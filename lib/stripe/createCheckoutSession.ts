import type Stripe from "stripe"
import { stripe, PLANS, type PlanTier } from "@/lib/stripe/config"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { ApiError } from "@/lib/errorReporting"

/**
 * Shared Stripe checkout session builder — single source of truth used by
 * both `app/api/stripe/checkout/route.ts` (POST from client JS) and
 * `app/(app)/subscribe/page.tsx` (server-rendered redirect page).
 *
 * Responsibilities, in order:
 *   1. Validate the (tier, billing) pair against `PLANS`. Invalid combos
 *      throw `ApiError(400, "invalid_plan")` — caller decides how to surface.
 *   2. Resolve or create the user's Stripe customer, idempotent per user.
 *   3. If the user already has an `stripe_subscription_id`, return a
 *      billing-portal session URL instead of a checkout session URL — they
 *      can't double-subscribe, they should manage the existing one.
 *   4. Otherwise create a Checkout Session with subscription metadata so
 *      the webhook can map it back to the Supabase user.
 *
 * Returns `{ url, mode }` where `mode` is `"checkout"` for new subscribers
 * or `"portal"` for existing ones. Callers route the browser to `url` the
 * same way in both cases.
 */
export interface CreateCheckoutSessionInput {
  userId: string
  email: string | null | undefined
  tier: PlanTier
  billing: "monthly" | "annual"
}

export interface CreateCheckoutSessionResult {
  url: string
  mode: "checkout" | "portal"
}

export async function createCheckoutSessionForUser(
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionResult> {
  const { userId, email, tier, billing } = input

  // ─── 1. Plan validation ──────────────────────────────────────────────────
  const plan = PLANS[tier]
  if (!plan) {
    throw new ApiError(
      400,
      "invalid_plan",
      `Unknown plan tier: ${String(tier)}.`,
    )
  }
  if (plan.tier === "free" || plan.tier === "anonymous") {
    throw new ApiError(
      400,
      "free_plan_not_purchasable",
      "The free and guest plans cannot be purchased — they're already free.",
    )
  }

  const priceId =
    billing === "annual" ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly
  if (!priceId) {
    // Env var missing or not wired — this is a config bug, not user error.
    // Rethrow as a real Error so `withErrorReporting` opens an auto-bug issue.
    throw new Error(
      `[createCheckoutSession] Missing Stripe price ID for ${plan.tier} ${billing}. ` +
        `Check Vercel env vars STRIPE_PRICE_${plan.tier.toUpperCase()}_${billing.toUpperCase()}.`,
    )
  }

  const service = createSupabaseServiceRoleClient()

  // ─── 2. Resolve or create Stripe customer ───────────────────────────────
  const { data: sub } = await service
    .from("extractor_subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle()

  // ─── 3. Already subscribed? Send to portal, not checkout ────────────────
  if (sub?.stripe_subscription_id) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id!,
      return_url: `${appUrl}/settings`,
    })
    return { url: portalSession.url, mode: "portal" }
  }

  let customerId = sub?.stripe_customer_id ?? undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { supabase_user_id: userId },
    })
    customerId = customer.id

    // Persist the customer id only — do NOT touch credits_free/tier here.
    // (An older version of this code reset credits_free to 30 as a side
    // effect, which silently downgraded comped accounts on upgrade clicks.)
    await service
      .from("extractor_subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", userId)
  }

  // ─── 4. Build the checkout session ──────────────────────────────────────
  //
  // URL choice matters: `success_url` must land on `app.parsli.co` (where
  // `/settings` lives) so the middleware doesn't cross-domain redirect the
  // user after payment. `cancel_url` goes back to `parsli.co/pricing` where
  // they can pick a different tier without needing a session.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  // Friendly product label that shows on the Stripe-hosted checkout, in
  // the customer portal subscription list, and on every invoice. Stripe's
  // default would be the bare product name ("Parsli Starter"); this makes
  // the parent-brand relationship explicit so customers don't get confused
  // by the "ByteBeamAgency Ltd" merchant name on their card statement.
  const planLabel = plan.name // "Starter" | "Growth" | "Pro" | "Business"
  const subscriptionDescription = `Parsli ${planLabel} subscription — AI document data extraction. A product by ByteBeam Agency Ltd.`

  const params: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/pricing?checkout=cancel`,
    subscription_data: {
      // Shown in the Stripe customer portal under "Current plan" and on
      // every invoice line item. The metadata block below is what our
      // webhook handler uses to map Stripe events back to a Supabase user.
      description: subscriptionDescription,
      metadata: {
        supabase_user_id: userId,
        plan_tier: tier,
      },
    },
    // Renders as helper text under the "Subscribe" button on the
    // Stripe-hosted checkout page. Reinforces the Parsli brand even when
    // we're on the default checkout.stripe.com domain (no custom domain
    // configured to keep Stripe billing at $0/mo until first revenue).
    custom_text: {
      submit: {
        message:
          "Parsli — AI document data extraction. A product by ByteBeam Agency Ltd.",
      },
    },
    client_reference_id: userId,
    allow_promotion_codes: true,
  }

  const checkoutSession = await stripe.checkout.sessions.create(params)
  if (!checkoutSession.url) {
    throw new Error(
      "[createCheckoutSession] Stripe returned a session without a url field",
    )
  }

  return { url: checkoutSession.url, mode: "checkout" }
}
