"use client"

import { useEffect, useRef } from "react"
import { useSession } from "@/lib/supabase/hooks"
import { completeSignup } from "@/lib/analytics/signup"
import type { AnalyticsEventMap } from "@/lib/analytics/events"

const COOKIE_NAME = "_parsli_new_signup"

type SignupSource = AnalyticsEventMap["sign_up_completed"]["source"]

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function deleteCookie(name: string) {
  // Match the production cookie's domain so the delete actually removes it.
  const isProd =
    typeof window !== "undefined" && window.location.hostname.endsWith("parsli.co")
  const domainAttr = isProd ? "; domain=.parsli.co" : ""
  document.cookie = `${name}=; path=/; max-age=0${domainAttr}`
}

/**
 * The single fire point for `sign_up_completed` on cross-redirect signup
 * paths (email confirmation, Google OAuth, any future provider). Server-
 * side callbacks set `_parsli_new_signup={source}`; this reads it on the
 * first authenticated render, fires via `completeSignup`, and clears the
 * cookie.
 *
 * In-app signup paths that don't redirect (anonymous → real account via
 * `updateUser`) call `completeSignup` directly — they skip the cookie
 * because identity is already stable and client-side.
 */
export function SignupConversionTracker() {
  const session = useSession()
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    if (!session?.user) return

    const cookieValue = getCookie(COOKIE_NAME)
    if (!cookieValue) return

    firedRef.current = true
    deleteCookie(COOKIE_NAME)

    completeSignup(
      cookieValue as SignupSource,
      session.user.id,
      session.user.email ?? ""
    )
  }, [session])

  return null
}
