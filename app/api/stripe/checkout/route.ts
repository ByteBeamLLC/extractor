import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createCheckoutSessionForUser } from "@/lib/stripe/createCheckoutSession"
import { ApiError, withErrorReporting } from "@/lib/errorReporting"
import type { PlanTier } from "@/lib/stripe/config"

export const maxDuration = 60

/**
 * POST /api/stripe/checkout
 *
 * JSON endpoint for any client JS that wants to kick off a Stripe checkout
 * without a page navigation — e.g. an in-app "Upgrade" button that opens
 * the Stripe URL in a new tab. The server-rendered `/subscribe` page is
 * the preferred entry point from the marketing pricing page because it
 * avoids a round-trip and handles auth redirects natively.
 *
 * Both entry points share the same `createCheckoutSessionForUser` helper
 * so the session-building logic lives in exactly one place.
 *
 * Request body: `{ tier: PlanTier, billing: "monthly" | "annual" }`
 * Response:     `{ url: string, mode: "checkout" | "portal" }`
 */
export const POST = withErrorReporting(
  "/api/stripe/checkout",
  async (request: NextRequest) => {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new ApiError(401, "unauthorized", "You must be signed in to subscribe.")
    }

    if (session.user.is_anonymous) {
      // Guests can't subscribe — they need to convert to a real account first.
      throw new ApiError(
        403,
        "anonymous_cannot_subscribe",
        "Please create a free account before subscribing.",
      )
    }

    let body: { tier?: unknown; billing?: unknown }
    try {
      body = await request.json()
    } catch {
      throw new ApiError(400, "invalid_json", "Request body must be valid JSON.")
    }

    const tier = typeof body.tier === "string" ? (body.tier as PlanTier) : undefined
    const billing = typeof body.billing === "string" ? body.billing : undefined

    if (!tier) {
      throw new ApiError(400, "missing_tier", "`tier` is required.")
    }
    if (billing !== "monthly" && billing !== "annual") {
      throw new ApiError(
        400,
        "invalid_billing",
        "`billing` must be 'monthly' or 'annual'.",
      )
    }

    const result = await createCheckoutSessionForUser({
      userId: session.user.id,
      email: session.user.email,
      tier,
      billing,
    })

    return NextResponse.json(result)
  },
)
