import { ensureServerOnly } from "./ensureServerOnly"

ensureServerOnly("lib/server/documents")

const pdfMimeTypes = new Set(["application/pdf"])
const docxMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])
const docMimeTypes = new Set(["application/msword"])

const textLikeMimePrefixes = ["text/", "application/json", "application/xml"]

const decoder = new TextDecoder()

type PdfParseFn = (data: Buffer, options?: any) => Promise<{ text?: string }>
let pdfParseSingleton: PdfParseFn | null = null

type MammothModule = typeof import("mammoth")
let mammothSingleton: MammothModule | null = null

async function loadPdfParse(): Promise<PdfParseFn | null> {
  if (pdfParseSingleton) return pdfParseSingleton
  try {
    const mod = await import("pdf-parse/lib/pdf-parse.js")
    const fn = (mod as any).default ?? mod
    if (typeof fn === "function") {
      pdfParseSingleton = fn as PdfParseFn
      return pdfParseSingleton
    }
    console.warn("[bytebeam] pdf-parse module did not expose a function")
    return null
  } catch (error) {
    console.error("[bytebeam] Failed to load pdf-parse:", error)
    return null
  }
}

async function loadMammoth(): Promise<MammothModule | null> {
  if (mammothSingleton) return mammothSingleton
  try {
    const mod = await import("mammoth")
    const lib = (mod as any).default ?? mod
    if (lib && typeof lib.extractRawText === "function") {
      mammothSingleton = lib as MammothModule
      return mammothSingleton
    }
    console.warn("[bytebeam] mammoth module missing extractRawText")
    return null
  } catch (error) {
    console.error("[bytebeam] Failed to load mammoth:", error)
    return null
  }
}

export async function extractTextFromDocument(
  bytes: Uint8Array,
  fileName?: string,
  mimeType?: string,
): Promise<{ text: string; warnings: string[] }> {
  const warnings: string[] = []
  const ext = fileName?.split(".").pop()?.toLowerCase() ?? ""
  const normalizedMime = mimeType?.toLowerCase() ?? ""

  try {
    if (pdfMimeTypes.has(normalizedMime) || ext === "pdf") {
      const pdfParse = await loadPdfParse()
      if (pdfParse) {
        const pdfData = await pdfParse(Buffer.from(bytes))
        return { text: pdfData.text?.trim() ?? "", warnings }
      }
      warnings.push("PDF text extraction unavailable. Falling back to UTF-8 decode.")
      return { text: decoder.decode(bytes), warnings }
    }

    if (docxMimeTypes.has(normalizedMime) || ext === "docx") {
      const mammoth = await loadMammoth()
      if (mammoth) {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
        result.messages?.forEach((msg: any) => {
          if (msg?.message) warnings.push(msg.message)
        })
        return { text: result.value?.trim() ?? "", warnings }
      }
      warnings.push("DOCX extraction unavailable. Falling back to UTF-8 decode.")
      return { text: decoder.decode(bytes), warnings }
    }

    if (docMimeTypes.has(normalizedMime) || ext === "doc") {
      warnings.push("Legacy .doc files have limited support. Attempting best-effort extraction.")
      const mammoth = await loadMammoth()
      if (mammoth) {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
        result.messages?.forEach((msg: any) => {
          if (msg?.message) warnings.push(msg.message)
        })
        return { text: result.value?.trim() ?? "", warnings }
      }
      warnings.push("DOC extraction unavailable. Falling back to UTF-8 decode.")
      return { text: decoder.decode(bytes), warnings }
    }

    if (
      textLikeMimePrefixes.some((prefix) => normalizedMime.startsWith(prefix)) ||
      ["txt", "csv", "json", "xml", "md"].includes(ext)
    ) {
      return { text: decoder.decode(bytes), warnings }
    }

    warnings.push("File type not recognized as structured text. Attempting UTF-8 decode.")
    return { text: decoder.decode(bytes), warnings }
  } catch (error) {
    warnings.push(
      error instanceof Error ? error.message : "Unknown error while extracting document text",
    )
    return { text: "", warnings }
  }
}
