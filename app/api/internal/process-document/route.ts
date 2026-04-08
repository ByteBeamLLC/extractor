import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { countDocumentPages } from "@/lib/extraction/api"
import { refundCredits } from "@/lib/extractor/billing/credits"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import { trackServerEvent } from "@/lib/analytics/server"
import { reportError } from "@/lib/errorReporting"
import type { SchemaField } from "@/lib/schema"
import {
  getTransformationFields,
  buildWaves,
  runTransformation,
} from "@/lib/extraction/transformations"
import { getSignedFileUrl } from "@/lib/storage/fileUrl"

export const runtime = "nodejs"
export const maxDuration = 600

/**
 * POST /api/internal/process-document
 *
 * Background extraction worker. Called by the pg_net database trigger
 * when a new document is inserted into parser_processed_documents
 * with status "processing".
 *
 * This endpoint owns the entire extraction lifecycle:
 *   download file → AI extraction → update results → deduct credits → fire events → deliver integrations
 *
 * Authenticated via EXTRACTION_WORKER_SECRET (not user auth).
 */
export async function POST(request: NextRequest) {
  // --- Auth: shared secret ---
  const authHeader = request.headers.get("authorization")
  const expectedSecret = process.env.EXTRACTION_WORKER_SECRET
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { document_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const documentId = body.document_id
  if (!documentId) {
    return NextResponse.json({ error: "document_id required" }, { status: 400 })
  }

  const supabase = createSupabaseServiceRoleClient()

  // --- Atomic claim ---
  // Replace the old SELECT-then-process pattern with an UPDATE-returning
  // claim. Only one invocation can set claimed_at from NULL → now(); the
  // others see zero rows and exit. This closes the double-extraction window
  // where pg_net retries could otherwise re-run a doc that was mid-flight.
  const claimId = crypto.randomUUID()
  const { data: claimedRows, error: claimError } = await supabase
    .from("parser_processed_documents")
    .update({
      claimed_at: new Date().toISOString(),
      claimed_by: claimId,
    })
    .eq("id", documentId)
    .eq("status", "processing")
    .is("claimed_at", null)
    .select("*")

  if (claimError) {
    console.error("[process-document] Claim UPDATE failed:", claimError)
    return NextResponse.json({ error: "Claim failed" }, { status: 500 })
  }

  if (!claimedRows || claimedRows.length === 0) {
    // Another worker already claimed this doc, or it's already been
    // finalized. Skip silently — this is the idempotent path.
    return NextResponse.json({ status: "skipped", reason: "already_claimed" })
  }

  const doc = claimedRows[0]

  // --- Load parser ---
  const { data: parser, error: parserError } = await supabase
    .from("parsers")
    .select("*")
    .eq("id", doc.parser_id)
    .single()

  if (parserError || !parser) {
    await markError(supabase, documentId, "Parser not found")
    return NextResponse.json({ error: "Parser not found" }, { status: 404 })
  }

  // --- Download file from Supabase Storage ---
  const safeName = (doc.file_name ?? "uploaded").replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${doc.user_id}/${doc.parser_id}/${documentId}/${safeName}`

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("parser-documents")
    .download(storagePath)

  if (downloadError || !fileBlob) {
    console.error(`[process-document] File not found at ${storagePath}:`, downloadError)
    await markError(supabase, documentId, "File not found in storage")
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const buffer = Buffer.from(await fileBlob.arrayBuffer())
  const base64 = buffer.toString("base64")

  // Generate a signed URL so OpenRouter can fetch the file directly (avoids base64 bloat)
  const fileUrl = await getSignedFileUrl("parser-documents", storagePath)

  // --- Run extraction ---
  const extractionType = parser.extraction_type ?? "fields"
  const schemaTree: SchemaField[] = parser.fields ?? []

  // Credits were atomically reserved in the gate route before this worker
  // was invoked. The reserved amount is stored on the doc row as
  // `credits_used`. The worker never decides billing — it only refunds on
  // failure (via the catch block below and the final-status branch).
  const reservedPages: number = (doc.credits_used as number | null) ?? 0

  let extractionResult
  try {
    extractionResult = await runExtraction({
      fileData: base64,
      fileName: doc.file_name ?? "uploaded",
      mimeType: doc.mime_type ?? "",
      schemaTree,
      extractionPromptOverride: parser.extraction_prompt_override,
      extractionType,
      fileUrl,
    })
  } catch (err) {
    console.error("[process-document] Extraction threw:", err)
    reportError(err, {
      route: "/api/internal/process-document",
      userId: doc.user_id,
      extra: { documentId, parserId: doc.parser_id },
    })
    await markError(
      supabase,
      documentId,
      err instanceof Error ? err.message : "Extraction failed"
    )
    // Refund the pre-reserved credits — idempotent via refunded_at.
    if (reservedPages > 0) {
      await refundCredits(doc.user_id, documentId, reservedPages, supabase)
    }
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 })
  }

  // pageCount is used later for integration delivery metadata; keep
  // deriving it but no billing decision is based on it anymore.
  const pageCount =
    doc.page_count ??
    (await countDocumentPages(
      new Uint8Array(buffer),
      doc.file_name ?? "uploaded",
      doc.mime_type ?? "application/octet-stream"
    ))

  // --- Waterfall enrichments: run transformation fields in waves ---
  const transformationFields = getTransformationFields(schemaTree)
  const waves = buildWaves(transformationFields)
  let enrichedResults = { ...extractionResult.results }

  if (waves.length > 0 && extractionResult.success) {
    // Publish base extraction results immediately (before enrichments start)
    const allTransformationIds = transformationFields.map((tf) => tf.id)
    await supabase
      .from("parser_processed_documents")
      .update({
        results: enrichedResults,
        enriching_fields: allTransformationIds,
      })
      .eq("id", documentId)

    // Process each wave sequentially; fields within a wave run in parallel
    for (let waveIdx = 0; waveIdx < waves.length; waveIdx++) {
      const wave = waves[waveIdx]
      const waveFieldIds = wave.map((tf) => tf.id)

      // Mark which fields are actively being enriched in this wave
      await supabase
        .from("parser_processed_documents")
        .update({ enriching_fields: waveFieldIds })
        .eq("id", documentId)

      // Run all transformations in this wave in parallel
      const waveResults = await Promise.allSettled(
        wave.map(async (tf) => ({
          id: tf.id,
          value: await runTransformation(tf, enrichedResults),
        }))
      )

      // Merge successful results into the enriched results object
      for (const result of waveResults) {
        if (result.status === "fulfilled") {
          enrichedResults[result.value.id] = result.value.value
        } else {
          console.warn(
            `[process-document] Transformation failed in wave ${waveIdx}:`,
            result.reason
          )
        }
      }

      // Publish updated results after this wave completes
      // Remaining enriching_fields = fields in subsequent waves
      const remainingFieldIds = waves
        .slice(waveIdx + 1)
        .flat()
        .map((tf) => tf.id)

      await supabase
        .from("parser_processed_documents")
        .update({
          results: enrichedResults,
          enriching_fields: remainingFieldIds.length > 0 ? remainingFieldIds : null,
        })
        .eq("id", documentId)
    }
  }

  // --- Update document with final results ---
  const finalStatus =
    extractionResult.handledWithFallback && extractionResult.error
      ? "error"
      : "completed"

  await supabase
    .from("parser_processed_documents")
    .update({
      status: finalStatus,
      results: enrichedResults,
      processed_at: new Date().toISOString(),
      error_message: extractionResult.error ?? null,
      page_count: pageCount,
      enriching_fields: null,
    })
    .eq("id", documentId)

  // Refund pre-reserved credits if the extraction produced an error.
  // Idempotent via refunded_at, so pg_net retries are safe.
  if (finalStatus === "error" && reservedPages > 0) {
    await refundCredits(doc.user_id, documentId, reservedPages, supabase)
  }

  // --- Update parser stats ---
  await supabase
    .from("parsers")
    .update({
      document_count: (parser.document_count ?? 0) + 1,
      last_processed_at: new Date().toISOString(),
    })
    .eq("id", parser.id)

  // `isFirstValue` means this was the first successful extraction for this
  // parser (used for analytics and re-engagement copy). Distinct from the
  // first-doc-free billing flag which now lives on extractor_subscriptions.
  const isFirstValue = (parser.document_count ?? 0) === 0

  // --- Analytics: first_value ---
  if (extractionResult.success && isFirstValue) {
    trackServerEvent("first_value", {
      distinct_id: doc.user_id,
      user_id: doc.user_id,
      parser_id: parser.id,
      document_id: documentId,
      source_type: doc.source_type ?? "upload",
      is_first_extraction: true,
    })
  }

  // --- Two-stage re-engagement: schedule email + fire push ---
  //
  // The user may have navigated away during extraction. Two channels:
  //   1. Email — scheduled t+5 min, deduped at send time by checking
  //      `push_clicked_at` / `email_clicked_at` on the same nid row.
  //   2. Push  — fired synchronously; the service worker suppresses the
  //      OS notification if a tab is currently focused on the doc page.
  //
  // Both channels share a single `nid` UUID so the click attribution
  // endpoint can flip the matching dedupe row regardless of channel.
  //
  // MUST NOT throw — extraction completion is the source of truth; this
  // entire block is best-effort and never rolls back a successful extraction.
  if (finalStatus === "completed") {
    try {
      // Default email ON, push OFF (push is opt-in via the settings toggle)
      const { data: subRow } = await supabase
        .from("extractor_subscriptions")
        .select("notification_email_enabled, notification_push_enabled")
        .eq("user_id", doc.user_id)
        .maybeSingle()

      const sub = subRow as
        | {
            notification_email_enabled?: boolean
            notification_push_enabled?: boolean
          }
        | null
      const emailEnabled = sub?.notification_email_enabled ?? true
      const pushEnabled = sub?.notification_push_enabled ?? false

      if (emailEnabled || pushEnabled) {
        const nid = crypto.randomUUID()
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://app.parsli.co"
        const fileName = doc.file_name ?? "your document"

        // ─── Email (Phase 1): schedule t+5 min ───
        if (emailEnabled) {
          const scheduledFor = new Date(Date.now() + 5 * 60 * 1000)
          const { error: insertErr } = await supabase
            .from("notification_emails")
            .insert({
              nid,
              user_id: doc.user_id,
              document_id: documentId,
              parser_id: parser.id,
              scheduled_for: scheduledFor.toISOString(),
              is_first_value: isFirstValue,
              status: "pending",
            })

          if (insertErr) {
            console.warn(
              `[process-document] Failed to schedule notification email:`,
              insertErr
            )
          } else {
            trackServerEvent("notification_scheduled", {
              distinct_id: doc.user_id,
              user_id: doc.user_id,
              nid,
              channel: "email",
              document_id: documentId,
              parser_id: parser.id,
              is_first_value: isFirstValue,
              extraction_type: extractionType,
            })
          }
        }

        // ─── Push (Phase 2): fire immediately ───
        if (pushEnabled) {
          const { sendPushToUser } = await import("@/lib/push/webPush")
          const pushUrl =
            `${baseUrl}/parsers/${parser.id}/documents/${documentId}` +
            `?utm_source=push&utm_medium=notification&utm_campaign=extraction_ready&nid=${nid}`

          try {
            const pushResult = await sendPushToUser(
              doc.user_id,
              {
                nid,
                title: "Your data is ready",
                body: `${fileName} — extraction complete`,
                url: pushUrl,
                documentId,
              },
              supabase
            )
            if (pushResult.sent > 0) {
              trackServerEvent("notification_sent", {
                distinct_id: doc.user_id,
                user_id: doc.user_id,
                nid,
                channel: "push",
                document_id: documentId,
                parser_id: parser.id,
                is_first_value: isFirstValue,
                extraction_type: extractionType,
              })
            }
          } catch (pushErr) {
            console.warn(
              "[process-document] Push send failed (non-fatal):",
              pushErr
            )
          }
        }
      }
    } catch (err) {
      console.error(
        "[process-document] Notification scheduling failed (non-fatal):",
        err
      )
      reportError(err, {
        route: "/api/internal/process-document",
        userId: doc.user_id,
        extra: {
          documentId,
          parserId: parser.id,
          stage: "schedule_notification",
        },
      })
    }
  }

  // --- Deliver to integrations (non-blocking) ---
  if (finalStatus === "completed") {
    deliverToIntegrations(
      parser.id,
      parser.name,
      documentId,
      enrichedResults,
      {
        file_name: doc.file_name ?? "uploaded",
        mime_type: doc.mime_type ?? "",
        source_type: doc.source_type ?? "upload",
        page_count: pageCount,
      },
      supabase
    ).catch((err) =>
      console.error("[process-document] Integration delivery failed:", err)
    )
  }

  console.log(
    `[process-document] ${finalStatus} doc=${documentId} parser=${parser.id} pages=${pageCount} credits=${reservedPages} waves=${waves.length}`
  )

  return NextResponse.json({ status: finalStatus, document_id: documentId })
}

/** Mark a document as errored with a message. */
async function markError(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  documentId: string,
  message: string
) {
  await supabase
    .from("parser_processed_documents")
    .update({
      status: "error",
      error_message: message,
      processed_at: new Date().toISOString(),
    })
    .eq("id", documentId)
}
