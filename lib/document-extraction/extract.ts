/**
 * Shared extraction logic for document extraction
 * Supports both single images and multi-page PDFs via dots.ocr (Real-ESRGAN upscaling on low-quality OCR)
 * Uses Gemini 2.5 Pro for text extraction from each block (parallel processing)
 */

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { callDotsOcr, callRealEsrgan } from "@/lib/replicate"
import { callDatalabChandra, extractLayoutBlocks as extractDatalabBlocks } from "@/lib/datalab"
import { generateText } from "@/lib/openrouter"

interface ExtractFileParams {
  fileId: string
  userId: string
  supabase: ReturnType<typeof createSupabaseServerClient>
  extractionMethod?: string
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

Please extract the text content from this region and format it using Markdown syntax:
- Use **bold** for emphasized or important text
- Use headers (# ## ###) for titles and section headers
- Use bullet points (-) or numbered lists where appropriate
- Use tables (| col1 | col2 |) for tabular data
- Preserve the structure and hierarchy of the content

If the OCR text looks correct, you can use it as a base. If you see errors or can extract it more accurately, provide the corrected text.

Return ONLY the markdown-formatted text, nothing else. No explanations or meta-commentary.`

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

  // CRITICAL: Disable worker by setting workerSrc to empty string BEFORE getDocument()
  // This prevents pdfjs-dist from trying to load the worker file in serverless environments
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = ""
  }

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
// Image extraction (datalab) - Single page
// ============================================================================

async function extractImageWithDatalab(
  base64: string,
  mimeType: string,
  fileName: string
): Promise<MultiPageLayoutData> {
  console.log(`[document-extraction] Using Datalab Marker for single image extraction`)
  
  const datalabOutput = await callDatalabChandra(
    { 
      file: base64, 
      file_name: fileName, 
      mime_type: mimeType,
      output_format: 'json',
      mode: 'accurate'
    },
    { timeout: 240_000 }
  )

  console.log(`[document-extraction] Datalab Marker response:`, {
    hasJson: !!datalabOutput.json,
    hasBlocks: !!datalabOutput.blocks,
    hasPages: !!datalabOutput.pages,
  })

  const extractedBlocks = extractDatalabBlocks(datalabOutput)
  console.log(`[document-extraction] Extracted ${extractedBlocks.length} blocks with types`)
  if (extractedBlocks.length > 0) {
    console.log(`[document-extraction] Sample block 0:`, {
      type: extractedBlocks[0].type,
      bbox: extractedBlocks[0].bbox,
      polygon: extractedBlocks[0].polygon,
      hasContent: !!extractedBlocks[0].content,
    })
  }

  // Get image dimensions from metadata or infer from block extents
  let pageWidth = 1536 // Default fallback
  let pageHeight = 2193 // Default fallback

  if (datalabOutput.metadata?.page_stats && datalabOutput.metadata.page_stats.length > 0) {
    const pageStats = datalabOutput.metadata.page_stats[0]
    pageWidth = pageStats.width || pageWidth
    pageHeight = pageStats.height || pageHeight
    console.log(`[document-extraction] Page dimensions from metadata:`, { width: pageWidth, height: pageHeight })
  } else if (extractedBlocks.length > 0) {
    // Infer page dimensions from the maximum extent of all blocks
    let maxX = 0, maxY = 0
    extractedBlocks.forEach((block: any) => {
      if (block.originalBbox && block.originalBbox.length === 4) {
        // originalBbox is [x1, y1, x2, y2]
        maxX = Math.max(maxX, block.originalBbox[2])
        maxY = Math.max(maxY, block.originalBbox[3])
      } else if (block.bbox && block.bbox.length === 4) {
        // bbox is [x, y, width, height]
        maxX = Math.max(maxX, block.bbox[0] + block.bbox[2])
        maxY = Math.max(maxY, block.bbox[1] + block.bbox[3])
      }
    })
    if (maxX > 0 && maxY > 0) {
      pageWidth = maxX
      pageHeight = maxY
      console.log(`[document-extraction] Page dimensions inferred from block extents:`, { width: pageWidth, height: pageHeight })
    }
  }

  const pageData: PageData = {
    pageIndex: 0,
    pageNumber: 1,
    width: pageWidth,
    height: pageHeight,
    imageDataUrl: `data:${mimeType};base64,${base64}`,
    blocks: extractedBlocks.map((block: any, i: number) => ({
      blockIndex: i,
      globalBlockIndex: i,
      type: block.type || "TEXT",
      content: block.content || "",
      text: block.content || "",
      bbox: block.bbox || [0, 0, 0, 0],
      // Use originalBbox from Datalab if available (already in [x1, y1, x2, y2] format)
      // Otherwise calculate from bbox [x, y, width, height]
      originalBbox: block.originalBbox || (block.bbox ? [block.bbox[0], block.bbox[1], block.bbox[0] + block.bbox[2], block.bbox[1] + block.bbox[3]] : undefined),
      polygon: block.polygon,
      category: block.type,
    })),
  }

  return {
    pages: [pageData],
    totalPages: 1,
    totalBlocks: extractedBlocks.length,
  }
}

// ============================================================================
// PDF extraction (datalab) - Multi-page
// ============================================================================

async function extractPDFWithDatalab(
  base64: string,
  fileName: string
): Promise<MultiPageLayoutData> {
  console.log(`[document-extraction] Using Datalab Marker for PDF extraction`)

  const datalabOutput = await callDatalabChandra(
    { 
      file: base64, 
      file_name: fileName, 
      mime_type: "application/pdf",
      output_format: 'json',
      mode: 'accurate'
    },
    { timeout: 240_000 }
  )

  console.log(`[document-extraction] Datalab Marker response:`, {
    hasJson: !!datalabOutput.json,
    hasBlocks: !!datalabOutput.blocks,
    hasPages: !!datalabOutput.pages,
  })

  const extractedBlocks = extractDatalabBlocks(datalabOutput)
  console.log(`[document-extraction] Extracted ${extractedBlocks.length} blocks with types`)
  if (extractedBlocks.length > 0) {
    console.log(`[document-extraction] Sample block 0:`, {
      type: extractedBlocks[0].type,
      bbox: extractedBlocks[0].bbox,
      polygon: extractedBlocks[0].polygon,
      pageIndex: extractedBlocks[0].pageIndex,
      hasContent: !!extractedBlocks[0].content,
    })
  }

  // Get page dimensions from Datalab metadata if available
  const pageDimensions = new Map<number, { width: number; height: number }>()
  if (datalabOutput.metadata?.page_stats && Array.isArray(datalabOutput.metadata.page_stats)) {
    datalabOutput.metadata.page_stats.forEach((stats: any, idx: number) => {
      if (stats.width && stats.height) {
        pageDimensions.set(idx, { width: stats.width, height: stats.height })
        console.log(`[document-extraction] Page ${idx} dimensions from metadata:`, stats.width, 'x', stats.height)
      }
    })
  }

  // Render PDF pages for visualization
  console.log(`[document-extraction] Rendering PDF pages for visualization...`)
  const pageImages = await renderPdfPagesToImages(base64)
  console.log(`[document-extraction] Rendered ${pageImages.length} PDF pages`)

  // Group blocks by page if available
  const blocksByPage = new Map<number, any[]>()
  
  extractedBlocks.forEach((block: any) => {
    const pageIndex = block.pageIndex ?? 0
    if (!blocksByPage.has(pageIndex)) {
      blocksByPage.set(pageIndex, [])
    }
    blocksByPage.get(pageIndex)!.push(block)
  })

  let globalBlockIndex = 0
  const pages: PageData[] = pageImages.map((pageImage, idx) => {
    const pageBlocks = blocksByPage.get(idx) || []
    
    // Use dimensions from Datalab metadata if available, otherwise use rendered page dimensions
    const dimensions = pageDimensions.get(idx) || { width: pageImage.width, height: pageImage.height }
    
    const page: PageData = {
      pageIndex: pageImage.pageIndex,
      pageNumber: pageImage.pageNumber,
      width: dimensions.width,
      height: dimensions.height,
      imageDataUrl: pageImage.imageDataUrl,
      blocks: pageBlocks.map((block: any, i: number) => ({
        blockIndex: i,
        globalBlockIndex: globalBlockIndex + i,
        type: block.type || "TEXT",
        content: block.content || "",
        text: block.content || "",
        bbox: block.bbox || [0, 0, 0, 0],
        // Use originalBbox from Datalab if available (already in [x1, y1, x2, y2] format)
        // Otherwise calculate from bbox [x, y, width, height]
        originalBbox: block.originalBbox || (block.bbox ? [block.bbox[0], block.bbox[1], block.bbox[0] + block.bbox[2], block.bbox[1] + block.bbox[3]] : undefined),
        polygon: block.polygon,
        category: block.type,
      })),
    }

    globalBlockIndex += pageBlocks.length
    return page
  })

  return {
    pages,
    totalPages: pages.length,
    totalBlocks: globalBlockIndex,
  }
}

// ============================================================================
// Full image extraction (fallback when no blocks found)
// ============================================================================

async function extractFullImage(imageDataUrl: string): Promise<string> {
  const prompt = `Extract all text content from this document image and format it using Markdown syntax.

Formatting guidelines:
- Use **bold** for emphasized or important text
- Use headers (# ## ###) for titles and section headers
- Use bullet points (-) or numbered lists where appropriate
- Use tables (| col1 | col2 |) for tabular data
- Use > blockquotes for quoted text or notes
- Preserve the structure, hierarchy and layout of the original document

Return ONLY the markdown-formatted text. No explanations, meta-commentary, or descriptions of the image.`

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
// Gemini fallback extraction (when primary method fails)
// ============================================================================

async function extractWithGeminiFallback(
  base64: string,
  mimeType: string,
  fileName: string
): Promise<MultiPageLayoutData> {
  console.log(`[document-extraction] Using Gemini fallback for full document OCR`)

  const isPdf = isPDFFile(mimeType, fileName)

  if (isPdf) {
    // For PDFs, render pages and extract from each
    console.log(`[document-extraction] Rendering PDF pages for Gemini fallback...`)
    const pageImages = await renderPdfPagesToImages(base64)
    console.log(`[document-extraction] Processing ${pageImages.length} pages with Gemini...`)

    const pages: PageData[] = []
    let globalBlockIndex = 0

    for (const pageImage of pageImages) {
      console.log(`[document-extraction] Extracting text from page ${pageImage.pageNumber} with Gemini...`)
      const extractedText = await extractFullImage(pageImage.imageDataUrl)

      pages.push({
        pageIndex: pageImage.pageIndex,
        pageNumber: pageImage.pageNumber,
        width: pageImage.width,
        height: pageImage.height,
        imageDataUrl: pageImage.imageDataUrl,
        blocks: [{
          blockIndex: 0,
          globalBlockIndex: globalBlockIndex,
          type: "TEXT",
          content: extractedText,
          text: extractedText,
          bbox: [0, 0, pageImage.width || 0, pageImage.height || 0],
          extractedText: extractedText,
        }],
      })
      globalBlockIndex++
    }

    return {
      pages,
      totalPages: pages.length,
      totalBlocks: globalBlockIndex,
      markdown: pages.map(p => p.blocks[0]?.content || '').join('\n\n---\n\n'),
    }
  } else {
    // For images, extract directly
    const imageDataUrl = `data:${mimeType};base64,${base64}`
    console.log(`[document-extraction] Extracting text from image with Gemini...`)
    const extractedText = await extractFullImage(imageDataUrl)

    return {
      pages: [{
        pageIndex: 0,
        pageNumber: 1,
        imageDataUrl,
        blocks: [{
          blockIndex: 0,
          globalBlockIndex: 0,
          type: "TEXT",
          content: extractedText,
          text: extractedText,
          bbox: [0, 0, 0, 0],
          extractedText: extractedText,
        }],
      }],
      totalPages: 1,
      totalBlocks: 1,
      markdown: extractedText,
    }
  }
}

// ============================================================================
// Gemini Full-Text Extraction (runs independently)
// ============================================================================

async function runGeminiFullTextExtraction(
  fileId: string,
  base64: string,
  mimeType: string,
  fileName: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<{ success: boolean; text?: string; error?: string }> {
  console.log(`[document-extraction] Starting Gemini full-text extraction for ${fileId}`)

  // Update Gemini status to processing
  const { error: statusError } = await supabase
    .from("document_extraction_files")
    .update({
      gemini_extraction_status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", fileId)

  if (statusError) {
    console.error(`[document-extraction] Failed to update Gemini status to processing:`, statusError)
    // Continue anyway - the extraction might still work
  }

  try {
    const isPdf = isPDFFile(mimeType, fileName)
    let fullText: string

    if (isPdf) {
      // For PDFs, render pages and extract from each
      console.log(`[document-extraction] Rendering PDF pages for Gemini full-text...`)
      const pageImages = await renderPdfPagesToImages(base64)
      console.log(`[document-extraction] Extracting text from ${pageImages.length} pages with Gemini...`)

      const pageTexts: string[] = []
      for (const pageImage of pageImages) {
        const pageText = await extractFullImage(pageImage.imageDataUrl)
        pageTexts.push(`## Page ${pageImage.pageNumber}\n\n${pageText}`)
      }
      fullText = pageTexts.join('\n\n---\n\n')
    } else {
      // For images, extract directly
      const imageDataUrl = `data:${mimeType};base64,${base64}`
      console.log(`[document-extraction] Extracting text from image with Gemini...`)
      fullText = await extractFullImage(imageDataUrl)
    }

    // Update database with results
    const { error: updateError } = await supabase
      .from("document_extraction_files")
      .update({
        gemini_full_text: fullText,
        gemini_extraction_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    if (updateError) {
      console.error(`[document-extraction] Failed to save Gemini results to database:`, updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log(`[document-extraction] ✅ Gemini full-text extraction completed for ${fileId}`)
    return { success: true, text: fullText }
  } catch (error: any) {
    console.error(`[document-extraction] Gemini full-text extraction failed:`, error)

    await supabase
      .from("document_extraction_files")
      .update({
        gemini_extraction_status: "error",
        gemini_error_message: error.message || String(error),
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    return { success: false, error: error.message || String(error) }
  }
}

// ============================================================================
// Layout-based Extraction (runs independently)
// ============================================================================

async function runLayoutExtraction(
  fileId: string,
  base64: string,
  mimeType: string,
  fileName: string,
  extractionMethod: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<{ success: boolean; layoutData?: any; extractedTextData?: any; error?: string }> {
  console.log(`[document-extraction] Starting layout extraction for ${fileId} using method: ${extractionMethod}`)

  // Update layout status to processing
  const { error: statusError } = await supabase
    .from("document_extraction_files")
    .update({
      layout_extraction_status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", fileId)

  if (statusError) {
    console.error(`[document-extraction] Failed to update layout status to processing:`, statusError)
    // Continue anyway - the extraction might still work
  }

  try {
    // Step 1: Layout detection
    let layoutData: MultiPageLayoutData
    let usedFallback = false

    try {
      if (extractionMethod === 'datalab') {
        if (isPDFFile(mimeType, fileName)) {
          console.log(`[document-extraction] Detected PDF file, using Datalab Marker`)
          layoutData = await extractPDFWithDatalab(base64, fileName)
        } else {
          console.log(`[document-extraction] Detected image file, using Datalab Marker`)
          layoutData = await extractImageWithDatalab(base64, mimeType, fileName)
        }
      } else {
        if (isPDFFile(mimeType, fileName)) {
          console.log(`[document-extraction] Detected PDF file, using dots.ocr per page`)
          layoutData = await extractPDFWithDotsOcr(base64, fileName)
        } else {
          console.log(`[document-extraction] Detected image file, using dots.ocr`)
          layoutData = await extractImageWithDotsOcr(base64, mimeType, fileName)
        }
      }
    } catch (layoutError: any) {
      console.error(`[document-extraction] Layout detection failed: ${layoutError.message}`)
      console.log(`[document-extraction] Falling back to Gemini for layout extraction...`)
      layoutData = await extractWithGeminiFallback(base64, mimeType, fileName)
      usedFallback = true
    }

    console.log(`[document-extraction] Layout detection complete:`, {
      totalPages: layoutData.totalPages,
      totalBlocks: layoutData.totalBlocks,
      usedFallback,
    })

    // Step 2: Extract text from blocks
    const extractedTextData: MultiPageExtractedText = {
      pages: [],
      totalBlocks: 0,
    }

    const allBlocks = layoutData.pages.flatMap(p => p.blocks)

    if (usedFallback) {
      // Fallback was used - text already extracted
      console.log(`[document-extraction] Skipping block extraction (fallback already extracted text)`)
      for (const page of layoutData.pages) {
        extractedTextData.pages.push({
          pageIndex: page.pageIndex,
          pageNumber: page.pageNumber,
          blocks: page.blocks.map(block => ({
            blockIndex: block.blockIndex,
            globalBlockIndex: block.globalBlockIndex,
            type: block.type || "TEXT",
            text: block.extractedText || block.content || block.text || "",
            ocrText: block.content || block.text || "",
            bbox: block.bbox,
          })),
        })
      }
      extractedTextData.totalBlocks = allBlocks.length
    } else if (allBlocks.length === 0) {
      // No blocks found - extract from full image
      console.log(`[document-extraction] No blocks found, extracting from full document`)
      const firstPageImageUrl = layoutData.pages[0]?.imageDataUrl || `data:${mimeType};base64,${base64}`
      const fullText = await extractFullImage(firstPageImageUrl)

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
      // Extract text from each block
      console.log(`[document-extraction] Extracting text from ${allBlocks.length} blocks using Gemini...`)

      const tasks: BlockExtractionTask[] = []
      const invalidResults: BlockExtractionResult[] = []

      for (const page of layoutData.pages) {
        for (const block of page.blocks) {
          const [, , width, height] = block.bbox
          const ocrText = block.content || block.text || ""

          if (width <= 0 || height <= 0) {
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

      let allResults: BlockExtractionResult[] = [...invalidResults]

      if (tasks.length > 0) {
        const parallelResults = await extractBlocksInParallel(tasks)
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

      allResults.sort((a, b) => a.globalBlockIndex - b.globalBlockIndex)

      const pageResultsMap = new Map<number, BlockExtractionResult[]>()
      for (const result of allResults) {
        if (!pageResultsMap.has(result.pageIndex)) {
          pageResultsMap.set(result.pageIndex, [])
        }
        pageResultsMap.get(result.pageIndex)!.push(result)
      }

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
    }

    // Prepare layout data for storage
    const layoutDataForStorage = {
      pages: layoutData.pages.map(page => ({
        pageIndex: page.pageIndex,
        pageNumber: page.pageNumber,
        width: page.width,
        height: page.height,
        imageDataUrl: page.imageDataUrl,
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

    // Update database with results
    const { error: updateError } = await supabase
      .from("document_extraction_files")
      .update({
        layout_data: layoutDataForStorage,
        extracted_text: extractedTextData,
        layout_extraction_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    if (updateError) {
      console.error(`[document-extraction] Failed to save layout results to database:`, updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log(`[document-extraction] ✅ Layout extraction completed for ${fileId}`)
    console.log(`[document-extraction] Pages: ${layoutData.totalPages}, Blocks: ${layoutData.totalBlocks}`)

    return { success: true, layoutData: layoutDataForStorage, extractedTextData }
  } catch (error: any) {
    console.error(`[document-extraction] Layout extraction failed:`, error)

    await supabase
      .from("document_extraction_files")
      .update({
        layout_extraction_status: "error",
        layout_error_message: error.message || String(error),
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    return { success: false, error: error.message || String(error) }
  }
}

// ============================================================================
// Main extraction function (runs both methods in parallel)
// ============================================================================

export async function extractDocumentFile({ fileId, userId, supabase, extractionMethod = "datalab" }: ExtractFileParams) {
  console.log(`[document-extraction] Starting dual extraction for file ${fileId}`)

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

  // Check if already processing
  if (fileRecord.extraction_status === "processing") {
    console.log(`[document-extraction] Extraction already in progress for ${fileId}`)
    return { message: "Extraction already in progress" }
  }

  // Update overall status to processing
  await supabase
    .from("document_extraction_files")
    .update({
      extraction_status: "processing",
      gemini_extraction_status: "pending",
      layout_extraction_status: "pending",
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

    // Run both extraction methods in parallel
    console.log(`[document-extraction] Starting parallel extraction (Gemini full-text + Layout blocks)`)

    const [geminiResult, layoutResult] = await Promise.allSettled([
      runGeminiFullTextExtraction(fileId, base64, mimeType, fileName, supabase),
      runLayoutExtraction(fileId, base64, mimeType, fileName, extractionMethod, supabase),
    ])

    // Determine overall status based on results
    const geminiSuccess = geminiResult.status === 'fulfilled' && geminiResult.value.success
    const layoutSuccess = layoutResult.status === 'fulfilled' && layoutResult.value.success

    let overallStatus: string
    let errorMessage: string | null = null

    if (geminiSuccess && layoutSuccess) {
      overallStatus = "completed"
    } else if (geminiSuccess || layoutSuccess) {
      // At least one succeeded
      overallStatus = "completed"
    } else {
      // Both failed
      overallStatus = "error"
      const geminiError = geminiResult.status === 'rejected'
        ? geminiResult.reason?.message
        : (geminiResult.value as any)?.error
      const layoutError = layoutResult.status === 'rejected'
        ? layoutResult.reason?.message
        : (layoutResult.value as any)?.error
      errorMessage = `Gemini: ${geminiError || 'unknown'}; Layout: ${layoutError || 'unknown'}`
    }

    // Update overall status
    await supabase
      .from("document_extraction_files")
      .update({
        extraction_status: overallStatus,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    console.log(`[document-extraction] ✅ Dual extraction completed for ${fileId}`)
    console.log(`[document-extraction] Gemini: ${geminiSuccess ? 'success' : 'failed'}, Layout: ${layoutSuccess ? 'success' : 'failed'}`)

    return {
      success: overallStatus === "completed",
      file_id: fileId,
      gemini_success: geminiSuccess,
      layout_success: layoutSuccess,
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
