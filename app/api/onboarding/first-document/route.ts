import { type NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { createSupabaseServerComponentClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { countDocumentPages } from "@/lib/extraction/api"
import { generateInboundEmail } from "@/lib/extractor/inbound-email"
import { checkCredits, deductCredits } from "@/lib/extractor/billing/credits"
import { trackServerEvent } from "@/lib/analytics/server"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * POST /api/onboarding/first-document
 *
 * Single endpoint for the "upload first" onboarding flow.
 * Creates a parser + extracts a document in one call so new users
 * reach first value without going through the full parser-creation wizard.
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Guard: only for users with 0 parsers
  const { count: parserCount } = await supabase
    .from("parsers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "archived")

  if ((parserCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "This endpoint is for first-time users only." },
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

  // Resolve file data (same pattern as extract route)
  let fileData: { name: string; type: string; data: string; size?: number }
  const inlineFile = body.file as { name?: string; type?: string; data?: string; size?: number } | undefined

  if (inlineFile?.data) {
    fileData = {
      name: inlineFile.name ?? body.file_name ?? "uploaded",
      type: inlineFile.type ?? body.file_type ?? "application/octet-stream",
      data: inlineFile.data,
      size: inlineFile.size ?? body.file_size,
    }
  } else if (body.storage_path) {
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
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // Count pages
  const fileBuffer = Buffer.from(fileData.data, "base64")
  const pageCount = await countDocumentPages(new Uint8Array(fileBuffer), fileData.name, fileData.type)

  // Check credits (first-document-free policy will allow this)
  const isAnonymous = user.is_anonymous === true
  const creditCheck = await checkCredits(user.id, pageCount, supabase, isAnonymous)
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { error: creditCheck.reason || "Credit limit reached." },
      { status: 402 }
    )
  }

  // Create parser (full_content — AI determines structure, no fields needed)
  const webhookToken = crypto.randomUUID().replace(/-/g, "")
  const parserName = "My Parser"

  const { data: parser, error: parserError } = await supabase
    .from("parsers" as any)
    .insert({
      user_id: user.id,
      name: parserName,
      description: null,
      fields: [],
      extraction_type: "full_content",
      extraction_mode: "ai",
      inbound_email: generateInboundEmail(parserName),
      inbound_webhook_token: webhookToken,
    } as any)
    .select("id")
    .single()

  if (parserError || !parser) {
    return NextResponse.json(
      { error: "Failed to create parser" },
      { status: 500 }
    )
  }

  const parserId = (parser as any).id

  trackServerEvent("parser_created", {
    distinct_id: user.id,
    user_id: user.id,
    parser_id: parserId,
    parser_name: parserName,
    extraction_type: "full_content",
    has_template: false,
    is_first_parser: true,
  })

  // Create processing document entry
  const { data: processedDoc, error: docError } = await supabase
    .from("parser_processed_documents" as any)
    .insert({
      parser_id: parserId,
      user_id: user.id,
      source_type: "upload",
      file_name: fileData.name,
      mime_type: fileData.type,
      file_size: fileData.size,
      status: "processing",
    } as any)
    .select("id")
    .single()

  if (docError || !processedDoc) {
    return NextResponse.json(
      { error: "Failed to create document record" },
      { status: 500 }
    )
  }

  const docId = (processedDoc as any).id

  // Store file to final path
  const safeName = (fileData.name ?? "uploaded").replace(/[^a-zA-Z0-9._-]/g, "_")
  const finalStoragePath = `${user.id}/${parserId}/${docId}/${safeName}`
  const hasInlineData = !!inlineFile?.data

  try {
    const adminClient = createSupabaseServiceRoleClient()
    await adminClient.storage.createBucket("parser-documents", {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
    }).catch(() => {})

    if (hasInlineData) {
      // Inline data: upload from server-side buffer
      await adminClient.storage
        .from("parser-documents")
        .upload(finalStoragePath, fileBuffer, {
          contentType: fileData.type || "application/octet-stream",
          upsert: true,
        })
    } else if (body.storage_path) {
      // Large file: move from pending path to final path (avoids orphaned files)
      if (body.storage_path !== finalStoragePath) {
        await adminClient.storage
          .from("parser-documents")
          .move(body.storage_path, finalStoragePath)
          .catch(() => {})
      }
    }
  } catch (err) {
    console.error("[first-document] File storage error:", err)
  }

  // Background extraction
  const performExtraction = async () => {
    const extractionResult = await runExtraction({
      fileData: fileData.data,
      fileName: fileData.name,
      mimeType: fileData.type,
      schemaTree: [],
      extractionType: "full_content",
    })

    // For first-document-free, still deduct whatever the user has remaining
    // (may be 0 if they're over-quota — that's fine, the doc was free)
    const creditsUsed = creditCheck.firstDocumentFree
      ? Math.min(pageCount, Math.max(creditCheck.remaining, 0))
      : pageCount
    if (creditsUsed > 0) {
      await deductCredits(user.id, creditsUsed, supabase)
    }

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

    await supabase
      .from("parsers" as any)
      .update({
        document_count: 1,
        last_processed_at: new Date().toISOString(),
      } as any)
      .eq("id", parserId)

    if (docId && extractionResult.success) {
      trackServerEvent("first_value", {
        distinct_id: user.id,
        user_id: user.id,
        parser_id: parserId,
        document_id: docId,
        source_type: "upload",
        is_first_extraction: true,
      })
    }

    return extractionResult
  }

  waitUntil(
    performExtraction().catch((err) => {
      console.error("[first-document] Extraction failed:", err)
      if (docId) {
        supabase
          .from("parser_processed_documents" as any)
          .update({
            status: "error",
            error_message: err instanceof Error ? err.message : "Extraction failed",
            processed_at: new Date().toISOString(),
          } as any)
          .eq("id", docId)
          .then(() => {})
      }
    })
  )

  return NextResponse.json({
    success: true,
    parser_id: parserId,
    document_id: docId,
    status: "processing",
    ...(creditCheck.firstDocumentFree && {
      firstDocumentFree: true,
      upgradeMessage: `Your first document is on us! This ${pageCount}-page document used your entire monthly quota. Upgrade for more pages.`,
    }),
  })
}
