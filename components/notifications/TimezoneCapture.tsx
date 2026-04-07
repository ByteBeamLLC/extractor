"use client"

import { useEffect } from "react"
import { useSession } from "@/lib/supabase/hooks"

const LS_KEY = "parsli:user_tz"

/**
 * Silently captures the user's IANA timezone from the browser and PATCHes
 * it to `extractor_subscriptions.timezone` so the email cron can apply
 * 22:00–07:00 quiet hours in the user's local time.
 *
 * Idempotent across sessions via localStorage — only fires when the
 * browser's reported timezone differs from the last value we synced.
 * Renders nothing.
 */
export function TimezoneCapture() {
  const session = useSession()

  useEffect(() => {
    if (!session?.user?.id) return
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (!browserTz) return

      const cached = localStorage.getItem(LS_KEY)
      if (cached === browserTz) return

      fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: browserTz }),
      })
        .then((res) => {
          if (res.ok) localStorage.setItem(LS_KEY, browserTz)
        })
        .catch(() => {
          // Best-effort. Worst case: cron uses UTC for quiet hours.
        })
    } catch {
      // Intl unavailable / locked-down environment — fine to skip.
    }
  }, [session?.user?.id])

  return null
}
