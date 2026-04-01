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
    })
    if (linkError) throw linkError

    // Build the verify URL ourselves so it uses the correct origin
    // (Supabase action_link uses the Site URL from dashboard which may be localhost)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(redirectTo)}`

    return NextResponse.redirect(verifyUrl)
  } catch (err) {
    console.error("[google-auth-callback] Error:", err)
    return NextResponse.redirect(loginUrl)
  }
}
