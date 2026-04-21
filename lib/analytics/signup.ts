"use client"

import { trackEvent } from "."
import { getAttribution } from "./attribution"
import type { AnalyticsEventMap } from "./events"

type SignupSource = AnalyticsEventMap["sign_up_completed"]["source"]

/**
 * The ONE place that fires `sign_up_completed` + the Google Ads conversion
 * push. Every signup path — email confirmation, Google OAuth, anonymous
 * conversion, future providers — funnels through here so the event fires
 * exactly once per account, with the browser's current Mixpanel distinct_id
 * (which by this point has been `identify()`'d to the Supabase user id).
 *
 * Dedup key is scoped to the user id in sessionStorage. The cookie handoff
 * in `SignupConversionTracker` already deletes the cookie after read, but
 * that dedup only covers the cross-redirect case — this second guard also
 * covers the in-app anonymous-conversion path and any future caller.
 */
export function completeSignup(
  source: SignupSource,
  userId: string,
  email: string
) {
  if (typeof window === "undefined") return
  if (!userId) return

  const dedupKey = `_parsli_signup_fired_${userId}`
  try {
    if (sessionStorage.getItem(dedupKey)) return
    sessionStorage.setItem(dedupKey, "1")
  } catch {
    // Private-mode or storage disabled — fall through and fire anyway.
    // A duplicate event is less bad than a missed one.
  }

  trackEvent("sign_up_completed", { user_id: userId, email, source })

  // Google Ads conversion with Enhanced Conversion payload. This path
  // used to live in SignupConversionTracker and only fired for OAuth;
  // centralizing it here means email + anonymous conversions now fire
  // the conversion pixel too.
  const attr = getAttribution()
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: "ads_conversion",
    conversion_type: "sign_up",
    user_id: userId,
    enhanced_conversion_data: { email },
    ...(attr?.gclid && { gclid: attr.gclid }),
    ...(attr?.utm_campaign && { utm_campaign: attr.utm_campaign }),
    ...(attr?.utm_term && { utm_term: attr.utm_term }),
  })
}
