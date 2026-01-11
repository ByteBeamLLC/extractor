/**
 * MIME type constants for document handling
 */

// PDF MIME types
export const PDF_MIME_TYPES = new Set(["application/pdf"])

// DOCX (Office Open XML) MIME types
export const DOCX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

// Legacy DOC MIME types
export const DOC_MIME_TYPES = new Set(["application/msword"])

// Excel MIME types
export const XLSX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])

export const XLS_MIME_TYPES = new Set(["application/vnd.ms-excel"])

// Image MIME types
export const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
])

// Text-like MIME type prefixes
export const TEXT_LIKE_MIME_PREFIXES = ["text/", "application/json", "application/xml"]

/**
 * Checks if a MIME type represents an image
 */
export function isImageMimeType(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.has(mimeType.toLowerCase())
}

/**
 * Checks if a MIME type represents a PDF
 */
export function isPdfMimeType(mimeType: string): boolean {
  return PDF_MIME_TYPES.has(mimeType.toLowerCase())
}

/**
 * Checks if a MIME type represents text-like content
 */
export function isTextLikeMimeType(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase()
  return TEXT_LIKE_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

/**
 * Gets file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string | null {
  const mimeToExt: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-excel": "xls",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/bmp": "bmp",
    "image/svg+xml": "svg",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/json": "json",
    "application/xml": "xml",
    "text/xml": "xml",
  }
  return mimeToExt[mimeType.toLowerCase()] ?? null
}
