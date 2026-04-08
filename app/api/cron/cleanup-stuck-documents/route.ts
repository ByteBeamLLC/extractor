import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { refundCredits } from "@/lib/extractor/billing/credits"
import { reportError } from "@/lib/errorReporting"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/cron/cleanup-stuck-documents
 *
 * Vercel Cron worker — sweeps the zombie processing queue every 5 minutes.
 *
 * A document is "stuck" if it has been in status='processing' for longer
 * than STUCK_THRESHOLD_MINUTES. Causes:
 *   - pg_net trigger dropped the request
 *   - worker crashed mid-extraction
 *   - Vercel invocation hit the 600s hard limit
 *
 * For each stuck doc:
 *   1. Mark it as status='error' with a timeout message.
 *   2. Refund any credits that were reserved at intent time (idempotent
 *      via refunded_at on parser_processed_documents).
 *
 * Auth mirrors the other crons: x-vercel-cron header OR CRON_SECRET bearer.
 */

const STUCK_THRESHOLD_MINUTES = 15
const BATCH_LIMIT = 100

export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  const auth = request.headers.get("authorization")
  const hasValidBearer =
    !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && !hasValidBearer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString()

  try {
    // Find stuck rows — processing past the threshold.
    const { data: stuck, error: findError } = await supabase
      .from("parser_processed_documents")
      .select("id, user_id, parser_id, credits_used, created_at, claimed_at, file_name")
      .eq("status", "processing")
      .lt("created_at", cutoff)
      .is("refunded_at", null)
      .limit(BATCH_LIMIT)

    if (findError) {
      console.error("[cleanup-stuck] Find query failed:", findError)
      return NextResponse.json({ error: "find_failed" }, { status: 500 })
    }

    const rows = (stuck ?? []) as Array<{
      id: string
      user_id: string
      parser_id: string
      credits_used: number | null
      created_at: string
      claimed_at: string | null
      file_name: string | null
    }>

    if (rows.length === 0) {
      return NextResponse.json({ swept: 0 })
    }

    let marked = 0
    let refunded = 0
    const failures: string[] = []

    for (const row of rows) {
      // Mark as error first so any late worker pickup is a no-op.
      const { error: updateError } = await supabase
        .from("parser_processed_documents")
        .update({
          status: "error",
          error_message: `Extraction timed out after ${STUCK_THRESHOLD_MINUTES} minutes and was automatically cleaned up.`,
          processed_at: new Date().toISOString(),
          enriching_fields: null,
        })
        .eq("id", row.id)
        .eq("status", "processing") // still processing — don't clobber finished ones

      if (updateError) {
        failures.push(`${row.id}: update_failed`)
        continue
      }

      marked++

      const reserved = row.credits_used ?? 0
      if (reserved > 0) {
        const { refunded: didRefund } = await refundCredits(
          row.user_id,
          row.id,
          reserved,
          supabase
        )
        if (didRefund) refunded++
      }
    }

    console.log(
      `[cleanup-stuck] swept=${rows.length} marked=${marked} refunded=${refunded} failed=${failures.length}`
    )

    if (failures.length > 0) {
      reportError(new Error("Stuck-doc cleanup had failures"), {
        route: "/api/cron/cleanup-stuck-documents",
        extra: { failures, sweptCount: rows.length },
      })
    }

    return NextResponse.json({
      swept: rows.length,
      marked,
      refunded,
      failures,
    })
  } catch (err) {
    console.error("[cleanup-stuck] Unhandled error:", err)
    reportError(err, { route: "/api/cron/cleanup-stuck-documents" })
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
