import { PLANS, type PlanDefinition, type PlanTier } from "@/lib/stripe/config"
import {
  reserveFailureMessage,
  type ReserveResult,
} from "@/lib/extractor/billing/credits"

/**
 * Structured 402 body returned by upload endpoints when a credit
 * reservation fails. Additive on top of the legacy `{ error }` shape —
 * existing clients that only read `error` keep working; new clients
 * read `reason` + `recommended_plan` to drive the upgrade dialog.
 *
 * Kept in its own module (not inside credits.ts) because the billing
 * core is deliberately decoupled from UI-facing concerns like plan
 * recommendation and marketing copy. Per project convention, do not
 * modify reserve/refund RPC behavior to satisfy presentation needs.
 */
export interface QuotaErrorBody {
  /** Legacy human-readable message. Kept for clients that already read it. */
  error: string
  /**
   * Machine code. Clients branch on this.
   *
   *   - `quota_exceeded`: out of pages for this period.
   *   - `anonymous_quota_exceeded`: guest hit daily limit (should prompt signup).
   *   - `rpc_error` / `no_subscription`: transient or setup issue, retry.
   */
  reason: string
  /** Pages required to process this document (the page count we counted). */
  pages_needed: number
  /** Pages left on the current plan until reset. */
  pages_remaining: number
  /** The user's current tier when they hit the wall. */
  current_tier: PlanTier
  /**
   * The smallest paid plan that covers `pages_needed` with roughly 30%
   * headroom. `null` when the document exceeds the largest plan — in
   * that case the client should steer to "contact us" / Business.
   */
  recommended_plan: RecommendedPlan | null
}

export interface RecommendedPlan {
  tier: PlanTier
  name: string
  pages: number
  monthly_price: number
  annual_price_per_month: number
  /** Short bullets shown under the recommendation. Cap at 3. */
  features: string[]
}

/**
 * Paid tiers in ascending page size — walked in order to pick the
 * smallest plan that fits the document.
 */
const PAID_TIERS: PlanTier[] = ["starter", "growth", "pro", "business"]

/**
 * Pick the smallest paid plan whose monthly page allowance covers
 * `pagesNeeded`. Returns null when the document exceeds Business's
 * allowance (caller should surface "contact us" copy).
 */
export function recommendPlan(pagesNeeded: number): RecommendedPlan | null {
  for (const tier of PAID_TIERS) {
    const plan = PLANS[tier]
    if (plan.pages >= pagesNeeded) {
      return toRecommendedPlan(plan)
    }
  }
  return null
}

function toRecommendedPlan(plan: PlanDefinition): RecommendedPlan {
  // Trim to the first three features so the modal stays scannable —
  // the full list belongs on the pricing page, not a paywall surface.
  return {
    tier: plan.tier,
    name: plan.name,
    pages: plan.pages,
    monthly_price: plan.monthlyPrice,
    annual_price_per_month: plan.annualPricePerMonth,
    features: plan.features.slice(0, 3),
  }
}

/**
 * Build the structured 402 body from a failed reservation. Always
 * includes the legacy `error` string so pre-existing error-path code
 * (which only reads `error`) continues to display something sensible.
 */
export function buildQuotaErrorBody(params: {
  reservation: Extract<ReserveResult, { reserved: false }>
  pagesNeeded: number
  currentTier: PlanTier
}): QuotaErrorBody {
  const { reservation, pagesNeeded, currentTier } = params
  return {
    error: reserveFailureMessage(reservation),
    reason: reservation.reason,
    pages_needed: pagesNeeded,
    pages_remaining: reservation.remaining,
    current_tier: currentTier,
    recommended_plan:
      reservation.reason === "quota_exceeded"
        ? recommendPlan(pagesNeeded)
        : null,
  }
}
