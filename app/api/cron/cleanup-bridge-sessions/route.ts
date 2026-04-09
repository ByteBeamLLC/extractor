import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { reportError } from "@/lib/errorReporting"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/cron/cleanup-bridge-sessions
 *
 * Vercel Cron worker — purges expired handoff tokens once a day.
 *
 * Bridge sessions: DELETE rows expired > 24h ago (consumed or not).
 * Email continuation tokens: DELETE rows expired > 30 days ago.
 *
 * Both tables use expires_at for the TTL. We add a grace period past
 * expiry before deletion so that recently-expired tokens still show a
 * clean "expired" error rather than a confusing "not found".
 */

const BRIDGE_GRACE_HOURS = 24
const EMAIL_GRACE_DAYS = 30

export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  const auth = request.headers.get("authorization")
  const hasValidBearer =
    !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && !hasValidBearer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const results: Record<string, number | string[]> = {}
  const errors: string[] = []

  // 1. Purge bridge_sessions expired > 24h ago
  try {
    const bridgeCutoff = new Date(
      Date.now() - BRIDGE_GRACE_HOURS * 60 * 60 * 1000
    ).toISOString()

    const { data, error } = await supabase
      .from("bridge_sessions")
      .delete()
      .lt("expires_at", bridgeCutoff)
      .select("token_hash")

    if (error) {
      errors.push(`bridge_sessions: ${error.message}`)
    } else {
      results.bridge_deleted = data?.length ?? 0
    }
  } catch (err) {
    errors.push(`bridge_sessions: ${err instanceof Error ? err.message : String(err)}`)
  }

  // 2. Purge email_continuation_tokens expired > 30 days ago
  try {
    const emailCutoff = new Date(
      Date.now() - EMAIL_GRACE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString()

    const { data, error } = await supabase
      .from("email_continuation_tokens")
      .delete()
      .lt("expires_at", emailCutoff)
      .select("token_hash")

    if (error) {
      errors.push(`email_continuation_tokens: ${error.message}`)
    } else {
      results.email_deleted = data?.length ?? 0
    }
  } catch (err) {
    errors.push(`email_continuation_tokens: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (errors.length > 0) {
    console.error("[cleanup-bridge-sessions] Errors:", errors)
    reportError(new Error("Bridge/email token cleanup had failures"), {
      route: "/api/cron/cleanup-bridge-sessions",
      extra: { errors, results },
    })
  }

  console.log("[cleanup-bridge-sessions]", results)
  return NextResponse.json({ ...results, errors })
}
