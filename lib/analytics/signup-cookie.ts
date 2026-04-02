import { cookies } from "next/headers"

const COOKIE_NAME = "_parsli_new_signup"

/**
 * Sets a short-lived cookie indicating a new sign-up just occurred.
 * Called from server-side auth callbacks (Google OAuth, email confirmation)
 * so the client can fire GA4/Google Ads conversion events on the next page load.
 */
export async function setNewSignupCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, "1", {
    path: "/",
    maxAge: 5 * 60, // 5 minutes — just needs to survive the redirect
    httpOnly: false, // Client-side JS needs to read this
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}
