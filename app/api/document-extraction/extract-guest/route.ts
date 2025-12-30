import { type NextRequest, NextResponse } from "next/server"
import { callDotsOcr, extractLayoutBlocks } from "@/lib/replicate"
import { callDatalabChandra, extractLayoutBlocks as extractDatalabBlocks } from "@/lib/datalab"
import { generateText } from "@/lib/openrouter"

// Set timeout for extraction (4 minutes)
export const runtime = 'nodejs'
export const maxDuration = 240 // 4 minutes in seconds

// Concurrency configuration for parallel text extraction
const INITIAL_CONCURRENCY = 5
const MIN_CONCURRENCY = 2
const MAX_CONCURRENCY = 10
const MAX_RETRIES = 3
const BASE_BACKOFF_MS = 1000

// Gemini model for text extraction
const GEMINI_MODEL = "google/gemini-2.5-pro-preview"

// ============================================================================
// Types for dual extraction results
// ============================================================================

interface GeminiFullTextResult {
  success: boolean
  fullText?: string
  error?: string
}

interface LayoutExtractionResult {
  success: boolean
  layout_data?: any
  extracted_text?: any
  error?: string
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
    }
  }

  onRateLimit(): void {
    this.consecutiveFailures++
    this.consecutiveSuccesses = 0
    if (this.currentConcurrency > MIN_CONCURRENCY) {
      this.currentConcurrency = Math.max(MIN_CONCURRENCY, Math.floor(this.currentConcurrency * 0.6))
    }
  }

  onError(): void {
    this.consecutiveFailures++
    this.consecutiveSuccesses = 0
  }
}

interface BlockExtractionTask {
  index: number
  block: any
  ocrText: string
  bbox: [number, number, number, number]
  imageDataUrl: string
}

interface BlockExtractionResult {
  blockIndex: number
  type: string
  text: string
  ocrText?: string
  bbox?: [number, number, number, number]
  originalBbox?: [number, number, number, number]
  error?: string
}

async function extractBlockText(
  task: BlockExtractionTask,
  controller: ConcurrencyController,
  retryCount: number = 0
): Promise<BlockExtractionResult> {
  const { index, block, ocrText, bbox, imageDataUrl } = task
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
      blockIndex: index,
      type: block.type || block.category || "TEXT",
      text: result.text.trim(),
      ocrText,
      bbox,
      originalBbox: block.originalBbox,
    }
  } catch (error: any) {
    if (isRateLimitError(error)) {
      controller.onRateLimit()
      if (retryCount < MAX_RETRIES) {
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, retryCount)
        await sleep(backoffMs)
        return extractBlockText(task, controller, retryCount + 1)
      }
    } else {
      controller.onError()
      if (retryCount < MAX_RETRIES) {
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, retryCount)
        await sleep(backoffMs)
        return extractBlockText(task, controller, retryCount + 1)
      }
    }

    return {
      blockIndex: index,
      type: block.type || block.category || "TEXT",
      text: ocrText || "",
      ocrText,
      bbox,
      originalBbox: block.originalBbox,
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

  console.log(`[extraction] Starting parallel extraction of ${tasks.length} blocks`)

  while (pending.length > 0 || inFlight.length > 0) {
    while (pending.length > 0 && inFlight.length < controller.concurrency) {
      const task = pending.shift()!

      const promise = extractBlockText(task, controller)
        .then(result => {
          results.push(result)
          if (results.length % 10 === 0 || results.length === tasks.length) {
            console.log(`[extraction] Progress: ${results.length}/${tasks.length} blocks`)
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

  results.sort((a, b) => a.blockIndex - b.blockIndex)
  return results
}

// Render PDF pages to images using pdfjs-dist
async function renderPdfPagesToImages(base64: string): Promise<Array<{
  pageIndex: number
  pageNumber: number
  width: number
  height: number
  imageDataUrl: string
  imageBase64: string
}>> {
  const pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const canvasModule = await import("@napi-rs/canvas")
  const { createCanvas } = canvasModule
  const buffer = Buffer.from(base64, "base64")
  const data = new Uint8Array(buffer)

  const pdfjsLib = (pdfjsModule as any).default ?? pdfjsModule

  // CRITICAL: Disable worker by setting workerSrc to empty string BEFORE getDocument()
  // This prevents pdfjs-dist from trying to load the worker file in serverless environments
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = ""
  }

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

  const loadingTask = pdfjsLib.getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: true,
    canvasFactory: new NodeCanvasFactory(),
  })
  const pdf = await loadingTask.promise

  const pages: Array<{
    pageIndex: number
    pageNumber: number
    width: number
    height: number
    imageDataUrl: string
    imageBase64: string
  }> = []

  const PDF_RENDER_SCALE = 2

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE })
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error(`Failed to get 2D context for PDF page ${pageNumber}`)
    }

    await page.render({ canvasContext: context as any, viewport }).promise

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
  }

  if (typeof pdf.cleanup === "function") pdf.cleanup()
  if (typeof pdf.destroy === "function") pdf.destroy()

  return pages
}

function isPDFFile(mimeType: string, fileName: string): boolean {
  return (
    mimeType === "application/pdf" ||
    mimeType === "application/x-pdf" ||
    fileName?.toLowerCase().endsWith(".pdf")
  )
}

// ============================================================================
// Gemini Full-Text Extraction (Pipeline 2)
// ============================================================================

async function extractFullImageWithGemini(imageDataUrl: string): Promise<string> {
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

async function runGeminiFullTextExtractionGuest(
  base64: string,
  mimeType: string,
  fileName: string
): Promise<GeminiFullTextResult> {
  console.log(`[document-extraction] Starting Gemini full-text extraction (Pipeline 2)`)

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
        console.log(`[document-extraction] Gemini extracting page ${pageImage.pageNumber}...`)
        const pageText = await extractFullImageWithGemini(pageImage.imageDataUrl)
        pageTexts.push(`## Page ${pageImage.pageNumber}\n\n${pageText}`)
      }
      fullText = pageTexts.join('\n\n---\n\n')
    } else {
      // For images, extract directly
      const imageDataUrl = `data:${mimeType};base64,${base64}`
      console.log(`[document-extraction] Extracting text from image with Gemini...`)
      fullText = await extractFullImageWithGemini(imageDataUrl)
    }

    console.log(`[document-extraction] ✅ Gemini full-text extraction completed`)
    return { success: true, fullText }
  } catch (error: any) {
    console.error(`[document-extraction] Gemini full-text extraction failed:`, error)
    return { success: false, error: error.message || String(error) }
  }
}

// ============================================================================
// Layout-based Extraction (Pipeline 1)
// ============================================================================

async function runLayoutExtractionGuest(
  base64: string,
  mimeType: string,
  fileName: string,
  extractionMethod: string
): Promise<LayoutExtractionResult> {
  console.log(`[document-extraction] Starting layout extraction (Pipeline 1) using method: ${extractionMethod}`)

  try {
    const isPdf = isPDFFile(mimeType, fileName)

    // For multi-page data structure
    interface PageData {
      pageIndex: number
      pageNumber: number
      width?: number
      height?: number
      imageDataUrl: string
      blocks: Array<{
        blockIndex: number
        globalBlockIndex: number
        type: string
        content?: string
        text?: string
        bbox: [number, number, number, number]
        originalBbox?: [number, number, number, number]
        category?: string
      }>
    }

    const pages: PageData[] = []
    let globalBlockIndex = 0

    if (extractionMethod === 'datalab') {
      // Use Datalab Marker (Chandra) with accurate mode for block type classification
      console.log("[document-extraction] Processing with Datalab Marker (Chandra) in accurate mode...")

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

      console.log("[document-extraction] Datalab Marker response:", {
        hasJson: !!datalabOutput.json,
        hasBlocks: !!datalabOutput.blocks,
        hasPages: !!datalabOutput.pages,
      })

      // Extract blocks with types from Datalab output
      const extractedBlocks = extractDatalabBlocks(datalabOutput)
      console.log(`[document-extraction] Extracted ${extractedBlocks.length} blocks with types`)

      if (isPdf) {
        // For PDFs, render pages for visualization
        console.log("[document-extraction] Rendering PDF pages for visualization...")
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

        // Create page data with blocks
        pageImages.forEach((pageImage, idx) => {
          const pageBlocks = blocksByPage.get(idx) || []

          pages.push({
            pageIndex: pageImage.pageIndex,
            pageNumber: pageImage.pageNumber,
            width: pageImage.width,
            height: pageImage.height,
            imageDataUrl: pageImage.imageDataUrl,
            blocks: pageBlocks.map((block: any, i: number) => ({
              blockIndex: i,
              globalBlockIndex: globalBlockIndex + i,
              type: block.type || "TEXT",
              content: block.content || "",
              text: block.content || "",
              bbox: block.bbox || [0, 0, 0, 0],
              originalBbox: block.originalBbox || (block.bbox ? [block.bbox[0], block.bbox[1], block.bbox[0] + block.bbox[2], block.bbox[1] + block.bbox[3]] : undefined),
              polygon: block.polygon,
              category: block.type,
            })),
          })

          globalBlockIndex += pageBlocks.length
        })
      } else {
        // Single image
        const imageDataUrl = `data:${mimeType || "image/png"};base64,${base64}`

        pages.push({
          pageIndex: 0,
          pageNumber: 1,
          imageDataUrl,
          blocks: extractedBlocks.map((block: any, i: number) => ({
            blockIndex: i,
            globalBlockIndex: i,
            type: block.type || "TEXT",
            content: block.content || "",
            text: block.content || "",
            bbox: block.bbox || [0, 0, 0, 0],
            originalBbox: block.originalBbox || (block.bbox ? [block.bbox[0], block.bbox[1], block.bbox[0] + block.bbox[2], block.bbox[1] + block.bbox[3]] : undefined),
            polygon: block.polygon,
            category: block.type,
          })),
        })
      }
    } else {
      // Use dots.ocr (default)
      if (isPdf) {
        // Render PDF pages to images and process each with dots.ocr
        console.log("[document-extraction] Rendering PDF pages to images...")
        const pageImages = await renderPdfPagesToImages(base64)
        console.log(`[document-extraction] Rendered ${pageImages.length} PDF pages`)

        for (const pageImage of pageImages) {
          console.log(`[document-extraction] Processing page ${pageImage.pageNumber} with dots.ocr...`)

          const dotsOcrOutput = await callDotsOcr(
            { image: pageImage.imageBase64, file_name: `${fileName}-page-${pageImage.pageNumber}.png`, mime_type: "image/png" },
            { timeout: 240_000 }
          )

          console.log(`[document-extraction] dots.ocr page ${pageImage.pageNumber} response:`, {
            hasBlocks: !!dotsOcrOutput.blocks,
            blocksCount: dotsOcrOutput.blocks?.length || 0,
          })

          const blocks = dotsOcrOutput.blocks || []

          pages.push({
            pageIndex: pageImage.pageIndex,
            pageNumber: pageImage.pageNumber,
            width: pageImage.width,
            height: pageImage.height,
            imageDataUrl: pageImage.imageDataUrl,
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
      } else {
        // Single image - process directly with dots.ocr
        console.log("[document-extraction] Processing image with dots.ocr...")

        const dotsOcrOutput = await callDotsOcr(
          { image: base64, file_name: fileName, mime_type: mimeType },
          { timeout: 240_000 }
        )

        console.log("[document-extraction] dots.ocr response:", {
          hasBlocks: !!dotsOcrOutput.blocks,
          blocksCount: dotsOcrOutput.blocks?.length || 0,
        })

        const blocks = dotsOcrOutput.blocks || []
        const imageDataUrl = `data:${mimeType || "image/png"};base64,${base64}`

        pages.push({
          pageIndex: 0,
          pageNumber: 1,
          imageDataUrl,
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
        })
      }
    }

    // Collect all blocks for parallel text extraction
    const allBlocks = pages.flatMap(p => p.blocks)
    console.log(`[document-extraction] Total blocks extracted: ${allBlocks.length}`)

    // Prepare tasks for parallel text extraction
    const tasks: BlockExtractionTask[] = []

    for (const page of pages) {
      for (const block of page.blocks) {
        const [, , width, height] = block.bbox
        const ocrText = block.content || block.text || ""

        if (width > 0 && height > 0) {
          tasks.push({
            index: block.globalBlockIndex,
            block,
            ocrText,
            bbox: block.bbox,
            imageDataUrl: page.imageDataUrl,
          })
        }
      }
    }

    // Extract text from blocks in parallel
    let extractedTexts: BlockExtractionResult[] = []

    if (tasks.length > 0) {
      console.log(`[document-extraction] Extracting text from ${tasks.length} blocks in parallel...`)
      extractedTexts = await extractBlocksInParallel(tasks)
    } else if (allBlocks.length > 0) {
      // Use OCR text directly for blocks without valid bbox
      extractedTexts = pages.flatMap(p => p.blocks.map(block => ({
        blockIndex: block.globalBlockIndex,
        type: block.type,
        text: block.content || block.text || "",
        ocrText: block.content || block.text || "",
        bbox: block.bbox,
        originalBbox: block.originalBbox,
      })))
    } else {
      // No blocks found - extract from full image
      console.log("[document-extraction] No blocks found, extracting from full document")
      const firstPageImageUrl = pages[0]?.imageDataUrl || `data:${mimeType || "image/png"};base64,${base64}`
      const fullText = await extractFullImageWithGemini(firstPageImageUrl)

      pages[0] = pages[0] || {
        pageIndex: 0,
        pageNumber: 1,
        imageDataUrl: firstPageImageUrl,
        blocks: [],
      }

      pages[0].blocks.push({
        blockIndex: 0,
        globalBlockIndex: 0,
        type: "TEXT",
        content: fullText,
        text: fullText,
        bbox: [0, 0, 0, 0],
      })

      extractedTexts = [{
        blockIndex: 0,
        type: "TEXT",
        text: fullText,
        ocrText: fullText,
        bbox: [0, 0, 0, 0],
      }]
    }

    // Build result structures
    const layout_data = {
      pages: pages.map(p => ({
        pageIndex: p.pageIndex,
        pageNumber: p.pageNumber,
        width: p.width,
        height: p.height,
        imageDataUrl: p.imageDataUrl,
        blocks: p.blocks,
      })),
      totalPages: pages.length,
      totalBlocks: allBlocks.length,
    }

    const extracted_text = {
      pages: pages.map(p => ({
        pageIndex: p.pageIndex,
        pageNumber: p.pageNumber,
        blocks: extractedTexts
          .filter(et => {
            const block = allBlocks.find(b => b.globalBlockIndex === et.blockIndex)
            return block && pages.find(pg => pg.blocks.includes(block))?.pageIndex === p.pageIndex
          })
          .map(et => ({
            blockIndex: et.blockIndex,
            globalBlockIndex: et.blockIndex,
            type: et.type,
            text: et.text,
            ocrText: et.ocrText,
            bbox: et.bbox,
            originalBbox: et.originalBbox,
          })),
      })),
      totalBlocks: extractedTexts.length,
    }

    console.log(`[document-extraction] ✅ Layout extraction completed`)
    return { success: true, layout_data, extracted_text }
  } catch (error: any) {
    console.error(`[document-extraction] Layout extraction failed:`, error)
    return { success: false, error: error.message || String(error) }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { file_id, file_name, mime_type, file_data, extraction_method = 'dots.ocr' } = body

    console.log("[document-extraction] Received extraction request:", {
      file_name,
      extraction_method_received: extraction_method,
      extraction_method_type: typeof extraction_method,
    })

    if (!file_id || !file_data) {
      return NextResponse.json({ error: "File ID and file data are required" }, { status: 400 })
    }

    // Validate extraction method
    const method = extraction_method === 'datalab' ? 'datalab' : 'dots.ocr'

    console.log("[document-extraction] Using extraction method:", method)
    console.log("[document-extraction] Starting PARALLEL dual extraction (Gemini full-text + Layout blocks)")

    // Run BOTH extraction pipelines in PARALLEL
    const [geminiResult, layoutResult] = await Promise.allSettled([
      runGeminiFullTextExtractionGuest(file_data, mime_type || "image/png", file_name || "document"),
      runLayoutExtractionGuest(file_data, mime_type || "image/png", file_name || "document", method),
    ])

    // Process results
    const geminiSuccess = geminiResult.status === 'fulfilled' && geminiResult.value.success
    const layoutSuccess = layoutResult.status === 'fulfilled' && layoutResult.value.success

    // Extract data from results
    const geminiData = geminiResult.status === 'fulfilled' ? geminiResult.value : null
    const layoutData = layoutResult.status === 'fulfilled' ? layoutResult.value : null

    // Determine overall success (at least one pipeline succeeded)
    const success = geminiSuccess || layoutSuccess

    // Build error message if both failed
    let errorMessage: string | undefined
    if (!success) {
      const geminiError = geminiResult.status === 'rejected'
        ? geminiResult.reason?.message
        : geminiData?.error
      const layoutError = layoutResult.status === 'rejected'
        ? layoutResult.reason?.message
        : layoutData?.error
      errorMessage = `Gemini: ${geminiError || 'unknown'}; Layout: ${layoutError || 'unknown'}`
    }

    console.log(`[document-extraction] ✅ Dual extraction completed`)
    console.log(`[document-extraction] Gemini: ${geminiSuccess ? 'success' : 'failed'}, Layout: ${layoutSuccess ? 'success' : 'failed'}`)

    // Return combined results from both pipelines
    return NextResponse.json({
      success,
      file_id,
      // Pipeline 1: Layout-based extraction results
      layout_data: layoutData?.layout_data || null,
      extracted_text: layoutData?.extracted_text || null,
      layout_extraction_status: layoutSuccess ? 'completed' : 'error',
      layout_error_message: layoutSuccess ? null : (layoutData?.error || 'Unknown error'),
      // Pipeline 2: Gemini full-text extraction results
      gemini_full_text: geminiData?.fullText || null,
      gemini_extraction_status: geminiSuccess ? 'completed' : 'error',
      gemini_error_message: geminiSuccess ? null : (geminiData?.error || 'Unknown error'),
      // Overall status
      error_message: errorMessage,
    })
  } catch (error) {
    console.error("[document-extraction] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
