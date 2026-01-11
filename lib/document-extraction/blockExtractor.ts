/**
 * Block text extraction using Gemini AI
 */

import { generateText } from "@/lib/openrouter"
import type { BlockExtractionTask, BlockExtractionResult } from "./types"
import { ConcurrencyController, sleep, isRateLimitError } from "./concurrency"
import {
  GEMINI_MODEL,
  INITIAL_CONCURRENCY,
  MAX_RETRIES,
  BASE_BACKOFF_MS,
} from "./constants"

/**
 * Extract text from a single block using Gemini
 */
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
  } catch (error: unknown) {
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

    const err = error as { message?: string }
    console.error(`[extraction] Failed to extract block ${index} after ${MAX_RETRIES} retries:`, err?.message || error)

    return {
      blockIndex,
      globalBlockIndex: index,
      pageIndex,
      type: block.type || "TEXT",
      text: ocrText || "",
      ocrText,
      bbox,
      error: err?.message || String(error),
    }
  }
}

/**
 * Extract text from multiple blocks in parallel with adaptive concurrency
 */
export async function extractBlocksInParallel(
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
          const idx = inFlight.indexOf(promise)
          if (idx > -1) inFlight.splice(idx, 1)
        })

      inFlight.push(promise)
    }

    if (inFlight.length > 0) {
      await Promise.race(inFlight)
    }
  }

  results.sort((a, b) => a.globalBlockIndex - b.globalBlockIndex)
  return results
}

/**
 * Extract text from a full image when no blocks are detected
 */
export async function extractFullImage(imageDataUrl: string): Promise<string> {
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
