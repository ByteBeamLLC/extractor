import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { exchangeCodeForUser } from "@/lib/auth/google-oauth"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { trackServerEvent } from "@/lib/analytics/server"
import { setNewSignupCookie } from "@/lib/analytics/signup-cookie"
import type { Database } from "@/lib/supabase/types"

export const runtime = "nodejs"

export const maxDuration = 60

// GET /api/auth/google/callback?code=...&state=...
// Google redirects here after user grants consent.
// Creates or finds the Supabase user, verifies OTP server-side to set session cookies.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const stateRaw = searchParams.get("state")
  const error = searchParams.get("error")

  let next = "/dashboard"
  let anonUserId: string | undefined
  if (stateRaw) {
    try {
      const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString())
      next = state.next || "/dashboard"
      anonUserId = state.anon_uid
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
      // Flag for client-side GA4/Google Ads conversion on next page load
      await setNewSignupCookie()
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

    // Migrate anonymous user data to the new authenticated account
    if (anonUserId) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser && authUser.id !== anonUserId) {
        try {
          await migrateAnonymousData(admin, anonUserId, authUser.id)
          trackServerEvent("anonymous_converted", {
            distinct_id: authUser.id,
            user_id: authUser.id,
            email,
            source: "google_oauth",
            anon_user_id: anonUserId,
          })
        } catch (migErr) {
          // Log but don't block login — user can still use the app
          console.error("[google-auth-callback] Data migration failed:", migErr)
        }
      }
    }

    return NextResponse.redirect(new URL(next, origin))
  } catch (err) {
    console.error("[google-auth-callback] Error:", err)
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * Transfer all data owned by an anonymous user to a newly authenticated user.
 * Runs in a single transaction-like sequence using the service role client.
 * Only the anonymous user_id from the server-side session cookie is trusted.
 */
async function migrateAnonymousData(
  admin: ReturnType<typeof createSupabaseServiceRoleClient>,
  anonUserId: string,
  newUserId: string
) {
  // Re-assign parsers (and their child documents follow via parser_id)
  await admin
    .from("parsers")
    .update({ user_id: newUserId })
    .eq("user_id", anonUserId)

  // Re-assign extraction jobs
  await admin
    .from("extraction_jobs")
    .update({ user_id: newUserId })
    .eq("user_id", anonUserId)

  // Re-assign parser processed documents (have their own user_id column)
  await admin
    .from("parser_processed_documents")
    .update({ user_id: newUserId })
    .eq("user_id", anonUserId)

  // Transfer subscription/billing data
  await admin
    .from("extractor_subscriptions")
    .update({ user_id: newUserId })
    .eq("user_id", anonUserId)

  await admin
    .from("credit_wallets")
    .update({ user_id: newUserId })
    .eq("user_id", anonUserId)

  // Mark guest session as converted (if any)
  await admin
    .from("guest_sessions")
    .update({
      converted_to_user_id: newUserId,
      converted_at: new Date().toISOString(),
    })
    .eq("session_token", anonUserId)

  // Delete the orphaned anonymous auth user
  await admin.auth.admin.deleteUser(anonUserId)
}
