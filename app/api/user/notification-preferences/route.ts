import { type NextRequest, NextResponse } from "next/server"
import {
  createSupabaseServerComponentClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server"

export const runtime = "nodejs"

interface PrefsBody {
  notification_email_enabled?: boolean
  timezone?: string
}

/**
 * PATCH /api/user/notification-preferences
 *
 * Updates the current user's notification preferences on `extractor_subscriptions`.
 * Used by the settings toggle and the silent timezone-capture component.
 */
export async function PATCH(request: NextRequest) {
  let body: PrefsBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const auth = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const updates: Record<string, unknown> = {}

  if (typeof body.notification_email_enabled === "boolean") {
    updates.notification_email_enabled = body.notification_email_enabled
  }

  if (typeof body.timezone === "string" && body.timezone.length > 0) {
    // Validate against Intl's known IANA list — throws on garbage
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: body.timezone })
      updates.timezone = body.timezone
    } catch {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 })
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const { error } = await supabase
    .from("extractor_subscriptions")
    .update(updates)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
