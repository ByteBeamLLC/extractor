import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import type { SchemaField } from "@/lib/schema"

export const runtime = "nodejs"

/**
 * POST /api/extractor/inbound/webhook/[token]
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

  const schemaTree: SchemaField[] = parser.fields ?? []
  if (schemaTree.length === 0) {
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

  // Create processing log
  const { data: processedDoc } = await supabase
    .from("parser_processed_documents" as any)
    .insert({
      parser_id: parser.id,
      user_id: parser.user_id,
      source_type: "webhook",
      file_name: fileName,
      mime_type: fileMimeType,
      status: "processing",
    } as any)
    .select("id")
    .single()

  const docId = (processedDoc as any)?.id

  // Run extraction using shared logic
  const result = await runExtraction({
    fileData: fileBase64,
    fileName,
    mimeType: fileMimeType,
    schemaTree,
    extractionPromptOverride: parser.extraction_prompt_override,
  })

  const { __meta__, ...apiResults } = result.results

  // Update processing log
  if (docId) {
    await supabase
      .from("parser_processed_documents" as any)
      .update({
        status: result.error ? "error" : "completed",
        results: result.results,
        processed_at: new Date().toISOString(),
        credits_used: 1,
        error_message: result.error ?? null,
      } as any)
      .eq("id", docId)

    // Deliver to integrations
    await deliverToIntegrations(
      parser.id,
      parser.name,
      docId,
      result.results,
      { file_name: fileName, mime_type: fileMimeType, source_type: "webhook", page_count: 1 },
      supabase as any
    )
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
