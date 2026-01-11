/**
 * OCR quality detection and utility functions
 */

import type { OcrOutput, OcrTextStats } from "./types"
import {
  OCR_MIN_TEXT_CHARS,
  OCR_MIN_AVG_CHARS,
  OCR_MAX_EMPTY_BLOCK_RATIO,
} from "./constants"

/**
 * Calculate statistics from OCR output
 */
export function getOcrTextStats(output: OcrOutput): OcrTextStats {
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

/**
 * Check if OCR output indicates low quality that needs upscaling
 */
export function isLowOcrQuality(output: OcrOutput): boolean {
  const stats = getOcrTextStats(output)

  if (stats.blocksCount === 0) {
    return stats.markdownLength < OCR_MIN_TEXT_CHARS
  }
  if (stats.totalTextLength + stats.markdownLength < OCR_MIN_TEXT_CHARS) return true
  if (stats.emptyBlockRatio > OCR_MAX_EMPTY_BLOCK_RATIO) return true
  if (stats.avgBlockChars < OCR_MIN_AVG_CHARS && stats.emptyBlockRatio > 0.4) return true

  return false
}

/**
 * Fetch an image URL and convert to base64
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
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

/**
 * Check if a file is a PDF based on MIME type or filename
 */
export function isPDFFile(mimeType: string, fileName: string): boolean {
  return (
    mimeType === "application/pdf" ||
    mimeType === "application/x-pdf" ||
    fileName.toLowerCase().endsWith(".pdf")
  )
}
