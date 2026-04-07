import { NextResponse } from "next/server"
import {
  createSupabaseServerComponentClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server"
import { sendPushToUser } from "@/lib/push/webPush"

export const runtime = "nodejs"

/**
 * POST /api/notifications/push/test
 *
 * Fires a sample push notification to every push subscription registered
 * for the current user. Used by the "Send test notification" button in
 * settings to verify VAPID configuration + service worker + send pipeline
 * end-to-end without uploading a real document.
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.parsli.co"
  const nid = crypto.randomUUID()

  const result = await sendPushToUser(
    user.id,
    {
      nid,
      title: "Parsli test notification",
      body: "If you can read this, your browser notifications are working.",
      url: `${baseUrl}/settings?tab=notifications`,
      documentId: "test",
    },
    supabase
  )

  return NextResponse.json({ ok: true, result })
}
