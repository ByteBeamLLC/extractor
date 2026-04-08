import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { authenticateApiKey } from "@/lib/extractor/auth/apiKeyAuth"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { countDocumentPages } from "@/lib/extraction/api"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import { reserveCredits, refundCredits, reserveFailureMessage } from "@/lib/extractor/billing/credits"
import type { SchemaField } from "@/lib/schema"
import { trackServerEvent } from "@/lib/analytics/server"
import { reportError } from "@/lib/errorReporting"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * POST /api/v1/extract
 *
 * Public API endpoint — authenticated via API key (Bearer ext_...).
 * Uses the same shared extraction logic as the main app.
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServiceRoleClient()
  const auth = await authenticateApiKey(request, supabase)

  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  // Load parser
  const { data: parserRaw } = await supabase
    .from("parsers" as any)
    .select("*")
    .eq("id", auth.parserId!)
    .single()

  const parser = parserRaw as any
  if (!parser || parser.status !== "active") {
    return NextResponse.json({ error: "Parser not found or inactive" }, { status: 404 })
  }

  const extractionType = parser.extraction_type ?? "fields"
  const schemaTree: SchemaField[] = parser.fields ?? []
  if (extractionType === "fields" && schemaTree.length === 0) {
    return NextResponse.json({ error: "Parser has no fields" }, { status: 400 })
  }

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const fileData = body.file
  if (!fileData?.data) {
    return NextResponse.json({ error: "Missing file.data (base64)" }, { status: 400 })
  }

  // Count actual pages
  const fileBuffer = Buffer.from(fileData.data, "base64")
  const pageCount = await countDocumentPages(new Uint8Array(fileBuffer), fileData.name, fileData.type)

  // Pre-generate the doc id so the reservation can be keyed to it.
  const docId = crypto.randomUUID()

  // Atomically reserve credits up front.
  const reservation = await reserveCredits(
    auth.userId!,
    pageCount,
    docId,
    supabase
  )
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
      user_id: auth.userId!,
      source_type: "api",
      file_name: fileData.name ?? "api-upload",
      mime_type: fileData.type,
      file_size: fileData.size,
      page_count: pageCount,
      credits_used: reservation.pagesCharged,
      status: "processing",
    } as any)

  if (insertError) {
    console.error("[v1/extract] Doc insert failed:", insertError)
    await supabase
      .from("parser_processed_documents" as any)
      .insert({
        id: docId,
        parser_id: parser.id,
        user_id: auth.userId!,
        source_type: "api",
        file_name: fileData.name ?? "api-upload",
        mime_type: fileData.type,
        file_size: fileData.size,
        page_count: pageCount,
        credits_used: reservation.pagesCharged,
        status: "error",
        error_message: "Doc insert failed",
      } as any)
    await refundCredits(auth.userId!, docId, reservation.pagesCharged, supabase)
    return NextResponse.json({ error: "Failed to create document record" }, { status: 500 })
  }

  // Run extraction using shared logic
  const result = await runExtraction({
    fileData: fileData.data,
    fileName: fileData.name ?? "api-upload",
    mimeType: fileData.type ?? "",
    schemaTree,
    extractionPromptOverride: parser.extraction_prompt_override,
    extractionType,
  })

  // Strip __meta__ for API response
  const { __meta__, ...apiResults } = result.results

  // Update processing log with final status. Credits were already reserved;
  // only refund on failure.
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
    await refundCredits(auth.userId!, docId, reservation.pagesCharged, supabase)
  } else {
    // Deliver to integrations only on success.
    deliverToIntegrations(
      parser.id,
      parser.name,
      docId,
      result.results,
      { file_name: fileData.name ?? "api-upload", mime_type: fileData.type ?? "", source_type: "api", page_count: pageCount },
      supabase as any
    ).catch((err) => console.error("[extractor] Integration delivery failed:", err))
  }

  // Track first_value server-side (survives ad blockers)
  if (docId && result.success && (parser.document_count ?? 0) === 0) {
    trackServerEvent("first_value", {
      distinct_id: auth.userId!,
      user_id: auth.userId!,
      parser_id: parser.id,
      document_id: docId,
      source_type: "api",
      is_first_extraction: true,
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

  return NextResponse.json({
    success: result.success,
    parser_id: parser.id,
    document_id: docId,
    results: apiResults,
  })
}
