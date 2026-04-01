import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { countDocumentPages } from "@/lib/extraction/api"
import type { SchemaField } from "@/lib/schema"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import { checkCredits, deductCredits } from "@/lib/extractor/billing/credits"
import { trackServerEvent } from "@/lib/analytics/server"

export const runtime = "nodejs"
export const maxDuration = 60

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

  if (p.status !== "active") {
    return NextResponse.json({ error: "Parser is paused" }, { status: 400 })
  }

  const extractionType = p.extraction_type ?? "fields"
  const schemaTree: SchemaField[] = p.fields ?? []
  if (extractionType === "fields" && schemaTree.length === 0) {
    return NextResponse.json(
      { error: "Parser has no fields defined. Add fields in the Schema tab." },
      { status: 400 }
    )
  }

  // Parse request body
  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const sourceType = (body.source_type ?? "upload") as string

  // Support two upload modes:
  // 1. storage_path — file already uploaded to Supabase Storage (large files)
  // 2. file.data — base64 inline (legacy / small files / API)
  let fileData: { name: string; type: string; data: string; size?: number }

  if (body.storage_path) {
    const adminClient = createSupabaseServiceRoleClient()
    const { data: fileBytes, error: downloadError } = await adminClient.storage
      .from("parser-documents")
      .download(body.storage_path)
    if (downloadError || !fileBytes) {
      return NextResponse.json({ error: "Failed to read uploaded file" }, { status: 400 })
    }
    const buffer = Buffer.from(await fileBytes.arrayBuffer())
    fileData = {
      name: body.file_name ?? body.storage_path.split("/").pop() ?? "uploaded",
      type: body.file_type ?? "application/octet-stream",
      data: buffer.toString("base64"),
      size: body.file_size ?? buffer.length,
    }
  } else {
    const inlineFile = body.file as { name?: string; type?: string; data?: string; size?: number } | undefined
    if (!inlineFile?.data) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    fileData = {
      name: inlineFile.name ?? "uploaded",
      type: inlineFile.type ?? "application/octet-stream",
      data: inlineFile.data,
      size: inlineFile.size,
    }
  }

  // Count actual pages in the document
  const fileBuffer = Buffer.from(fileData.data, "base64")
  const pageCount = await countDocumentPages(new Uint8Array(fileBuffer), fileData.name, fileData.type)

  // Check credits (with automatic reset if period elapsed)
  const creditCheck = await checkCredits(user.id, pageCount, supabase, user.is_anonymous === true)
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { error: creditCheck.reason || "Monthly credit limit reached. Upgrade your plan for more pages." },
      { status: 402 }
    )
  }

  // Create processing log entry
  const { data: processedDoc } = await supabase
    .from("parser_processed_documents" as any)
    .insert({
      parser_id: p.id,
      user_id: user.id,
      source_type: sourceType,
      file_name: fileData.name ?? "uploaded",
      mime_type: fileData.type,
      file_size: fileData.size,
      status: "processing",
    } as any)
    .select("id")
    .single()

  const docId = (processedDoc as any)?.id

  // Store original file to Supabase Storage for preview & reprocessing
  // Skip if file was already uploaded via storage_path (client-side upload)
  if (docId && !body.storage_path) {
    const safeName = (fileData.name ?? "uploaded").replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `${user.id}/${params.parserId}/${docId}/${safeName}`
    const fileBuffer = Buffer.from(fileData.data, "base64")
    try {
      const adminClient = createSupabaseServiceRoleClient()
      // Ensure bucket exists (no-op if it already does)
      await adminClient.storage.createBucket("parser-documents", {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
      }).catch(() => {}) // ignore "already exists" error
      const { error: uploadError } = await adminClient.storage
        .from("parser-documents")
        .upload(storagePath, fileBuffer, {
          contentType: fileData.type || "application/octet-stream",
          upsert: true,
        })
      if (uploadError) {
        console.error("[extract] File storage failed:", uploadError.message)
      }
    } catch (err) {
      console.error("[extract] File storage error:", err)
    }
  } else if (docId && body.storage_path) {
    // Move file from pending path to final path
    const adminClient = createSupabaseServiceRoleClient()
    const safeFinalName = (fileData.name ?? "uploaded").replace(/[^a-zA-Z0-9._-]/g, "_")
    const finalPath = `${user.id}/${params.parserId}/${docId}/${safeFinalName}`
    if (body.storage_path !== finalPath) {
      await adminClient.storage
        .from("parser-documents")
        .move(body.storage_path, finalPath)
        .catch(() => {}) // best-effort rename
    }
  }

  // Run extraction using the SAME shared logic as the main app
  const extractionResult = await runExtraction({
    fileData: fileData.data,
    fileName: fileData.name ?? "uploaded",
    mimeType: fileData.type ?? "",
    schemaTree,
    extractionPromptOverride: p.extraction_prompt_override,
    extractionType,
  })

  // Atomically deduct credits (DB-level guard prevents overshoot)
  // For first-document-free, only deduct what's available (caps out their quota)
  const creditsUsed = creditCheck.firstDocumentFree
    ? Math.min(pageCount, creditCheck.remaining)
    : pageCount
  const { success: deducted } = await deductCredits(user.id, creditsUsed, supabase)
  if (!deducted) {
    // Race condition: credits exhausted between check and deduct
    // Still return the extraction result since it already ran
    console.warn(`[extract] Credit deduction failed for user ${user.id} — possible race condition`)
  }

  // Update processing log
  if (docId) {
    await supabase
      .from("parser_processed_documents" as any)
      .update({
        status: extractionResult.handledWithFallback && extractionResult.error ? "error" : "completed",
        results: extractionResult.results,
        processed_at: new Date().toISOString(),
        credits_used: creditsUsed,
        error_message: extractionResult.error ?? null,
      } as any)
      .eq("id", docId)
  }

  // Increment parser document count
  await supabase
    .from("parsers" as any)
    .update({
      document_count: (p.document_count ?? 0) + 1,
      last_processed_at: new Date().toISOString(),
    } as any)
    .eq("id", p.id)

  // Track first_value server-side (survives ad blockers)
  if (docId && extractionResult.success && (p.document_count ?? 0) === 0) {
    trackServerEvent("first_value", {
      distinct_id: user.id,
      user_id: user.id,
      parser_id: p.id,
      document_id: docId,
      source_type: sourceType,
      is_first_extraction: true,
    })
  }

  // Deliver to integrations (fire-and-forget)
  if (docId) {
    deliverToIntegrations(
      p.id,
      p.name,
      docId,
      extractionResult.results,
      { file_name: fileData.name ?? "uploaded", mime_type: fileData.type ?? "", source_type: sourceType, page_count: pageCount },
      supabase as any
    ).catch((err) => console.error("[extractor] Integration delivery failed:", err))
  }

  return NextResponse.json({
    success: extractionResult.success,
    results: extractionResult.results,
    warnings: extractionResult.warnings,
    handledWithFallback: extractionResult.handledWithFallback,
    document_id: docId,
    ...(creditCheck.firstDocumentFree && {
      firstDocumentFree: true,
      upgradeMessage: `Your first document is on us! This ${pageCount}-page document used your entire monthly quota. Upgrade for more pages.`,
    }),
  })
}
