import { NextResponse } from "next/server"
import {
  createSupabaseServerComponentClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server"
import { runEmailCron } from "@/lib/notifications/runEmailCron"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * POST /api/notifications/flush-pending
 *
 * Authenticated manual trigger for the email cron. Only processes pending
 * `notification_emails` rows belonging to the calling user. Lets you debug
 * the pipeline without waiting a minute for the scheduled cron, and works
 * as a user-facing "send my pending emails now" button.
 */
export async function POST() {
  const auth = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceRoleClient()
  // Runs the same rules as the scheduled cron, scoped to this user.
  // Honors quiet hours and scheduled_for — no bypasses.
  const summary = await runEmailCron(supabase, { userId: user.id })

  return NextResponse.json({ ok: true, summary })
}
