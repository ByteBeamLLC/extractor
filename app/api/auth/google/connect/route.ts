import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { buildGoogleAuthUrl } from "@/lib/auth/google-oauth"
import type { Database } from "@/lib/supabase/types"

export const runtime = "nodejs"
export const maxDuration = 30

// GET /api/auth/google/connect?next=/dashboard
// Redirects user to Google OAuth consent screen.
// If the current session is anonymous, passes the anonymous user_id through
// the OAuth state so the callback can migrate their data.
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") || "/dashboard"
  const origin = request.nextUrl.origin
  const redirectUri = `${origin}/api/auth/google/callback`

  // Check if current session is anonymous — read from server-side cookies only
  let anonUserId: string | undefined
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.is_anonymous) {
      anonUserId = user.id
    }
  } catch { /* no session — proceed without */ }

  const statePayload: Record<string, string> = { next }
  if (anonUserId) statePayload.anon_uid = anonUserId

  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url")
  const authUrl = buildGoogleAuthUrl(redirectUri, state)

  return NextResponse.redirect(authUrl)
}
