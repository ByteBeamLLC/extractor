import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { authenticateApiKey } from "@/lib/extractor/auth/apiKeyAuth"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import type { SchemaField } from "@/lib/schema"

export const runtime = "nodejs"

/**
 * POST /api/extractor/v1/extract
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

  const schemaTree: SchemaField[] = parser.fields ?? []
  if (schemaTree.length === 0) {
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

  // Create processing log
  const { data: processedDoc } = await supabase
    .from("parser_processed_documents" as any)
    .insert({
      parser_id: parser.id,
      user_id: auth.userId!,
      source_type: "api",
      file_name: fileData.name ?? "api-upload",
      mime_type: fileData.type,
      file_size: fileData.size,
      status: "processing",
    } as any)
    .select("id")
    .single()

  const docId = (processedDoc as any)?.id

  // Run extraction using shared logic
  const result = await runExtraction({
    fileData: fileData.data,
    fileName: fileData.name ?? "api-upload",
    mimeType: fileData.type ?? "",
    schemaTree,
    extractionPromptOverride: parser.extraction_prompt_override,
  })

  // Strip __meta__ for API response
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
    deliverToIntegrations(
      parser.id,
      parser.name,
      docId,
      result.results,
      { file_name: fileData.name ?? "api-upload", mime_type: fileData.type ?? "", source_type: "api", page_count: 1 },
      supabase as any
    ).catch((err) => console.error("[extractor] Integration delivery failed:", err))
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
