import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe, planFromPriceId, PLANS } from "@/lib/stripe/config"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import type Stripe from "stripe"

// Helper: resolve user ID from subscription metadata or customer lookup
async function resolveUserId(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  subscription?: Stripe.Subscription | null,
  customerId?: string | null
): Promise<string | null> {
  // Try subscription metadata first
  if (subscription?.metadata?.supabase_user_id) {
    return subscription.metadata.supabase_user_id
  }
  // Fall back to DB lookup by stripe_customer_id
  if (customerId) {
    const { data } = await supabase
      .from("extractor_subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle()
    return data?.user_id ?? null
  }
  return null
}

// Helper: extract customer ID string from various Stripe types
function customerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (!customer) return null
  return typeof customer === "string" ? customer : customer.id
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("[stripe/webhook] Signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createSupabaseServiceRoleClient()

  // ─── Idempotency: skip duplicate events ─────────────────────
  const { data: existingEvent } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle()

  if (existingEvent) {
    console.log(`[stripe/webhook] Duplicate event ${event.id}, skipping`)
    return NextResponse.json({ received: true })
  }

  // Record event before processing (insert will fail on duplicate PK if race)
  const { error: insertError } = await supabase
    .from("stripe_webhook_events")
    .insert({ id: event.id, event_type: event.type })

  if (insertError) {
    // Unique constraint violation = another instance already processing
    console.log(`[stripe/webhook] Event ${event.id} already being processed`)
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      // ─── New subscription via Checkout ───────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "subscription" || !session.subscription) break

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const plan = planFromPriceId(priceId)
        const userId =
          subscription.metadata.supabase_user_id ||
          session.metadata?.supabase_user_id

        if (!userId || !plan) {
          console.error("[stripe/webhook] checkout.session.completed: missing userId or plan", {
            userId,
            priceId,
          })
          break
        }

        await supabase
          .from("extractor_subscriptions")
          .upsert(
            {
              user_id: userId,
              tier: plan.tier,
              credits_free: plan.pages,
              max_parsers: plan.maxParsers,
              stripe_customer_id: customerId(subscription.customer),
              stripe_subscription_id: subscription.id,
              credits_used: 0,
              credits_reset_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )

        console.log(
          `[stripe/webhook] Activated ${plan.tier} for user ${userId}`
        )
        break
      }

      // ─── Subscription created (covers non-Checkout flows) ───────
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription
        const custId = customerId(subscription.customer)
        const userId = await resolveUserId(supabase, subscription, custId)
        if (!userId) break

        const priceId = subscription.items.data[0]?.price.id
        const plan = planFromPriceId(priceId)
        if (!plan) break

        await supabase
          .from("extractor_subscriptions")
          .upsert(
            {
              user_id: userId,
              tier: plan.tier,
              credits_free: plan.pages,
              max_parsers: plan.maxParsers,
              stripe_customer_id: custId,
              stripe_subscription_id: subscription.id,
              credits_used: 0,
              credits_reset_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )

        console.log(
          `[stripe/webhook] Subscription created: ${plan.tier} for user ${userId}`
        )
        break
      }

      // ─── Subscription updated (plan change, status change, reactivation) ─
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const custId = customerId(subscription.customer)
        const userId = await resolveUserId(supabase, subscription, custId)
        if (!userId) break

        const priceId = subscription.items.data[0]?.price.id
        const plan = planFromPriceId(priceId)
        if (!plan) break

        if (
          subscription.status === "active" ||
          subscription.status === "trialing"
        ) {
          // Active or trialing — update tier & limits
          await supabase
            .from("extractor_subscriptions")
            .update({
              tier: plan.tier,
              credits_free: plan.pages,
              max_parsers: plan.maxParsers,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)

          console.log(
            `[stripe/webhook] Subscription updated: ${plan.tier} (${subscription.status}) for user ${userId}`
          )
        } else if (
          subscription.status === "past_due" ||
          subscription.status === "unpaid"
        ) {
          // Payment issue — keep current tier but log for monitoring
          // Don't immediately downgrade; Stripe's smart retries will handle recovery
          console.warn(
            `[stripe/webhook] Subscription ${subscription.status} for user ${userId} (${plan.tier})`
          )
        } else if (subscription.status === "canceled") {
          // Terminal cancellation — downgrade to free
          await supabase
            .from("extractor_subscriptions")
            .update({
              tier: "free",
              credits_free: PLANS.free.pages,
              max_parsers: PLANS.free.maxParsers,
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)

          console.log(
            `[stripe/webhook] Subscription canceled via update for user ${userId}`
          )
        }

        // Log if cancel_at_period_end changed (user scheduled cancellation or reactivated)
        if (subscription.cancel_at_period_end) {
          console.log(
            `[stripe/webhook] Subscription scheduled for cancellation at period end for user ${userId}`
          )
        }

        break
      }

      // ─── Subscription deleted (final cancellation) ──────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const custId = customerId(subscription.customer)
        const userId = await resolveUserId(supabase, subscription, custId)
        if (!userId) break

        await supabase
          .from("extractor_subscriptions")
          .update({
            tier: "free",
            credits_free: PLANS.free.pages,
            max_parsers: PLANS.free.maxParsers,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)

        console.log(
          `[stripe/webhook] Subscription deleted for user ${userId}, downgraded to free`
        )
        break
      }

      // ─── Subscription paused ────────────────────────────────────
      case "customer.subscription.paused": {
        const subscription = event.data.object as Stripe.Subscription
        const custId = customerId(subscription.customer)
        const userId = await resolveUserId(supabase, subscription, custId)
        if (!userId) break

        // Paused = no access, downgrade to free limits but keep tier info
        await supabase
          .from("extractor_subscriptions")
          .update({
            credits_free: 0,
            max_parsers: PLANS.free.maxParsers,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)

        console.log(
          `[stripe/webhook] Subscription paused for user ${userId}`
        )
        break
      }

      // ─── Subscription resumed ───────────────────────────────────
      case "customer.subscription.resumed": {
        const subscription = event.data.object as Stripe.Subscription
        const custId = customerId(subscription.customer)
        const userId = await resolveUserId(supabase, subscription, custId)
        if (!userId) break

        const priceId = subscription.items.data[0]?.price.id
        const plan = planFromPriceId(priceId)
        if (!plan) break

        await supabase
          .from("extractor_subscriptions")
          .update({
            tier: plan.tier,
            credits_free: plan.pages,
            max_parsers: plan.maxParsers,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)

        console.log(
          `[stripe/webhook] Subscription resumed: ${plan.tier} for user ${userId}`
        )
        break
      }

      // ─── Trial ending soon (3 days before) ──────────────────────
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription
        const custId = customerId(subscription.customer)
        const userId = await resolveUserId(supabase, subscription, custId)

        console.log(
          `[stripe/webhook] Trial ending soon for user ${userId}, customer ${custId}`
        )
        // TODO: Send email notification about trial ending
        break
      }

      // ─── Invoice paid (renewal success — reset credits) ─────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const custId = customerId(invoice.customer)

        // Only reset credits for subscription invoices (not one-offs)
        // Support both old (invoice.subscription) and new (invoice.parent) SDK shapes
        const subRef =
          (invoice as any).subscription ??
          (invoice as any).parent?.subscription_details?.subscription
        if (!subRef) break

        const subscriptionId = typeof subRef === "string" ? subRef : subRef.id

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId)
        const userId = await resolveUserId(supabase, subscription, custId)
        if (!userId) break

        const priceId = subscription.items.data[0]?.price.id
        const plan = planFromPriceId(priceId)
        if (!plan) break

        // Reset credits for the new billing period
        await supabase
          .from("extractor_subscriptions")
          .update({
            credits_used: 0,
            credits_free: plan.pages,
            credits_reset_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)

        console.log(
          `[stripe/webhook] Invoice paid — credits reset for user ${userId} (${plan.tier}: ${plan.pages} pages)`
        )
        break
      }

      // ─── Invoice payment failed ─────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const custId = customerId(invoice.customer)
        const attemptCount = invoice.attempt_count ?? 0

        // Look up the user
        if (custId) {
          const { data } = await supabase
            .from("extractor_subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", custId)
            .maybeSingle()

          console.warn(
            `[stripe/webhook] Payment failed for user ${data?.user_id}, customer ${custId}, attempt #${attemptCount}`
          )
          // TODO: Send email notification about payment failure
        }
        break
      }

      // ─── Invoice requires customer action (3DS/SCA) ─────────────
      case "invoice.payment_action_required": {
        const invoice = event.data.object as Stripe.Invoice
        const custId = customerId(invoice.customer)

        if (custId) {
          const { data } = await supabase
            .from("extractor_subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", custId)
            .maybeSingle()

          console.warn(
            `[stripe/webhook] Payment action required (3DS/SCA) for user ${data?.user_id}, customer ${custId}, hosted_invoice_url: ${invoice.hosted_invoice_url}`
          )
          // TODO: Send email with invoice.hosted_invoice_url for customer to complete payment
        }
        break
      }

      // ─── Invoice finalization failed ────────────────────────────
      case "invoice.finalization_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const custId = customerId(invoice.customer)
        console.error(
          `[stripe/webhook] Invoice finalization failed for customer ${custId}, invoice ${invoice.id}`
        )
        break
      }

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error("[stripe/webhook] Error handling event:", err)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
