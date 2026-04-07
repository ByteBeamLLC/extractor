import { type NextRequest, NextResponse } from "next/server"
import {
  createSupabaseServerComponentClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server"

export const runtime = "nodejs"

interface ClickBody {
  nid?: string
  channel?: "email" | "push"
}

/**
 * POST /api/notifications/click
 *
 * Records that a user returned via a notification (push or email).
 * Called from `useNotificationAttribution` on the client when `?nid=...`
 * is present in the URL. The cron worker checks `push_clicked_at` /
 * `email_clicked_at` before sending the t+5min email so dedupe is automatic.
 *
 * Auth-gated: scoped to the current user so account A cannot mark notifications
 * for account B as clicked.
 */
export async function POST(request: NextRequest) {
  let body: ClickBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { nid, channel } = body
  if (!nid || (channel !== "email" && channel !== "push")) {
    return NextResponse.json(
      { error: "nid and channel ('email' | 'push') required" },
      { status: 400 }
    )
  }

  const auth = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const column = channel === "push" ? "push_clicked_at" : "email_clicked_at"

  // Idempotent: only set the timestamp if not already set, so a refresh doesn't
  // overwrite the original click time.
  const { error } = await supabase
    .from("notification_emails")
    .update({ [column]: new Date().toISOString() })
    .eq("nid", nid)
    .eq("user_id", user.id)
    .is(column, null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
