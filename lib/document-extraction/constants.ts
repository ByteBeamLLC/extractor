/**
 * Constants for document extraction
 */

// Gemini model for text extraction (via OpenRouter)
export const GEMINI_MODEL = "google/gemini-2.5-pro-preview"

// Concurrency configuration
export const INITIAL_CONCURRENCY = 5
export const MIN_CONCURRENCY = 2
export const MAX_CONCURRENCY = 10
export const MAX_RETRIES = 3
export const BASE_BACKOFF_MS = 1000

// PDF rendering
export const PDF_RENDER_SCALE = 2

// OCR quality thresholds
export const OCR_UPSCALE_SCALE = 2
export const OCR_MIN_TEXT_CHARS = 30
export const OCR_MIN_AVG_CHARS = 8
export const OCR_MAX_EMPTY_BLOCK_RATIO = 0.6

// Timeout values
export const OCR_TIMEOUT_MS = 600_000
export const DATALAB_TIMEOUT_MS = 240_000
