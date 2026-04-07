import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { trackServerEvent } from "@/lib/analytics/server"
import { sendEmail } from "@/lib/email/send"
import {
  ExtractionReadyEmail,
  getExtractionReadyText,
  type ExtractionReadyEmailProps,
  type FieldPreviewItem,
} from "@/emails/ExtractionReady"
import { reportError } from "@/lib/errorReporting"
import type { SchemaField } from "@/lib/schema"

export const runtime = "nodejs"
export const maxDuration = 60

const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const QUIET_HOURS_START = 22 // 22:00 local
const QUIET_HOURS_END = 7 // 07:00 local
const BATCH_SIZE = 100
const PREVIEW_FIELD_LIMIT = 6
const FULL_PREVIEW_CHARS = 300
const FIELD_VALUE_TRUNCATE = 60

type SuppressionReason =
  | "push_clicked"
  | "email_clicked"
  | "user_disabled"
  | "expired"

type JobOutcome = "sent" | "suppressed" | "deferred" | "failed"

/**
 * GET /api/cron/process-notification-emails
 *
 * Vercel Cron worker — runs every minute, picks up `notification_emails`
 * rows that are due (status=pending AND scheduled_for <= now()), applies
 * dedupe + quiet-hours rules, and dispatches via Resend.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (
    !process.env.CRON_SECRET ||
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const summary = {
    processed: 0,
    sent: 0,
    suppressed: 0,
    deferred: 0,
    failed: 0,
  }

  const { data: jobs, error: queryErr } = await supabase
    .from("notification_emails")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_SIZE)

  if (queryErr) {
    console.error("[notification-cron] Query failed:", queryErr)
    reportError(queryErr, { route: "/api/cron/process-notification-emails" })
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ summary, message: "no due jobs" })
  }

  for (const job of jobs) {
    summary.processed++
    try {
      const outcome = await processJob(job, supabase)
      summary[outcome]++
    } catch (err) {
      summary.failed++
      console.error(`[notification-cron] Job ${job.id} failed:`, err)
      reportError(err, {
        route: "/api/cron/process-notification-emails",
        userId: job.user_id,
        extra: { jobId: job.id, nid: job.nid },
      })
      await supabase
        .from("notification_emails")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : String(err),
        })
        .eq("id", job.id)
    }
  }

  console.log(
    `[notification-cron] processed=${summary.processed} sent=${summary.sent} suppressed=${summary.suppressed} deferred=${summary.deferred} failed=${summary.failed}`
  )

  return NextResponse.json({ summary })
}

async function processJob(
  job: any,
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>
): Promise<JobOutcome> {
  // 1. Dedupe — already returned via push or email
  if (job.push_clicked_at) {
    await markSuppressed(supabase, job, "push_clicked")
    return "suppressed"
  }
  if (job.email_clicked_at) {
    await markSuppressed(supabase, job, "email_clicked")
    return "suppressed"
  }

  // 2. Hard cap — drop jobs older than 6 hours
  const ageMs = Date.now() - new Date(job.created_at).getTime()
  if (ageMs > SIX_HOURS_MS) {
    await markSuppressed(supabase, job, "expired")
    return "suppressed"
  }

  // 3. Load doc + parser + sub
  const [{ data: doc }, { data: parser }, { data: sub }] = await Promise.all([
    supabase
      .from("parser_processed_documents")
      .select("*")
      .eq("id", job.document_id)
      .single(),
    supabase
      .from("parsers")
      .select("*")
      .eq("id", job.parser_id)
      .single(),
    supabase
      .from("extractor_subscriptions")
      .select("notification_email_enabled, timezone")
      .eq("user_id", job.user_id)
      .maybeSingle(),
  ])

  if (!doc || !parser) {
    // Source data was deleted between scheduling and now
    await markSuppressed(supabase, job, "expired")
    return "suppressed"
  }

  // 4. User disabled notifications between scheduling and now?
  if (sub && sub.notification_email_enabled === false) {
    await markSuppressed(supabase, job, "user_disabled")
    return "suppressed"
  }

  // 5. Quiet hours — defer until 8am local
  const tz = sub?.timezone || "UTC"
  if (isInQuietHours(tz)) {
    const newScheduledFor = deferUntilMorning(tz)
    await supabase
      .from("notification_emails")
      .update({ scheduled_for: newScheduledFor.toISOString() })
      .eq("id", job.id)
    return "deferred"
  }

  // 6. Resolve user email via auth.users
  const { data: userResp } = await supabase.auth.admin.getUserById(job.user_id)
  const userEmail = userResp?.user?.email
  if (!userEmail) {
    await markSuppressed(supabase, job, "expired")
    return "suppressed"
  }

  // 7. Build preview
  const extractionType = (parser.extraction_type ?? "fields") as
    | "fields"
    | "full_content"
  const results = (doc.results ?? {}) as Record<string, any>
  const fieldPreview =
    extractionType === "fields"
      ? buildFieldPreview(parser.fields ?? [], results)
      : []
  const fullPreview =
    extractionType === "full_content"
      ? truncate(typeof results.markdown === "string" ? results.markdown : "", FULL_PREVIEW_CHARS)
      : undefined
  const fieldCount =
    extractionType === "fields"
      ? Object.values(results).filter((v) => v != null && v !== "").length
      : undefined

  // 8. Build URLs (carry attribution)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.parsli.co"
  const documentUrl =
    `${baseUrl}/parsers/${job.parser_id}/documents/${job.document_id}` +
    `?utm_source=email&utm_medium=notification&utm_campaign=extraction_ready&nid=${job.nid}`
  const unsubscribeUrl = `${baseUrl}/settings?tab=notifications`

  // 9. Render + send
  const fileName = doc.file_name ?? "your document"
  const props: ExtractionReadyEmailProps = {
    fileName,
    parserName: parser.name ?? "",
    documentUrl,
    isFirstValue: job.is_first_value,
    extractionType,
    fieldPreview,
    fullPreview,
    fieldCount,
    unsubscribeUrl,
  }

  const subject = buildSubject({
    fileName,
    isFirstValue: job.is_first_value,
    extractionType,
    fieldCount,
  })

  const sendResult = await sendEmail({
    to: userEmail,
    subject,
    react: ExtractionReadyEmail(props),
    text: getExtractionReadyText(props),
    tags: [
      { name: "campaign", value: "extraction_ready" },
      { name: "is_first_value", value: String(job.is_first_value) },
      { name: "extraction_type", value: extractionType },
    ],
  })

  if (!sendResult.success) {
    await supabase
      .from("notification_emails")
      .update({
        status: "failed",
        error_message: sendResult.error ?? "Unknown send error",
      })
      .eq("id", job.id)
    return "failed"
  }

  // 10. Mark sent + track
  await supabase
    .from("notification_emails")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", job.id)

  trackServerEvent("notification_sent", {
    distinct_id: job.user_id,
    user_id: job.user_id,
    nid: job.nid,
    channel: "email",
    document_id: job.document_id,
    parser_id: job.parser_id,
    is_first_value: job.is_first_value,
    extraction_type: extractionType,
  })

  return "sent"
}

async function markSuppressed(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  job: any,
  reason: SuppressionReason
) {
  await supabase
    .from("notification_emails")
    .update({
      status: "suppressed",
      sent_at: new Date().toISOString(),
      error_message: `suppressed: ${reason}`,
    })
    .eq("id", job.id)

  trackServerEvent("notification_suppressed", {
    distinct_id: job.user_id,
    user_id: job.user_id,
    nid: job.nid,
    channel: "email",
    document_id: job.document_id,
    parser_id: job.parser_id,
    reason,
  })
}

// ─── Helpers ───

function buildSubject({
  fileName,
  isFirstValue,
  extractionType,
  fieldCount,
}: {
  fileName: string
  isFirstValue: boolean
  extractionType: "fields" | "full_content"
  fieldCount?: number
}): string {
  // Personalized subject lines (filename + concrete result count) outperform
  // generic ones; ~26% lift on personalized subject lines per Campaign Monitor.
  if (isFirstValue && extractionType === "fields" && fieldCount && fieldCount > 0) {
    return `${fileName} is ready — ${fieldCount} field${
      fieldCount === 1 ? "" : "s"
    } extracted`
  }
  if (isFirstValue) {
    return `${fileName} is ready`
  }
  return `${fileName} is ready`
}

function buildFieldPreview(
  fields: SchemaField[],
  results: Record<string, any>,
  limit = PREVIEW_FIELD_LIMIT
): FieldPreviewItem[] {
  const preview: FieldPreviewItem[] = []
  for (const field of fields) {
    if (preview.length >= limit) break
    if (field.type === "input") continue
    if ("isTransformation" in field && field.isTransformation) continue

    const raw = results[field.id]
    if (raw == null || raw === "") continue

    let value: string
    if (field.type === "object") {
      // Skip nested objects in the preview — too noisy for a small inline box
      continue
    } else if (field.type === "list" || field.type === "table") {
      const count = Array.isArray(raw) ? raw.length : 0
      value = count === 1 ? "1 item" : `${count} items`
    } else if (typeof raw === "object") {
      value = JSON.stringify(raw)
    } else {
      value = String(raw)
    }

    preview.push({
      label: field.name,
      value: truncate(value, FIELD_VALUE_TRUNCATE),
    })
  }
  return preview
}

function truncate(s: string, n: number): string {
  if (!s) return ""
  return s.length > n ? s.slice(0, n - 1) + "…" : s
}

/**
 * Returns true if the current moment is inside quiet hours (22:00–07:00)
 * for the given IANA timezone. Falls back to "not in quiet hours" if the
 * timezone string is invalid.
 */
function isInQuietHours(timezone: string, now: Date = new Date()): boolean {
  try {
    const localHour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      }).format(now),
      10
    )
    return localHour >= QUIET_HOURS_START || localHour < QUIET_HOURS_END
  } catch {
    return false
  }
}

/**
 * Computes the next 8:00 local time and returns it as a UTC Date.
 *
 * Approximation: rounds to the hour, doesn't account for sub-hour timezone
 * offsets or DST transitions inside the deferral window. Acceptable for
 * re-engagement emails where ±30min precision is fine.
 */
function deferUntilMorning(timezone: string, now: Date = new Date()): Date {
  try {
    const localHour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      }).format(now),
      10
    )
    let hoursUntil = (8 - localHour + 24) % 24
    if (hoursUntil === 0) hoursUntil = 24
    return new Date(now.getTime() + hoursUntil * 60 * 60 * 1000)
  } catch {
    return new Date(now.getTime() + 8 * 60 * 60 * 1000)
  }
}
