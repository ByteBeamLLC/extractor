import type { AnalyticsEventMap, AnalyticsEvent } from "./events"

let mixpanelInitialized = false

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

/**
 * Initializes Mixpanel. Idempotent — safe to call multiple times.
 */
export function initAnalytics() {
  if (typeof window === "undefined") return
  if (mixpanelInitialized) return

  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!token) return

  // Dynamic import to avoid SSR issues
  import("mixpanel-browser").then((mp) => {
    mp.default.init(token, {
      track_pageview: true,
      persistence: "localStorage+cookie",
    })
    mixpanelInitialized = true
  })
}

/**
 * Identifies the current user in Mixpanel and pushes user properties to dataLayer.
 */
export function identifyUser(
  userId: string,
  traits: { email?: string; [key: string]: unknown }
) {
  if (typeof window === "undefined") return

  import("mixpanel-browser").then((mp) => {
    mp.default.identify(userId)
    mp.default.people.set({
      $email: traits.email,
      ...traits,
    })
  })

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: "user_identified",
    user_id: userId,
    ...traits,
  })
}

/**
 * Resets analytics identity on sign-out.
 */
export function resetAnalytics() {
  if (typeof window === "undefined") return

  import("mixpanel-browser").then((mp) => {
    mp.default.reset()
  })
}

/**
 * Tracks an event to both GTM dataLayer (for GA4 + Google Ads) and Mixpanel.
 */
export function trackEvent<E extends AnalyticsEvent>(
  name: E,
  properties: AnalyticsEventMap[E]
) {
  if (typeof window === "undefined") return

  // Push to GTM dataLayer
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: name,
    ...properties,
  })

  // Push to Mixpanel
  import("mixpanel-browser").then((mp) => {
    mp.default.track(name, properties)
  })
}
