import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { exchangeCodeForUser } from "@/lib/auth/google-oauth"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { trackServerEvent } from "@/lib/analytics/server"
import type { Database } from "@/lib/supabase/types"

export const runtime = "nodejs"

// GET /api/auth/google/callback?code=...&state=...
// Google redirects here after user grants consent.
// Creates or finds the Supabase user, verifies OTP server-side to set session cookies.
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

    const admin = createSupabaseServiceRoleClient()

    // Try to create user — if they already exist, Supabase returns an error we can handle
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
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

    // Generate a magic link token
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    })
    if (linkError) throw linkError

    // Verify the token server-side to set session cookies directly
    // This avoids redirecting through Supabase (which uses the Site URL)
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    })
    if (verifyError) throw verifyError

    return NextResponse.redirect(new URL(next, origin))
  } catch (err) {
    console.error("[google-auth-callback] Error:", err)
    return NextResponse.redirect(loginUrl)
  }
}
