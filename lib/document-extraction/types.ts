/**
 * Type definitions for document extraction
 */

import type { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Parameters for file extraction
 */
export interface ExtractFileParams {
  fileId: string
  userId: string
  supabase: ReturnType<typeof createSupabaseServerClient>
  extractionMethod?: string
}

/**
 * Page data with layout blocks
 */
export interface PageData {
  pageIndex: number
  pageNumber: number // 1-based for display
  width?: number
  height?: number
  imageDataUrl?: string // Base64 data URL for the page image
  blocks: PageBlock[]
}

/**
 * Individual block within a page
 */
export interface PageBlock {
  blockIndex: number // Index within the page
  globalBlockIndex: number // Index across all pages
  type: string
  content?: string
  text?: string
  bbox: [number, number, number, number]
  originalBbox?: [number, number, number, number]
  category?: string
  extractedText?: string
  polygon?: number[][]
}

/**
 * Multi-page layout data structure
 */
export interface MultiPageLayoutData {
  pages: PageData[]
  totalPages: number
  totalBlocks: number
  markdown?: string
}

/**
 * Extracted text data for a single block
 */
export interface ExtractedBlockText {
  blockIndex: number
  globalBlockIndex: number
  type: string
  text: string
  ocrText?: string
  bbox?: [number, number, number, number]
  error?: string
}

/**
 * Multi-page extracted text structure
 */
export interface MultiPageExtractedText {
  pages: Array<{
    pageIndex: number
    pageNumber: number
    blocks: ExtractedBlockText[]
  }>
  totalBlocks: number
}

/**
 * Task for block text extraction
 */
export interface BlockExtractionTask {
  index: number // Global block index
  pageIndex: number
  blockIndex: number // Index within page
  block: PageBlock
  ocrText: string
  bbox: [number, number, number, number]
  imageDataUrl: string // Per-task image URL (supports different pages)
}

/**
 * Result from block text extraction
 */
export interface BlockExtractionResult {
  blockIndex: number
  globalBlockIndex: number
  pageIndex: number
  type: string
  text: string
  ocrText?: string
  bbox?: [number, number, number, number]
  error?: string
}

/**
 * Rendered PDF page image
 */
export interface RenderedPageImage {
  pageIndex: number
  pageNumber: number
  width: number
  height: number
  imageDataUrl: string
  imageBase64: string
}

/**
 * OCR output with blocks and markdown
 */
export interface OcrOutput {
  blocks?: Array<{
    content?: string
    text?: string
    type?: string
    category?: string
    bbox?: [number, number, number, number]
    originalBbox?: [number, number, number, number]
  }>
  markdown?: string
}

/**
 * OCR text statistics
 */
export interface OcrTextStats {
  blocksCount: number
  totalTextLength: number
  avgBlockChars: number
  emptyBlockRatio: number
  markdownLength: number
}

/**
 * Result from extraction method
 */
export interface ExtractionResult {
  success: boolean
  text?: string
  layoutData?: MultiPageLayoutData
  extractedTextData?: MultiPageExtractedText
  error?: string
}
