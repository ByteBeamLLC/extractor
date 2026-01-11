/**
 * Document extraction module exports
 */

// Main extraction function
export { extractDocumentFile } from "./extract"

// Types
export type {
  ExtractFileParams,
  PageData,
  PageBlock,
  MultiPageLayoutData,
  ExtractedBlockText,
  MultiPageExtractedText,
  BlockExtractionTask,
  BlockExtractionResult,
  RenderedPageImage,
  OcrOutput,
  OcrTextStats,
  ExtractionResult,
} from "./types"

// Constants
export {
  GEMINI_MODEL,
  INITIAL_CONCURRENCY,
  MIN_CONCURRENCY,
  MAX_CONCURRENCY,
  MAX_RETRIES,
  BASE_BACKOFF_MS,
  PDF_RENDER_SCALE,
  OCR_UPSCALE_SCALE,
  OCR_MIN_TEXT_CHARS,
  OCR_MIN_AVG_CHARS,
  OCR_MAX_EMPTY_BLOCK_RATIO,
  OCR_TIMEOUT_MS,
  DATALAB_TIMEOUT_MS,
} from "./constants"

// Utilities
export { ConcurrencyController, sleep, isRateLimitError } from "./concurrency"
export { getOcrTextStats, isLowOcrQuality, fetchImageAsBase64, isPDFFile } from "./ocrUtils"
export { renderPdfPagesToImages } from "./pdfRenderer"
export { extractBlocksInParallel, extractFullImage } from "./blockExtractor"

// Layout extractors
export {
  extractImageWithDotsOcr,
  extractPDFWithDotsOcr,
  extractImageWithDatalab,
  extractPDFWithDatalab,
  extractWithGeminiFallback,
} from "./layoutExtractors"
