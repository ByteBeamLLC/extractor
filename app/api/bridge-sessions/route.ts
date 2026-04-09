import { NextRequest, NextResponse } from "next/server"
import {
  createSupabaseServerComponentClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server"
import { createBridgeSession } from "@/lib/bridge-sessions"
import { withErrorReporting, ApiError } from "@/lib/errorReporting"
import { trackServerEvent } from "@/lib/analytics/server"

export const runtime = "nodejs"

/**
 * POST /api/bridge-sessions
 *
 * Creates a server-side handoff token for the cross-subdomain bridge.
 * Called by BridgeChat when the anonymous user types a follow-up question
 * and needs to authenticate + land in the app with their session intact.
 *
 * Auth: requires a session (anonymous or permanent).
 * The caller must own the parser_id they're creating a session for.
 */
export const POST = withErrorReporting(
  "/api/bridge-sessions",
  async (req: NextRequest) => {
    const supabase = createSupabaseServerComponentClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new ApiError(401, "unauthenticated", "Sign in before creating a bridge session.")
    }

    const body = await req.json()
    const parserId = body.parserId as string | undefined
    const documentId = body.documentId as string | undefined
    const payload = body.payload as Record<string, unknown> | undefined

    if (!parserId || !documentId) {
      throw new ApiError(400, "missing_fields", "parserId and documentId are required.")
    }

    // Verify the user owns the parser
    const admin = createSupabaseServiceRoleClient()
    const { data: parser } = await admin
      .from("parsers")
      .select("id")
      .eq("id", parserId)
      .eq("user_id", user.id)
      .single()

    if (!parser) {
      throw new ApiError(403, "not_owner", "You do not own this parser.")
    }

    const { rawToken } = await createBridgeSession({
      source: "hwt_bridge",
      anonUserId: user.id,
      parserId,
      documentId,
      payload: payload ?? {},
    })

    trackServerEvent("bridge_session_created", {
      distinct_id: user.id,
      user_id: user.id,
      parser_id: parserId,
      document_id: documentId,
      is_anonymous: user.is_anonymous === true,
    })

    return NextResponse.json({ token: rawToken })
  }
)
