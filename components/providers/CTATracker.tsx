"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import type { AnalyticsEventMap } from "@/lib/analytics/events"

type Destination = AnalyticsEventMap["cta_clicked"]["cta_destination"]
type PageType = AnalyticsEventMap["cta_clicked"]["page_type"]

function inferDestination(href: string): Destination {
  if (!href) return "action"
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return "action"
  // Signup / auth surfaces
  if (/\/login|\/signup|\/dashboard/.test(href)) return "signup"
  if (href.includes("app.parsli.co")) return "signup"
  if (/\/pricing/.test(href)) return "pricing"
  if (/\/tools\//.test(href)) return "tool"
  if (/calendly\.com|demo/i.test(href)) return "demo"
  // Anything off-domain that wasn't caught above
  try {
    const u = new URL(href, typeof window !== "undefined" ? window.location.origin : "https://parsli.co")
    if (u.origin !== (typeof window !== "undefined" ? window.location.origin : "")) return "external"
  } catch {
    // relative href that didn't match any specific pattern
  }
  return "internal"
}

function inferPageType(pathname: string): PageType {
  if (!pathname) return "unknown"
  if (pathname.startsWith("/lp/") || pathname.startsWith("/ads/")) return "lp"
  if (pathname.startsWith("/tools/")) return "tool"
  if (pathname === "/login" || pathname.startsWith("/auth/")) return "auth"
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/parsers") ||
    pathname.startsWith("/settings")
  ) return "app"
  return "marketing"
}

/**
 * Global CTA click listener. Any element with `data-cta-location`
 * annotation (on the element itself or an ancestor) fires `cta_clicked`
 * when clicked. This is the universal replacement for the per-surface
 * heuristic listeners that previously only covered `/tools/*` and
 * `/lp/*` — every CTA, everywhere, through one schema.
 *
 * Attributes read (all optional except location):
 *   data-cta-location    required — stable identifier for the CTA slot
 *   data-cta-name        label; falls back to trimmed textContent
 *   data-cta-destination destination category; falls back to href inference
 *
 * Uses capture phase so the event fires before any stopPropagation from
 * child handlers, and walks up via closest() so the annotation can live
 * on any ancestor (e.g., the Button wrapper even when the <a> is inside).
 */
export function CTATracker() {
  const pathname = usePathname()

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const el = target.closest?.("[data-cta-location]") as HTMLElement | null
      if (!el) return

      const location = el.dataset.ctaLocation
      if (!location) return

      // Prefer explicit name, then an anchor inside, then element text.
      const anchor = el.tagName === "A" ? (el as HTMLAnchorElement) : el.querySelector("a")
      const name = (
        el.dataset.ctaName ||
        el.textContent?.trim().slice(0, 80) ||
        ""
      )
      const href =
        el.getAttribute("href") ||
        anchor?.getAttribute("href") ||
        ""

      const destination = (el.dataset.ctaDestination as Destination) || inferDestination(href)

      trackEvent("cta_clicked", {
        cta_location: location,
        cta_name: name,
        cta_href: href,
        cta_destination: destination,
        page_path: pathname || "",
        page_type: inferPageType(pathname || ""),
      })
    }

    document.addEventListener("click", onClick, { capture: true })
    return () => document.removeEventListener("click", onClick, { capture: true })
  }, [pathname])

  return null
}
