import { type NextRequest, NextResponse } from "next/server"
import {
  createSupabaseServerComponentClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server"

export const runtime = "nodejs"

interface UnsubscribeBody {
  /** Specific endpoint to remove. Omit to remove ALL of the user's subscriptions. */
  endpoint?: string
}

/**
 * POST /api/notifications/push/unsubscribe
 *
 * Removes a Web Push subscription. If `endpoint` is provided, removes just
 * that one (this browser only). If omitted, wipes all of the user's
 * subscriptions across every browser they ever opted in from.
 *
 * Side effect: flips `notification_push_enabled = false` once the user has
 * zero remaining subscriptions, so the worker stops firing push for them.
 */
export async function POST(request: NextRequest) {
  let body: UnsubscribeBody
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const auth = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceRoleClient()

  if (body.endpoint) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", body.endpoint)
      .eq("user_id", user.id)
  } else {
    await supabase.from("push_subscriptions").delete().eq("user_id", user.id)
  }

  // If no subs remain on any device, flip the flag off so the worker
  // stops firing push.
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  if ((count ?? 0) === 0) {
    await supabase
      .from("extractor_subscriptions")
      .update({ notification_push_enabled: false })
      .eq("user_id", user.id)
  }

  return NextResponse.json({ ok: true })
}
