import type { SupabaseClient } from "@supabase/supabase-js"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>
import type { ExtractorSubscription } from "@/lib/extractor/types"
import { PLANS } from "@/lib/stripe/config"

/**
 * Credit metering — atomic reserve/refund model.
 *
 * Architecture (Phase 2):
 *   Extract route  →  reserveCredits()   [atomic RPC inside row lock]
 *                     ├── success   → insert processing doc → worker extracts
 *                     └── 402       → return error to client
 *
 *   Worker runs    →  extract OK   → no billing call (reservation already committed)
 *                  →  extract FAIL → refundCredits()  [idempotent, keyed by doc id]
 *
 * Why this shape:
 *   - The reserve RPC takes a row lock, handles period reset, first-doc-free,
 *     quota check, deduction, and ledger append in ONE transaction. Concurrent
 *     uploads can't race past each other; the first-doc-free freebie is based
 *     on `extractor_subscriptions.first_doc_used_at`, not a count() query.
 *   - The worker no longer decides anything about billing. It only refunds on
 *     failure, keyed by `parser_processed_documents.id`, so pg_net retries
 *     can't double-refund.
 *   - Every credit movement writes a `billing_events` row, giving us a full
 *     audit trail we can reconcile against `extractor_subscriptions.credits_used`.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS

/**
 * Get or create the extractor_subscriptions row for this user.
 *
 * Ensures a row exists before the reserve RPC runs (the RPC returns
 * 'no_subscription' if the row is missing). Also repairs an anonymous tier
 * mismatch where a guest previously got a `free` row — this is kept as a
 * defensive backstop; Phase 4's auth trigger is the permanent fix.
 */
export async function getOrCreateSubscription(
  userId: string,
  supabase: AnySupabaseClient,
  isAnonymous: boolean = false
): Promise<ExtractorSubscription> {
  const { data: existing } = await supabase
    .from("extractor_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) {
    // Defensive: anonymous user wrongly on 'free' tier. The auth trigger in
    // Phase 4 handles this for new signups; this backstop catches any
    // pre-existing rows that slipped through.
    if (isAnonymous && existing.tier === "free") {
      const anonPlan = PLANS.anonymous
      const patched = {
        tier: "anonymous" as const,
        credits_free: anonPlan.pages,
        max_parsers: anonPlan.maxParsers,
        credits_used: 0,
        credits_reset_at: new Date(Date.now() + ONE_DAY_MS).toISOString(),
        updated_at: new Date().toISOString(),
      }
      await supabase
        .from("extractor_subscriptions")
        .update(patched)
        .eq("user_id", userId)
      return { ...existing, ...patched }
    }
    return existing
  }

  // Create a new subscription row.
  const tier = isAnonymous ? "anonymous" : "free"
  const plan = PLANS[tier]
  const resetMs = isAnonymous ? ONE_DAY_MS : THIRTY_DAYS_MS

  const { data: created } = await supabase
    .from("extractor_subscriptions")
    .insert({
      user_id: userId,
      tier,
      credits_free: plan.pages,
      credits_used: 0,
      max_parsers: plan.maxParsers,
      credits_reset_at: new Date(Date.now() + resetMs).toISOString(),
    })
    .select("*")
    .single()

  return created!
}

/** Max pages allowed under the first-document-free policy. */
export const FIRST_DOC_FREE_MAX_PAGES = 100

/** Outcome of a reserveCredits call. */
export type ReserveResult =
  | {
      reserved: true
      pagesCharged: number
      firstDocumentFree: boolean
      remaining: number
      /** Reason code from the DB, e.g. `reserved` or `first_document_free`. */
      reason: string
    }
  | {
      reserved: false
      pagesCharged: 0
      firstDocumentFree: false
      remaining: number
      /**
       * Reason code:
       *   - `quota_exceeded` — normal user is out of credits
       *   - `anonymous_quota_exceeded` — guest hit daily limit (should prompt signup)
       *   - `no_subscription` — should never happen in the gate (we bootstrap first)
       */
      reason: string
    }

interface ReserveCreditsOptions {
  /**
   * Whether the caller allows this reservation to burn the user's
   * first-document-free allowance. Default true — set to false for
   * paths where free-docs shouldn't apply (e.g. API key uploads,
   * re-processing an existing doc).
   */
  allowFirstDocFree?: boolean
}

/**
 * Atomically reserve credits for a pending document.
 *
 * This is the ONLY place in the codebase that should mutate
 * `extractor_subscriptions.credits_used` on the forward path. The function
 * bootstraps the subscription row if missing, then calls the `reserve_credits`
 * Postgres RPC which runs the whole decision under a row lock.
 */
export async function reserveCredits(
  userId: string,
  pages: number,
  documentId: string,
  supabase: AnySupabaseClient,
  isAnonymous: boolean = false,
  options: ReserveCreditsOptions = {}
): Promise<ReserveResult> {
  const allowFirstDocFree = options.allowFirstDocFree ?? true

  // Ensure the row exists — reserve_credits returns 'no_subscription' otherwise.
  await getOrCreateSubscription(userId, supabase, isAnonymous)

  const { data, error } = await supabase.rpc("reserve_credits", {
    p_user_id: userId,
    p_pages: pages,
    p_document_id: documentId,
    p_allow_first_doc_free: allowFirstDocFree,
  })

  if (error || !data || data.length === 0) {
    console.error("[reserveCredits] RPC failed:", error)
    return {
      reserved: false,
      pagesCharged: 0,
      firstDocumentFree: false,
      remaining: 0,
      reason: "rpc_error",
    }
  }

  const row = data[0] as {
    reserved: boolean
    pages_charged: number
    first_doc_free: boolean
    remaining: number
    reason: string
  }

  if (!row.reserved) {
    return {
      reserved: false,
      pagesCharged: 0,
      firstDocumentFree: false,
      remaining: row.remaining,
      reason: row.reason,
    }
  }

  return {
    reserved: true,
    pagesCharged: row.pages_charged,
    firstDocumentFree: row.first_doc_free,
    remaining: row.remaining,
    reason: row.reason,
  }
}

/**
 * Refund a previously-reserved credit charge for a document. Idempotent:
 * keyed by document_id via the `refunded_at` column on
 * `parser_processed_documents`, so it is safe to call from pg_net retries
 * or from a cleanup cron.
 *
 * Call this when an extraction fails, when a document is manually deleted
 * while still `processing`, or from the stuck-doc cleanup cron.
 */
export async function refundCredits(
  userId: string,
  documentId: string,
  pages: number,
  supabase: AnySupabaseClient
): Promise<{ refunded: boolean; remaining: number }> {
  const { data, error } = await supabase.rpc("refund_credits", {
    p_user_id: userId,
    p_document_id: documentId,
    p_pages: pages,
  })

  if (error || !data || data.length === 0) {
    console.error("[refundCredits] RPC failed:", error)
    return { refunded: false, remaining: 0 }
  }

  const row = data[0] as { refunded: boolean; remaining: number }
  return { refunded: row.refunded, remaining: row.remaining }
}

/**
 * Human-readable error message for a reservation failure. Used by routes
 * to build a response body when `reserveCredits` returns reserved=false.
 */
export function reserveFailureMessage(result: Extract<ReserveResult, { reserved: false }>): string {
  switch (result.reason) {
    case "anonymous_quota_exceeded":
      return "Daily guest limit reached. Sign up free for 30 pages/month."
    case "quota_exceeded":
      return `This document needs more pages than you have remaining (${result.remaining} left). Upgrade your plan for more pages.`
    case "no_subscription":
      return "Unable to load your subscription. Please reload and try again."
    case "rpc_error":
      return "A temporary error occurred. Please try again in a moment."
    default:
      return "Monthly credit limit reached. Upgrade your plan for more pages."
  }
}
