"use client"

import { useEffect, useRef } from "react"
import { useSession } from "@/lib/supabase/hooks"
import { identifyUser } from "@/lib/analytics"
import { getAttribution, clearAttribution } from "@/lib/analytics/attribution"

export function AnalyticsIdentifier() {
  const session = useSession()
  const identifiedRef = useRef(false)

  useEffect(() => {
    if (!session?.user || identifiedRef.current) return
    identifiedRef.current = true

    const userId = session.user.id
    const email = session.user.email

    identifyUser(userId, { email })

    // Send attribution data to Supabase, then clear local storage
    const attribution = getAttribution()
    if (attribution) {
      fetch("/api/analytics/attribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attribution),
      })
        .then(() => clearAttribution())
        .catch(() => {
          // Keep local data if server write fails — will retry on next session
        })
    }
  }, [session])

  return null
}
