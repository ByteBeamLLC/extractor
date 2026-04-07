"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "@/lib/supabase/hooks"
import { trackEvent } from "@/lib/analytics"

/**
 * Detects re-engagement attribution params on the current URL and:
 *   1. Fires a `notification_clicked` Mixpanel event tagged with channel + nid
 *   2. POSTs to /api/notifications/click so the email cron can dedupe
 *   3. Strips the attribution params from the URL (replace, no scroll)
 *
 * Mount once near the top of the authenticated app tree. The hook is
 * idempotent within a session via a ref guard.
 */
export function useNotificationAttribution() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const session = useSession()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    if (!session?.user?.id) return

    const nid = searchParams.get("nid")
    if (!nid) return

    const utmSource = searchParams.get("utm_source") || ""
    const channel: "email" | "push" = utmSource === "push" ? "push" : "email"

    fired.current = true

    const documentId = extractDocumentIdFromPath(pathname) ?? undefined

    trackEvent("notification_clicked", {
      user_id: session.user.id,
      nid,
      channel,
      document_id: documentId,
    })

    // Fire-and-forget — failure here just means the email isn't deduped,
    // not the end of the world.
    fetch("/api/notifications/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nid, channel }),
    }).catch(() => {})

    // Strip attribution params so refreshes don't re-fire and the URL stays clean.
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete("nid")
    newParams.delete("utm_source")
    newParams.delete("utm_medium")
    newParams.delete("utm_campaign")
    const newQuery = newParams.toString()
    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [session?.user?.id, searchParams, pathname, router])
}

function extractDocumentIdFromPath(path: string): string | null {
  const match = path.match(/\/documents\/([^/?#]+)/)
  return match ? match[1] : null
}
