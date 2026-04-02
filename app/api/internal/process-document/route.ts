import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { countDocumentPages } from "@/lib/extraction/api"
import { deductCredits } from "@/lib/extractor/billing/credits"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import { trackServerEvent } from "@/lib/analytics/server"
import { reportError } from "@/lib/errorReporting"
import type { SchemaField } from "@/lib/schema"

export const runtime = "nodejs"
export const maxDuration = 300

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

  // --- Load document (atomic claim: only process if still "processing") ---
  const { data: doc, error: docError } = await supabase
    .from("parser_processed_documents")
    .select("*")
    .eq("id", documentId)
    .eq("status", "processing")
    .single()

  if (docError || !doc) {
    // Already completed, errored, or claimed by sync mode — skip silently
    return NextResponse.json({ status: "skipped", reason: "not_processing" })
  }

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

  // --- Run extraction ---
  const extractionType = parser.extraction_type ?? "fields"
  const schemaTree: SchemaField[] = parser.fields ?? []

  let extractionResult
  try {
    extractionResult = await runExtraction({
      fileData: base64,
      fileName: doc.file_name ?? "uploaded",
      mimeType: doc.mime_type ?? "",
      schemaTree,
      extractionPromptOverride: parser.extraction_prompt_override,
      extractionType,
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
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 })
  }

  // --- Billing ---
  const pageCount =
    doc.page_count ??
    (await countDocumentPages(
      new Uint8Array(buffer),
      doc.file_name ?? "uploaded",
      doc.mime_type ?? "application/octet-stream"
    ))

  // Determine credits to deduct (first-document-free: check if this is their first completed doc)
  const { count: completedCount } = await supabase
    .from("parser_processed_documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", doc.user_id)
    .eq("status", "completed")

  const isFirstDocument = (completedCount ?? 0) === 0
  const creditsUsed = isFirstDocument ? 0 : pageCount

  if (creditsUsed > 0) {
    const { success: deducted } = await deductCredits(doc.user_id, creditsUsed, supabase)
    if (!deducted) {
      console.warn(`[process-document] Credit deduction failed for user ${doc.user_id}`)
    }
  }

  // --- Update document with results ---
  const finalStatus =
    extractionResult.handledWithFallback && extractionResult.error
      ? "error"
      : "completed"

  await supabase
    .from("parser_processed_documents")
    .update({
      status: finalStatus,
      results: extractionResult.results,
      processed_at: new Date().toISOString(),
      credits_used: creditsUsed,
      error_message: extractionResult.error ?? null,
      page_count: pageCount,
    })
    .eq("id", documentId)

  // --- Update parser stats ---
  await supabase
    .from("parsers")
    .update({
      document_count: (parser.document_count ?? 0) + 1,
      last_processed_at: new Date().toISOString(),
    })
    .eq("id", parser.id)

  // --- Analytics: first_value ---
  if (extractionResult.success && (parser.document_count ?? 0) === 0) {
    trackServerEvent("first_value", {
      distinct_id: doc.user_id,
      user_id: doc.user_id,
      parser_id: parser.id,
      document_id: documentId,
      source_type: doc.source_type ?? "upload",
      is_first_extraction: true,
    })
  }

  // --- Deliver to integrations (non-blocking) ---
  if (finalStatus === "completed") {
    deliverToIntegrations(
      parser.id,
      parser.name,
      documentId,
      extractionResult.results,
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
    `[process-document] ${finalStatus} doc=${documentId} parser=${parser.id} pages=${pageCount} credits=${creditsUsed}`
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
