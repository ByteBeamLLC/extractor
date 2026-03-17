import Mixpanel from "mixpanel"
import type { AnalyticsEventMap, AnalyticsEvent } from "./events"

let client: Mixpanel.Mixpanel | null = null

function getClient(): Mixpanel.Mixpanel | null {
  if (client) return client
  const token =
    process.env.MIXPANEL_TOKEN || process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!token) return null
  client = Mixpanel.init(token)
  return client
}

/**
 * Tracks an event server-side via Mixpanel Node SDK.
 * Use for critical business events (first_value, sign_up_completed)
 * that must not be lost to ad blockers or client-side failures.
 */
export function trackServerEvent<E extends AnalyticsEvent>(
  name: E,
  properties: AnalyticsEventMap[E] & { distinct_id: string }
) {
  const mp = getClient()
  if (!mp) return

  mp.track(name, properties)
}
