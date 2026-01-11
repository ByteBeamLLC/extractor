/**
 * PDF rendering utilities - converts PDF pages to images
 */

import type { RenderedPageImage } from "./types"
import { PDF_RENDER_SCALE } from "./constants"

/**
 * Render all pages of a PDF to images
 */
export async function renderPdfPagesToImages(base64: string): Promise<RenderedPageImage[]> {
  // Dynamic import for server-side PDF rendering (use legacy build for Node.js)
  const pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs")
  // Use @napi-rs/canvas which has better compatibility with pdfjs-dist
  const canvasModule = await import("@napi-rs/canvas")
  const { createCanvas } = canvasModule
  // pdfjs-dist v5 requires Uint8Array, not Buffer
  const buffer = Buffer.from(base64, "base64")
  const data = new Uint8Array(buffer)

  const pdfjsLib = (pdfjsModule as { default?: typeof pdfjsModule }).default ?? pdfjsModule

  // Create a custom canvas factory for node-canvas compatibility
  class NodeCanvasFactory {
    create(width: number, height: number) {
      const canvas = createCanvas(width, height)
      const context = canvas.getContext("2d")
      return { canvas, context }
    }
    reset(canvasAndContext: { canvas: ReturnType<typeof createCanvas>; context: unknown }, width: number, height: number) {
      canvasAndContext.canvas.width = width
      canvasAndContext.canvas.height = height
    }
    destroy(canvasAndContext: { canvas: ReturnType<typeof createCanvas> | null; context: unknown }) {
      if (canvasAndContext.canvas) {
        canvasAndContext.canvas.width = 0
        canvasAndContext.canvas.height = 0
      }
      canvasAndContext.canvas = null
      canvasAndContext.context = null
    }
  }

  console.log(`[document-extraction] Loading PDF document...`)

  // For pdfjs-dist v5 in Node.js, use workerPort: null to explicitly disable workers
  // This avoids the "No GlobalWorkerOptions.workerSrc specified" error
  const loadingTask = pdfjsLib.getDocument({
    data,
    workerPort: null, // Explicitly disable worker for Node.js environment (pdfjs-dist v5)
    isEvalSupported: false,
    useSystemFonts: true,
    canvasFactory: new NodeCanvasFactory(),
  })
  const pdf = await loadingTask.promise

  console.log(`[document-extraction] PDF loaded, ${pdf.numPages} pages`)

  const pages: RenderedPageImage[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    console.log(`[document-extraction] Rendering PDF page ${pageNumber}/${pdf.numPages}...`)
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE })
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error(`Failed to get 2D context for PDF page ${pageNumber}`)
    }

    await page.render({ canvasContext: context as unknown as CanvasRenderingContext2D, viewport }).promise

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
