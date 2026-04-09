import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { consumeEmailContinuationToken } from "@/lib/email-continuation"
import { trackServerEvent } from "@/lib/analytics/server"
import type { Database } from "@/lib/supabase/types"

export const runtime = "nodejs"

/**
 * GET /auth/email-continue?token=ect_...
 *
 * Magic-link-style auto-auth for notification emails. The CTA button in
 * "your document is ready" emails carries a single-use email continuation
 * token. This route:
 *
 *   1. Atomically consumes the token (single-use, expired = fail)
 *   2. Looks up the user by token.user_id
 *   3. Generates a magic link server-side and verifies it to set session cookies
 *   4. Redirects to the target URL (e.g. /parsers/{id}/documents/{docId})
 *
 * If the token is invalid, expired, or already consumed, redirects to
 * /login with an error message and a fallback link to the target URL.
 *
 * Security: Referrer-Policy: no-referrer prevents the token from leaking
 * in the Referer header when the user navigates away from the target page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const rawToken = searchParams.get("token")

  const loginFallback = `${origin}/login?error=email_link_expired`

  if (!rawToken || !rawToken.startsWith("ect_")) {
    return NextResponse.redirect(loginFallback)
  }

  const ip = request.headers.get("x-forwarded-for") ?? undefined
  const ua = request.headers.get("user-agent") ?? undefined

  // 1. Atomically consume — single-use
  const tokenRow = await consumeEmailContinuationToken(rawToken, ip, ua)

  if (!tokenRow) {
    trackServerEvent("email_continue_rejected", {
      distinct_id: "unknown",
      reason: "expired_or_consumed",
    })
    return NextResponse.redirect(loginFallback)
  }

  try {
    const admin = createSupabaseServiceRoleClient()

    // 2. Resolve user email
    const { data: userData } = await admin.auth.admin.getUserById(
      tokenRow.user_id
    )
    const email = userData?.user?.email
    if (!email) {
      trackServerEvent("email_continue_rejected", {
        distinct_id: tokenRow.user_id,
        user_id: tokenRow.user_id,
        reason: "user_not_found",
        nid: tokenRow.nid,
      })
      return NextResponse.redirect(loginFallback)
    }

    // 3. Generate magic link and verify server-side to set session cookies
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      })
    if (linkError) throw linkError

    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    })
    if (verifyError) throw verifyError

    // 4. Update consumed_by now that we have a session
    await admin
      .from("email_continuation_tokens")
      .update({ consumed_by: tokenRow.user_id })
      .eq("token_hash", tokenRow.token_hash)

    trackServerEvent("email_continue_success", {
      distinct_id: tokenRow.user_id,
      user_id: tokenRow.user_id,
      nid: tokenRow.nid,
      purpose: tokenRow.purpose,
      target_url: tokenRow.target_url,
    })

    // 5. Redirect to target — strip any token from the URL for safety
    const targetUrl = new URL(tokenRow.target_url, origin)
    const response = NextResponse.redirect(targetUrl)
    response.headers.set("Referrer-Policy", "no-referrer")
    return response
  } catch (err) {
    console.error("[email-continue] Error creating session:", err)
    trackServerEvent("email_continue_rejected", {
      distinct_id: tokenRow.user_id,
      user_id: tokenRow.user_id,
      reason: "session_creation_failed",
      nid: tokenRow.nid,
    })
    return NextResponse.redirect(loginFallback)
  }
}
