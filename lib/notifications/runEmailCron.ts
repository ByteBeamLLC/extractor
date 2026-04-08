import type { SupabaseClient } from "@supabase/supabase-js"
import { trackServerEvent } from "@/lib/analytics/server"
import { sendEmail } from "@/lib/email/send"
import {
  ExtractionReadyEmail,
  getExtractionReadyText,
  type ExtractionReadyEmailProps,
  type FieldPreviewItem,
} from "@/emails/ExtractionReady"
import type { SchemaField } from "@/lib/schema"

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

export type JobOutcome = "sent" | "suppressed" | "deferred" | "failed"

export interface RunCronOptions {
  /** If provided, only process rows belonging to this user. Used for manual flush. */
  userId?: string
  /** Override the batch size. */
  limit?: number
}

export interface RunCronSummary {
  processed: number
  sent: number
  suppressed: number
  deferred: number
  failed: number
  errors: string[]
}

/**
 * Shared worker body for the scheduled Vercel Cron handler AND the
 * authenticated manual flush endpoint.
 *
 * Picks up `notification_emails` rows that are due (status=pending AND
 * scheduled_for <= now()), applies dedupe + quiet-hours rules, and
 * dispatches via Resend. Optionally scopes to a single user for manual
 * triggers.
 */
export async function runEmailCron(
  supabase: SupabaseClient,
  options: RunCronOptions = {}
): Promise<RunCronSummary> {
  const summary: RunCronSummary = {
    processed: 0,
    sent: 0,
    suppressed: 0,
    deferred: 0,
    failed: 0,
    errors: [],
  }

  let query = supabase
    .from("notification_emails")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(options.limit ?? BATCH_SIZE)

  if (options.userId) {
    query = query.eq("user_id", options.userId)
  }

  const { data: jobs, error: queryErr } = await query

  if (queryErr) {
    summary.errors.push(`query: ${queryErr.message}`)
    return summary
  }

  if (!jobs || jobs.length === 0) {
    return summary
  }

  for (const job of jobs as any[]) {
    summary.processed++
    try {
      const outcome = await processJob(job, supabase)
      summary[outcome]++
    } catch (err) {
      summary.failed++
      const msg = err instanceof Error ? err.message : String(err)
      summary.errors.push(`job ${job.id}: ${msg}`)
      console.error(`[notification-cron] Job ${job.id} failed:`, err)
      await supabase
        .from("notification_emails")
        .update({ status: "failed", error_message: msg })
        .eq("id", job.id)
    }
  }

  return summary
}

async function processJob(
  job: any,
  supabase: SupabaseClient
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

  // 2. Hard cap — drop jobs older than 6 hours past their scheduled fire time.
  //
  // Counting from `scheduled_for` (not `created_at`) is critical: when a row
  // is deferred by the 22:00–07:00 quiet-hours rule, `scheduled_for` gets
  // bumped to ~08:00 local next morning. Counting from `created_at` would
  // mark every overnight-deferred row as "expired" (the whole deferred window
  // blew through the cap), which is exactly what happened to the Beirut rows.
  //
  // Counting from `scheduled_for` gives the row a clean 6-hour retry window
  // starting from when it was ACTUALLY supposed to fire, regardless of how
  // far it was deferred.
  const ageMs = Date.now() - new Date(job.scheduled_for).getTime()
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
    supabase.from("parsers").select("*").eq("id", job.parser_id).single(),
    supabase
      .from("extractor_subscriptions")
      .select("notification_email_enabled, timezone")
      .eq("user_id", job.user_id)
      .maybeSingle(),
  ])

  if (!doc || !parser) {
    await markSuppressed(supabase, job, "expired")
    return "suppressed"
  }

  const typedSub = sub as
    | { notification_email_enabled?: boolean; timezone?: string }
    | null

  // 4. User disabled notifications between scheduling and now?
  if (typedSub && typedSub.notification_email_enabled === false) {
    await markSuppressed(supabase, job, "user_disabled")
    return "suppressed"
  }

  // 5. Quiet hours — defer until 8am local
  const tz = typedSub?.timezone || "UTC"
  if (isInQuietHours(tz)) {
    const newScheduledFor = deferUntilMorning(tz)
    await supabase
      .from("notification_emails")
      .update({ scheduled_for: newScheduledFor.toISOString() })
      .eq("id", job.id)
    return "deferred"
  }

  // 6. Resolve user email via auth.users (requires service role)
  const { data: userResp } = await (supabase as any).auth.admin.getUserById(
    job.user_id
  )
  const userEmail = userResp?.user?.email
  if (!userEmail) {
    await markSuppressed(supabase, job, "expired")
    return "suppressed"
  }

  // 7. Build preview
  const typedDoc = doc as { file_name?: string; results?: Record<string, any> }
  const typedParser = parser as {
    name?: string
    extraction_type?: string
    fields?: SchemaField[]
  }
  const extractionType = (typedParser.extraction_type ?? "fields") as
    | "fields"
    | "full_content"
  const results = (typedDoc.results ?? {}) as Record<string, any>
  const fieldPreview =
    extractionType === "fields"
      ? buildFieldPreview(typedParser.fields ?? [], results)
      : []
  const fullPreview =
    extractionType === "full_content"
      ? truncate(
          typeof results.markdown === "string" ? results.markdown : "",
          FULL_PREVIEW_CHARS
        )
      : undefined
  const fieldCount =
    extractionType === "fields"
      ? Object.values(results).filter((v) => v != null && v !== "").length
      : undefined

  // 8. Build URLs (carry attribution)
  //
  // Base URL fallback order: NEXT_PUBLIC_SITE_URL → NEXT_PUBLIC_APP_URL → parsli.co.
  // Prefer SITE_URL (parsli.co) because that's where user sessions live —
  // linking to app.parsli.co would drop the user onto a foreign origin with
  // no cookies and break the "Open in Parsli" click.
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://parsli.co"
  const documentUrl =
    `${baseUrl}/parsers/${job.parser_id}/documents/${job.document_id}` +
    `?utm_source=email&utm_medium=notification&utm_campaign=extraction_ready&nid=${job.nid}`
  const unsubscribeUrl = `${baseUrl}/settings?tab=notifications`
  const logoUrl = `${baseUrl}/parsli-icon.png`

  // 9. Render + send
  const fileName = typedDoc.file_name ?? "your document"
  const props: ExtractionReadyEmailProps = {
    fileName,
    parserName: typedParser.name ?? "",
    documentUrl,
    isFirstValue: job.is_first_value,
    extractionType,
    fieldPreview,
    fullPreview,
    fieldCount,
    unsubscribeUrl,
    logoUrl,
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
    .update({ status: "sent", sent_at: new Date().toISOString() })
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
  supabase: SupabaseClient,
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
  if (
    isFirstValue &&
    extractionType === "fields" &&
    fieldCount &&
    fieldCount > 0
  ) {
    return `${fileName} is ready — ${fieldCount} field${
      fieldCount === 1 ? "" : "s"
    } extracted`
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
