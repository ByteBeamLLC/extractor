import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { consumeBridgeSession } from "@/lib/bridge-sessions"
import { withErrorReporting, ApiError } from "@/lib/errorReporting"
import { trackServerEvent } from "@/lib/analytics/server"

export const runtime = "nodejs"

/**
 * POST /api/bridge-sessions/[token]/consume
 *
 * Atomically consumes a bridge session token after the user has authenticated.
 * Returns the session payload (chat messages, pending question, etc.) so the
 * app can hydrate the chat UI.
 *
 * Auth: requires a non-anonymous authenticated session.
 * Single-use: if the token was already consumed, returns 410 Gone.
 */
export const POST = withErrorReporting(
  "/api/bridge-sessions/[token]/consume",
  async (
    req: NextRequest,
    { params }: { params: { token: string } }
  ) => {
    const supabase = createSupabaseServerComponentClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new ApiError(401, "unauthenticated", "Sign in before consuming a bridge session.")
    }

    if (user.is_anonymous) {
      throw new ApiError(
        403,
        "anonymous_not_allowed",
        "Complete sign-up before consuming the bridge session."
      )
    }

    const rawToken = params.token
    if (!rawToken) {
      throw new ApiError(400, "missing_token", "Token is required.")
    }

    const ip = req.headers.get("x-forwarded-for") ?? undefined
    const ua = req.headers.get("user-agent") ?? undefined

    const session = await consumeBridgeSession(rawToken, user.id, ip, ua)

    if (!session) {
      trackServerEvent("bridge_session_rejected", {
        distinct_id: user.id,
        user_id: user.id,
        reason: "expired_or_consumed",
      })
      throw new ApiError(410, "token_expired", "This bridge session has expired or was already used.")
    }

    trackServerEvent("bridge_session_consumed", {
      distinct_id: user.id,
      user_id: user.id,
      parser_id: session.parser_id,
      document_id: session.document_id,
      anon_user_id: session.anon_user_id,
    })

    return NextResponse.json({
      parserId: session.parser_id,
      documentId: session.document_id,
      payload: session.payload,
    })
  }
)
