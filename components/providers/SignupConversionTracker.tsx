"use client"

import { useEffect, useRef } from "react"
import { useSession } from "@/lib/supabase/hooks"
import { trackEvent } from "@/lib/analytics"
import { getAttribution } from "@/lib/analytics/attribution"

const COOKIE_NAME = "_parsli_new_signup"

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`
}

/**
 * Fires GA4/Google Ads conversion events on the first authenticated page load
 * after sign-up. Reads the _parsli_new_signup cookie set by server-side auth
 * callbacks (Google OAuth, email confirmation) and pushes sign_up_completed +
 * ads_conversion to the dataLayer where GTM can forward them to GA4.
 *
 * This solves the gap where server-side auth redirects (OAuth) skip the
 * client-side JavaScript that normally fires these events.
 */
export function SignupConversionTracker() {
  const session = useSession()
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    if (!session?.user) return

    const cookie = getCookie(COOKIE_NAME)
    if (!cookie) return

    firedRef.current = true
    deleteCookie(COOKIE_NAME)

    const userId = session.user.id
    const email = session.user.email ?? ""

    // Fire the GA4 event (picked up by GTM tag "GA4 - sign_up_completed")
    trackEvent("sign_up_completed", {
      user_id: userId,
      email,
      source: "google_oauth",
    })

    // Fire the Google Ads conversion event with Enhanced Conversion data
    const attr = getAttribution()
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: "ads_conversion",
      conversion_type: "sign_up",
      user_id: userId,
      enhanced_conversion_data: { email },
      ...(attr?.gclid && { gclid: attr.gclid }),
      ...(attr?.utm_campaign && { utm_campaign: attr.utm_campaign }),
      ...(attr?.utm_term && { utm_term: attr.utm_term }),
    })
  }, [session])

  return null
}
