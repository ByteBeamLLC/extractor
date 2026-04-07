import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runEmailCron } from "@/lib/notifications/runEmailCron"
import { reportError } from "@/lib/errorReporting"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/cron/process-notification-emails
 *
 * Vercel Cron worker — runs every minute, picks up `notification_emails`
 * rows that are due and dispatches them via the shared worker.
 *
 * Auth — in priority order:
 *   1. `x-vercel-cron: 1` header  — automatically set by Vercel Cron on Pro+
 *      and stripped from external requests at the edge. Primary auth so no
 *      env-var setup is required.
 *   2. `Authorization: Bearer ${CRON_SECRET}` — fallback for local testing
 *      or environments where x-vercel-cron isn't present.
 */
export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  const auth = request.headers.get("authorization")
  const hasValidBearer =
    !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && !hasValidBearer) {
    console.warn(
      "[notification-cron] Unauthorized invocation — isVercelCron=%s hasValidBearer=%s",
      isVercelCron,
      hasValidBearer
    )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createSupabaseServiceRoleClient()
    const summary = await runEmailCron(supabase)

    console.log(
      `[notification-cron] processed=${summary.processed} sent=${summary.sent} suppressed=${summary.suppressed} deferred=${summary.deferred} failed=${summary.failed}`
    )

    if (summary.errors.length > 0) {
      console.warn("[notification-cron] errors:", summary.errors)
    }

    return NextResponse.json({ summary })
  } catch (err) {
    console.error("[notification-cron] Fatal error:", err)
    reportError(err, { route: "/api/cron/process-notification-emails" })
    return NextResponse.json({ error: "Cron run failed" }, { status: 500 })
  }
}
