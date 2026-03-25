"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"
import { getIdentity } from "@/lib/analytics/identity"

/**
 * Landing page tracker for paid ad campaigns.
 *
 * Captures UTM parameters (especially utm_term for keyword-level tracking)
 * and fires analytics events for:
 * - lp_viewed: Page view with full UTM context
 * - lp_cta_clicked: Every CTA click with keyword attribution
 * - lp_section_seen: Scroll depth by section (25%, 50%, 75%, 100%)
 *
 * Usage: <LPTracker page="handwriting-to-text" />
 *
 * Google Ads setup: Use {keyword} ValueTrack parameter in the final URL:
 *   parsli.co/lp/handwriting-to-text?utm_source=google&utm_medium=cpc&utm_campaign=handwriting&utm_term={keyword}
 */
export function LPTracker({ page }: { page: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const utm = {
      source: params.get("utm_source") || "(direct)",
      medium: params.get("utm_medium") || "(none)",
      campaign: params.get("utm_campaign") || "(none)",
      term: params.get("utm_term") || "(none)",
      content: params.get("utm_content") || "(none)",
      gclid: params.get("gclid") || undefined,
    }

    // Persist UTM to sessionStorage so CTA clicks carry the keyword context
    sessionStorage.setItem("parsli_lp_utm", JSON.stringify(utm))

    const identity = getIdentity()

    // ── Page view ──
    trackEvent("lp_viewed", {
      lp_page: page,
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      utm_term: utm.term,
      utm_content: utm.content,
      has_gclid: !!utm.gclid,
      traffic_source: identity?.traffic_source || utm.source,
      session_number: identity?.session_count || 1,
    })

    // ── CTA click tracking ──
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const link = target.closest("a, button")
      if (!link) return

      const text = link.textContent?.trim() || ""
      const href = link.getAttribute("href") || ""

      const isCta =
        href.includes("app.parsli.co") ||
        href.includes("calendly.com") ||
        href.includes("/tools/handwriting") ||
        text.toLowerCase().includes("start free") ||
        text.toLowerCase().includes("get started") ||
        text.toLowerCase().includes("book a") ||
        text.toLowerCase().includes("try free") ||
        text.toLowerCase().includes("contact sales")

      if (isCta) {
        const stored = sessionStorage.getItem("parsli_lp_utm")
        const utmCtx = stored ? JSON.parse(stored) : utm

        trackEvent("lp_cta_clicked", {
          lp_page: page,
          cta_text: text.slice(0, 100),
          cta_href: href.slice(0, 200),
          cta_section:
            link
              .closest("section")
              ?.querySelector("h2")
              ?.textContent?.trim()
              .slice(0, 80) || "hero",
          utm_source: utmCtx.source,
          utm_medium: utmCtx.medium,
          utm_campaign: utmCtx.campaign,
          utm_term: utmCtx.term,
          utm_content: utmCtx.content,
        })
      }
    }

    document.addEventListener("click", handleClick)

    // ── Scroll depth tracking ──
    const sections = document.querySelectorAll("section")
    const totalSections = sections.length
    const seen = new Set<number>()

    function checkScroll() {
      const scrollY = window.scrollY + window.innerHeight
      const docHeight = document.documentElement.scrollHeight
      const pct = Math.round((scrollY / docHeight) * 100)

      const milestones = [25, 50, 75, 100]
      for (const m of milestones) {
        if (pct >= m && !seen.has(m)) {
          seen.add(m)
          trackEvent("lp_scroll_depth", {
            lp_page: page,
            depth_pct: m,
            utm_term: utm.term,
            utm_campaign: utm.campaign,
          })
        }
      }
    }

    window.addEventListener("scroll", checkScroll, { passive: true })
    return () => {
      document.removeEventListener("click", handleClick)
      window.removeEventListener("scroll", checkScroll)
    }
  }, [page])

  return null
}
