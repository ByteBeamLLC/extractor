/**
 * Shared extraction logic used by both the main app and the extractor tool.
 * Single AI request for all fields — not per-field.
 *
 * This is the core extraction pipeline:
 *   file → detect type → parse text → build Zod schema → build prompt → AI call → sanitize results
 *
 * Supports two modes:
 *   - "fields" (default): Schema-driven extraction with Zod validation
 *   - "full_content": Extract ALL data from the document, AI determines the structure
 */

import { generateObject, generateFreeformJson } from "@/lib/openrouter"
import { flattenFields } from "@/lib/schema"
import type { SchemaField } from "@/lib/schema"
import type { ExtractionType } from "@/lib/extractor/types"
import {
  extractTextFromDocument,
  isImageFile,
  isPdfFile,
  buildObjectFromTree,
  buildImagePrompt,
  buildPdfPrompt,
  buildTextDocumentPrompt,
  buildFullContentImagePrompt,
  buildFullContentPdfPrompt,
  buildFullContentTextPrompt,
  buildFallbackFromTree,
  MAX_SUPPLEMENTAL_TEXT_CHARS,
} from "@/lib/extraction/api"
import {
  extractResultsMeta,
  computeInitialReviewMeta,
  sanitizeResultsFromTree,
  mergeResultsWithMeta,
} from "@/lib/extraction-results"

/**
 * Maps raw API/network errors to user-friendly messages.
 * The raw error is already logged via console.error above — this is only for user-facing text.
 */
function sanitizeExtractionError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  if (
    raw.includes('Unexpected end of JSON') ||
    raw.includes('ECONNRESET') ||
    raw.includes('socket hang up') ||
    raw.includes('network') ||
    raw.includes('UND_ERR') ||
    raw.includes('fetch failed')
  ) {
    return 'Document processing failed due to a temporary service issue. Please try again.'
  }
  if (raw.includes('OpenRouter API error (429)') || raw.includes('rate limit')) {
    return 'Our AI service is temporarily at capacity. Please try again in a moment.'
  }
  if (raw.includes('OpenRouter API error (5')) {
    return 'Our AI service encountered an error. Please try again.'
  }
  // Pass through errors that are already user-friendly (e.g. "Credit limit reached.")
  return raw
}

export interface ExtractionInput {
  /** Base64-encoded file data */
  fileData: string
  /** Original file name */
  fileName: string
  /** MIME type of the file */
  mimeType: string
  /** Schema fields defining what to extract (used in "fields" mode) */
  schemaTree: SchemaField[]
  /** Optional custom prompt override */
  extractionPromptOverride?: string | null
  /** Extraction type — "fields" for schema-driven, "full_content" for extracting everything */
  extractionType?: ExtractionType
}

export interface ExtractionOutput {
  success: boolean
  /** Extracted values keyed by field id, including __meta__ with review & confidence */
  results: Record<string, any>
  /** Any warnings produced during extraction */
  warnings: string[]
  /** True if extraction failed and fallback values were returned */
  handledWithFallback?: boolean
  /** Error message if extraction failed */
  error?: string
}

/**
 * Runs the full extraction pipeline in a single AI request.
 * Delegates to schema-driven or full-content extraction based on extractionType.
 */
export async function runExtraction(input: ExtractionInput): Promise<ExtractionOutput> {
  const extractionType = input.extractionType ?? "fields"

  if (extractionType === "full_content") {
    return runFullContentExtraction(input)
  }
  return runFieldsExtraction(input)
}

// ---------------------------------------------------------------------------
// Full-content extraction (no predefined schema)
// ---------------------------------------------------------------------------

async function runFullContentExtraction(input: ExtractionInput): Promise<ExtractionOutput> {
  const { fileData, fileName, mimeType, extractionPromptOverride } = input

  const buffer = Buffer.from(fileData, "base64")
  const bytes = new Uint8Array(buffer)
  const fileMimeType = mimeType.toLowerCase()

  if (bytes.length === 0) {
    return {
      success: false,
      results: {},
      warnings: ["Uploaded file is empty."],
      handledWithFallback: true,
    }
  }

  const isImage = isImageFile(fileMimeType, fileName)
  const isPdf = isPdfFile(fileMimeType, fileName)

  let documentContent: Array<{ type: string; text?: string; image?: string }> | null = null
  let extractionPrompt = ""
  const warnings: string[] = []
  const promptOverride = extractionPromptOverride || undefined

  if (isImage) {
    const base64 = Buffer.from(bytes).toString("base64")
    documentContent = buildFullContentImagePrompt(base64, fileMimeType || "image/png", promptOverride)
  } else if (isPdf) {
    const base64 = Buffer.from(bytes).toString("base64")

    const extraction = await extractTextFromDocument(bytes, fileName, fileMimeType)
    warnings.push(...extraction.warnings)

    let supplemental = extraction.text.trim()
    if (supplemental.length > MAX_SUPPLEMENTAL_TEXT_CHARS) {
      supplemental = `${supplemental.slice(0, MAX_SUPPLEMENTAL_TEXT_CHARS)}\n\n[Truncated]`
      warnings.push(`Supplemental text truncated to ${MAX_SUPPLEMENTAL_TEXT_CHARS} characters.`)
    }

    documentContent = buildFullContentPdfPrompt(
      base64,
      fileMimeType || "application/pdf",
      supplemental.length > 0 ? supplemental : null,
      promptOverride
    )
  } else {
    const extraction = await extractTextFromDocument(bytes, fileName, fileMimeType)
    warnings.push(...extraction.warnings)

    if (extraction.text.trim().length === 0) {
      return {
        success: true,
        results: {},
        warnings: [...warnings, "No readable text detected."],
        handledWithFallback: true,
      }
    }

    extractionPrompt = buildFullContentTextPrompt(extraction.text, promptOverride)
  }

  try {
    const result = await generateFreeformJson({
      temperature: 0.2,
      messages: documentContent
        ? [{ role: "user" as const, content: documentContent as any }]
        : [{ role: "user" as const, content: extractionPrompt }],
    })

    return {
      success: true,
      results: result.object,
      warnings,
    }
  } catch (modelError) {
    console.error("[extraction] Full-content extraction failed:", modelError)

    return {
      success: false,
      results: {},
      warnings: [
        ...warnings,
        "Extraction failed. Please review and retry.",
      ],
      handledWithFallback: true,
      error: sanitizeExtractionError(modelError),
    }
  }
}

// ---------------------------------------------------------------------------
// Schema-driven field extraction (original behavior, unchanged)
// ---------------------------------------------------------------------------

async function runFieldsExtraction(input: ExtractionInput): Promise<ExtractionOutput> {
  const { fileData, fileName, mimeType, schemaTree, extractionPromptOverride } = input

  // Decode file
  const buffer = Buffer.from(fileData, "base64")
  const bytes = new Uint8Array(buffer)
  const fileMimeType = mimeType.toLowerCase()

  if (bytes.length === 0) {
    return {
      success: false,
      results: buildFallbackFromTree(schemaTree),
      warnings: ["Uploaded file is empty."],
      handledWithFallback: true,
    }
  }

  const isImage = isImageFile(fileMimeType, fileName)
  const isPdf = isPdfFile(fileMimeType, fileName)

  // Build Zod schema from the full field tree (same as main app)
  const { zodSchema, schemaLines } = buildObjectFromTree(schemaTree, { includeMeta: true })
  const schemaSummary = `Schema Fields:\n${schemaLines.join("\n")}`

  // Build prompt based on file type (same logic as main app's /api/extract)
  let documentContent: Array<{ type: string; text?: string; image?: string }> | null = null
  let extractionPrompt = ""
  const warnings: string[] = []
  const promptOverride = extractionPromptOverride || undefined

  if (isImage) {
    const base64 = Buffer.from(bytes).toString("base64")
    documentContent = buildImagePrompt(base64, fileMimeType || "image/png", schemaSummary, promptOverride)
  } else if (isPdf) {
    const base64 = Buffer.from(bytes).toString("base64")

    // Extract supplemental text from PDF (same as main app)
    const extraction = await extractTextFromDocument(bytes, fileName, fileMimeType)
    warnings.push(...extraction.warnings)

    let supplemental = extraction.text.trim()
    if (supplemental.length > MAX_SUPPLEMENTAL_TEXT_CHARS) {
      supplemental = `${supplemental.slice(0, MAX_SUPPLEMENTAL_TEXT_CHARS)}\n\n[Truncated]`
      warnings.push(`Supplemental text truncated to ${MAX_SUPPLEMENTAL_TEXT_CHARS} characters.`)
    }

    documentContent = buildPdfPrompt(
      base64,
      fileMimeType || "application/pdf",
      schemaSummary,
      supplemental.length > 0 ? supplemental : null,
      promptOverride
    )
  } else {
    // Text-based document (DOCX, Excel, TXT, CSV, etc.)
    const extraction = await extractTextFromDocument(bytes, fileName, fileMimeType)
    warnings.push(...extraction.warnings)

    if (extraction.text.trim().length === 0) {
      const fallback = buildFallbackFromTree(schemaTree)
      const reviewMeta = computeInitialReviewMeta(fallback, {
        handledWithFallback: true,
        fallbackReason: "No readable text detected.",
      })
      const confidenceMap = Object.fromEntries(
        Object.entries(reviewMeta).map(([fieldId, meta]) => [
          fieldId,
          (meta as { confidence?: number }).confidence ?? null,
        ])
      )
      const fallbackWithMeta = mergeResultsWithMeta(fallback, {
        review: reviewMeta,
        confidence: confidenceMap,
      })
      return {
        success: true,
        results: fallbackWithMeta,
        warnings: [...warnings, "No readable text detected. Returned '-' for all fields."],
        handledWithFallback: true,
      }
    }

    extractionPrompt = buildTextDocumentPrompt(extraction.text, schemaSummary, promptOverride)
  }

  // Single AI request for ALL fields (same as main app)
  try {
    const result = await generateObject({
      temperature: 0.2,
      messages: documentContent
        ? [{ role: "user" as const, content: documentContent as any }]
        : [{ role: "user" as const, content: extractionPrompt }],
      schema: zodSchema,
    })

    // Process results (same as main app)
    const { values: modelValues, meta: modelMeta } = extractResultsMeta(
      result.object as Record<string, unknown>
    )
    const rawForSanitization = modelValues ?? (result.object as Record<string, unknown>)
    const sanitizedResults = sanitizeResultsFromTree(schemaTree, rawForSanitization)

    // Check for missing confidence fields (same as main app)
    const expectedFieldIds = Array.from(
      new Set(
        flattenFields(schemaTree)
          .map((field) => field?.id)
          .filter((id): id is string => typeof id === "string" && !id.startsWith("__"))
      )
    )
    if (expectedFieldIds.length > 0) {
      const providedConfidence = modelMeta?.confidence ?? {}
      const missingFields = expectedFieldIds.filter((id) => !(id in providedConfidence))
      if (missingFields.length > 0) {
        console.warn(`[extraction] Missing confidence for: ${missingFields.join(", ")}`)
      }
    }

    const reviewMeta = computeInitialReviewMeta(sanitizedResults, {
      confidenceByField: modelMeta?.confidence,
      confidenceThreshold: 0.5,
      fallbackReason: warnings.length > 0 ? warnings.join(" ") : undefined,
    })

    const resultsWithMeta = mergeResultsWithMeta(sanitizedResults, {
      review: reviewMeta,
      confidence: modelMeta?.confidence,
    })

    return {
      success: true,
      results: resultsWithMeta,
      warnings,
    }
  } catch (modelError) {
    console.error("[extraction] Model extraction failed:", modelError)

    // Fallback on model error (same as main app)
    const fallback = buildFallbackFromTree(schemaTree)
    const reviewMeta = computeInitialReviewMeta(fallback, {
      handledWithFallback: true,
      fallbackReason: sanitizeExtractionError(modelError),
    })
    const confidenceMap = Object.fromEntries(
      Object.entries(reviewMeta).map(([fieldId, meta]) => [
        fieldId,
        (meta as { confidence?: number }).confidence ?? null,
      ])
    )
    const fallbackWithMeta = mergeResultsWithMeta(fallback, {
      review: reviewMeta,
      confidence: confidenceMap,
    })

    return {
      success: true,
      results: fallbackWithMeta,
      warnings: [
        ...warnings,
        "Automatic extraction failed, so we returned '-' for each field instead. Please review and retry.",
      ],
      handledWithFallback: true,
      error: sanitizeExtractionError(modelError),
    }
  }
}
