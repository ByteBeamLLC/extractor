"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"
import { getIdentity } from "@/lib/analytics/identity"

/**
 * Tracks tool page views with enriched identity context.
 * Drop this into any free tool page as a client component.
 *
 * CTA clicks on tool pages are now handled globally by `CTATracker` in
 * the root layout — any button annotated with `data-cta-location` fires
 * the unified `cta_clicked` event. This tracker is now just the tool-
 * page view signal.
 */
export function ToolPageTracker({ toolName }: { toolName: string }) {
  useEffect(() => {
    const identity = getIdentity()
    if (!identity) return

    const daysSinceFirst = identity.first_seen
      ? Math.floor(
          (Date.now() - new Date(identity.first_seen).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    trackEvent("tool_page_viewed", {
      tool_name: toolName,
      traffic_source: identity.traffic_source,
      session_number: identity.session_count,
      days_since_first_visit: daysSinceFirst,
      lifetime_tool_uses: identity.tool_uses,
    })
  }, [toolName])

  return null
}
