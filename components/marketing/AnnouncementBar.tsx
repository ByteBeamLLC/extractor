"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, X } from "lucide-react"

/**
 * Top-of-page announcement bar for launches and high-intent product updates.
 *
 * Design principles (following landing-page-design best practices):
 *   - Single, high-contrast CTA with action verb ("See how")
 *   - Dismissable — remembered via localStorage so returning visitors aren't
 *     pestered with the same announcement
 *   - Story-driven copy: result + tool + differentiator
 *   - Tiny footprint — does not compete with the hero for attention
 *
 * Update ANNOUNCEMENT_ID when replacing the banner content. Dismissals are
 * keyed on this id so new announcements show to everyone, including users
 * who dismissed the previous one.
 */
const ANNOUNCEMENT_ID = "qbo-launch-2026-04"

const STORAGE_KEY = `parsli_announcement_dismissed_${ANNOUNCEMENT_ID}`

export function AnnouncementBar() {
  const [hidden, setHidden] = useState(true)

  // Read dismissal state AFTER mount so SSR output stays consistent for all
  // visitors (dismissal is a per-device preference, not a cacheable signal).
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === "1"
      setHidden(dismissed)
    } catch {
      // localStorage unavailable (private mode, SSR). Default to visible so
      // we don't silently hide announcements from those users.
      setHidden(false)
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // Ignore — dismissal is best-effort.
    }
    setHidden(true)
  }

  if (hidden) return null

  return (
    <div className="relative border-b border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
      <Link
        href="/integrations/quickbooks"
        className="flex items-center justify-center gap-3 py-2.5 px-10 text-sm font-medium text-foreground hover:text-primary transition-colors"
        data-cta-location="announcement_bar"
        data-cta-name={`Announcement: ${ANNOUNCEMENT_ID}`}
        data-cta-destination="internal"
      >
        <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
          New
        </span>
        <span className="hidden sm:inline">
          Push extracted invoices straight into QuickBooks Online — native, no Zapier.
        </span>
        <span className="sm:hidden">QuickBooks integration is live.</span>
        <span className="inline-flex items-center gap-1 text-primary">
          See how
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
