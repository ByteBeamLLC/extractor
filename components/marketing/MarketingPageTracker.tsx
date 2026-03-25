"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import { getIdentity } from "@/lib/analytics/identity"

/**
 * Fires `page_viewed` on every marketing page navigation with enriched
 * identity context. Placed in the marketing layout so it covers all
 * public pages (blog, guides, use-cases, integrations, tools, etc.).
 */
export function MarketingPageTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<string>("")

  useEffect(() => {
    // Avoid double-firing on the same path (React strict mode)
    if (pathname === lastTracked.current) return
    lastTracked.current = pathname

    const identity = getIdentity()

    trackEvent("page_viewed", {
      page_path: pathname,
      referrer: document.referrer || "",
      traffic_source: identity?.traffic_source || "direct",
      session_number: identity?.session_count || 1,
      is_return_visitor: (identity?.session_count || 1) > 1,
    })
  }, [pathname])

  return null
}
