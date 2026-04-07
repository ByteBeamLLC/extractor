import webpush from "web-push"
import type { SupabaseClient } from "@supabase/supabase-js"

let configured = false

function configure() {
  if (configured) return
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@parsli.co"
  if (!publicKey || !privateKey) return
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export interface PushPayload {
  /** Shared attribution id — also used as the notification tag for collapse. */
  nid: string
  title: string
  body: string
  /** Already includes ?utm_source=push&...&nid=<id> */
  url: string
  documentId: string
}

export interface SendPushResult {
  attempted: number
  sent: number
  /** Endpoints the push service told us are gone (404/410). Pruned automatically. */
  expired: string[]
  failed: number
}

/**
 * Sends a push notification to all of a user's registered subscriptions.
 *
 * Subscriptions that the push service reports as expired (404/410) are
 * pruned from the database so we don't keep retrying dead endpoints.
 *
 * Never throws — failure is reflected in the returned summary.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  supabase: SupabaseClient
): Promise<SendPushResult> {
  configure()
  if (!configured) {
    console.warn("[push] VAPID keys not configured — skipping send")
    return { attempted: 0, sent: 0, expired: [], failed: 0 }
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)

  if (error || !subs || subs.length === 0) {
    return { attempted: 0, sent: 0, expired: [], failed: 0 }
  }

  const result: SendPushResult = {
    attempted: subs.length,
    sent: 0,
    expired: [],
    failed: 0,
  }

  await Promise.allSettled(
    (subs as any[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        )
        result.sent++
        // Bump last_used_at — fire and forget, don't block delivery loop
        supabase
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", sub.id)
          .then(() => undefined)
      } catch (err: any) {
        const code = err?.statusCode
        if (code === 404 || code === 410) {
          // Permanent — sub is gone or unsubscribed
          result.expired.push(sub.endpoint)
        } else {
          result.failed++
          console.warn(
            `[push] send failed for sub ${sub.id}: status=${code} message=${err?.message}`
          )
        }
      }
    })
  )

  if (result.expired.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", result.expired)
  }

  return result
}
