import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { countDocumentPages } from "@/lib/extraction/api"
import type { SchemaField } from "@/lib/schema"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import { checkCredits, deductCredits } from "@/lib/extractor/billing/credits"
import { trackServerEvent } from "@/lib/analytics/server"
import { reportError } from "@/lib/errorReporting"
import {
  getTransformationFields,
  buildWaves,
  runTransformation,
} from "@/lib/extraction/transformations"

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
  // If client requests synchronous mode (e.g. public API), run blocking
  const async_ = body.async !== false

  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

  // Support upload modes (in priority order):
  // 1. storage_path — file already in Supabase Storage (recommended, used by browser uploads)
  // 2. file.data — base64 inline (backward compat for REST API consumers)
  let fileData: { name: string; type: string; data: string; size?: number }
  const inlineFile = body.file as { name?: string; type?: string; data?: string; size?: number } | undefined

  if (body.storage_path) {
    const adminClient = createSupabaseServiceRoleClient()
    const { data: fileBytes, error: downloadError } = await adminClient.storage
      .from("parser-documents")
      .download(body.storage_path)
    if (downloadError || !fileBytes) {
      return NextResponse.json({ error: "Failed to read uploaded file from storage" }, { status: 400 })
    }
    const buffer = Buffer.from(await fileBytes.arrayBuffer())
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds the 50MB size limit" }, { status: 413 })
    }
    fileData = {
      name: body.file_name ?? body.storage_path.split("/").pop() ?? "uploaded",
      type: body.file_type ?? "application/octet-stream",
      data: buffer.toString("base64"),
      size: body.file_size ?? buffer.length,
    }
  } else if (inlineFile?.data) {
    // Inline base64 path — kept for backward compatibility with REST API consumers
    const estimatedSize = inlineFile.size ?? Math.ceil((inlineFile.data.length * 3) / 4)
    if (estimatedSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds the 50MB size limit" }, { status: 413 })
    }
    fileData = {
      name: inlineFile.name ?? body.file_name ?? "uploaded",
      type: inlineFile.type ?? body.file_type ?? "application/octet-stream",
      data: inlineFile.data,
      size: inlineFile.size ?? body.file_size,
    }
  } else {
    return NextResponse.json({ error: "No file provided. Send storage_path or file.data." }, { status: 400 })
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

  // Pre-generate document ID so we can store the file before the INSERT.
  // This ensures the file is in Storage before the pg_net trigger fires.
  const docId = crypto.randomUUID()

  // Store file FIRST — the background worker downloads from this path.
  const hasInlineData = !!inlineFile?.data
  const safeName = (fileData.name ?? "uploaded").replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${user.id}/${params.parserId}/${docId}/${safeName}`

  try {
    const adminClient = createSupabaseServiceRoleClient()

    if (hasInlineData) {
      // Inline upload from REST API — store file for the background worker
      await adminClient.storage
        .from("parser-documents")
        .upload(storagePath, fileBuffer, {
          contentType: fileData.type || "application/octet-stream",
          upsert: true,
        })
    } else if (body.storage_path && body.storage_path !== storagePath) {
      // Browser upload — move from pending path to canonical document path
      await adminClient.storage
        .from("parser-documents")
        .move(body.storage_path, storagePath)
        .catch(() => {})
    }
  } catch (err) {
    console.error("[extract] File storage error:", err)
  }

  // Create document record — this INSERT triggers pg_net → worker endpoint
  await supabase
    .from("parser_processed_documents" as any)
    .insert({
      id: docId,
      parser_id: p.id,
      user_id: user.id,
      source_type: sourceType,
      file_name: fileData.name ?? "uploaded",
      mime_type: fileData.type,
      file_size: fileData.size,
      page_count: pageCount,
      status: "processing",
    } as any)

  // --- Async mode: return immediately, extraction handled by pg_net trigger → worker ---
  if (async_) {
    return NextResponse.json({
      success: true,
      document_id: docId,
      status: "processing",
      ...(creditCheck.firstDocumentFree && {
        firstDocumentFree: true,
        upgradeMessage: `Your first document is on us! This ${pageCount}-page document used your entire monthly quota. Upgrade for more pages.`,
      }),
    })
  }

  // --- Sync mode: extract inline (for public API, reprocessing) ---
  // The worker will also receive the trigger, but it checks status="processing"
  // before starting. By the time it arrives, we've already updated to completed/error.
  try {
    const extractionResult = await runExtraction({
      fileData: fileData.data,
      fileName: fileData.name ?? "uploaded",
      mimeType: fileData.type ?? "",
      schemaTree,
      extractionPromptOverride: p.extraction_prompt_override,
      extractionType,
    })

    const creditsUsed = creditCheck.firstDocumentFree
      ? Math.min(pageCount, creditCheck.remaining)
      : pageCount
    const { success: deducted } = await deductCredits(user.id, creditsUsed, supabase)
    if (!deducted) {
      console.warn(`[extract] Credit deduction failed for user ${user.id}`)
    }

    // Run waterfall enrichments for transformation fields (sync mode)
    let enrichedResults = { ...extractionResult.results }
    const transformationFields = getTransformationFields(schemaTree)
    const waves = buildWaves(transformationFields)

    if (waves.length > 0 && extractionResult.success) {
      for (const wave of waves) {
        const waveResults = await Promise.allSettled(
          wave.map(async (tf) => ({
            id: tf.id,
            value: await runTransformation(tf, enrichedResults),
          }))
        )
        for (const result of waveResults) {
          if (result.status === "fulfilled") {
            enrichedResults[result.value.id] = result.value.value
          }
        }
      }
    }

    const finalStatus =
      extractionResult.handledWithFallback && extractionResult.error ? "error" : "completed"

    await supabase
      .from("parser_processed_documents" as any)
      .update({
        status: finalStatus,
        results: enrichedResults,
        processed_at: new Date().toISOString(),
        credits_used: creditsUsed,
        error_message: extractionResult.error ?? null,
        enriching_fields: null,
      } as any)
      .eq("id", docId)

    await supabase
      .from("parsers" as any)
      .update({
        document_count: (p.document_count ?? 0) + 1,
        last_processed_at: new Date().toISOString(),
      } as any)
      .eq("id", p.id)

    if (extractionResult.success && (p.document_count ?? 0) === 0) {
      trackServerEvent("first_value", {
        distinct_id: user.id,
        user_id: user.id,
        parser_id: p.id,
        document_id: docId,
        source_type: sourceType,
        is_first_extraction: true,
      })
    }

    if (finalStatus === "completed") {
      deliverToIntegrations(
        p.id,
        p.name,
        docId,
        enrichedResults,
        { file_name: fileData.name ?? "uploaded", mime_type: fileData.type ?? "", source_type: sourceType, page_count: pageCount },
        supabase as any
      ).catch((err) => console.error("[extract] Integration delivery failed:", err))
    }

    return NextResponse.json({
      success: extractionResult.success,
      results: enrichedResults,
      warnings: extractionResult.warnings,
      handledWithFallback: extractionResult.handledWithFallback,
      document_id: docId,
      ...(creditCheck.firstDocumentFree && {
        firstDocumentFree: true,
        upgradeMessage: `Your first document is on us! This ${pageCount}-page document used your entire monthly quota. Upgrade for more pages.`,
      }),
    })
  } catch (err) {
    console.error("[extract] Sync extraction failed:", err)
    reportError(err, { route: "/api/parsers/extract", method: "POST", userId: user.id, extra: { parserId: p.id, docId } })

    await supabase
      .from("parser_processed_documents" as any)
      .update({
        status: "error",
        error_message: err instanceof Error ? err.message : "Extraction failed",
        processed_at: new Date().toISOString(),
      } as any)
      .eq("id", docId)

    return NextResponse.json(
      { error: "Extraction failed", document_id: docId },
      { status: 500 }
    )
  }
}
