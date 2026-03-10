import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import type { SchemaField } from "@/lib/schema"
import { checkCredits, deductCredits } from "@/lib/extractor/billing/credits"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"

export const runtime = "nodejs"

/**
 * POST /api/parsers/[parserId]/reprocess
 *
 * Re-runs extraction on an existing document using the current parser schema.
 * Expects { document_id: string } in the request body.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Load parser
  const { data: parser, error: parserError } = await supabase
    .from("parsers" as any)
    .select("*")
    .eq("id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (parserError || !parser) {
    return NextResponse.json({ error: "Parser not found" }, { status: 404 })
  }

  const p = parser as any
  const schemaTree: SchemaField[] = p.fields ?? []

  if (schemaTree.length === 0) {
    return NextResponse.json(
      { error: "Parser has no fields defined." },
      { status: 400 }
    )
  }

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const documentId = body.document_id as string | undefined
  if (!documentId) {
    return NextResponse.json({ error: "document_id is required" }, { status: 400 })
  }

  // Load the existing document
  const { data: doc, error: docError } = await supabase
    .from("parser_processed_documents" as any)
    .select("*")
    .eq("id", documentId)
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  const d = doc as any

  // We need the original file data to re-extract.
  // Use service role client to bypass storage RLS
  const adminClient = createSupabaseServiceRoleClient()
  const storagePath = `${user.id}/${params.parserId}/${documentId}/${d.file_name}`
  const { data: fileBlob } = await adminClient.storage
    .from("parser-documents")
    .download(storagePath)

  if (!fileBlob) {
    return NextResponse.json(
      { error: "Original file not available for reprocessing. Only documents with stored files can be reprocessed." },
      { status: 400 }
    )
  }

  // Check credits
  const { allowed, reason } = await checkCredits(user.id, 1, supabase)
  if (!allowed) {
    return NextResponse.json(
      { error: reason || "Monthly credit limit reached." },
      { status: 402 }
    )
  }

  // Mark as processing
  await supabase
    .from("parser_processed_documents" as any)
    .update({ status: "processing", error_message: null } as any)
    .eq("id", documentId)

  // Convert blob to base64
  const arrayBuffer = await fileBlob.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")

  // Run extraction
  const extractionResult = await runExtraction({
    fileData: base64,
    fileName: d.file_name,
    mimeType: d.mime_type ?? "",
    schemaTree,
    extractionPromptOverride: p.extraction_prompt_override,
  })

  // Deduct credits
  const { success: deducted } = await deductCredits(user.id, 1, supabase)
  if (!deducted) {
    console.warn(`[reprocess] Credit deduction failed for user ${user.id}`)
  }

  // Update document record
  await supabase
    .from("parser_processed_documents" as any)
    .update({
      status: extractionResult.handledWithFallback && extractionResult.error ? "error" : "completed",
      results: extractionResult.results,
      processed_at: new Date().toISOString(),
      credits_used: (d.credits_used ?? 0) + 1,
      error_message: extractionResult.error ?? null,
    } as any)
    .eq("id", documentId)

  // Deliver to integrations
  deliverToIntegrations(
    p.id,
    p.name,
    documentId,
    extractionResult.results,
    { file_name: d.file_name, mime_type: d.mime_type ?? "", source_type: d.source_type, page_count: 1 },
    supabase as any
  ).catch((err) => console.error("[reprocess] Integration delivery failed:", err))

  return NextResponse.json({
    success: extractionResult.success,
    results: extractionResult.results,
    warnings: extractionResult.warnings,
    handledWithFallback: extractionResult.handledWithFallback,
    document_id: documentId,
  })
}
