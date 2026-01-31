/**
 * Document parsing utilities for extracting text from various file formats
 */

import {
  PDF_MIME_TYPES,
  DOCX_MIME_TYPES,
  DOC_MIME_TYPES,
  XLSX_MIME_TYPES,
  TEXT_LIKE_MIME_PREFIXES,
} from "./constants"

const decoder = new TextDecoder()

type PdfParseFn = (data: Buffer, options?: Record<string, unknown>) => Promise<{ text?: string }>
let pdfParseSingleton: PdfParseFn | null = null

type MammothModule = typeof import("mammoth")
let mammothSingleton: MammothModule | null = null

type XlsxModule = typeof import("xlsx")
let xlsxSingleton: XlsxModule | null = null

/**
 * Lazily loads the pdf-parse module
 */
async function loadPdfParse(): Promise<PdfParseFn | null> {
  if (pdfParseSingleton) return pdfParseSingleton
  try {
    const mod = await import("pdf-parse")
    const fn = (mod as { default?: PdfParseFn }).default ?? mod
    if (typeof fn === "function") {
      pdfParseSingleton = fn as PdfParseFn
      return pdfParseSingleton
    }
    console.warn("[extraction] pdf-parse module did not expose a function")
    return null
  } catch (error) {
    console.error("[extraction] Failed to load pdf-parse:", error)
    return null
  }
}

/**
 * Lazily loads the mammoth module for DOCX parsing
 */
async function loadMammoth(): Promise<MammothModule | null> {
  if (mammothSingleton) return mammothSingleton
  try {
    const mod = await import("mammoth")
    const lib = (mod as { default?: MammothModule }).default ?? mod
    if (lib && typeof lib.extractRawText === "function") {
      mammothSingleton = lib as MammothModule
      return mammothSingleton
    }
    console.warn("[extraction] mammoth module missing extractRawText")
    return null
  } catch (error) {
    console.error("[extraction] Failed to load mammoth:", error)
    return null
  }
}

/**
 * Lazily loads the xlsx module for spreadsheet parsing
 */
async function loadXlsx(): Promise<XlsxModule | null> {
  if (xlsxSingleton) return xlsxSingleton
  try {
    const mod = await import("xlsx")
    const lib = (mod as { default?: XlsxModule }).default ?? mod
    if (lib && typeof lib.read === "function") {
      xlsxSingleton = lib as XlsxModule
      return xlsxSingleton
    }
    console.warn("[extraction] xlsx module missing read function")
    return null
  } catch (error) {
    console.error("[extraction] Failed to load xlsx:", error)
    return null
  }
}

/**
 * Checks if a MIME type represents text-like content
 */
export function isTextLikeMimeType(mimeType?: string | null): boolean {
  if (!mimeType) return false
  const normalized = mimeType.toLowerCase()
  return TEXT_LIKE_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

/**
 * Result from document text extraction
 */
export interface DocumentExtractionResult {
  text: string
  warnings: string[]
}

/**
 * Extracts text content from a document based on its type
 */
export async function extractTextFromDocument(
  bytes: Uint8Array,
  fileName?: string,
  mimeType?: string
): Promise<DocumentExtractionResult> {
  const warnings: string[] = []
  const ext = fileName?.split(".").pop()?.toLowerCase() ?? ""
  const normalizedMime = mimeType?.toLowerCase() ?? ""

  try {
    // Handle PDF files
    if (PDF_MIME_TYPES.has(normalizedMime) || ext === "pdf") {
      const pdfParse = await loadPdfParse()
      if (pdfParse) {
        const pdfData = await pdfParse(Buffer.from(bytes))
        return { text: pdfData.text?.trim() ?? "", warnings }
      }
      warnings.push("PDF text extraction unavailable. Falling back to UTF-8 decode.")
      return { text: decoder.decode(bytes), warnings }
    }

    // Handle DOCX files
    if (DOCX_MIME_TYPES.has(normalizedMime) || ext === "docx") {
      const mammoth = await loadMammoth()
      if (mammoth) {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
        result.messages?.forEach((msg: { message?: string }) => {
          if (msg?.message) warnings.push(msg.message)
        })
        return { text: result.value?.trim() ?? "", warnings }
      }
      warnings.push("DOCX extraction unavailable. Falling back to UTF-8 decode.")
      return { text: decoder.decode(bytes), warnings }
    }

    // Handle legacy DOC files
    if (DOC_MIME_TYPES.has(normalizedMime) || ext === "doc") {
      warnings.push("Legacy .doc files have limited support. Attempting best-effort extraction.")
      const mammoth = await loadMammoth()
      if (mammoth) {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
        result.messages?.forEach((msg: { message?: string }) => {
          if (msg?.message) warnings.push(msg.message)
        })
        return { text: result.value?.trim() ?? "", warnings }
      }
      warnings.push("DOC extraction unavailable. Falling back to UTF-8 decode.")
      return { text: decoder.decode(bytes), warnings }
    }

    // Handle XLSX/XLS files
    if (XLSX_MIME_TYPES.has(normalizedMime) || ext === "xlsx" || ext === "xls") {
      const xlsx = await loadXlsx()
      if (xlsx) {
        const workbook = xlsx.read(Buffer.from(bytes), { type: "buffer" })
        const sheets = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name]
          const csv = xlsx.utils.sheet_to_csv(sheet)
          return `Sheet: ${name}\n${csv}`
        })
        return { text: sheets.join("\n\n").trim(), warnings }
      }
      warnings.push("XLSX extraction unavailable. Falling back to UTF-8 decode.")
      return { text: decoder.decode(bytes), warnings }
    }

    // Handle text-like files
    if (
      TEXT_LIKE_MIME_PREFIXES.some((prefix) => normalizedMime.startsWith(prefix)) ||
      ["txt", "csv", "json", "xml", "md"].includes(ext)
    ) {
      return { text: decoder.decode(bytes), warnings }
    }

    // Fallback to UTF-8 decoding for unknown content
    warnings.push("File type not recognized as structured text. Attempting UTF-8 decode.")
    return { text: decoder.decode(bytes), warnings }
  } catch (error) {
    warnings.push(
      error instanceof Error ? error.message : "Unknown error while extracting document text"
    )
    return { text: "", warnings }
  }
}

/**
 * Checks if a file is an image based on MIME type or extension
 */
export function isImageFile(mimeType: string, fileName: string): boolean {
  const normalizedMime = mimeType.toLowerCase()
  const ext = fileName.toLowerCase()
  return (
    normalizedMime.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|bmp|webp)$/.test(ext)
  )
}

/**
 * Checks if a file is a PDF based on MIME type or extension
 */
export function isPdfFile(mimeType: string, fileName: string): boolean {
  const normalizedMime = mimeType.toLowerCase()
  return normalizedMime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")
}

/**
 * Checks if DotsOCR supports this file type
 */
export function isDotsOcrSupported(mimeType?: string, fileName?: string): boolean {
  const normalizedMime = mimeType?.toLowerCase() ?? ""
  const ext = fileName?.split(".").pop()?.toLowerCase() ?? ""
  return (
    normalizedMime.startsWith("image/") ||
    normalizedMime === "application/pdf" ||
    /\.(png|jpg|jpeg|gif|bmp|webp|pdf)$/.test(`.${ext}`)
  )
}
