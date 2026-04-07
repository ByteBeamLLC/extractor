import { type NextRequest, NextResponse } from "next/server"
import {
  createSupabaseServerComponentClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server"

export const runtime = "nodejs"

interface SubscribeBody {
  subscription?: {
    endpoint?: string
    keys?: {
      p256dh?: string
      auth?: string
    }
  }
}

/**
 * POST /api/notifications/push/subscribe
 *
 * Stores a Web Push subscription returned by `PushManager.subscribe()`.
 * Upserts by endpoint so re-subscribes (e.g. after the browser rotates the
 * key) replace the existing row instead of duplicating it.
 *
 * Side effect: flips `extractor_subscriptions.notification_push_enabled = true`
 * so the extraction worker starts firing push for this user.
 */
export async function POST(request: NextRequest) {
  let body: SubscribeBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const sub = body.subscription
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json(
      { error: "Invalid subscription — endpoint and keys.p256dh/auth required" },
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

  const { error: upsertErr } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: request.headers.get("user-agent") ?? null,
      },
      { onConflict: "endpoint" }
    )

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  await supabase
    .from("extractor_subscriptions")
    .update({ notification_push_enabled: true })
    .eq("user_id", user.id)

  return NextResponse.json({ ok: true })
}
