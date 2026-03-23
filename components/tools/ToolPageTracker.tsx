"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"
import { getIdentity } from "@/lib/analytics/identity"

/**
 * Tracks tool page views and CTA clicks with enriched identity context.
 * Drop this into any free tool page as a client component.
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

    // Track CTA clicks on the page
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const link = target.closest("a, button")
      if (!link) return

      const text = link.textContent?.trim() || ""
      const href = link.getAttribute("href") || ""

      // Only track CTA-like elements (links to app, pricing, calendly)
      const isCta =
        href.includes("app.parsli.co") ||
        href.includes("/pricing") ||
        href.includes("calendly.com") ||
        href.includes("/solutions/") ||
        href.includes("/docs") ||
        text.toLowerCase().includes("try parsli") ||
        text.toLowerCase().includes("get started") ||
        text.toLowerCase().includes("book a demo") ||
        text.toLowerCase().includes("explore api")

      if (isCta) {
        const currentIdentity = getIdentity()
        trackEvent("cta_clicked", {
          cta_text: text.slice(0, 100),
          cta_location: link.closest("section")?.querySelector("h2")?.textContent?.trim().slice(0, 80) || "unknown",
          page_path: window.location.pathname,
          lifetime_tool_uses: currentIdentity?.tool_uses || 0,
          session_number: currentIdentity?.session_count || 1,
        })
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [toolName])

  return null
}
