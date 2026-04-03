/**
 * Chunked PDF Extraction
 *
 * For large PDFs (>CHUNKED_PAGE_THRESHOLD pages), splits the document into
 * individual pages and extracts each in parallel, then consolidates the
 * per-page results into a single output using a lighter model.
 *
 * Phase 1: Per-page extraction with Gemini 2.5 Pro (parallel, capped concurrency)
 * Phase 2: Consolidation with Gemini 2.5 Flash (single text-only call)
 */

import { PDFDocument } from "pdf-lib"
import { generateObject, generateFreeformJson, generateText } from "@/lib/openrouter"
import type { SchemaField } from "@/lib/schema"
import type { ExtractionInput, ExtractionOutput } from "./runExtraction"
import {
  buildObjectFromTree,
  buildFallbackFromTree,
} from "@/lib/extraction/api"
import {
  extractResultsMeta,
  computeInitialReviewMeta,
  sanitizeResultsFromTree,
  mergeResultsWithMeta,
} from "@/lib/extraction-results"
import {
  buildFieldsConsolidationPrompt,
  buildFullContentConsolidationPrompt,
} from "./consolidationPrompts"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** PDFs with more pages than this use chunked extraction */
export const CHUNKED_PAGE_THRESHOLD = 5

/** Max parallel OpenRouter requests */
const MAX_CONCURRENCY = 10

/** Model used for Phase 2 consolidation (text-only, fast, cheap) */
const CONSOLIDATION_MODEL = "google/gemini-2.5-flash"

/** Stop submitting new pages if less than this time remains */
const TIMEOUT_SAFETY_MARGIN_MS = 30_000

/** Assumed max worker duration (matches process-document route maxDuration) */
const MAX_DURATION_MS = 600_000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageExtractionResult {
  pageNumber: number
  success: boolean
  data: Record<string, any> | null
  error?: string
}

// ---------------------------------------------------------------------------
// Concurrency control (no external dependency)
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let index = 0

  async function worker() {
    while (index < tasks.length) {
      const i = index++
      results[i] = await tasks[i]()
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  )
  return results
}

// ---------------------------------------------------------------------------
// PDF splitting (server-side, pdf-lib)
// ---------------------------------------------------------------------------

/**
 * Splits a PDF into individual single-page PDF buffers.
 */
async function splitPdfToPageBuffers(
  pdfBytes: Uint8Array
): Promise<Uint8Array[]> {
  const sourcePdf = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: true,
  })
  const totalPages = sourcePdf.getPageCount()
  const pageBuffers: Uint8Array[] = []

  for (let i = 0; i < totalPages; i++) {
    const singlePagePdf = await PDFDocument.create()
    const [copiedPage] = await singlePagePdf.copyPages(sourcePdf, [i])
    singlePagePdf.addPage(copiedPage)
    const bytes = await singlePagePdf.save({ useObjectStreams: true })
    pageBuffers.push(new Uint8Array(bytes))
  }

  return pageBuffers
}

// ---------------------------------------------------------------------------
// Per-page extraction
// ---------------------------------------------------------------------------

/**
 * Extracts raw markdown text from a single PDF page using Gemini Pro.
 * This is the "Read" step — no structuring, no JSON, just faithful
 * text conversion. Structuring happens in the consolidation step.
 */
async function extractSinglePage(
  pageBuffer: Uint8Array,
  pageNumber: number,
  totalPages: number,
  input: ExtractionInput
): Promise<PageExtractionResult> {
  const base64 = Buffer.from(pageBuffer).toString("base64")
  const mimeType = "application/pdf"

  const prompt = `Convert this scanned document page to clean markdown text. Preserve the original structure faithfully:
- Reproduce all text exactly as it appears
- Use markdown tables for any tabular data
- Preserve headings, lists, and formatting
- Include every number, date, name, and data point — do not skip anything
- Do not add commentary or interpretation — just convert what you see`

  try {
    const result = await generateText({
      temperature: 0.1,
      messages: [
        {
          role: "user" as const,
          content: [
            { type: "text", text: `Page ${pageNumber} of ${totalPages}.\n\n${prompt}` },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ] as any,
        },
      ],
    })

    return {
      pageNumber,
      success: true,
      data: { markdown: result.text },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(
      `[chunked-extraction] Page ${pageNumber}/${totalPages} FAILED: ${message}`
    )
    return { pageNumber, success: false, data: null, error: message }
  }
}

// ---------------------------------------------------------------------------
// Consolidation
// ---------------------------------------------------------------------------

async function consolidateFieldsResults(
  pageResults: PageExtractionResult[],
  input: ExtractionInput
): Promise<ExtractionOutput> {
  const schemaTree: SchemaField[] = input.schemaTree ?? []
  const { zodSchema, schemaLines } = buildObjectFromTree(schemaTree, {
    includeMeta: true,
  })
  const schemaSummary = `Schema Fields:\n${schemaLines.join("\n")}`

  const prompt = buildFieldsConsolidationPrompt(
    pageResults,
    schemaSummary,
    input.extractionPromptOverride || undefined
  )

  try {
    const result = await generateObject({
      temperature: 0.1,
      model: CONSOLIDATION_MODEL,
      messages: [{ role: "user" as const, content: prompt }],
      schema: zodSchema,
    })

    const { values: modelValues, meta: modelMeta } = extractResultsMeta(
      result.object as Record<string, unknown>
    )
    const raw = modelValues ?? (result.object as Record<string, unknown>)
    const sanitized = sanitizeResultsFromTree(schemaTree, raw)
    const reviewMeta = computeInitialReviewMeta(sanitized, {
      confidenceByField: modelMeta?.confidence,
      confidenceThreshold: 0.5,
    })
    const resultsWithMeta = mergeResultsWithMeta(sanitized, {
      review: reviewMeta,
      confidence: modelMeta?.confidence,
    })

    return { success: true, results: resultsWithMeta, warnings: [] }
  } catch (err) {
    console.warn(
      `[chunked-extraction] Consolidation failed, falling back to naive merge: ${err instanceof Error ? err.message : err}`
    )
    return naiveMergeResults(pageResults)
  }
}

async function consolidateFullContentResults(
  pageResults: PageExtractionResult[]
): Promise<ExtractionOutput> {
  const prompt = buildFullContentConsolidationPrompt(pageResults)

  try {
    const result = await generateFreeformJson({
      temperature: 0.1,
      model: CONSOLIDATION_MODEL,
      messages: [{ role: "user" as const, content: prompt }],
    })

    return { success: true, results: result.object, warnings: [] }
  } catch (err) {
    console.warn(
      `[chunked-extraction] Consolidation failed, falling back to naive merge: ${err instanceof Error ? err.message : err}`
    )
    return naiveMergeResults(pageResults)
  }
}

// ---------------------------------------------------------------------------
// Naive fallback merges (when consolidation LLM call fails)
// ---------------------------------------------------------------------------

/**
 * Fallback when consolidation LLM fails: return concatenated raw markdown.
 * Not ideal, but better than nothing — the user at least sees the text.
 */
function naiveMergeResults(
  pageResults: PageExtractionResult[]
): ExtractionOutput {
  const allText = pageResults
    .filter((r) => r.success && r.data?.markdown)
    .map((r) => `--- Page ${r.pageNumber} ---\n${r.data!.markdown}`)
    .join("\n\n")

  return {
    success: true,
    results: { raw_text: allText },
    warnings: ["Consolidation failed. Returning raw extracted text from all pages."],
    handledWithFallback: true,
  }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Extracts data from a large PDF by splitting into pages, extracting each
 * in parallel, and consolidating the results.
 */
export async function runChunkedPdfExtraction(
  input: ExtractionInput,
  pageCount: number
): Promise<ExtractionOutput> {
  const extractionType = input.extractionType ?? "fields"
  const startTime = Date.now()

  console.log(
    `[chunked-extraction] Starting: ${pageCount} pages, mode=${extractionType}, file="${input.fileName}"`
  )

  // Phase 0: Split PDF into individual page buffers
  const buffer = Buffer.from(input.fileData, "base64")
  let pageBuffers: Uint8Array[]
  try {
    pageBuffers = await splitPdfToPageBuffers(new Uint8Array(buffer))
  } catch (err) {
    console.error("[chunked-extraction] PDF split failed:", err)
    return {
      success: false,
      results: extractionType === "fields"
        ? buildFallbackFromTree(input.schemaTree ?? [])
        : {},
      warnings: ["Failed to split PDF into pages."],
      handledWithFallback: true,
      error: err instanceof Error ? err.message : "PDF split failed",
    }
  }

  const totalPages = pageBuffers.length

  // Phase 1: Per-page extraction with concurrency control + timeout safety
  const tasks: (() => Promise<PageExtractionResult>)[] = []

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1
    const pageBuffer = pageBuffers[i]

    tasks.push(async () => {
      // Timeout safety: check if we have enough time
      const elapsed = Date.now() - startTime
      const remaining = MAX_DURATION_MS - elapsed
      if (remaining < TIMEOUT_SAFETY_MARGIN_MS) {
        console.warn(
          `[chunked-extraction] Timeout approaching (${Math.round(remaining / 1000)}s left), skipping page ${pageNum}`
        )
        return {
          pageNumber: pageNum,
          success: false,
          data: null,
          error: "Skipped: timeout approaching",
        }
      }

      const pageStart = Date.now()
      const result = await extractSinglePage(
        pageBuffer,
        pageNum,
        totalPages,
        input
      )
      const pageDuration = Date.now() - pageStart

      if (result.success) {
        console.log(
          `[chunked-extraction] Page ${pageNum}/${totalPages} complete (${pageDuration}ms)`
        )
      }

      return result
    })
  }

  const pageResults = await runWithConcurrency(tasks, MAX_CONCURRENCY)

  const succeeded = pageResults.filter((r) => r.success)
  const failed = pageResults.filter((r) => !r.success)

  console.log(
    `[chunked-extraction] Phase 1 complete: ${succeeded.length}/${totalPages} pages succeeded` +
      (failed.length > 0
        ? `, ${failed.length} failed: [${failed.map((f) => `p${f.pageNumber}`).join(", ")}]`
        : "")
  )

  // All pages failed — return error
  if (succeeded.length === 0) {
    const firstError = failed[0]?.error ?? "All page extractions failed"
    return {
      success: false,
      results: extractionType === "fields"
        ? buildFallbackFromTree(input.schemaTree ?? [])
        : {},
      warnings: ["All page extractions failed."],
      handledWithFallback: true,
      error: firstError,
    }
  }

  // Phase 2: Consolidation
  const consolidationStart = Date.now()
  let output: ExtractionOutput

  if (extractionType === "full_content") {
    output = await consolidateFullContentResults(succeeded)
  } else {
    output = await consolidateFieldsResults(succeeded, input)
  }

  const consolidationDuration = Date.now() - consolidationStart
  const totalDuration = Date.now() - startTime

  console.log(
    `[chunked-extraction] Consolidation complete (${consolidationDuration}ms)`
  )
  console.log(
    `[chunked-extraction] Done: ${totalDuration}ms total, ${succeeded.length}/${totalPages} pages`
  )

  // Add warnings for failed pages
  if (failed.length > 0) {
    output.warnings = [
      ...(output.warnings || []),
      `${failed.length} of ${totalPages} pages failed to extract and were excluded from results.`,
    ]
  }

  return output
}
