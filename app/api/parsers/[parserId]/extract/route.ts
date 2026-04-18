import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { countDocumentPages } from "@/lib/extraction/api"
import type { SchemaField } from "@/lib/schema"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"
import {
  reserveCredits,
  refundCredits,
  getOrCreateSubscription,
  type ReserveResult,
} from "@/lib/extractor/billing/credits"
import { buildQuotaErrorBody } from "@/lib/extractor/billing/quota-response"
import type { PlanTier } from "@/lib/stripe/config"
import { trackServerEvent } from "@/lib/analytics/server"
import { reportError } from "@/lib/errorReporting"

/** Preserves the full inferred return type of the factory so Supabase query
 * builders retain their table typings inside the outer catch. */
type SupabaseServerClient = ReturnType<typeof createSupabaseServerComponentClient>
import {
  getTransformationFields,
  buildWaves,
  runTransformation,
} from "@/lib/extraction/transformations"
import { getSignedFileUrl } from "@/lib/storage/fileUrl"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  // Per-request correlation id — threaded through reportError and returned
  // to the client in any 500 envelope so we can find the exact incident in
  // logs when a user reports "it broke".
  const requestId = crypto.randomUUID()

  // These are lifted out of the try{} so the outer catch can refund credits
  // and report the incident with the same correlation context the happy
  // path would have used. Without this, an escape BETWEEN reserveCredits()
  // and the doc INSERT would silently leak a reservation.
  let supabaseClient: SupabaseServerClient | null = null
  let userId: string | null = null
  let docId: string | null = null
  let reservation: ReserveResult | null = null

  try {
  const supabase = createSupabaseServerComponentClient()
  supabaseClient = supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  userId = user.id

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

  // Pre-generate document ID so we can reserve credits keyed to it,
  // then store the file, then INSERT the row — all before the pg_net
  // trigger fires.
  docId = crypto.randomUUID()

  // Atomically reserve credits up front. This replaces the old
  // check-then-deduct two-step: first-doc-free eligibility, quota check,
  // period reset, and deduction all happen inside a single row lock in
  // the reserve_credits RPC. Concurrent uploads can't race past this.
  reservation = await reserveCredits(
    user.id,
    pageCount,
    docId,
    supabase,
    user.is_anonymous === true
  )
  if (!reservation.reserved) {
    // Resolve the user's current tier so the upgrade dialog can frame the
    // recommendation correctly. getOrCreateSubscription was already called
    // inside reserveCredits (it ensures the row exists), so this second
    // read is cheap and avoids threading tier through the reserve result.
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

  // Store file FIRST — the background worker downloads from this path.
  // If storage fails or the doc insert fails after this point we refund the
  // reservation so the user isn't charged for a document we never processed.
  const hasInlineData = !!inlineFile?.data
  const safeName = (fileData.name ?? "uploaded").replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${user.id}/${params.parserId}/${docId}/${safeName}`
  let storageOk = true

  try {
    const adminClient = createSupabaseServiceRoleClient()

    if (hasInlineData) {
      // Inline upload from REST API — store file for the background worker
      const { error: uploadErr } = await adminClient.storage
        .from("parser-documents")
        .upload(storagePath, fileBuffer, {
          contentType: fileData.type || "application/octet-stream",
          upsert: true,
        })
      if (uploadErr) {
        storageOk = false
        console.error("[extract] Inline upload failed:", uploadErr)
      }
    } else if (body.storage_path && body.storage_path !== storagePath) {
      // Browser upload — move from pending path to canonical document path
      await adminClient.storage
        .from("parser-documents")
        .move(body.storage_path, storagePath)
        .catch(() => {})
    }
  } catch (err) {
    storageOk = false
    console.error("[extract] File storage error:", err)
  }

  if (!storageOk) {
    // The file never landed — refund the reservation (doc row doesn't exist
    // yet, so we fake an insert-then-refund by passing the docId directly
    // to a bare UPDATE of extractor_subscriptions via the refund RPC).
    // In practice: we insert a shell doc row so refund_credits has a target,
    // mark it errored, then refund.
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
        status: "error",
        error_message: "File storage failed",
        credits_used: reservation.pagesCharged,
      } as any)
    await refundCredits(user.id, docId, reservation.pagesCharged, supabase)
    return NextResponse.json(
      { error: "Failed to store uploaded file" },
      { status: 500 }
    )
  }

  // Create document record — this INSERT triggers pg_net → worker endpoint.
  // `credits_used` stores what the reservation charged for this doc so
  // refund_credits knows the exact amount if extraction later fails.
  const { error: insertError } = await supabase
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
      credits_used: reservation.pagesCharged,
      status: "processing",
    } as any)

  if (insertError) {
    // Doc insert failed — we already charged credits, so refund. Since the
    // row doesn't exist, refund_credits' idempotency guard would no-op; we
    // decrement credits_used directly via a minimal shell row so the ledger
    // stays consistent.
    console.error("[extract] Doc insert failed:", insertError)
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
        status: "error",
        error_message: "Doc insert failed",
        credits_used: reservation.pagesCharged,
      } as any)
    await refundCredits(user.id, docId, reservation.pagesCharged, supabase)
    return NextResponse.json(
      { error: "Failed to create document record" },
      { status: 500 }
    )
  }

  // --- Async mode: return immediately, extraction handled by pg_net trigger → worker ---
  if (async_) {
    return NextResponse.json({
      success: true,
      document_id: docId,
      status: "processing",
      ...(reservation.firstDocumentFree && {
        firstDocumentFree: true,
        upgradeMessage: `Your first document is on us! Upgrade for more pages.`,
      }),
    })
  }

  // --- Sync mode: extract inline (for public API, reprocessing) ---
  // The worker will also receive the trigger, but it checks status="processing"
  // before starting. By the time it arrives, we've already updated to completed/error.
  try {
    const fileUrl = await getSignedFileUrl("parser-documents", storagePath)

    const extractionResult = await runExtraction({
      fileData: fileData.data,
      fileName: fileData.name ?? "uploaded",
      mimeType: fileData.type ?? "",
      schemaTree,
      extractionPromptOverride: p.extraction_prompt_override,
      extractionType,
      fileUrl,
    })

    // Credits were already atomically reserved before this branch ran;
    // sync mode only needs to record the pagesCharged on the doc row
    // (already done in the INSERT above via `credits_used`). No separate
    // deduction call — that used to race with the gate.
    const creditsUsed = reservation.pagesCharged

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
      ...(reservation.firstDocumentFree && {
        firstDocumentFree: true,
        upgradeMessage: `Your first document is on us! Upgrade for more pages.`,
      }),
    })
  } catch (err) {
    console.error(`[extract][${requestId}] Sync extraction failed:`, err)
    reportError(err, {
      route: "/api/parsers/[parserId]/extract",
      method: "POST",
      userId: user.id,
      extra: { requestId, parserId: p.id, docId },
    })

    await supabase
      .from("parser_processed_documents" as any)
      .update({
        status: "error",
        error_message: err instanceof Error ? err.message : "Extraction failed",
        processed_at: new Date().toISOString(),
      } as any)
      .eq("id", docId)

    // Refund the reservation since the extraction failed. Idempotent via
    // refunded_at on the doc row.
    await refundCredits(user.id, docId, reservation.pagesCharged, supabase)

    return NextResponse.json(
      {
        error: "Extraction failed",
        document_id: docId,
        requestId,
      },
      { status: 500 }
    )
  }
  } catch (err) {
    // Top-level containment: catches everything the inner handlers didn't —
    // parser load failures that throw instead of returning {error}, body
    // parse failures, countDocumentPages crashes on malformed PDFs, Supabase
    // RPC network errors during reserveCredits, and any other unhandled
    // throw between the entry point and the happy-path return.
    //
    // Without this wrapper, such throws escape as a bare Vercel 500 with no
    // body, no correlation id, and no reporter entry — which is the exact
    // failure mode that produced issue #66.
    console.error(`[extract][${requestId}] Unhandled error:`, err)
    reportError(err, {
      route: "/api/parsers/[parserId]/extract",
      method: "POST",
      userId: userId ?? undefined,
      extra: {
        requestId,
        parserId: params.parserId,
        docId: docId ?? undefined,
        reserved: reservation?.reserved ?? false,
        pagesCharged: reservation?.reserved ? reservation.pagesCharged : 0,
      },
    })

    // If we managed to reserve credits before the throw but never reached
    // the refund paths inside the inner handlers, refund now so the ledger
    // stays consistent. refundCredits is idempotent via refunded_at, so a
    // later call (e.g., from the stuck-doc cleanup cron) is a no-op.
    if (
      userId &&
      docId &&
      reservation?.reserved &&
      reservation.pagesCharged > 0 &&
      supabaseClient
    ) {
      try {
        await refundCredits(userId, docId, reservation.pagesCharged, supabaseClient)
      } catch (refundErr) {
        console.error(
          `[extract][${requestId}] Refund after unhandled error failed:`,
          refundErr
        )
      }
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong while starting your extraction. Please try again in a moment.",
        code: "internal_error",
        requestId,
        ...(docId && { document_id: docId }),
      },
      { status: 500 }
    )
  }
}
