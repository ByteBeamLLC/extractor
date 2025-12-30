/**
 * Shared extraction logic for document extraction
 * Supports both single images and multi-page PDFs via dots.ocr (Real-ESRGAN upscaling on low-quality OCR)
 * Uses Gemini 2.5 Pro for text extraction from each block (parallel processing)
 */

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { callDotsOcr, callRealEsrgan } from "@/lib/replicate"
import { generateText } from "@/lib/openrouter"

interface ExtractFileParams {
  fileId: string
  userId: string
  supabase: ReturnType<typeof createSupabaseServerClient>
}

// Gemini model for text extraction (via OpenRouter)
const GEMINI_MODEL = "google/gemini-2.5-pro-preview"

// Concurrency configuration
const INITIAL_CONCURRENCY = 5
const MIN_CONCURRENCY = 2
const MAX_CONCURRENCY = 10
const MAX_RETRIES = 3
const BASE_BACKOFF_MS = 1000
const PDF_RENDER_SCALE = 2
const OCR_UPSCALE_SCALE = 2
const OCR_MIN_TEXT_CHARS = 30
const OCR_MIN_AVG_CHARS = 8
const OCR_MAX_EMPTY_BLOCK_RATIO = 0.6

// ============================================================================
// Multi-page data structures
// ============================================================================

interface PageData {
  pageIndex: number
  pageNumber: number // 1-based for display
  width?: number
  height?: number
  imageDataUrl?: string // Base64 data URL for the page image
  blocks: Array<{
    blockIndex: number // Index within the page
    globalBlockIndex: number // Index across all pages
    type: string
    content?: string
    text?: string
    bbox: [number, number, number, number]
    originalBbox?: [number, number, number, number]
    category?: string
    extractedText?: string
  }>
}

interface MultiPageLayoutData {
  pages: PageData[]
  totalPages: number
  totalBlocks: number
  markdown?: string
}

interface MultiPageExtractedText {
  pages: Array<{
    pageIndex: number
    pageNumber: number
    blocks: Array<{
      blockIndex: number
      globalBlockIndex: number
      type: string
      text: string
      ocrText?: string
      bbox?: [number, number, number, number]
      error?: string
    }>
  }>
  totalBlocks: number
}

// ============================================================================
// Block extraction types
// ============================================================================

interface BlockExtractionTask {
  index: number // Global block index
  pageIndex: number
  blockIndex: number // Index within page
  block: any
  ocrText: string
  bbox: [number, number, number, number]
  imageDataUrl: string // Per-task image URL (supports different pages)
}

interface BlockExtractionResult {
  blockIndex: number
  globalBlockIndex: number
  pageIndex: number
  type: string
  text: string
  ocrText?: string
  bbox?: [number, number, number, number]
  error?: string
}

// ============================================================================
// Concurrency control
// ============================================================================

class ConcurrencyController {
  private currentConcurrency: number
  private consecutiveSuccesses: number = 0
  private consecutiveFailures: number = 0

  constructor(initial: number = INITIAL_CONCURRENCY) {
    this.currentConcurrency = initial
  }

  get concurrency(): number {
    return this.currentConcurrency
  }

  onSuccess(): void {
    this.consecutiveSuccesses++
    this.consecutiveFailures = 0
    if (this.consecutiveSuccesses >= 5 && this.currentConcurrency < MAX_CONCURRENCY) {
      this.currentConcurrency++
      this.consecutiveSuccesses = 0
      console.log(`[concurrency] Increased to ${this.currentConcurrency}`)
    }
  }

  onRateLimit(): void {
    this.consecutiveFailures++
    this.consecutiveSuccesses = 0
    if (this.currentConcurrency > MIN_CONCURRENCY) {
      this.currentConcurrency = Math.max(MIN_CONCURRENCY, Math.floor(this.currentConcurrency * 0.6))
      console.log(`[concurrency] Decreased to ${this.currentConcurrency} due to rate limit`)
    }
  }

  onError(): void {
    this.consecutiveFailures++
    this.consecutiveSuccesses = 0
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRateLimitError(error: any): boolean {
  const message = error?.message?.toLowerCase() || ""
  const status = error?.status || error?.statusCode
  return (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("quota exceeded")
  )
}

function getOcrTextStats(output: { blocks?: Array<{ content?: string; text?: string }>; markdown?: string }) {
  const blocks = output.blocks || []
  const textValues = blocks
    .map(block => (block.content || block.text || "").trim())
    .filter(text => text.length > 0)
  const totalTextLength = textValues.reduce((sum, text) => sum + text.length, 0)
  const emptyBlocks = blocks.length - textValues.length
  const avgBlockChars = blocks.length > 0 ? totalTextLength / blocks.length : 0
  const emptyBlockRatio = blocks.length > 0 ? emptyBlocks / blocks.length : 1
  const markdownLength = output.markdown?.trim().length || 0

  return {
    blocksCount: blocks.length,
    totalTextLength,
    avgBlockChars,
    emptyBlockRatio,
    markdownLength,
  }
}

function isLowOcrQuality(output: { blocks?: Array<{ content?: string; text?: string }>; markdown?: string }): boolean {
  const stats = getOcrTextStats(output)

  if (stats.blocksCount === 0) {
    return stats.markdownLength < OCR_MIN_TEXT_CHARS
  }
  if (stats.totalTextLength + stats.markdownLength < OCR_MIN_TEXT_CHARS) return true
  if (stats.emptyBlockRatio > OCR_MAX_EMPTY_BLOCK_RATIO) return true
  if (stats.avgBlockChars < OCR_MIN_AVG_CHARS && stats.emptyBlockRatio > 0.4) return true

  return false
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch upscaled image: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/png"
  return {
    base64: Buffer.from(arrayBuffer).toString("base64"),
    mimeType,
  }
}

// ============================================================================
// File type detection
// ============================================================================

function isPDFFile(mimeType: string, fileName: string): boolean {
  return (
    mimeType === "application/pdf" ||
    mimeType === "application/x-pdf" ||
    fileName.toLowerCase().endsWith(".pdf")
  )
}

// ============================================================================
// Gemini text extraction (parallel)
// ============================================================================

async function extractBlockText(
  task: BlockExtractionTask,
  controller: ConcurrencyController,
  retryCount: number = 0
): Promise<BlockExtractionResult> {
  const { index, pageIndex, blockIndex, block, ocrText, bbox, imageDataUrl } = task
  const [x, y, width, height] = bbox

  try {
    const prompt = `Look at this document image. I need you to extract the text from a specific region.

The region is defined by these coordinates (in pixels from top-left):
- X (left): ${Math.round(x)}
- Y (top): ${Math.round(y)}
- Width: ${Math.round(width)}
- Height: ${Math.round(height)}

The OCR system detected this content in the region: "${ocrText || 'No text detected'}"

Please extract the EXACT text content from this region. If the OCR text looks correct, you can confirm it. If you see errors or can extract it more accurately, provide the corrected text.

Return ONLY the extracted text, nothing else. No explanations.`

    const result = await generateText({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      model: GEMINI_MODEL,
    })

    controller.onSuccess()

    return {
      blockIndex,
      globalBlockIndex: index,
      pageIndex,
      type: block.type || "TEXT",
      text: result.text.trim(),
      ocrText,
      bbox,
    }
  } catch (error: any) {
    if (isRateLimitError(error)) {
      controller.onRateLimit()
      if (retryCount < MAX_RETRIES) {
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, retryCount)
        console.log(`[extraction] Rate limit hit for block ${index}, retrying in ${backoffMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)
        await sleep(backoffMs)
        return extractBlockText(task, controller, retryCount + 1)
      }
    } else {
      controller.onError()
      if (retryCount < MAX_RETRIES) {
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, retryCount)
        console.log(`[extraction] Error for block ${index}, retrying in ${backoffMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)
        await sleep(backoffMs)
        return extractBlockText(task, controller, retryCount + 1)
      }
    }

    console.error(`[extraction] Failed to extract block ${index} after ${MAX_RETRIES} retries:`, error?.message || error)

    return {
      blockIndex,
      globalBlockIndex: index,
      pageIndex,
      type: block.type || "TEXT",
      text: ocrText || "",
      ocrText,
      bbox,
      error: error?.message || String(error),
    }
  }
}

async function extractBlocksInParallel(
  tasks: BlockExtractionTask[]
): Promise<BlockExtractionResult[]> {
  const controller = new ConcurrencyController(INITIAL_CONCURRENCY)
  const results: BlockExtractionResult[] = []
  const pending = [...tasks]
  const inFlight: Promise<void>[] = []

  console.log(`[extraction] Starting parallel extraction of ${tasks.length} blocks with initial concurrency ${controller.concurrency}`)

  while (pending.length > 0 || inFlight.length > 0) {
    while (pending.length > 0 && inFlight.length < controller.concurrency) {
      const task = pending.shift()!

      const promise = extractBlockText(task, controller)
        .then(result => {
          results.push(result)
          if (results.length % 10 === 0 || results.length === tasks.length) {
            console.log(`[extraction] Progress: ${results.length}/${tasks.length} blocks completed (concurrency: ${controller.concurrency})`)
          }
        })
        .finally(() => {
          const idx = inFlight.indexOf(promise as any)
          if (idx > -1) inFlight.splice(idx, 1)
        })

      inFlight.push(promise as any)
    }

    if (inFlight.length > 0) {
      await Promise.race(inFlight)
    }
  }

  results.sort((a, b) => a.globalBlockIndex - b.globalBlockIndex)
  return results
}

// ============================================================================
// Image extraction (dots.ocr) - Single page
// ============================================================================

async function extractImageWithDotsOcr(
  base64: string,
  mimeType: string,
  fileName: string
): Promise<MultiPageLayoutData> {
  console.log(`[document-extraction] Using dots.ocr for single image extraction`)
  let imageBase64 = base64
  let imageMimeType = mimeType
  let dotsOcrOutput = await callDotsOcr(
    { image: imageBase64, file_name: fileName, mime_type: imageMimeType },
    { timeout: 600_000 }
  )

  if (isLowOcrQuality(dotsOcrOutput)) {
    console.log(`[document-extraction] Low OCR quality detected, upscaling image with Real-ESRGAN`)
    try {
      const upscaled = await callRealEsrgan(
        { image: imageBase64, mime_type: imageMimeType, scale: OCR_UPSCALE_SCALE },
        { timeout: 600_000 }
      )
      const upscaledImage = await fetchImageAsBase64(upscaled.imageUrl)
      imageBase64 = upscaledImage.base64
      imageMimeType = upscaledImage.mimeType

      dotsOcrOutput = await callDotsOcr(
        { image: imageBase64, file_name: fileName, mime_type: imageMimeType },
        { timeout: 600_000 }
      )
    } catch (error) {
      console.warn(`[document-extraction] Real-ESRGAN upscale failed, using original OCR output:`, error)
    }
  }

  console.log(`[document-extraction] dots.ocr response:`, {
    hasBlocks: !!dotsOcrOutput.blocks,
    blocksCount: dotsOcrOutput.blocks?.length || 0,
    hasMarkdown: !!dotsOcrOutput.markdown,
  })

  const blocks = dotsOcrOutput.blocks || []

  // Normalize to multi-page structure (single page)
  const pageData: PageData = {
    pageIndex: 0,
    pageNumber: 1,
    imageDataUrl: `data:${imageMimeType};base64,${imageBase64}`,
    blocks: blocks.map((block: any, i: number) => ({
      blockIndex: i,
      globalBlockIndex: i,
      type: block.type || block.category || "TEXT",
      content: block.content || block.text || "",
      text: block.content || block.text || "",
      bbox: block.bbox || [0, 0, 0, 0],
      originalBbox: block.originalBbox,
      category: block.category,
    })),
  }

  return {
    pages: [pageData],
    totalPages: 1,
    totalBlocks: blocks.length,
    markdown: dotsOcrOutput.markdown,
  }
}

// ============================================================================
// PDF extraction (dots.ocr) - Multi-page (per page)
// ============================================================================

async function renderPdfPagesToImages(base64: string): Promise<Array<{
  pageIndex: number
  pageNumber: number
  width: number
  height: number
  imageDataUrl: string
  imageBase64: string
}>> {
  // Dynamic import for server-side PDF rendering (use legacy build for Node.js)
  const pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs")
  // Use @napi-rs/canvas which has better compatibility with pdfjs-dist
  const canvasModule = await import("@napi-rs/canvas")
  const { createCanvas } = canvasModule
  // pdfjs-dist v5 requires Uint8Array, not Buffer
  const buffer = Buffer.from(base64, "base64")
  const data = new Uint8Array(buffer)

  const pdfjsLib = (pdfjsModule as any).default ?? pdfjsModule

  // Create a custom canvas factory for node-canvas compatibility
  class NodeCanvasFactory {
    create(width: number, height: number) {
      const canvas = createCanvas(width, height)
      const context = canvas.getContext("2d")
      return { canvas, context }
    }
    reset(canvasAndContext: any, width: number, height: number) {
      canvasAndContext.canvas.width = width
      canvasAndContext.canvas.height = height
    }
    destroy(canvasAndContext: any) {
      canvasAndContext.canvas.width = 0
      canvasAndContext.canvas.height = 0
      canvasAndContext.canvas = null
      canvasAndContext.context = null
    }
  }

  console.log(`[document-extraction] Loading PDF document...`)

  const loadingTask = pdfjsLib.getDocument({
    data,
    disableWorker: true, // Disable worker for Node.js environment
    isEvalSupported: false,
    useSystemFonts: true,
    canvasFactory: new NodeCanvasFactory(),
  })
  const pdf = await loadingTask.promise

  console.log(`[document-extraction] PDF loaded, ${pdf.numPages} pages`)

  const pages: Array<{
    pageIndex: number
    pageNumber: number
    width: number
    height: number
    imageDataUrl: string
    imageBase64: string
  }> = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    console.log(`[document-extraction] Rendering PDF page ${pageNumber}/${pdf.numPages}...`)
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE })
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error(`Failed to get 2D context for PDF page ${pageNumber}`)
    }

    await page.render({ canvasContext: context as any, viewport }).promise

    // @napi-rs/canvas uses encode() which returns a Promise
    const imageBuffer = await canvas.encode("png")
    const imageBase64 = Buffer.from(imageBuffer).toString("base64")
    pages.push({
      pageIndex: pageNumber - 1,
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      imageDataUrl: `data:image/png;base64,${imageBase64}`,
      imageBase64,
    })
    console.log(`[document-extraction] PDF page ${pageNumber} rendered (${Math.round(imageBase64.length * 0.75 / 1024)}KB)`)
  }

  if (typeof pdf.cleanup === "function") pdf.cleanup()
  if (typeof pdf.destroy === "function") pdf.destroy()

  return pages
}

async function extractPDFWithDotsOcr(
  base64: string,
  fileName: string
): Promise<MultiPageLayoutData> {
  console.log(`[document-extraction] Using dots.ocr for PDF extraction (per page)`)

  const pageImages = await renderPdfPagesToImages(base64)
  console.log(`[document-extraction] Rendered ${pageImages.length} PDF pages to images`)

  const pages: PageData[] = []
  let globalBlockIndex = 0
  const markdownParts: string[] = []

  for (const pageImage of pageImages) {
    const pageFileName = `${fileName.replace(/\.pdf$/i, "")}-page-${pageImage.pageNumber}.png`
    let pageImageBase64 = pageImage.imageBase64
    let pageImageMimeType = "image/png"
    let pageImageDataUrl = pageImage.imageDataUrl
    let pageWidth = pageImage.width
    let pageHeight = pageImage.height

    let dotsOcrOutput = await callDotsOcr(
      { image: pageImageBase64, file_name: pageFileName, mime_type: pageImageMimeType },
      { timeout: 600_000 }
    )

    if (isLowOcrQuality(dotsOcrOutput)) {
      console.log(`[document-extraction] Low OCR quality detected on page ${pageImage.pageNumber}, upscaling with Real-ESRGAN`)
      try {
        const upscaled = await callRealEsrgan(
          { image: pageImageBase64, mime_type: pageImageMimeType, scale: OCR_UPSCALE_SCALE },
          { timeout: 600_000 }
        )
        const upscaledImage = await fetchImageAsBase64(upscaled.imageUrl)
        pageImageBase64 = upscaledImage.base64
        pageImageMimeType = upscaledImage.mimeType
        pageImageDataUrl = `data:${pageImageMimeType};base64,${pageImageBase64}`
        pageWidth = Math.round(pageWidth * OCR_UPSCALE_SCALE)
        pageHeight = Math.round(pageHeight * OCR_UPSCALE_SCALE)

        dotsOcrOutput = await callDotsOcr(
          { image: pageImageBase64, file_name: pageFileName, mime_type: pageImageMimeType },
          { timeout: 600_000 }
        )
      } catch (error) {
        console.warn(`[document-extraction] Real-ESRGAN upscale failed for page ${pageImage.pageNumber}, using original OCR output:`, error)
      }
    }

    console.log(`[document-extraction] dots.ocr page ${pageImage.pageNumber} response:`, {
      hasBlocks: !!dotsOcrOutput.blocks,
      blocksCount: dotsOcrOutput.blocks?.length || 0,
      hasMarkdown: !!dotsOcrOutput.markdown,
    })

    const blocks = dotsOcrOutput.blocks || []
    if (dotsOcrOutput.markdown) {
      markdownParts.push(`## Page ${pageImage.pageNumber}\n\n${dotsOcrOutput.markdown}`)
    }

    pages.push({
      pageIndex: pageImage.pageIndex,
      pageNumber: pageImage.pageNumber,
      width: pageWidth,
      height: pageHeight,
      imageDataUrl: pageImageDataUrl,
      blocks: blocks.map((block: any, i: number) => ({
        blockIndex: i,
        globalBlockIndex: globalBlockIndex + i,
        type: block.type || block.category || "TEXT",
        content: block.content || block.text || "",
        text: block.content || block.text || "",
        bbox: block.bbox || [0, 0, 0, 0],
        originalBbox: block.originalBbox,
        category: block.category,
      })),
    })

    globalBlockIndex += blocks.length
  }

  return {
    pages,
    totalPages: pages.length,
    totalBlocks: globalBlockIndex,
    markdown: markdownParts.length > 0 ? markdownParts.join("\n\n---\n\n") : undefined,
  }
}

// ============================================================================
// Full image extraction (fallback when no blocks found)
// ============================================================================

async function extractFullImage(imageDataUrl: string): Promise<string> {
  const prompt = `Extract all text content from this document image.
Return only the extracted text, preserving the structure and layout as much as possible.
Format the output appropriately (use headers for titles, bullet points for lists, etc.).
No explanations or metadata - just the extracted text.`

  const result = await generateText({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    temperature: 0.1,
    model: GEMINI_MODEL,
  })

  return result.text.trim()
}

// ============================================================================
// Main extraction function
// ============================================================================

export async function extractDocumentFile({ fileId, userId, supabase }: ExtractFileParams) {
  console.log(`[document-extraction] Starting extraction for file ${fileId}`)

  // Get file record
  const { data: fileRecord, error: fetchError } = await supabase
    .from("document_extraction_files")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .single()

  if (fetchError || !fileRecord) {
    throw new Error("File not found")
  }

  if (fileRecord.extraction_status === "processing") {
    console.log(`[document-extraction] Extraction already in progress for ${fileId}`)
    return { message: "Extraction already in progress" }
  }

  // Update status to processing
  await supabase
    .from("document_extraction_files")
    .update({
      extraction_status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", fileId)

  try {
    // Download file from storage
    const fileUrl = fileRecord.file_url
    if (!fileUrl) {
      throw new Error("File URL not found")
    }

    console.log(`[document-extraction] Downloading file from ${fileUrl}`)
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`)
    }

    const arrayBuffer = await fileResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const mimeType = fileRecord.mime_type || "image/png"
    const fileName = fileRecord.name || "document"

    console.log(`[document-extraction] File downloaded, size: ${Math.round(base64.length * 0.75 / 1024)}KB, type: ${mimeType}`)

    // Step 1: Layout detection (route based on file type)
    console.log(`[document-extraction] Step 1: Layout detection`)

    let layoutData: MultiPageLayoutData

    if (isPDFFile(mimeType, fileName)) {
      console.log(`[document-extraction] Detected PDF file, using dots.ocr per page`)
      layoutData = await extractPDFWithDotsOcr(base64, fileName)
    } else {
      console.log(`[document-extraction] Detected image file, using dots.ocr`)
      layoutData = await extractImageWithDotsOcr(base64, mimeType, fileName)
    }

    console.log(`[document-extraction] Layout detection complete:`, {
      totalPages: layoutData.totalPages,
      totalBlocks: layoutData.totalBlocks,
    })

    // Step 2: Extract text from blocks using Gemini (parallel)
    console.log(`[document-extraction] Step 2: Extracting text from blocks using Gemini 2.5 Pro (parallel)`)

    const extractedTextData: MultiPageExtractedText = {
      pages: [],
      totalBlocks: 0,
    }

    // Check if we have any blocks
    const allBlocks = layoutData.pages.flatMap(p => p.blocks)

    if (allBlocks.length === 0) {
      // No blocks found - extract from full image/first page
      console.log(`[document-extraction] No blocks found, extracting from full document`)

      const firstPageImageUrl = layoutData.pages[0]?.imageDataUrl || `data:${mimeType};base64,${base64}`
      const fullText = await extractFullImage(firstPageImageUrl)

      // Add as single block
      layoutData.pages[0].blocks.push({
        blockIndex: 0,
        globalBlockIndex: 0,
        type: "TEXT",
        content: fullText,
        text: fullText,
        bbox: [0, 0, 0, 0],
        extractedText: fullText,
      })

      extractedTextData.pages.push({
        pageIndex: 0,
        pageNumber: 1,
        blocks: [{
          blockIndex: 0,
          globalBlockIndex: 0,
          type: "TEXT",
          text: fullText,
        }],
      })
      extractedTextData.totalBlocks = 1
    } else {
      // Prepare tasks for all blocks across all pages
      const tasks: BlockExtractionTask[] = []
      const invalidResults: BlockExtractionResult[] = []

      for (const page of layoutData.pages) {
        for (const block of page.blocks) {
          const [, , width, height] = block.bbox
          const ocrText = block.content || block.text || ""

          if (width <= 0 || height <= 0) {
            // Invalid bbox - use OCR text directly
            console.log(`[document-extraction] Block ${block.globalBlockIndex} (page ${page.pageIndex}) has no valid bbox, using OCR text`)
            invalidResults.push({
              blockIndex: block.blockIndex,
              globalBlockIndex: block.globalBlockIndex,
              pageIndex: page.pageIndex,
              type: block.type || "TEXT",
              text: ocrText,
              ocrText,
              bbox: block.bbox,
            })
            block.extractedText = ocrText
          } else {
            tasks.push({
              index: block.globalBlockIndex,
              pageIndex: page.pageIndex,
              blockIndex: block.blockIndex,
              block,
              ocrText,
              bbox: block.bbox,
              imageDataUrl: page.imageDataUrl || `data:${mimeType};base64,${base64}`,
            })
          }
        }
      }

      // Process valid blocks in parallel
      let allResults: BlockExtractionResult[] = [...invalidResults]

      if (tasks.length > 0) {
        const parallelResults = await extractBlocksInParallel(tasks)

        // Update layout blocks with extracted text
        for (const result of parallelResults) {
          const page = layoutData.pages.find(p => p.pageIndex === result.pageIndex)
          if (page) {
            const block = page.blocks.find(b => b.blockIndex === result.blockIndex)
            if (block) {
              block.extractedText = result.text
            }
          }
        }

        allResults = [...allResults, ...parallelResults]
      }

      // Sort by global block index
      allResults.sort((a, b) => a.globalBlockIndex - b.globalBlockIndex)

      // Group results by page
      const pageResultsMap = new Map<number, BlockExtractionResult[]>()
      for (const result of allResults) {
        if (!pageResultsMap.has(result.pageIndex)) {
          pageResultsMap.set(result.pageIndex, [])
        }
        pageResultsMap.get(result.pageIndex)!.push(result)
      }

      // Build extracted text data structure
      for (const page of layoutData.pages) {
        const pageResults = pageResultsMap.get(page.pageIndex) || []
        extractedTextData.pages.push({
          pageIndex: page.pageIndex,
          pageNumber: page.pageNumber,
          blocks: pageResults.map(r => ({
            blockIndex: r.blockIndex,
            globalBlockIndex: r.globalBlockIndex,
            type: r.type,
            text: r.text,
            ocrText: r.ocrText,
            bbox: r.bbox,
            error: r.error,
          })),
        })
      }
      extractedTextData.totalBlocks = allResults.length

      // Log any errors
      const errors = allResults.filter(r => r.error)
      if (errors.length > 0) {
        console.warn(`[document-extraction] ${errors.length} blocks had extraction errors (used OCR fallback)`)
      }
    }

    console.log(`[document-extraction] Extraction complete, updating database`)

    // Prepare layout data for storage (include imageDataUrl for PDF pages to enable bounding box overlays)
    const layoutDataForStorage = {
      pages: layoutData.pages.map(page => ({
        pageIndex: page.pageIndex,
        pageNumber: page.pageNumber,
        width: page.width,
        height: page.height,
        imageDataUrl: page.imageDataUrl, // Include for PDF pages to render with bounding boxes
        blocks: page.blocks.map(block => ({
          blockIndex: block.blockIndex,
          globalBlockIndex: block.globalBlockIndex,
          type: block.type,
          content: block.content,
          text: block.text,
          bbox: block.bbox,
          originalBbox: block.originalBbox,
          category: block.category,
          extractedText: block.extractedText,
        })),
      })),
      totalPages: layoutData.totalPages,
      totalBlocks: layoutData.totalBlocks,
      markdown: layoutData.markdown,
    }

    // Update file record with results
    const { error: updateError } = await supabase
      .from("document_extraction_files")
      .update({
        extraction_status: "completed",
        layout_data: layoutDataForStorage,
        extracted_text: extractedTextData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    if (updateError) {
      throw updateError
    }

    console.log(`[document-extraction] ✅ Extraction completed successfully for ${fileId}`)
    console.log(`[document-extraction] Pages: ${layoutData.totalPages}, Blocks: ${layoutData.totalBlocks}`)

    return {
      success: true,
      file_id: fileId,
      pages: layoutData.totalPages,
      blocks: layoutData.totalBlocks,
    }
  } catch (extractionError) {
    console.error("[document-extraction] Extraction error:", extractionError)

    // Update status to error
    await supabase
      .from("document_extraction_files")
      .update({
        extraction_status: "error",
        error_message: extractionError instanceof Error ? extractionError.message : String(extractionError),
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    throw extractionError
  }
}
