import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "@/lib/openrouter"
import { flattenFields } from "@/lib/schema"
import {
  computeInitialReviewMeta,
  extractResultsMeta,
  mergeResultsWithMeta,
  sanitizeResultsFromFlat,
  sanitizeResultsFromTree,
} from "@/lib/extraction-results"

// Import from extracted modules
import {
  type InputDocumentPayload,
  type ProcessDotsOcrResult,
  type GenerateMarkdownResult,
  type SanitizedInputDocument,
  MAX_SUPPLEMENTAL_TEXT_CHARS,
  resolveDotsOcrServiceUrl,
  extractTextFromDocument,
  isImageFile,
  isPdfFile,
  processWithDotsOCR,
  generateMarkdownFromDocument,
  buildObjectFromTree,
  buildObjectFromFlat,
  buildFallbackFromTree,
  buildFallbackFromFlat,
  buildMultiDocumentPrompt,
  buildImagePrompt,
  buildPdfPrompt,
  buildTextDocumentPrompt,
  createJobSyncFn,
  initializeExtractionContext,
  parseInputDocuments,
  createSanitizedInputDocuments,
  uploadInputDocuments,
  type SchemaField,
} from "@/lib/extraction/api"

// Re-export the InputDocumentPayload type for backwards compatibility
export type { InputDocumentPayload }

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let ocrPromise: Promise<ProcessDotsOcrResult | null> | null = null
  let markdownPromise: Promise<GenerateMarkdownResult | null> | null = null
  let syncJob: (patch: Parameters<typeof createJobSyncFn>[0] extends infer T ? T extends { supabase: unknown } ? never : Parameters<ReturnType<typeof createJobSyncFn>>[0] : never) => Promise<void> = async () => {}
  let sanitizedInputDocuments: Record<string, SanitizedInputDocument> | null = null

  try {
    console.log("[extraction] API route called")

    // Parse request
    let requestData: Record<string, unknown>
    try {
      requestData = await request.json()
      console.log("[extraction] JSON payload parsed successfully")
    } catch (error) {
      console.log("[extraction] Error parsing JSON:", error)
      return NextResponse.json(
        { error: "Failed to parse request data. Please ensure you're sending valid JSON." },
        { status: 400 }
      )
    }

    const {
      file: fileData,
      schema,
      schemaTree,
      extractionPromptOverride,
      job: rawJobMeta,
      inputDocuments: inputDocsPayload,
      fieldInputDocMap,
    } = requestData as {
      file?: { name?: string; type?: string; data?: string; size?: number }
      schema?: Record<string, SchemaField>
      schemaTree?: SchemaField[]
      extractionPromptOverride?: string
      job?: unknown
      inputDocuments?: Record<string, unknown>
      fieldInputDocMap?: Record<string, string[]>
    }

    // Process input documents for multi-document mode
    const inputDocuments = parseInputDocuments(inputDocsPayload ?? null)
    const isMultiDocumentMode = inputDocuments.size > 0
    console.log("[extraction] Multi-document mode:", isMultiDocumentMode, "documents:", inputDocuments.size)

    // Pre-extract text from non-image, non-PDF input documents (e.g. DOCX, DOC)
    // so they are sent as text to the model instead of unsupported binary MIME types
    if (isMultiDocumentMode) {
      for (const [fieldId, doc] of inputDocuments) {
        if (doc.text) continue
        const docMime = (doc.type || "").toLowerCase()
        const docName = doc.name || fieldId
        if (!isImageFile(docMime, docName) && !isPdfFile(docMime, docName) && doc.data) {
          console.log(`[extraction] Extracting text from input document "${docName}" (${doc.type})`)
          const docBytes = new Uint8Array(Buffer.from(String(doc.data), "base64"))
          const extraction = await extractTextFromDocument(docBytes, docName, doc.type)
          if (extraction.text.trim().length > 0) {
            doc.text = extraction.text
            console.log(`[extraction] Extracted ${extraction.text.length} chars from "${docName}"`)
          } else {
            console.warn(`[extraction] No text extracted from "${docName}"`)
          }
          if (extraction.warnings.length > 0) {
            console.warn(`[extraction] Warnings for "${docName}":`, extraction.warnings)
          }
        }
      }
    }

    // Create sanitized input documents
    sanitizedInputDocuments = createSanitizedInputDocuments(inputDocuments)

    // Initialize extraction context
    const context = await initializeExtractionContext(rawJobMeta)
    syncJob = createJobSyncFn(context)

    // Upload input documents if in multi-document mode
    if (isMultiDocumentMode && sanitizedInputDocuments && context.supabase && context.userId && context.jobMeta) {
      await uploadInputDocuments(inputDocuments, sanitizedInputDocuments, context.supabase, context.userId, context.jobMeta)
    }

    console.log("[extraction] Received file data:", fileData?.name, fileData?.type, fileData?.size)
    if (schemaTree) {
      console.log("[extraction] schemaTree received with", Array.isArray(schemaTree) ? schemaTree.length : 0, "fields")
    } else {
      console.log("[extraction] Schema keys:", Object.keys(schema || {}))
    }

    // Validate schema
    if (!schema && !schemaTree) {
      console.log("[extraction] Error: No schema received")
      return NextResponse.json({ error: "No schema was provided" }, { status: 400 })
    }

    // Validate file
    const hasPrimaryFile = Boolean(fileData && fileData.data)
    if (!hasPrimaryFile && !isMultiDocumentMode) {
      console.log("[extraction] Error: No file data received")
      return NextResponse.json({ error: "No file was uploaded or file is invalid" }, { status: 400 })
    }

    // Decode base64 file
    const buffer = hasPrimaryFile ? Buffer.from(String(fileData?.data), "base64") : Buffer.from([])
    const bytes = new Uint8Array(buffer)

    console.log("[extraction] File converted from base64, size:", bytes.length)

    if (hasPrimaryFile && bytes.length === 0) {
      console.log("[extraction] Error: Empty file received")
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 })
    }

    const originalMimeType = fileData?.type ?? ""
    const fileMimeType = originalMimeType.toLowerCase()
    const fileName = fileData?.name ?? "uploaded"
    const isImage = isImageFile(fileMimeType, fileName)
    const isPdf = isPdfFile(fileMimeType, fileName)
    const shouldProcessDotsOcr = false // dots.ocr is disabled
    const shouldGenerateMarkdown = hasPrimaryFile && (isImage || isPdf)

    // Mark job as processing
    await syncJob({
      status: "processing",
      results: null,
      completedAt: null,
      ocrMarkdown: null,
      ocrAnnotatedImageUrl: null,
      inputDocuments: sanitizedInputDocuments ?? undefined,
    })

    if (shouldProcessDotsOcr && !resolveDotsOcrServiceUrl() && !process.env.HUGGINGFACE_API_KEY) {
      console.warn("[extraction] HUGGINGFACE_API_KEY is not set and no local dots.ocr service configured")
    }

    // Start OCR and markdown generation in parallel
    ocrPromise = shouldProcessDotsOcr
      ? processWithDotsOCR({
          bytes,
          fileName,
          mimeType: originalMimeType || fileMimeType,
          supabase: context.supabase,
          userId: context.userId,
          jobMeta: context.jobMeta,
        }).catch((error) => {
          console.error("[extraction] dots.ocr promise failed:", error)
          return null
        })
      : Promise.resolve(null)

    markdownPromise = shouldGenerateMarkdown
      ? generateMarkdownFromDocument({
          bytes,
          fileName,
          mimeType: originalMimeType || fileMimeType,
          supabase: context.supabase,
          userId: context.userId,
          jobMeta: context.jobMeta,
        }).catch((error) => {
          console.error("[extraction] markdown generation promise failed:", error)
          return null
        })
      : Promise.resolve(null)

    // Build Zod schema
    const { zodSchema, schemaLines } = schemaTree && Array.isArray(schemaTree)
      ? buildObjectFromTree(schemaTree, { includeMeta: true })
      : buildObjectFromFlat(schema ?? {})

    console.log("[extraction] Built Zod schema for Gemini")
    const schemaSummary = `Schema Fields:\n${schemaLines.join("\n")}`

    // Build extraction prompt
    let documentContent: Array<{ type: string; text?: string; image?: string }> | null = null
    let extractionPrompt = ""
    const warnings: string[] = []

    if (isMultiDocumentMode) {
      documentContent = buildMultiDocumentPrompt(
        inputDocuments,
        fieldInputDocMap ?? null,
        schemaSummary,
        extractionPromptOverride
      )
    } else {
      let extractedDocumentText = ""
      if (!isImage) {
        const extraction = await extractTextFromDocument(bytes, fileName, fileMimeType)
        extractedDocumentText = extraction.text
        warnings.push(...extraction.warnings)
      }

      if (isImage) {
        console.log("[extraction] Processing as image file...")
        const base64 = Buffer.from(bytes).toString("base64")
        const mimeType = originalMimeType || fileMimeType || "image/png"
        documentContent = buildImagePrompt(base64, mimeType, schemaSummary, extractionPromptOverride)
      } else if (isPdf) {
        console.log("[extraction] Processing as PDF file...")
        const base64 = Buffer.from(bytes).toString("base64")
        const mimeType = originalMimeType || fileMimeType || "application/pdf"

        let supplemental = extractedDocumentText.trim()
        if (supplemental.length > MAX_SUPPLEMENTAL_TEXT_CHARS) {
          supplemental = `${supplemental.slice(0, MAX_SUPPLEMENTAL_TEXT_CHARS)}\n\n[Truncated]`
          warnings.push(`Supplemental text truncated to ${MAX_SUPPLEMENTAL_TEXT_CHARS} characters.`)
        }

        documentContent = buildPdfPrompt(
          base64,
          mimeType,
          schemaSummary,
          supplemental.length > 0 ? supplemental : null,
          extractionPromptOverride
        )
      } else {
        console.log("[extraction] Processing as text-based document...")

        if (extractedDocumentText.trim().length === 0) {
          // Return fallback for empty documents
          return handleEmptyDocument(
            schema ?? null,
            schemaTree ?? null,
            warnings,
            ocrPromise,
            markdownPromise,
            syncJob,
            sanitizedInputDocuments
          )
        }

        extractionPrompt = buildTextDocumentPrompt(extractedDocumentText, schemaSummary, extractionPromptOverride)
      }
    }

    console.log("[extraction] Processing with Gemini...")

    try {
      const result = await generateObject({
        temperature: 0.2,
        messages: documentContent
          ? [{ role: "user", content: documentContent }]
          : [{ role: "user", content: extractionPrompt }],
        schema: zodSchema,
      })

      console.log("[extraction] Extraction successful")

      const { values: modelValues, meta: modelMeta } = extractResultsMeta(result.object as Record<string, unknown>)
      const rawForSanitization = modelValues ?? (result.object as Record<string, unknown>)

      const sanitizedResults = schemaTree && Array.isArray(schemaTree)
        ? sanitizeResultsFromTree(schemaTree, rawForSanitization)
        : sanitizeResultsFromFlat(schema ?? {}, rawForSanitization)

      const expectedFieldIds = schemaTree && Array.isArray(schemaTree)
        ? Array.from(
            new Set(
              flattenFields(schemaTree)
                .map((field) => field?.id)
                .filter((id): id is string => typeof id === "string" && !id.startsWith("__"))
            )
          )
        : Object.keys(schema ?? {}).filter((id) => !id.startsWith("__"))

      const reviewMeta = computeInitialReviewMeta(sanitizedResults, {
        confidenceByField: modelMeta?.confidence,
        confidenceThreshold: 0.5,
        fallbackReason: warnings.length > 0 ? warnings.join(" ") : undefined,
      })

      if (expectedFieldIds.length > 0) {
        const providedConfidence = modelMeta?.confidence ?? {}
        const missingConfidenceFields = expectedFieldIds.filter((fieldId) => !(fieldId in providedConfidence))
        if (missingConfidenceFields.length > 0) {
          console.warn(`[extraction] Missing confidence entries for fields: ${missingConfidenceFields.join(", ")}`)
        }
      }

      const resultsWithMeta = mergeResultsWithMeta(sanitizedResults, {
        review: reviewMeta,
        confidence: modelMeta?.confidence,
      })

      const ocrResult = ocrPromise ? await ocrPromise : null
      const markdownResult = markdownPromise ? await markdownPromise : null

      console.log("[extraction] Final results before sync:", {
        ocrMarkdown: ocrResult?.markdown?.length || 0,
        ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl,
        originalFileUrl: markdownResult?.originalFileUrl,
        markdownFromGeneration: markdownResult?.markdown?.length || 0,
      })

      const responsePayload = {
        success: true,
        results: resultsWithMeta,
        warnings,
        ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
        ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
        originalFileUrl: markdownResult?.originalFileUrl ?? null,
      }

      await syncJob({
        status: "completed",
        results: resultsWithMeta,
        completedAt: new Date(),
        ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
        ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
        originalFileUrl: markdownResult?.originalFileUrl ?? null,
        inputDocuments: sanitizedInputDocuments ?? undefined,
      })

      return NextResponse.json(responsePayload)
    } catch (modelError) {
      console.error("[extraction] Model extraction failed, returning fallback:", modelError)
      return handleModelError(
        modelError,
        schema ?? null,
        schemaTree ?? null,
        warnings,
        ocrPromise,
        markdownPromise,
        syncJob,
        sanitizedInputDocuments
      )
    }
  } catch (error) {
    console.error("[extraction] Extraction error:", error)
    const ocrResult = ocrPromise ? await ocrPromise : null
    const markdownResult = markdownPromise ? await markdownPromise : null

    await syncJob({
      status: "error",
      completedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
      ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
      originalFileUrl: markdownResult?.originalFileUrl ?? null,
      inputDocuments: sanitizedInputDocuments ?? undefined,
    })

    return NextResponse.json(
      {
        error: "Failed to extract data",
        details: error instanceof Error ? error.message : "Unknown error",
        ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
        ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
        originalFileUrl: markdownResult?.originalFileUrl ?? null,
      },
      { status: 500 }
    )
  }
}

/**
 * Handles empty document case by returning fallback results
 */
async function handleEmptyDocument(
  schema: Record<string, SchemaField> | null,
  schemaTree: SchemaField[] | null,
  warnings: string[],
  ocrPromise: Promise<ProcessDotsOcrResult | null> | null,
  markdownPromise: Promise<GenerateMarkdownResult | null> | null,
  syncJob: (patch: Record<string, unknown>) => Promise<void>,
  sanitizedInputDocuments: Record<string, SanitizedInputDocument> | null
) {
  console.log("[extraction] No readable text detected; returning fallback results")

  const fallback = schemaTree && Array.isArray(schemaTree)
    ? buildFallbackFromTree(schemaTree)
    : buildFallbackFromFlat(schema ?? {})

  const reviewMeta = computeInitialReviewMeta(fallback, {
    handledWithFallback: true,
    fallbackReason: "No readable text detected.",
  })

  const confidenceMap = Object.fromEntries(
    Object.entries(reviewMeta).map(([fieldId, meta]) => [fieldId, (meta as { confidence?: number }).confidence ?? null])
  )

  const fallbackWithMeta = mergeResultsWithMeta(fallback, {
    review: reviewMeta,
    confidence: confidenceMap,
  })

  warnings.push("No readable text detected. Returned '-' for all fields.")

  const ocrResult = ocrPromise ? await ocrPromise : null
  const markdownResult = markdownPromise ? await markdownPromise : null

  await syncJob({
    status: "completed",
    results: fallbackWithMeta,
    completedAt: new Date(),
    errorMessage: "No readable text detected",
    ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
    ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
    originalFileUrl: markdownResult?.originalFileUrl ?? null,
    inputDocuments: sanitizedInputDocuments ?? undefined,
  })

  return NextResponse.json(
    {
      success: true,
      results: fallbackWithMeta,
      warnings,
      handledWithFallback: true,
      ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
      ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
      originalFileUrl: markdownResult?.originalFileUrl ?? null,
    },
    { status: 200 }
  )
}

/**
 * Handles model errors by returning fallback results
 */
async function handleModelError(
  modelError: unknown,
  schema: Record<string, SchemaField> | null,
  schemaTree: SchemaField[] | null,
  warnings: string[],
  ocrPromise: Promise<ProcessDotsOcrResult | null> | null,
  markdownPromise: Promise<GenerateMarkdownResult | null> | null,
  syncJob: (patch: Record<string, unknown>) => Promise<void>,
  sanitizedInputDocuments: Record<string, SanitizedInputDocument> | null
) {
  const fallback = schemaTree && Array.isArray(schemaTree)
    ? buildFallbackFromTree(schemaTree)
    : buildFallbackFromFlat(schema ?? {})

  warnings.push("Automatic extraction failed, so we returned '-' for each field instead. Please review and retry.")

  const reviewMeta = computeInitialReviewMeta(fallback, {
    handledWithFallback: true,
    fallbackReason: modelError instanceof Error ? modelError.message : String(modelError ?? "Unknown error"),
  })

  const confidenceMap = Object.fromEntries(
    Object.entries(reviewMeta).map(([fieldId, meta]) => [fieldId, (meta as { confidence?: number }).confidence ?? null])
  )

  const fallbackWithMeta = mergeResultsWithMeta(fallback, {
    review: reviewMeta,
    confidence: confidenceMap,
  })

  const ocrResult = ocrPromise ? await ocrPromise : null
  const markdownResult = markdownPromise ? await markdownPromise : null

  await syncJob({
    status: "completed",
    results: fallbackWithMeta,
    completedAt: new Date(),
    errorMessage: modelError instanceof Error ? modelError.message : String(modelError ?? "Unknown error"),
    ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
    ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
    originalFileUrl: markdownResult?.originalFileUrl ?? null,
    inputDocuments: sanitizedInputDocuments ?? undefined,
  })

  return NextResponse.json({
    success: true,
    results: fallbackWithMeta,
    warnings,
    handledWithFallback: true,
    error: modelError instanceof Error ? modelError.message : String(modelError ?? "Unknown error"),
    ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
    ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
    originalFileUrl: markdownResult?.originalFileUrl ?? null,
  })
}
