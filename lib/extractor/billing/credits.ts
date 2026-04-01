import type { SupabaseClient } from "@supabase/supabase-js"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>
import type { ExtractorSubscription } from "@/lib/extractor/types"
import { PLANS } from "@/lib/stripe/config"

/**
 * Get or create subscription for a user.
 * Automatically resets credits if the billing period has elapsed (uses DB-level row lock).
 */
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS

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
    // Atomically reset credits if period has elapsed (DB handles row locking)
    if (new Date(existing.credits_reset_at) < new Date()) {
      if (existing.tier === "anonymous") {
        // Daily reset for anonymous users (bypass the RPC which assumes 30-day cycles)
        await supabase
          .from("extractor_subscriptions")
          .update({
            credits_used: 0,
            credits_reset_at: new Date(Date.now() + ONE_DAY_MS).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
        return { ...existing, credits_used: 0, credits_reset_at: new Date(Date.now() + ONE_DAY_MS).toISOString() }
      }

      const { data: resetResult } = await supabase
        .rpc("reset_credits_if_due", { p_user_id: userId })

      if (resetResult?.[0]?.was_reset) {
        return {
          ...existing,
          credits_used: 0,
          credits_reset_at: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
        }
      }
    }
    return existing
  }

  // Create new subscription
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

/**
 * Check if user has available credits.
 * Also checks subscription status — blocks access if tier indicates payment issues.
 */
export async function checkCredits(
  userId: string,
  pagesNeeded: number,
  supabase: AnySupabaseClient,
  isAnonymous: boolean = false
): Promise<{ allowed: boolean; remaining: number; subscription: ExtractorSubscription; reason?: string }> {
  const subscription = await getOrCreateSubscription(userId, supabase, isAnonymous)
  const remaining = Math.max(subscription.credits_free - subscription.credits_used, 0)

  return {
    allowed: remaining >= pagesNeeded,
    remaining,
    subscription,
    reason: remaining < pagesNeeded
      ? subscription.tier === "anonymous"
        ? "Daily guest limit reached. Sign up free for 30 pages/month."
        : "Monthly credit limit reached. Upgrade your plan for more pages."
      : undefined,
  }
}

/**
 * Atomically deduct credits using DB-level UPDATE with WHERE guard.
 * Returns true if deduction succeeded, false if insufficient credits.
 * This prevents race conditions where two concurrent requests both pass the check.
 */
export async function deductCredits(
  userId: string,
  pagesUsed: number,
  supabase: AnySupabaseClient
): Promise<{ success: boolean; remaining: number }> {
  const { data, error } = await supabase
    .rpc("deduct_credits", { p_user_id: userId, p_pages: pagesUsed })

  if (error || !data || data.length === 0) {
    return { success: false, remaining: 0 }
  }

  return { success: true, remaining: data[0].remaining }
}
