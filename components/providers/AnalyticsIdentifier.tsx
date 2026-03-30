"use client"

import { useEffect, useRef } from "react"
import { useSession } from "@/lib/supabase/hooks"
import { identifyUser, startSessionRecording } from "@/lib/analytics"
import { getAttribution, clearAttribution } from "@/lib/analytics/attribution"
import { getIdentity } from "@/lib/analytics/identity"

export function AnalyticsIdentifier() {
  const session = useSession()
  const identifiedRef = useRef(false)

  useEffect(() => {
    if (!session?.user || identifiedRef.current) return
    identifiedRef.current = true

    const userId = session.user.id
    const email = session.user.email

    // Capture pre-signup identity context before identify() merges it
    const identity = getIdentity()

    identifyUser(userId, {
      email,
      // Set user profile properties from anonymous identity
      ...(identity && {
        first_traffic_source: identity.traffic_source,
        first_landing_page: identity.first_landing,
        first_referrer: identity.first_referrer,
        first_seen: identity.first_seen,
        tool_uses_before_signup: identity.tool_uses,
        total_sessions_before_signup: identity.session_count,
      }),
    })

    // Record 100% of authenticated app sessions
    startSessionRecording()

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
