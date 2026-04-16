import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { countDocumentPages } from "@/lib/extraction/api"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import { reserveCredits, refundCredits, reserveFailureMessage } from "@/lib/extractor/billing/credits"
import { mapResultIdsToNames } from "@/lib/extraction/mapResultIdsToNames"
import { reportError } from "@/lib/errorReporting"
import type { SchemaField } from "@/lib/schema"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * POST /api/inbound/webhook/[token]
 *
 * Public endpoint for receiving documents via parser webhook URL.
 * No auth needed — the token itself authenticates.
 * Uses the same shared extraction logic as the main app.
 *
 * Accepts:
 * - multipart/form-data with a "file" field
 * - application/json with { file: { name, type, data (base64) } }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createSupabaseServiceRoleClient()

  // Look up parser by webhook token
  const { data: parserRaw } = await supabase
    .from("parsers" as any)
    .select("*")
    .eq("inbound_webhook_token", params.token)
    .single()

  const parser = parserRaw as any
  if (!parser) {
    return NextResponse.json({ error: "Invalid webhook token" }, { status: 404 })
  }

  if (parser.status !== "active") {
    return NextResponse.json({ error: "Parser is paused" }, { status: 400 })
  }

  const extractionType = parser.extraction_type ?? "fields"
  const schemaTree: SchemaField[] = parser.fields ?? []
  if (extractionType === "fields" && schemaTree.length === 0) {
    return NextResponse.json({ error: "Parser has no fields configured" }, { status: 400 })
  }

  // Parse the incoming file
  let fileName = "webhook-upload"
  let fileMimeType = ""
  let fileBase64: string

  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No 'file' field in form data" }, { status: 400 })
    }
    fileName = file.name
    fileMimeType = file.type
    const arrayBuffer = await file.arrayBuffer()
    fileBase64 = Buffer.from(arrayBuffer).toString("base64")
  } else {
    const body = await request.json()
    if (!body.file?.data) {
      return NextResponse.json({ error: "Missing file.data (base64)" }, { status: 400 })
    }
    fileName = body.file.name ?? "webhook-upload"
    fileMimeType = (body.file.type ?? "").toLowerCase()
    fileBase64 = body.file.data
  }

  // Count actual pages
  const pageCount = await countDocumentPages(
    new Uint8Array(Buffer.from(fileBase64, "base64")),
    fileName,
    fileMimeType
  )

  // Pre-generate the doc id so we can reserve credits against it.
  const docId = crypto.randomUUID()

  // Atomically reserve credits up front. This runs inside a row lock and
  // is safe against concurrent webhooks for the same parser owner.
  const reservation = await reserveCredits(parser.user_id, pageCount, docId, supabase)
  if (!reservation.reserved) {
    return NextResponse.json(
      { error: reserveFailureMessage(reservation) },
      { status: 402 }
    )
  }

  // Create processing log with the reserved amount.
  const { error: insertError } = await supabase
    .from("parser_processed_documents" as any)
    .insert({
      id: docId,
      parser_id: parser.id,
      user_id: parser.user_id,
      source_type: "webhook",
      file_name: fileName,
      mime_type: fileMimeType,
      page_count: pageCount,
      credits_used: reservation.pagesCharged,
      status: "processing",
    } as any)

  if (insertError) {
    console.error("[inbound/webhook] Doc insert failed:", insertError)
    await supabase
      .from("parser_processed_documents" as any)
      .insert({
        id: docId,
        parser_id: parser.id,
        user_id: parser.user_id,
        source_type: "webhook",
        file_name: fileName,
        mime_type: fileMimeType,
        page_count: pageCount,
        credits_used: reservation.pagesCharged,
        status: "error",
        error_message: "Doc insert failed",
      } as any)
    await refundCredits(parser.user_id, docId, reservation.pagesCharged, supabase)
    return NextResponse.json({ error: "Failed to create document record" }, { status: 500 })
  }

  // Store original file to Supabase Storage for preview & reprocessing
  {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `${parser.user_id}/${parser.id}/${docId}/${safeName}`
    const fileBuffer = Buffer.from(fileBase64, "base64")
    try {
      await supabase.storage.createBucket("parser-documents", {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024,
      }).catch(() => {})
      const { error: uploadError } = await supabase.storage
        .from("parser-documents")
        .upload(storagePath, fileBuffer, {
          contentType: fileMimeType || "application/octet-stream",
          upsert: true,
        })
      if (uploadError) {
        console.error("[inbound/webhook] File storage failed:", uploadError.message)
      }
    } catch (err) {
      console.error("[inbound/webhook] File storage error:", err)
    }
  }

  // Run extraction using shared logic
  const result = await runExtraction({
    fileData: fileBase64,
    fileName,
    mimeType: fileMimeType,
    schemaTree,
    extractionPromptOverride: parser.extraction_prompt_override,
    extractionType,
  })

  const { __meta__, ...idKeyedResults } = result.results
  const apiResults = mapResultIdsToNames(idKeyedResults, schemaTree)

  // Update processing log with final status. Credits were already reserved;
  // refund if the extraction failed.
  await supabase
    .from("parser_processed_documents" as any)
    .update({
      status: result.error ? "error" : "completed",
      results: result.results,
      processed_at: new Date().toISOString(),
      error_message: result.error ?? null,
    } as any)
    .eq("id", docId)

  if (result.error) {
    await refundCredits(parser.user_id, docId, reservation.pagesCharged, supabase)
  } else {
    await deliverToIntegrations(
      parser.id,
      parser.name,
      docId,
      result.results,
      { file_name: fileName, mime_type: fileMimeType, source_type: "webhook", page_count: pageCount },
      supabase as any
    ).catch((err) => {
      console.error("[inbound/webhook] Integration delivery failed:", err)
      reportError(err, { route: "/api/inbound/webhook", extra: { parserId: parser.id, docId } })
    })
  }

  // Update parser stats
  await supabase
    .from("parsers" as any)
    .update({
      document_count: (parser.document_count ?? 0) + 1,
      last_processed_at: new Date().toISOString(),
    } as any)
    .eq("id", parser.id)

  return NextResponse.json({ success: result.success, results: apiResults })
}
