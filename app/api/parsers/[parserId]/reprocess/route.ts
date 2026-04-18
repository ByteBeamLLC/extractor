import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { countDocumentPages } from "@/lib/extraction/api"
import type { SchemaField } from "@/lib/schema"
import { reserveCredits, refundCredits, getOrCreateSubscription } from "@/lib/extractor/billing/credits"
import { buildQuotaErrorBody } from "@/lib/extractor/billing/quota-response"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import type { PlanTier } from "@/lib/stripe/config"

export const runtime = "nodejs"
// Reprocess re-runs the full extraction pipeline (download file, count
// pages, reserve credits, runExtraction across possibly many LLM calls,
// write results, refund-on-failure, integration fan-out). On large PDFs
// this routinely exceeds 60 s. 300 s is the Fluid Compute default on all
// plans, so this raises the ceiling without requiring a plan upgrade.
//
// Note: the extraction pipeline itself does not yet propagate an upstream
// deadline to its internal LLM calls — that would touch runExtraction's
// 7 callers and is a separate, scoped follow-up. Bumping maxDuration here
// handles the common case by giving the pipeline enough wall-clock to
// finish, without modifying the shared extraction code path.
export const maxDuration = 300

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
  const extractionType = p.extraction_type ?? "fields"
  const schemaTree: SchemaField[] = p.fields ?? []

  if (extractionType === "fields" && schemaTree.length === 0) {
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
  const safeName = (d.file_name ?? "uploaded").replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${user.id}/${params.parserId}/${documentId}/${safeName}`
  const { data: fileBlob } = await adminClient.storage
    .from("parser-documents")
    .download(storagePath)

  if (!fileBlob) {
    return NextResponse.json(
      { error: "Original file not available for reprocessing. Only documents with stored files can be reprocessed." },
      { status: 400 }
    )
  }

  // Count actual pages
  const fileBytes = new Uint8Array(await fileBlob.arrayBuffer())
  const pageCount = await countDocumentPages(fileBytes, d.file_name, d.mime_type)

  // Reserve credits for the reprocess. We disable first-doc-free here —
  // a user can't claim the freebie by re-running an already-charged doc.
  // We also clear `refunded_at` so refund_credits can idempotently handle
  // a subsequent failure on this re-run.
  await (supabase as any)
    .from("parser_processed_documents")
    .update({ refunded_at: null })
    .eq("id", documentId)

  const reservation = await reserveCredits(
    user.id,
    pageCount,
    documentId,
    supabase,
    user.is_anonymous === true,
    { allowFirstDocFree: false }
  )
  if (!reservation.reserved) {
    const sub = await getOrCreateSubscription(
      user.id,
      supabase,
      user.is_anonymous === true,
    )
    return NextResponse.json(
      buildQuotaErrorBody({
        reservation,
        pagesNeeded: pageCount,
        currentTier: (sub.tier as PlanTier) ?? "free",
      }),
      { status: 402 }
    )
  }

  // Mark as processing
  await supabase
    .from("parser_processed_documents" as any)
    .update({ status: "processing", error_message: null } as any)
    .eq("id", documentId)

  // Convert to base64 (reuse bytes from page counting)
  const base64 = Buffer.from(fileBytes).toString("base64")

  // Run extraction
  const extractionResult = await runExtraction({
    fileData: base64,
    fileName: d.file_name,
    mimeType: d.mime_type ?? "",
    schemaTree,
    extractionPromptOverride: p.extraction_prompt_override,
    extractionType,
  })

  // Credits already reserved before extraction ran.
  const finalStatus =
    extractionResult.handledWithFallback && extractionResult.error
      ? "error"
      : "completed"

  await supabase
    .from("parser_processed_documents" as any)
    .update({
      status: finalStatus,
      results: extractionResult.results,
      processed_at: new Date().toISOString(),
      credits_used: (d.credits_used ?? 0) + reservation.pagesCharged,
      error_message: extractionResult.error ?? null,
    } as any)
    .eq("id", documentId)

  if (finalStatus === "error") {
    // Refund the reservation for this reprocess attempt. Idempotent.
    await refundCredits(user.id, documentId, reservation.pagesCharged, supabase)
  } else {
    // Deliver to integrations only on success.
    deliverToIntegrations(
      p.id,
      p.name,
      documentId,
      extractionResult.results,
      { file_name: d.file_name, mime_type: d.mime_type ?? "", source_type: d.source_type, page_count: pageCount },
      supabase as any
    ).catch((err) => console.error("[reprocess] Integration delivery failed:", err))
  }

  return NextResponse.json({
    success: extractionResult.success,
    results: extractionResult.results,
    warnings: extractionResult.warnings,
    handledWithFallback: extractionResult.handledWithFallback,
    document_id: documentId,
  })
}
