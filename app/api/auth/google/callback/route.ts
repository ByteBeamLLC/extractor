import { type NextRequest, NextResponse } from "next/server"
import { exchangeCodeForUser } from "@/lib/auth/google-oauth"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { trackServerEvent } from "@/lib/analytics/server"

export const runtime = "nodejs"

// GET /api/auth/google/callback?code=...&state=...
// Google redirects here after user grants consent.
// Creates or finds the Supabase user, generates a magic link to set their session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const stateRaw = searchParams.get("state")
  const error = searchParams.get("error")

  let next = "/dashboard"
  if (stateRaw) {
    try {
      const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString())
      next = state.next || "/dashboard"
    } catch { /* use default */ }
  }

  const loginUrl = `${origin}/login?error=google_auth_failed`

  if (error || !code) {
    return NextResponse.redirect(loginUrl)
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`
    const { email, name } = await exchangeCodeForUser(code, redirectUri)

    const supabase = createSupabaseServiceRoleClient()

    // Try to create user — if they already exist, Supabase returns an error we can handle
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (newUser?.user) {
      trackServerEvent("sign_up_completed", {
        distinct_id: newUser.user.id,
        user_id: newUser.user.id,
        email,
        source: "google_oauth",
      })
    } else if (createError && !createError.message.includes("already been registered")) {
      throw createError
    }

    // Generate a magic link to set the session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (linkError) throw linkError

    // Redirect user through the magic link to establish their session
    return NextResponse.redirect(linkData.properties.action_link)
  } catch (err) {
    console.error("[google-auth-callback] Error:", err)
    return NextResponse.redirect(loginUrl)
  }
}
