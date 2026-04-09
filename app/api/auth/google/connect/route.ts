import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { buildGoogleAuthUrl } from "@/lib/auth/google-oauth"
import { signState } from "@/lib/auth/state-signing"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { hashToken } from "@/lib/bridge-sessions"
import type { Database } from "@/lib/supabase/types"

export const runtime = "nodejs"
export const maxDuration = 30

// GET /api/auth/google/connect?next=/dashboard&bridge_token=bsn_...
//
// Redirects user to Google OAuth consent screen. The state parameter is
// HMAC-signed to prevent forgery (fixes pre-existing vulnerability where
// anon_uid was base64-encoded with no signature).
//
// If bridge_token is provided (cross-subdomain bridge flow), the anonymous
// user ID is looked up server-side from bridge_sessions — never trusted
// from the URL. If no bridge_token, falls back to cookie-based anon lookup
// (in-app callers).
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") || "/dashboard"
  const bridgeToken = request.nextUrl.searchParams.get("bridge_token")
  const origin = request.nextUrl.origin
  const redirectUri = `${origin}/api/auth/google/callback`

  let anonUserId: string | undefined

  if (bridgeToken) {
    // Cross-subdomain flow: look up anon_user_id from bridge_sessions
    // The bridge_token is NOT consumed here — that happens after auth in
    // the app. We only peek at the anon_user_id for migration.
    try {
      const admin = createSupabaseServiceRoleClient()
      const hash = hashToken(bridgeToken)
      const { data } = await admin
        .from("bridge_sessions")
        .select("anon_user_id")
        .eq("token_hash", hash)
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString())
        .single()
      if (data) {
        anonUserId = (data as { anon_user_id: string }).anon_user_id
      }
    } catch { /* proceed without — user still gets authed, just no migration */ }
  } else {
    // In-app flow: read anon_uid from server-side session cookie
    try {
      const supabase = createRouteHandlerClient<Database>({ cookies })
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.is_anonymous) {
        anonUserId = user.id
      }
    } catch { /* no session — proceed without */ }
  }

  const state = signState({
    next,
    anon_uid: anonUserId,
    bridge_token: bridgeToken ?? undefined,
  })

  const authUrl = buildGoogleAuthUrl(redirectUri, state)
  return NextResponse.redirect(authUrl)
}
