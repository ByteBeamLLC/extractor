import { type NextRequest, NextResponse } from "next/server"
import { callDotsOcr, extractLayoutBlocks } from "@/lib/replicate"
import { generateText } from "@/lib/openrouter"

// Set longer timeout for extraction (10 minutes)
export const runtime = 'nodejs'
export const maxDuration = 600 // 10 minutes in seconds

// Concurrency configuration for parallel text extraction
const INITIAL_CONCURRENCY = 5
const MIN_CONCURRENCY = 2
const MAX_CONCURRENCY = 10
const MAX_RETRIES = 3
const BASE_BACKOFF_MS = 1000

// Gemini model for text extraction
const GEMINI_MODEL = "google/gemini-2.5-pro-preview"

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { file_id, file_name, mime_type, file_data } = body

    if (!file_id || !file_data) {
      return NextResponse.json({ error: "File ID and file data are required" }, { status: 400 })
    }

    // Check if REPLICATE_API_TOKEN is configured
    if (!process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_KEY) {
      console.error("[document-extraction] REPLICATE_API_TOKEN is not configured")
      return NextResponse.json(
        {
          error: "REPLICATE_API_TOKEN is not configured. Please set REPLICATE_API_TOKEN in your .env file.",
          details: "Get your API key from https://replicate.com/"
        },
        { status: 500 }
      )
    }

    try {
      console.log("[document-extraction] Starting dots.ocr extraction for file:", file_name)

      const isPdf = isPDFFile(mime_type || "", file_name || "")

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
      let dotsOcrFailed = false

      // Try dots.ocr first
      try {
        if (isPdf) {
          // Render PDF pages to images and process each with dots.ocr
          console.log("[document-extraction] Rendering PDF pages to images...")
          const pageImages = await renderPdfPagesToImages(file_data)
          console.log(`[document-extraction] Rendered ${pageImages.length} PDF pages`)

          for (const pageImage of pageImages) {
            console.log(`[document-extraction] Processing page ${pageImage.pageNumber} with dots.ocr...`)

            const dotsOcrOutput = await callDotsOcr(
              { image: pageImage.imageBase64, file_name: `${file_name}-page-${pageImage.pageNumber}.png`, mime_type: "image/png" },
              { timeout: 600_000 }
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
            { image: file_data, file_name: file_name, mime_type: mime_type },
            { timeout: 600_000 }
          )

          console.log("[document-extraction] dots.ocr response:", {
            hasBlocks: !!dotsOcrOutput.blocks,
            blocksCount: dotsOcrOutput.blocks?.length || 0,
          })

          const blocks = dotsOcrOutput.blocks || []
          const imageDataUrl = `data:${mime_type || "image/png"};base64,${file_data}`

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
      } catch (dotsOcrError) {
        console.warn("[document-extraction] dots.ocr failed, falling back to direct Gemini extraction:", dotsOcrError)
        dotsOcrFailed = true

        // Fallback: Pass entire file to Gemini
        if (isPdf) {
          // For PDFs, render pages and pass all to Gemini
          console.log("[document-extraction] Rendering PDF pages for Gemini fallback...")
          const pageImages = await renderPdfPagesToImages(file_data)
          console.log(`[document-extraction] Rendered ${pageImages.length} PDF pages for Gemini`)

          // Pass all pages to Gemini in one call
          const imageContents = pageImages.map(pageImage => ({
            type: "image_url" as const,
            image_url: { url: pageImage.imageDataUrl }
          }))

          const prompt = `Extract all text content from this ${pageImages.length}-page document.
For each page, preserve the layout, structure, and meaning of the data.

Return a JSON array where each element represents a page with this structure:
{
  "pageNumber": <page number starting from 1>,
  "content": "<extracted text with preserved formatting>"
}

Rules:
- Preserve headers, titles, bullet points, lists, tables, and structure
- Format tables as markdown tables or HTML if complex
- Maintain reading order
- Keep the original language (no translation)
- No explanations or metadata - just the structured extraction

Output ONLY the JSON array, nothing else.`

          const result = await generateText({
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  ...imageContents
                ],
              },
            ],
            temperature: 0.1,
            model: GEMINI_MODEL,
          })

          // Parse Gemini's response
          try {
            const parsedPages = JSON.parse(result.text.trim())
            if (Array.isArray(parsedPages)) {
              for (let i = 0; i < parsedPages.length; i++) {
                const pageData = parsedPages[i]
                const pageImage = pageImages[i]
                
                pages.push({
                  pageIndex: i,
                  pageNumber: pageData.pageNumber || (i + 1),
                  width: pageImage?.width,
                  height: pageImage?.height,
                  imageDataUrl: pageImage?.imageDataUrl || "",
                  blocks: [{
                    blockIndex: 0,
                    globalBlockIndex: globalBlockIndex++,
                    type: "TEXT",
                    content: pageData.content || "",
                    text: pageData.content || "",
                    bbox: [0, 0, 0, 0],
                  }],
                })
              }
            }
          } catch (parseError) {
            console.warn("[document-extraction] Failed to parse Gemini JSON, using raw text")
            // Fallback: treat as single text block per page
            for (let i = 0; i < pageImages.length; i++) {
              const pageImage = pageImages[i]
              pages.push({
                pageIndex: i,
                pageNumber: i + 1,
                width: pageImage.width,
                height: pageImage.height,
                imageDataUrl: pageImage.imageDataUrl,
                blocks: [{
                  blockIndex: 0,
                  globalBlockIndex: globalBlockIndex++,
                  type: "TEXT",
                  content: result.text.trim(),
                  text: result.text.trim(),
                  bbox: [0, 0, 0, 0],
                }],
              })
            }
          }
        } else {
          // Single image - pass to Gemini
          console.log("[document-extraction] Using Gemini for single image extraction...")
          const imageDataUrl = `data:${mime_type || "image/png"};base64,${file_data}`

          const prompt = `Extract all text content from this document image.
Preserve the layout, structure, context, and meaning of the data.

Rules:
- Maintain headers, titles, bullet points, lists, tables, and structure
- Format tables as markdown tables or HTML if complex
- Keep reading order
- Preserve the original language (no translation)
- No explanations or metadata

Return ONLY the extracted text with preserved formatting.`

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

          pages.push({
            pageIndex: 0,
            pageNumber: 1,
            imageDataUrl,
            blocks: [{
              blockIndex: 0,
              globalBlockIndex: 0,
              type: "TEXT",
              content: result.text.trim(),
              text: result.text.trim(),
              bbox: [0, 0, 0, 0],
            }],
          })
        }
      }

      // Collect all blocks for parallel text extraction
      const allBlocks = pages.flatMap(p => p.blocks)
      console.log(`[document-extraction] Total blocks extracted: ${allBlocks.length}`)

      // If dots.ocr failed and we used Gemini fallback, skip parallel extraction
      // because Gemini already extracted all the text
      let extractedTexts: BlockExtractionResult[] = []

      if (dotsOcrFailed) {
        console.log("[document-extraction] Using Gemini-extracted text directly (dots.ocr fallback)")
        // Use the text already extracted by Gemini in the fallback
        extractedTexts = pages.flatMap(p => p.blocks.map(block => ({
          blockIndex: block.globalBlockIndex,
          type: block.type,
          text: block.content || block.text || "",
          ocrText: block.content || block.text || "",
          bbox: block.bbox,
          originalBbox: block.originalBbox,
        })))
      } else {
        // If no blocks from dots.ocr, extract from full image
        if (allBlocks.length === 0) {
          console.log("[document-extraction] No blocks found, extracting from full document")

          const firstPageImageUrl = pages[0]?.imageDataUrl || `data:${mime_type || "image/png"};base64,${file_data}`

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
                  { type: "image_url", image_url: { url: firstPageImageUrl } },
                ],
              },
            ],
            temperature: 0.1,
            model: GEMINI_MODEL,
          })

          // Add as single block
          pages[0].blocks.push({
            blockIndex: 0,
            globalBlockIndex: 0,
            type: "TEXT",
            content: result.text.trim(),
            text: result.text.trim(),
            bbox: [0, 0, 0, 0],
          })
        }

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
        if (tasks.length > 0) {
          console.log(`[document-extraction] Extracting text from ${tasks.length} blocks in parallel...`)
          extractedTexts = await extractBlocksInParallel(tasks)
        } else {
          // Use OCR text directly for blocks without valid bbox
          extractedTexts = pages.flatMap(p => p.blocks.map(block => ({
            blockIndex: block.globalBlockIndex,
            type: block.type,
            text: block.content || block.text || "",
            ocrText: block.content || block.text || "",
            bbox: block.bbox,
            originalBbox: block.originalBbox,
          })))
        }
      }

      // Return multi-page data structure
      return NextResponse.json({
        success: true,
        file_id,
        layout_data: {
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
        },
        extracted_text: {
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
        },
      })
    } catch (extractionError) {
      console.error("[document-extraction] Extraction error:", extractionError)
      const errorMessage = extractionError instanceof Error ? extractionError.message : String(extractionError)
      const errorStack = extractionError instanceof Error ? extractionError.stack : undefined

      return NextResponse.json(
        {
          error: "Extraction failed",
          details: errorMessage,
          stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[document-extraction] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
