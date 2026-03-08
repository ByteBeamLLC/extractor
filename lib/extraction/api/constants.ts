/**
 * Constants for the extraction API
 */

// MIME type sets for document type detection
export const PDF_MIME_TYPES = new Set(["application/pdf"])

export const DOCX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

export const DOC_MIME_TYPES = new Set(["application/msword"])

export const XLSX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
])

export const TEXT_LIKE_MIME_PREFIXES = ["text/", "application/json", "application/xml"]

// Keys used to extract markdown from OCR responses
export const MARKDOWN_KEYS = [
  "markdown",
  "md",
  "markdown_body",
  "text",
  "content",
  "rendered_markdown",
  "markdown_text",
]

// Keys used to extract annotated images from OCR responses
export const IMAGE_KEYS = [
  "annotated_image",
  "annotatedImage",
  "annotated_image_url",
  "annotatedImageUrl",
  "visualization",
  "visualization_image",
  "rendered_image",
  "image_url",
  "imageUrl",
  "image",
  "image_base64",
  "base64",
  "data",
  "url",
]

// Timeout values
export const OCR_REQUEST_TIMEOUT_MS = 60_000
export const MAX_SUPPLEMENTAL_TEXT_CHARS = 15_000

// Fallback value for missing fields
export const FALLBACK_VALUE = "-"

/**
 * Resolves the DotsOCR service URL from environment variables
 */
export function resolveDotsOcrServiceUrl(): string | null {
  const explicit =
    process.env.DOTSOCR_API_URL ||
    process.env.DOTS_OCR_API_URL ||
    process.env.DOTSOCR_SERVICE_URL ||
    process.env.DOTS_OCR_SERVICE_URL
  if (explicit && explicit.trim().length > 0) return explicit.trim()

  const configuredBase =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL
  if (configuredBase && configuredBase.trim().length > 0) {
    const base = configuredBase.trim().replace(/\/$/, "")
    return `${base}/api/dotsocr`
  }

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl && vercelUrl.trim().length > 0) {
    const base = vercelUrl.startsWith("http")
      ? vercelUrl.trim()
      : `https://${vercelUrl.trim()}`
    return `${base.replace(/\/$/, "")}/api/dotsocr`
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:3000/api/dotsocr"
  }

  return null
}

/**
 * Resolves the DotsOCR HuggingFace endpoint
 */
export function resolveDotsOcrEndpoint(): string {
  const rawEndpoint =
    process.env.HUGGINGFACE_DOTS_OCR_ENDPOINT ||
    process.env.HUGGINGFACE_DOTS_OCR_MODEL ||
    "dots/ocr"
  return rawEndpoint.startsWith("http")
    ? rawEndpoint
    : `https://api-inference.huggingface.co/models/${rawEndpoint}`
}

/**
 * Gets the DotsOCR API key from environment
 */
export function getDotsOcrApiKey(): string {
  return process.env.DOTSOCR_API_KEY || process.env.DOTS_OCR_API_KEY || ""
}
