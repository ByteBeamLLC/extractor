import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { reportError } from "@/lib/errorReporting"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/cron/reconcile-credits
 *
 * Daily cron that audits every extractor_subscriptions row against the
 * append-only billing_events ledger. For each user it computes the
 * "ledger-derived" credits_used (since the last reset) by summing:
 *
 *   + reserve events         (pages_charged)
 *   + reserve_first_doc_free (always 0)
 *   - refund events          (pages returned)
 *   - reset events           (credits_used_after = 0 cleared the slate)
 *
 * and compares it with the live `credits_used` on the subscription row.
 * Any mismatch indicates drift — either a bug in the reserve/refund
 * pipeline, a direct manual write, or a webhook that bypassed the RPCs.
 *
 * On drift: log the mismatch, report to Sentry, and include the users
 * in the response so the oncall can investigate. This cron DOES NOT
 * auto-correct — corrections should be human-reviewed because the
 * ledger could itself be wrong.
 *
 * Schedule: daily at 06:00 UTC (see vercel.json).
 */

const DRIFT_TOLERANCE = 0 // tolerate zero drift — anything non-zero is a bug

export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  const auth = request.headers.get("authorization")
  const hasValidBearer =
    !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && !hasValidBearer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceRoleClient()

  try {
    // Pull every subscription with its live credits_used.
    const { data: subs, error: subsError } = await supabase
      .from("extractor_subscriptions")
      .select("user_id, tier, credits_used, credits_free, credits_reset_at")

    if (subsError) {
      reportError(subsError, { route: "/api/cron/reconcile-credits" })
      return NextResponse.json({ error: "subs_fetch_failed" }, { status: 500 })
    }

    const subRows = (subs ?? []) as Array<{
      user_id: string
      tier: string
      credits_used: number
      credits_free: number
      credits_reset_at: string
    }>

    let audited = 0
    let drifted = 0
    const drifts: Array<{
      user_id: string
      tier: string
      live_credits_used: number
      ledger_credits_used: number
      drift: number
    }> = []

    for (const sub of subRows) {
      audited++

      // Find the most recent "baseline" event — either a reset (which
      // zeros credits_used) or an adjustment (which sets it to
      // credits_used_after). Events before the baseline are ignored
      // because they describe a previous state of the world.
      const { data: lastBaseline } = await supabase
        .from("billing_events")
        .select("created_at, event_type, credits_used_after")
        .eq("user_id", sub.user_id)
        .in("event_type", ["reset", "adjustment"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const baseline = lastBaseline as
        | { created_at: string; event_type: string; credits_used_after: number }
        | null
      const since = baseline?.created_at ?? null
      const baselineUsed = baseline?.credits_used_after ?? 0

      let query = supabase
        .from("billing_events")
        .select("event_type, pages")
        .eq("user_id", sub.user_id)

      if (since) query = query.gt("created_at", since)

      const { data: events, error: eventsError } = await query

      if (eventsError) {
        console.error(
          `[reconcile] Events query failed for ${sub.user_id}:`,
          eventsError
        )
        continue
      }

      // Start from the baseline and apply every post-baseline event.
      let ledgerUsed = baselineUsed
      for (const ev of (events ?? []) as Array<{ event_type: string; pages: number }>) {
        switch (ev.event_type) {
          case "reserve":
          case "reserve_first_doc_free":
            ledgerUsed += ev.pages
            break
          case "refund":
            ledgerUsed -= ev.pages
            break
          // reset / adjustment events inside the window shouldn't exist
          // because we pick the most recent as `since`, but if they do we
          // ignore them — the most recent baseline is authoritative.
        }
      }

      ledgerUsed = Math.max(0, ledgerUsed)
      const drift = sub.credits_used - ledgerUsed

      if (Math.abs(drift) > DRIFT_TOLERANCE) {
        drifted++
        drifts.push({
          user_id: sub.user_id,
          tier: sub.tier,
          live_credits_used: sub.credits_used,
          ledger_credits_used: ledgerUsed,
          drift,
        })
      }
    }

    console.log(
      `[reconcile] audited=${audited} drifted=${drifted} tolerance=${DRIFT_TOLERANCE}`
    )

    if (drifts.length > 0) {
      reportError(new Error(`Billing drift detected on ${drifts.length} users`), {
        route: "/api/cron/reconcile-credits",
        extra: { drifts: drifts.slice(0, 20) }, // cap payload size
      })
      console.warn("[reconcile] drift details:", drifts.slice(0, 20))
    }

    return NextResponse.json({
      audited,
      drifted,
      drifts: drifts.slice(0, 50), // return up to 50 for visibility
    })
  } catch (err) {
    console.error("[reconcile] Unhandled error:", err)
    reportError(err, { route: "/api/cron/reconcile-credits" })
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
