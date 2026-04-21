import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { exchangeCodeForUser } from "@/lib/auth/google-oauth"
import { verifyState } from "@/lib/auth/state-signing"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { trackServerEvent } from "@/lib/analytics/server"
import { setNewSignupCookie } from "@/lib/analytics/signup-cookie"
import type { Database } from "@/lib/supabase/types"

export const runtime = "nodejs"

export const maxDuration = 60

// GET /api/auth/google/callback?code=...&state=...
// Google redirects here after user grants consent.
// Creates or finds the Supabase user, verifies OTP server-side to set session cookies.
//
// State is HMAC-verified — rejects forged or expired state parameters.
// Anonymous data migration uses the transactional Postgres RPC function
// instead of sequential JS UPDATEs.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const stateRaw = searchParams.get("state")
  const error = searchParams.get("error")

  const loginUrl = `${origin}/login?error=google_auth_failed`

  if (error || !code) {
    return NextResponse.redirect(loginUrl)
  }

  // Verify HMAC-signed state — rejects forged or expired (>15 min) states
  let next = "/dashboard"
  let anonUserId: string | undefined
  let bridgeToken: string | undefined

  if (stateRaw) {
    const state = verifyState(stateRaw)
    if (!state) {
      console.error("[google-auth-callback] Invalid or expired state parameter")
      return NextResponse.redirect(`${origin}/login?error=invalid_state`)
    }
    next = state.next || "/dashboard"
    anonUserId = state.anon_uid
    bridgeToken = state.bridge_token
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
      // Flag the client to fire sign_up_completed on the next render.
      // We intentionally do NOT trackServerEvent here — the server knows
      // only the Supabase auth UUID, not the browser's Mixpanel distinct_id,
      // so a server-side fire would orphan the event from the pre-signup
      // funnel (page_viewed, cta_clicked).
      await setNewSignupCookie("google_oauth")
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

    // Migrate anonymous user data via transactional Postgres function
    if (anonUserId) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser && authUser.id !== anonUserId) {
        try {
          const { data: rowCounts, error: rpcError } = await admin.rpc(
            "migrate_anonymous_user_data",
            { p_anon_user_id: anonUserId, p_new_user_id: authUser.id }
          )

          if (rpcError) throw rpcError

          // Audit log
          await admin.from("account_migrations").insert({
            anon_user_id: anonUserId,
            new_user_id: authUser.id,
            source: "google_oauth",
            row_counts: rowCounts ?? {},
            success: true,
          })

          // Delete the orphaned anonymous auth user
          await admin.auth.admin.deleteUser(anonUserId)

          trackServerEvent("anonymous_converted", {
            distinct_id: authUser.id,
            user_id: authUser.id,
            email,
            source: "google_oauth",
            anon_user_id: anonUserId,
          })
        } catch (migErr) {
          // Log failure audit — do NOT delete the anon user on failure
          console.error("[google-auth-callback] Data migration failed:", migErr)
          await admin.from("account_migrations").insert({
            anon_user_id: anonUserId,
            new_user_id: authUser.id,
            source: "google_oauth",
            row_counts: {},
            success: false,
            error_message:
              migErr instanceof Error ? migErr.message : String(migErr),
          })
        }
      }
    }

    // If bridge_token is present, append it to the redirect URL so the app
    // can consume it and hydrate the chat UI.
    const redirectUrl = new URL(next, origin)
    if (bridgeToken) {
      redirectUrl.searchParams.set("handoff", bridgeToken)
    }

    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error("[google-auth-callback] Error:", err)
    return NextResponse.redirect(loginUrl)
  }
}
