import { NextResponse } from "next/server"
import { stripe, PLANS, type PlanTier } from "@/lib/stripe/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tier, billing } = (await request.json()) as {
      tier: PlanTier
      billing: "monthly" | "annual"
    }

    const plan = PLANS[tier]
    if (!plan || plan.tier === "free") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const priceId =
      billing === "annual"
        ? plan.stripePriceIdAnnual
        : plan.stripePriceIdMonthly
    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured" },
        { status: 400 }
      )
    }

    const serviceSupabase = createSupabaseServiceRoleClient()
    const { data: sub } = await serviceSupabase
      .from("extractor_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", session.user.id)
      .maybeSingle()

    // If user already has an active subscription, redirect to portal instead
    if (sub?.stripe_subscription_id) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id!,
        return_url: `${siteUrl}/settings`,
      })
      return NextResponse.json({ url: portalSession.url })
    }

    // Get or create Stripe customer
    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { supabase_user_id: session.user.id },
      })
      customerId = customer.id

      await serviceSupabase
        .from("extractor_subscriptions")
        .upsert(
          {
            user_id: session.user.id,
            stripe_customer_id: customerId,
            credits_free: PLANS.free.pages,
            credits_used: 0,
            credits_reset_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          { onConflict: "user_id" }
        )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/settings?checkout=success`,
      cancel_url: `${siteUrl}/pricing?checkout=cancel`,
      subscription_data: {
        metadata: {
          supabase_user_id: session.user.id,
          plan_tier: tier,
        },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    console.error("[stripe/checkout]", err)
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    )
  }
}
