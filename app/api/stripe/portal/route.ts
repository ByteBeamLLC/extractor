import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export const maxDuration = 60

export async function POST() {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceSupabase = createSupabaseServiceRoleClient()
    const { data: sub } = await serviceSupabase
      .from("extractor_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", session.user.id)
      .maybeSingle()

    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${siteUrl}/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err: any) {
    console.error("[stripe/portal]", err)
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    )
  }
}
