"use client"

import { useEffect } from "react"
import { initAnalytics, trackEvent, registerSuperProperties } from "@/lib/analytics"
import { captureAttribution, getAttribution } from "@/lib/analytics/attribution"
import { initIdentity } from "@/lib/analytics/identity"

export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics()
    captureAttribution()

    // Register attribution as super properties so utm_term (keyword),
    // utm_campaign, gclid, etc. auto-attach to EVERY future event.
    // This enables full-funnel keyword attribution: LP → tool use → signup → paid.
    const attr = getAttribution()
    if (attr) {
      registerSuperProperties({
        attr_utm_source: attr.utm_source || "",
        attr_utm_medium: attr.utm_medium || "",
        attr_utm_campaign: attr.utm_campaign || "",
        attr_utm_term: attr.utm_term || "",
        attr_utm_content: attr.utm_content || "",
        attr_has_gclid: !!attr.gclid,
        attr_landing_page: attr.landing_page || "",
      })
    }

    // Initialize anonymous identity and fire session event
    const { identity, isNewSession } = initIdentity()

    if (isNewSession) {
      const daysSinceFirst = identity.first_seen
        ? Math.floor(
            (Date.now() - new Date(identity.first_seen).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0
      const daysSinceLast = identity.last_seen
        ? Math.floor(
            (Date.now() - new Date(identity.last_seen).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0

      trackEvent("session_started", {
        session_number: identity.session_count,
        days_since_first_visit: daysSinceFirst,
        days_since_last_session: daysSinceLast,
        traffic_source: identity.traffic_source,
        is_return_visitor: identity.session_count > 1,
        lifetime_tool_uses: identity.tool_uses,
      })
    }
  }, [])

  return null
}
