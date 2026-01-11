/**
 * Timeout constants for API operations
 */

// OCR and document processing timeouts
export const OCR_REQUEST_TIMEOUT_MS = 60_000 // 1 minute
export const DOCUMENT_EXTRACTION_TIMEOUT_MS = 120_000 // 2 minutes
export const AI_GENERATION_TIMEOUT_MS = 90_000 // 1.5 minutes

// API request timeouts
export const DEFAULT_API_TIMEOUT_MS = 30_000 // 30 seconds
export const LONG_RUNNING_API_TIMEOUT_MS = 300_000 // 5 minutes

// Debounce delays
export const SEARCH_DEBOUNCE_MS = 300
export const SAVE_DEBOUNCE_MS = 500
export const RESIZE_DEBOUNCE_MS = 250

// Retry configuration
export const MAX_RETRY_ATTEMPTS = 3
export const RETRY_BASE_DELAY_MS = 1_000
export const RETRY_MAX_DELAY_MS = 10_000
