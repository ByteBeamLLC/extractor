import { cookies } from "next/headers"

const COOKIE_NAME = "_parsli_new_signup"

export type SignupCookieSource = "email" | "google_oauth" | (string & {})

/**
 * Sets a short-lived cookie that survives a server → client redirect and
 * tells `SignupConversionTracker` to fire `sign_up_completed` from the
 * browser with the correct, cross-subdomain distinct_id.
 *
 * The cookie value IS the signup source — every provider callback (email
 * confirmation in `/auth/callback`, Google OAuth in `/api/auth/google/
 * callback`, future providers) sets this with its own value. Setting the
 * cookie is the provider's only tracking responsibility.
 *
 * `domain: ".parsli.co"` in production so the cookie is readable on both
 * `parsli.co` (if the redirect ever lands there) and `app.parsli.co`
 * (where `SignupConversionTracker` mounts).
 */
export async function setNewSignupCookie(source: SignupCookieSource) {
  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === "production"
  cookieStore.set(COOKIE_NAME, source, {
    path: "/",
    maxAge: 5 * 60,
    httpOnly: false,
    sameSite: "lax",
    secure: isProd,
    ...(isProd ? { domain: ".parsli.co" } : {}),
  })
}
