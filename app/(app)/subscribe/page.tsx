import { redirect } from "next/navigation"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { createCheckoutSessionForUser } from "@/lib/stripe/createCheckoutSession"
import { PLANS, type PlanTier } from "@/lib/stripe/config"
import { ApiError, reportError } from "@/lib/errorReporting"

/**
 * GET /subscribe?tier=TIER&billing=monthly|annual
 *
 * Server-rendered checkout handoff. Sits between the marketing pricing page
 * and the Stripe-hosted checkout. Reading its own URL params:
 *
 *   1. Validates (tier, billing) — invalid → back to /pricing with a code
 *   2. Ensures the user is authenticated + non-anonymous — else → /login
 *      with a `next=` param so they come back here after signing up
 *   3. Creates a Stripe Checkout session (or Billing Portal session if they
 *      already have an active subscription) via the shared helper
 *   4. 307-redirects the browser to the Stripe-hosted URL
 *
 * Why a server component and not a client effect on the dashboard:
 *   - No flash of unrelated UI before the Stripe redirect
 *   - The redirect happens before any HTML is painted
 *   - The subscribe intent isn't leaked into browser history alongside
 *     the dashboard state
 *   - Unauthenticated users can be bounced to /login before anything
 *     sensitive runs
 *
 * Replaces the old `/dashboard?subscribe=TIER&billing=BILLING` URL pattern
 * that silently did nothing because no code read the query string.
 */

const VALID_BILLING = new Set(["monthly", "annual"])

interface SubscribePageProps {
  searchParams: { tier?: string; billing?: string }
}

/** Always fetch — no caching for a redirect page. */
export const dynamic = "force-dynamic"

export default async function SubscribePage({ searchParams }: SubscribePageProps) {
  const tierParam = (searchParams.tier ?? "").toLowerCase()
  const billingParam = (searchParams.billing ?? "monthly").toLowerCase()

  // ─── 1. Validate URL params ─────────────────────────────────────────────
  if (!tierParam || !(tierParam in PLANS)) {
    redirect(`/pricing?checkout_error=invalid_tier`)
  }
  if (!VALID_BILLING.has(billingParam)) {
    redirect(`/pricing?checkout_error=invalid_billing`)
  }
  const tier = tierParam as PlanTier
  const billing = billingParam as "monthly" | "annual"

  // Free/anonymous plans aren't purchasable.
  if (tier === "free" || tier === "anonymous") {
    redirect(`/pricing?checkout_error=free_plan`)
  }

  // ─── 2. Auth check ──────────────────────────────────────────────────────
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Preserve the original intent through the login bounce so a new signup
  // lands back on /subscribe with the same params and continues to Stripe.
  const returnPath = `/subscribe?tier=${encodeURIComponent(
    tier,
  )}&billing=${encodeURIComponent(billing)}`

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`)
  }

  // Anonymous users can't subscribe — force a signup first.
  if (user.is_anonymous) {
    redirect(`/login?mode=signup&next=${encodeURIComponent(returnPath)}`)
  }

  // ─── 3. Create Stripe session ───────────────────────────────────────────
  let sessionUrl: string
  try {
    const result = await createCheckoutSessionForUser({
      userId: user.id,
      email: user.email,
      tier,
      billing,
    })
    sessionUrl = result.url
  } catch (err) {
    if (err instanceof ApiError) {
      // Expected user-facing failures (invalid plan, missing price id) —
      // bounce back to pricing with a code. The pricing page can surface
      // a human-readable error if it wants; for now the param is enough
      // to tell the user something went wrong.
      redirect(`/pricing?checkout_error=${encodeURIComponent(err.code)}`)
    }

    // Unknown failure — report to GitHub auto-bug so it's tracked, then
    // bounce with a generic code. The user sees "something went wrong";
    // we get a stack trace + request context in the tracker.
    await reportError(err, {
      route: "/subscribe",
      userId: user.id,
      extra: { tier, billing },
    })
    redirect(`/pricing?checkout_error=stripe_failure`)
  }

  // ─── 4. Redirect to Stripe ──────────────────────────────────────────────
  // `redirect()` throws a Next.js control flow error the framework catches
  // and converts into a 307 response. Code after this is unreachable.
  redirect(sessionUrl)
}
