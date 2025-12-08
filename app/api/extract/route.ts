import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "@/lib/openrouter"
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { upsertJobStatus, type JobMetadata, uploadOcrAnnotatedImage, uploadOriginalFile } from "@/lib/jobs/server"
import type { Database } from "@/lib/supabase/types"
import { flattenFields, type InputDocument } from "@/lib/schema"
import {
  FALLBACK_VALUE,
  computeInitialReviewMeta,
  extractResultsMeta,
  mergeResultsWithMeta,
  sanitizeResultsFromFlat,
  sanitizeResultsFromTree,
} from "@/lib/extraction-results"
import { parseMentions } from "@/lib/extraction/mentionParser"

// Multi-document input structure for API requests
export interface InputDocumentPayload {
  fieldId: string
  name: string
  data: string // base64 encoded
  type: string // mime type
}

export const runtime = "nodejs"

const pdfMimeTypes = new Set(["application/pdf"])
const docxMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])
const docMimeTypes = new Set(["application/msword"])

const textLikeMimePrefixes = ["text/", "application/json", "application/xml"]

const decoder = new TextDecoder()

function resolveLocalDotsOcrServiceUrl(): string | null {
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

const DOTS_OCR_SERVICE_URL = resolveLocalDotsOcrServiceUrl()

const DOTS_OCR_SERVICE_API_KEY =
  process.env.DOTSOCR_API_KEY || process.env.DOTS_OCR_API_KEY || ""

const rawDotsOcrEndpoint =
  process.env.HUGGINGFACE_DOTS_OCR_ENDPOINT ||
  process.env.HUGGINGFACE_DOTS_OCR_MODEL ||
  "dots/ocr"
const DOTS_OCR_ENDPOINT = rawDotsOcrEndpoint.startsWith("http")
  ? rawDotsOcrEndpoint
  : `https://api-inference.huggingface.co/models/${rawDotsOcrEndpoint}`

type PdfParseFn = (data: Buffer, options?: any) => Promise<{ text?: string }>
let pdfParseSingleton: PdfParseFn | null = null

async function loadPdfParse(): Promise<PdfParseFn | null> {
  if (pdfParseSingleton) return pdfParseSingleton
  try {
    const mod = await import("pdf-parse")
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

type MammothModule = typeof import("mammoth")
let mammothSingleton: MammothModule | null = null

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

async function extractTextFromDocument(
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

    // Fallback to UTF-8 decoding for unknown text-like content
    warnings.push("File type not recognized as structured text. Attempting UTF-8 decode.")
    return { text: decoder.decode(bytes), warnings }
  } catch (error) {
    warnings.push(
      error instanceof Error ? error.message : "Unknown error while extracting document text",
    )
    return { text: "", warnings }
  }
}

function buildFallbackFromTree(fields: any[]): any {
  const out: Record<string, any> = {}
  for (const field of fields ?? []) {
    if (field.type === "object") {
      out[field.id] = buildFallbackFromTree(field.children || [])
    } else if (field.type === "list" || field.type === "table") {
      out[field.id] = FALLBACK_VALUE
    } else {
      out[field.id] = FALLBACK_VALUE
    }
  }
  return out
}

function buildFallbackFromFlat(schema: Record<string, any>): any {
  const out: Record<string, any> = {}
  Object.entries(schema || {}).forEach(([key, column]) => {
    if (column?.type === "object" && Array.isArray(column?.children)) {
      out[key] = buildFallbackFromTree(column.children)
    } else {
      out[key] = FALLBACK_VALUE
    }
  })
  return out
}

interface DotsOcrArtifacts {
  markdown?: string
  imageData?: string
  imageContentType?: string
}

function applyFileNameFallbackToTree(results: any, fields: any[], fileName: string): any {
  const out: Record<string, any> = Array.isArray(fields) ? {} : results
  for (const field of fields ?? []) {
    const id = field?.id
    if (!id) continue
    const current = results?.[id]
    if (field.type === "object") {
      out[id] = applyFileNameFallbackToTree(current || {}, field.children || [], fileName)
    } else if (field.type === "list" || field.type === "table") {
      out[id] = current
    } else {
      if (typeof current === "string" && (current === FALLBACK_VALUE || current.trim().length === 0)) {
        out[id] = fileName
      } else {
        out[id] = current
      }
    }
  }
  return out
}

function applyFileNameFallbackToFlat(results: any, schema: Record<string, any>, fileName: string): any {
  const out: Record<string, any> = {}
  Object.entries(schema || {}).forEach(([key, column]) => {
    const current = results?.[key]
    if (column?.type === "object" && Array.isArray(column?.children)) {
      out[key] = applyFileNameFallbackToTree(current || {}, column.children, fileName)
    } else {
      if (typeof current === "string" && (current === FALLBACK_VALUE || current.trim().length === 0)) {
        out[key] = fileName
      } else {
        out[key] = current
      }
    }
  })
  return out
}

function gatherCandidateObjects(value: any): any[] {
  const out: any[] = []
  const seen = new Set<any>()
  const stack: any[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || typeof current !== "object") continue
    if (seen.has(current)) continue
    seen.add(current)
    out.push(current)
    if (Array.isArray(current)) {
      for (const entry of current) {
        stack.push(entry)
      }
    } else {
      for (const key of Object.keys(current)) {
        const next = (current as any)[key]
        if (next && typeof next === "object") {
          stack.push(next)
        }
      }
    }
  }
  return out
}

function pickFirstString(value: any): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string" && entry.trim().length > 0) {
        return entry
      }
    }
  }
  return null
}

function extractDotsOcrArtifacts(payload: any): DotsOcrArtifacts | null {
  if (!payload) return null
  const candidates = gatherCandidateObjects(payload)

  const markdownKeys = [
    "markdown",
    "md",
    "markdown_body",
    "text",
    "content",
    "rendered_markdown",
    "markdown_text",
  ]

  const imageKeys = [
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

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue
    let markdown: string | null = null
    for (const key of markdownKeys) {
      if (key in candidate) {
        markdown = pickFirstString((candidate as any)[key])
        if (markdown) break
      }
    }

    let imageData: string | null = null
    let imageContentType: string | undefined
    for (const key of imageKeys) {
      if (!(key in candidate)) continue
      const rawValue = (candidate as any)[key]
      const maybeString = pickFirstString(rawValue)
      if (maybeString) {
        imageData = maybeString
        if (typeof rawValue === "object" && rawValue) {
          const nestedType =
            typeof (rawValue as any).content_type === "string"
              ? (rawValue as any).content_type
              : typeof (rawValue as any).mime === "string"
                ? (rawValue as any).mime
                : undefined
          if (nestedType) {
            imageContentType = nestedType
          }
        }
        break
      }
    }

    if (markdown || imageData) {
      return {
        markdown: markdown ?? undefined,
        imageData: imageData ?? undefined,
        imageContentType,
      }
    }
  }

  return null
}

interface ProcessDotsOcrOptions {
  bytes: Uint8Array
  fileName?: string
  mimeType?: string
  supabase?: SupabaseClient<Database> | null
  userId?: string | null
  jobMeta?: JobMetadata | null
}

interface ProcessDotsOcrResult {
  markdown: string | null
  annotatedImageUrl: string | null
}

async function processWithDotsOCR(options: ProcessDotsOcrOptions): Promise<ProcessDotsOcrResult | null> {
  if (!options.bytes || options.bytes.length === 0) return null

  const normalizedMime = options.mimeType?.toLowerCase() ?? ""
  const ext = options.fileName?.split(".").pop()?.toLowerCase() ?? ""
  const isSupported =
    normalizedMime.startsWith("image/") ||
    normalizedMime === "application/pdf" ||
    /\.(png|jpg|jpeg|gif|bmp|webp|pdf)$/.test(`.${ext}`)
  if (!isSupported) return null

  const base64Payload = Buffer.from(options.bytes).toString("base64")

  const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)
    try {
      const response = await fetch(input, { ...init, signal: controller.signal })
      return response
    } finally {
      clearTimeout(timeout)
    }
  }

  const tryLocalService = async (): Promise<DotsOcrArtifacts | null> => {
    if (!DOTS_OCR_SERVICE_URL) return null
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (DOTS_OCR_SERVICE_API_KEY) {
        headers.Authorization = `Bearer ${DOTS_OCR_SERVICE_API_KEY}`
      }
      const response = await fetchWithTimeout(DOTS_OCR_SERVICE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          image_base64: base64Payload,
          file_name: options.fileName,
          mime_type: options.mimeType,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.error(
          `[bytebeam] Local dots.ocr service error ${response.status}: ${errorText}`,
        )
        return null
      }

      const payload = await response.json().catch((error) => {
        console.error("[bytebeam] Failed to parse local dots.ocr response:", error)
        return null
      })
      if (!payload) return null
      const artifacts = extractDotsOcrArtifacts(payload)
      if (!artifacts) {
        console.warn("[bytebeam] Local dots.ocr response missing expected artifacts")
      }
      return artifacts
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        console.warn("[bytebeam] Local dots.ocr request timed out")
        return null
      }
      console.error("[bytebeam] Local dots.ocr service failed:", error)
      return null
    }
  }

  const tryHuggingFace = async (): Promise<DotsOcrArtifacts | null> => {
    const apiKey = process.env.HUGGINGFACE_API_KEY
    if (!apiKey || !DOTS_OCR_ENDPOINT) return null
    try {
      const response = await fetchWithTimeout(DOTS_OCR_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          inputs: base64Payload,
          parameters: {
            return_markdown: true,
            return_visualization: true,
          },
          options: {
            wait_for_model: true,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`Hugging Face dots.ocr error ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get("content-type") ?? ""
      if (!contentType.includes("application/json")) {
        throw new Error(`Unexpected dots.ocr response type: ${contentType || "unknown"}`)
      }

      const payload = await response.json()
      const artifacts = extractDotsOcrArtifacts(payload)
      if (!artifacts) {
        console.warn("[bytebeam] dots.ocr response did not include markdown or annotated image")
      }
      return artifacts ?? null
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        console.warn("[bytebeam] dots.ocr request timed out")
        return null
      }
      console.error("[bytebeam] dots.ocr processing failed:", error)
      return null
    }
  }

  let artifacts = await tryLocalService()
  if (!artifacts) {
    artifacts = await tryHuggingFace()
  }

  if (!artifacts) {
    return null
  }

  const markdown = typeof artifacts.markdown === "string" ? artifacts.markdown.trim() : ""

  let annotatedImageUrl: string | null = null
  const maybePersistAnnotated = async (imageData: string): Promise<string | null> => {
    if (!options.supabase || !options.userId || !options.jobMeta || !options.jobMeta.jobId) {
      return /^https?:\/\//i.test(imageData) ? imageData : null
    }

    try {
      if (/^https?:\/\//i.test(imageData)) {
        try {
          const remoteResponse = await fetch(imageData)
          if (!remoteResponse.ok) {
            console.warn(
              `[bytebeam] Failed to fetch dots.ocr annotated image from ${imageData}: ${remoteResponse.status} ${remoteResponse.statusText}`,
            )
            return imageData
          }
          const arrayBuffer = await remoteResponse.arrayBuffer()
          const contentTypeForImage =
            artifacts.imageContentType || remoteResponse.headers.get("content-type") || undefined
          const buffer = Buffer.from(arrayBuffer)
          if (buffer.length === 0) return imageData
          return await uploadOcrAnnotatedImage(options.supabase, {
            userId: options.userId,
            jobId: options.jobMeta.jobId,
            image: buffer,
            fileName: options.fileName ?? "annotated",
            contentType: contentTypeForImage ?? "image/png",
          })
        } catch (error) {
          console.error("[bytebeam] Failed to mirror annotated image URL:", error)
          return imageData
        }
      }

      let imageBuffer: Uint8Array | null = null
      let contentTypeForImage = artifacts.imageContentType

      const dataUriMatch = imageData.match(/^data:([^;]+);base64,(.*)$/)
      if (dataUriMatch) {
        contentTypeForImage = contentTypeForImage ?? dataUriMatch[1]
        imageBuffer = Buffer.from(dataUriMatch[2], "base64")
      } else {
        imageBuffer = Buffer.from(imageData, "base64")
      }

      if (imageBuffer && imageBuffer.length > 0) {
        return await uploadOcrAnnotatedImage(options.supabase, {
          userId: options.userId,
          jobId: options.jobMeta.jobId,
          image: imageBuffer,
          fileName: options.fileName ?? "annotated",
          contentType: contentTypeForImage ?? "image/png",
        })
      }
    } catch (error) {
      console.error("[bytebeam] Failed to upload dots.ocr annotated image:", error)
    }
    return null
  }

  if (artifacts.imageData) {
    if (/^https?:\/\//i.test(artifacts.imageData)) {
      annotatedImageUrl = await maybePersistAnnotated(artifacts.imageData)
    } else {
      try {
        annotatedImageUrl = await maybePersistAnnotated(artifacts.imageData)
      } catch (error) {
        console.error("[bytebeam] Failed to process annotated image data:", error)
      }
    }
  }

  return {
    markdown: markdown.length > 0 ? markdown : null,
    annotatedImageUrl,
  }
}

interface GenerateMarkdownOptions {
  bytes: Uint8Array
  fileName?: string
  mimeType?: string
  supabase?: SupabaseClient<Database> | null
  userId?: string | null
  jobMeta?: JobMetadata | null
}

interface GenerateMarkdownResult {
  markdown: string | null
  originalFileUrl: string | null
}

async function generateMarkdownFromDocument(options: GenerateMarkdownOptions): Promise<GenerateMarkdownResult | null> {
  console.log("[bytebeam] generateMarkdownFromDocument called with:", {
    bytesLength: options.bytes?.length,
    fileName: options.fileName,
    mimeType: options.mimeType,
    hasSupabase: !!options.supabase,
    hasUserId: !!options.userId,
    hasJobMeta: !!options.jobMeta
  })

  if (!options.bytes || options.bytes.length === 0) {
    console.log("[bytebeam] No bytes provided, returning null")
    return null
  }

  const normalizedMime = options.mimeType?.toLowerCase() ?? ""
  const ext = options.fileName?.split(".").pop()?.toLowerCase() ?? ""
  const isSupported =
    normalizedMime.startsWith("image/") ||
    normalizedMime === "application/pdf" ||
    /\.(png|jpg|jpeg|gif|bmp|webp|pdf)$/.test(`.${ext}`)

  console.log("[bytebeam] File support check:", { normalizedMime, ext, isSupported })
  if (!isSupported) {
    console.log("[bytebeam] File type not supported for markdown generation")
    return null
  }

  // Upload original file to Supabase storage
  let originalFileUrl: string | null = null
  if (options.supabase && options.userId && options.jobMeta?.jobId) {
    console.log("[bytebeam] Uploading original file to storage...")
    try {
      originalFileUrl = await uploadOriginalFile(options.supabase, {
        userId: options.userId,
        jobId: options.jobMeta.jobId,
        file: options.bytes,
        fileName: options.fileName,
        contentType: options.mimeType,
      })
      console.log("[bytebeam] Original file uploaded successfully:", originalFileUrl)
    } catch (error) {
      console.error("[bytebeam] Failed to upload original file:", error)
    }
  } else {
    console.log("[bytebeam] Skipping original file upload - missing requirements:", {
      hasSupabase: !!options.supabase,
      hasUserId: !!options.userId,
      hasJobMeta: !!options.jobMeta,
      hasJobId: !!options.jobMeta?.jobId
    })
  }

  // Generate markdown using Gemini
  let markdown: string | null = null
  try {
    console.log("[bytebeam] Starting markdown generation with Gemini...")
    const base64Payload = Buffer.from(options.bytes).toString("base64")
    const mimeType = options.mimeType || "image/png"

    const prompt = `You are converting a document to clean, readable Markdown. 

Instructions:
- Extract all text content preserving the original structure
- Use proper markdown formatting (headings, lists, tables, bold, italic)
- Convert any tabular data to markdown tables
- Describe non-text elements briefly where relevant
- Focus on readability and accuracy
- Do not add interpretations or summaries, just convert the content
Return only the markdown content, no explanations.`

    console.log("[bytebeam] Calling Gemini for markdown generation...")
    const result = await generateObject({
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", image: `data:${mimeType};base64,${base64Payload}` },
          ],
        },
      ],
      schema: z.object({
        markdown: z.string().describe("The clean markdown content of the document"),
      }),
    })

    markdown = result.object.markdown?.trim() || null
    console.log("[bytebeam] Markdown generation completed, length:", markdown?.length || 0)
  } catch (error) {
    console.error("[bytebeam] Failed to generate markdown:", error)
  }

  return {
    markdown,
    originalFileUrl,
  }
}

export async function POST(request: NextRequest) {
  let ocrPromise: Promise<ProcessDotsOcrResult | null> | null = null
  let markdownPromise: Promise<GenerateMarkdownResult | null> | null = null
  try {
    console.log("[bytebeam] API route called")

    let requestData: any
    try {
      requestData = await request.json()
      console.log("[bytebeam] JSON payload parsed successfully")
    } catch (error) {
      console.log("[bytebeam] Error parsing JSON:", error)
      return NextResponse.json(
        { error: "Failed to parse request data. Please ensure you're sending valid JSON." },
        { status: 400 },
      )
    }

    const {
      file: fileData,
      schema,
      schemaTree,
      extractionPromptOverride,
      job: rawJobMeta,
      inputDocuments: inputDocsPayload,
      fieldInputDocMap,
      // Multi-document support: array of input documents keyed by field ID
    } = requestData

    // Process input documents if provided (multi-document mode)
    const inputDocuments: Map<string, InputDocumentPayload> = new Map()
    if (inputDocsPayload && typeof inputDocsPayload === 'object') {
      Object.entries(inputDocsPayload).forEach(([fieldId, doc]: [string, any]) => {
        if (doc && doc.data) {
          inputDocuments.set(fieldId, {
            fieldId,
            name: doc.name || fieldId,
            data: doc.data,
            type: doc.type || 'application/octet-stream',
          })
        }
      })
    }
    const isMultiDocumentMode = inputDocuments.size > 0
    console.log("[bytebeam] Multi-document mode:", isMultiDocumentMode, "documents:", inputDocuments.size)

    const sanitizedInputDocuments =
      isMultiDocumentMode && inputDocuments.size > 0
        ? Object.fromEntries(
          Array.from(inputDocuments.entries()).map(([fieldId, doc]) => [
            fieldId,
            {
              fieldId,
              fileName: doc.name,
              fileUrl: "",
              uploadedAt: new Date().toISOString(),
            },
          ]),
        )
        : null

    let supabase: SupabaseClient<Database> | null = null
    let userId: string | null = null
    let jobMeta: JobMetadata | null = null

    if (rawJobMeta && typeof rawJobMeta === "object") {
      if (typeof rawJobMeta.jobId === "string" && typeof rawJobMeta.schemaId === "string") {
        jobMeta = {
          jobId: rawJobMeta.jobId,
          schemaId: rawJobMeta.schemaId,
          fileName: rawJobMeta.fileName,
          agentType: rawJobMeta.agentType,
        }
        try {
          supabase = createSupabaseServerClient()
          const {
            data: { user },
          } = await supabase.auth.getUser()
          userId = user?.id ?? null
        } catch (authError) {
          console.warn("[bytebeam] Failed to resolve Supabase user for job sync:", authError)
        }
      }
    }

    const syncJob = async (patch: Parameters<typeof upsertJobStatus>[3]) => {
      if (!jobMeta || !supabase || !userId) return
      try {
        await upsertJobStatus(supabase, userId, jobMeta, patch)
      } catch (syncError) {
        console.error("[bytebeam] Failed to sync job status:", syncError)
      }
    }

    console.log("[bytebeam] Received file data:", fileData?.name, fileData?.type, fileData?.size)
    if (schemaTree) {
      console.log("[bytebeam] schemaTree received with", Array.isArray(schemaTree) ? schemaTree.length : 0, "fields")
    } else {
      console.log("[bytebeam] Schema keys:", Object.keys(schema || {}))
    }

    if (!schema && !schemaTree) {
      console.log("[bytebeam] Error: No schema received")
      return NextResponse.json({ error: "No schema was provided" }, { status: 400 })
    }

    const hasPrimaryFile = Boolean(fileData && fileData.data)
    if (!hasPrimaryFile && !isMultiDocumentMode) {
      console.log("[bytebeam] Error: No file data received")
      return NextResponse.json({ error: "No file was uploaded or file is invalid" }, { status: 400 })
    }

    // Decode base64 safely in Node runtime for single-file mode
    const buffer = hasPrimaryFile ? Buffer.from(String(fileData?.data), "base64") : Buffer.from([])
    const bytes = new Uint8Array(buffer)

    console.log("[bytebeam] File converted from base64, size:", bytes.length)

    if (hasPrimaryFile && bytes.length === 0) {
      console.log("[bytebeam] Error: Empty file received")
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 })
    }

    const originalMimeType = fileData?.type ?? ""
    const fileMimeType = originalMimeType.toLowerCase()
    const fileName = fileData?.name ?? "uploaded"
    const fileExt = fileName.toLowerCase()
    const isImageFile =
      fileMimeType.startsWith("image/") || fileExt.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/)
    const isPdfFile = fileMimeType === "application/pdf" || fileExt.endsWith(".pdf")
    // dots.ocr is disabled; send files directly to OpenRouter instead
    const shouldProcessDotsOcr = false
    const shouldGenerateMarkdown = hasPrimaryFile && (isImageFile || isPdfFile)

    await syncJob({
      status: "processing",
      results: null,
      completedAt: null,
      ocrMarkdown: null,
      ocrAnnotatedImageUrl: null,
      inputDocuments: sanitizedInputDocuments ?? undefined,
    })

    if (shouldProcessDotsOcr && !DOTS_OCR_SERVICE_URL && !process.env.HUGGINGFACE_API_KEY) {
      console.warn("[bytebeam] HUGGINGFACE_API_KEY is not set and no local dots.ocr service configured; skipping dots.ocr processing")
    }

    ocrPromise = shouldProcessDotsOcr
      ? processWithDotsOCR({
        bytes,
        fileName,
        mimeType: originalMimeType || fileMimeType,
        supabase,
        userId,
        jobMeta,
      }).catch((error) => {
        console.error("[bytebeam] dots.ocr promise failed:", error)
        return null
      })
      : Promise.resolve<ProcessDotsOcrResult | null>(null)

    // Generate markdown and upload original file in parallel
    console.log("[bytebeam] Setting up markdown generation, shouldProcessDotsOcr:", shouldProcessDotsOcr)
    markdownPromise = shouldGenerateMarkdown
      ? generateMarkdownFromDocument({
        bytes,
        fileName,
        mimeType: originalMimeType || fileMimeType,
        supabase,
        userId,
        jobMeta,
      }).catch((error) => {
        console.error("[bytebeam] markdown generation promise failed:", error)
        return null
      })
      : Promise.resolve<GenerateMarkdownResult | null>(null)

    // Build Zod schema (nested or flat) for AI SDK
    const schemaLines: string[] = []
    const makePrimitive = (column: any) => {
      const type = column.type === "decimal" ? "number" : column.type
      let prop: z.ZodTypeAny
      switch (type) {
        case "number":
          prop = z.number()
          if (column.constraints?.min !== undefined) prop = prop.min(column.constraints.min)
          if (column.constraints?.max !== undefined) prop = prop.max(column.constraints.max)
          break
        case "boolean":
          prop = z.boolean()
          break
        case "single_select": {
          // Constrain to predefined options only
          const options = column.constraints?.options || []
          if (options.length > 0) {
            // Create enum with options + fallback value
            prop = z.union([z.enum(options as [string, ...string[]]), z.literal("-")])
          } else {
            // No options defined, fallback to string
            prop = z.string()
          }
          break
        }
        case "multi_select": {
          // Constrain to array of predefined options only
          const options = column.constraints?.options || []
          if (options.length > 0) {
            // Create array of enum values
            prop = z.array(z.enum(options as [string, ...string[]]))
          } else {
            // No options defined, fallback to string array
            prop = z.array(z.string())
          }
          break
        }
        case "date": {
          const dateRegex = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
          prop = z.union([dateRegex, z.literal("-")])
          if (column.constraints?.minLength !== undefined) prop = prop.min(column.constraints.minLength)
          if (column.constraints?.maxLength !== undefined) prop = prop.max(column.constraints.maxLength)
          break
        }
        case "email":
          prop = z.union([z.string().email(), z.literal("-")])
          if (column.constraints?.minLength !== undefined) prop = prop.min(column.constraints.minLength)
          if (column.constraints?.maxLength !== undefined) prop = prop.max(column.constraints.maxLength)
          break
        case "url":
          prop = z.union([z.string().url(), z.literal("-")])
          if (column.constraints?.minLength !== undefined) prop = prop.min(column.constraints.minLength)
          if (column.constraints?.maxLength !== undefined) prop = prop.max(column.constraints.maxLength)
          break
        case "richtext":
        case "address":
        case "phone":
        case "string":
        default:
          prop = z.string()
          if (column.constraints?.minLength !== undefined) prop = prop.min(column.constraints.minLength)
          if (column.constraints?.maxLength !== undefined) prop = prop.max(column.constraints.maxLength)
          break
      }
      return prop
    }

    const metaSchema = z.object({
      confidence: z
        .array(
          z.object({
            fieldId: z.string(),
            value: z.number().min(0).max(1),
          }),
        )
        .optional(),
    })

    const buildObjectFromTree = (
      fields: any[],
      options?: { includeMeta?: boolean },
    ): z.ZodObject<any> => {
      const shape: Record<string, z.ZodTypeAny> = {}
      for (const field of fields) {
        const desc = `${field.description || ""} ${field.extractionInstructions || ""}`.trim()
        if (field.type === "object") {
          const obj = buildObjectFromTree(field.children || [], { includeMeta: false })
          let prop: z.ZodTypeAny = obj
          // Avoid unions in provider schema; prefer optional over nullable for objects
          prop = prop.optional()
          if (desc) prop = prop.describe(desc)
          shape[field.id] = prop
          const line = `- ${field.name} [object]${desc ? `: ${desc}` : ""}`
          schemaLines.push(line)
        } else if (field.type === "list") {
          const item = field.item
          let zItem: z.ZodTypeAny
          if (item?.type === "object") {
            zItem = buildObjectFromTree(item.children || [], { includeMeta: false })
          } else {
            zItem = makePrimitive(item || { type: "string" })
          }
          let prop: z.ZodTypeAny = z.array(zItem)
          // Avoid nullable on arrays to prevent anyOf in items
          prop = prop.optional()
          if (desc) prop = prop.describe(desc)
          shape[field.id] = prop
          const line = `- ${field.name} [list]${desc ? `: ${desc}` : ""}`
          schemaLines.push(line)
        } else if (field.type === "table") {
          const rowObj = buildObjectFromTree(field.columns || [], { includeMeta: false })
          let prop: z.ZodTypeAny = z.array(rowObj)
          prop = prop.optional()
          if (desc) prop = prop.describe(desc)
          shape[field.id] = prop
          const line = `- ${field.name} [table]${desc ? `: ${desc}` : ""}`
          schemaLines.push(line)
        } else {
          let prop = makePrimitive(field)
          prop = prop.nullable()
          if (desc) prop = prop.describe(desc)
          shape[field.id] = prop
          const typeLabel = field.type

          // Add options to schema summary for select fields
          let optionsText = ""
          if ((field.type === "single_select" || field.type === "multi_select") && field.constraints?.options?.length > 0) {
            const optionsList = field.constraints.options.join(", ")
            optionsText = ` (Options: ${optionsList})`
          }

          schemaLines.push(`- ${field.name} [${typeLabel}]${optionsText}${desc ? `: ${desc}` : ""}`)
        }
      }
      const base = z.object(shape).strict()
      if (options?.includeMeta) {
        return base
          .extend({
            __meta__: metaSchema.optional(),
          })
          .strict()
      }
      return base
    }

    let zodSchema: z.ZodObject<any>
    if (schemaTree && Array.isArray(schemaTree)) {
      zodSchema = buildObjectFromTree(schemaTree, { includeMeta: true })
    } else {
      // Back-compat: flat map schema
      const zodShape: Record<string, z.ZodTypeAny> = {}
      Object.entries(schema).forEach(([key, column]: [string, any]) => {
        const desc = `${column.description || ""} ${column.extractionInstructions || ""}`.trim()
        const type = column.type === "decimal" ? "number" : column.type
        let prop: z.ZodTypeAny
        if (type === "list") {
          // Provider does not like nullable arrays; use optional
          prop = z.array(z.string()).optional()
        } else {
          prop = makePrimitive(column).nullable()
        }
        if (desc) prop = prop.describe(desc)
        zodShape[key] = prop
        const typeLabel = type === "list" ? "list (array)" : type
        const name = column.name || key

        // Add options to schema summary for select fields
        let optionsText = ""
        if ((column.type === "single_select" || column.type === "multi_select") && column.constraints?.options?.length > 0) {
          const optionsList = column.constraints.options.join(", ")
          optionsText = ` (Options: ${optionsList})`
        }

        schemaLines.push(`- ${name} [${typeLabel}]${optionsText}${desc ? `: ${desc}` : ""}`)
      })
      zodSchema = z
        .object({
          ...zodShape,
          __meta__: metaSchema.optional(),
        })
        .strict()
    }
    console.log("[bytebeam] Built Zod schema for Gemini")

    const schemaSummary = `Schema Fields:\n${schemaLines.join("\n")}`

    let documentContent: any
    let extractionPrompt: string

    const warnings: string[] = []

    if (isMultiDocumentMode) {
      const docNameById = new Map<string, string>()
      inputDocuments.forEach((doc, id) => {
        docNameById.set(id, doc.name || id)
      })

      const fieldDocHints =
        fieldInputDocMap && typeof fieldInputDocMap === 'object'
          ? (fieldInputDocMap as Record<string, string[]>)
          : {}
      const routingLines = Object.entries(fieldDocHints).map(
        ([fieldId, docIds]) =>
          `- ${fieldId}: ${docIds.map((id) => docNameById.get(id) || id).join(", ")}`,
      )

      const routingText = routingLines.length > 0
        ? `Document routing (use only these documents for each field):\n${routingLines.join("\n")}`
        : "No explicit document routing provided; use the content of the attached documents as needed."

      const baseText = extractionPromptOverride
        ? `${extractionPromptOverride}\n\n${routingText}\n\nSchema Fields (for reference):\n${schemaSummary}`
        : `You are a specialized AI model for structured data extraction. Multiple input documents are attached. Use only the documents referenced for each field (see routing below). Do not cross-contaminate data between documents.\n\n${routingText}\n\n${schemaSummary}

Guidelines:
- Strictly adhere to the schema. Do not add or remove fields.
- If a field is not present in its referenced document(s), return "-" (a single hyphen). Do not guess.
- Respect data types and formatting instructions supplied in the schema.
- Provide a "__meta__" object with a "confidence" array. Each entry must contain a "fieldId" and a "value" between 0 and 1 describing your confidence in that field. Every field must appear exactly once in the confidence array. Use 1.0 only when highly certain; use 0.0 when the value is "-" or uncertain.`

      const contents: any[] = [{ type: "text", text: baseText }]

      inputDocuments.forEach((doc, fieldId) => {
        const mimeType = doc.type || "application/octet-stream"
        contents.push({
          type: "text",
          text: `Document "${doc.name || fieldId}" (input id: ${fieldId})`,
        })
        contents.push({
          type: "image",
          image: `data:${mimeType};base64,${doc.data}`,
        })
      })

      documentContent = contents
      extractionPrompt = ""
    } else {
      let extractedDocumentText = ""
      if (!isImageFile) {
        const extraction = await extractTextFromDocument(bytes, fileName, fileMimeType)
        extractedDocumentText = extraction.text
        warnings.push(...extraction.warnings)
      }

      if (isImageFile) {
        console.log("[bytebeam] Processing as image file...")

        // Build base64 without spreading large arrays (prevents stack issues)
        const base64 = Buffer.from(bytes).toString("base64")
        const mimeType = originalMimeType || fileMimeType || "image/png"

        console.log("[bytebeam] Image processed, base64 length:", base64.length)

        const baseText = extractionPromptOverride
          ? `${extractionPromptOverride}\n\nSchema Fields (for reference):\n${schemaSummary}`
          : `You are a specialized AI model for structured data extraction. Your purpose is to accurately extract information from the given image based on a dynamic, user-provided schema.\n\n${schemaSummary}

Here are the guiding principles for your operation:

Strict Adherence to Schema: The primary goal is to populate the fields defined in the schema. You must not add, omit, or alter any fields. The structure of your output must perfectly match the provided schema.

Confidence Reporting: You must include a confidence entry for every leaf field in the schema. Use 1.0 only when you are highly certain the extracted value is correct. Use 0 when the value is "-" or otherwise uncertain. Do not omit fields from the confidence array.

Contextual Extraction: Analyze the image content carefully to understand the context and ensure the extracted data correctly corresponds to the schema's field descriptions.

No Hallucination: If a piece of information for a specific field cannot be found in the image, you must use "-" (a single hyphen) as the value for that field. Do not invent, infer, or guess information.

Data Type Integrity: Ensure the extracted data conforms to the data type specified in the schema (e.g., number, string, boolean, array). Format dates according to ISO 8601 (YYYY-MM-DD) unless the schema specifies otherwise. Use "-" only when the information is truly unavailable.

Extract the information from the image according to the schema. Think about your answer first before you respond.

Follow these steps:
1. Carefully analyze the provided schema to understand each field, its data type, and its description.
2. Examine the entire image to locate the information corresponding to each field in the schema.
3. For each field, extract the precise data from the image that matches the field's description and context.
4. If information for a field is not present in the image, return "-" as its value.
5. Construct the final JSON object, ensuring it strictly validates against the provided schema and contains no extra text or explanations.
6. Include a "__meta__" object with a "confidence" array. Each entry must be an object with keys "fieldId" (the schema field ID) and "value" (a decimal between 0 and 1 representing your confidence in that field). Every leaf field must appear exactly once in this array.`

        documentContent = [
          { type: "text", text: baseText },
          { type: "image", image: `data:${mimeType};base64,${base64}` },
        ]

        extractionPrompt = "" // Not used for multimodal content
      } else if (isPdfFile) {
        console.log("[bytebeam] Processing as PDF file...")

        const baseInstructions = extractionPromptOverride
          ? `${extractionPromptOverride}\n\nSchema Fields (for reference):\n${schemaSummary}`
          : `You are a specialized AI model for structured data extraction. A PDF document is attached. Read it carefully (including any scanned pages) and extract information according to the provided schema.\n\n${schemaSummary}

Guidelines:
- Strictly adhere to the schema. Do not add or remove fields.
- If a field is not present in the document, return "-" (a single hyphen) for that field. Do not guess.
- Respect data types and formatting instructions supplied in the schema.
- Where possible, cross-verify values across the PDF to ensure accuracy.
- Provide a "__meta__" object with a "confidence" array. Each entry must contain a "fieldId" and a "value" between 0 and 1 describing your confidence in that field.
- Every field defined in the schema must appear exactly once in the confidence array. Use 1.0 only when you are highly certain; use 0.0 when the value is "-" or uncertain.`

        const base64 = Buffer.from(bytes).toString("base64")
        const mimeType = originalMimeType || fileMimeType || "application/pdf"

        documentContent = [
          { type: "text", text: baseInstructions },
          { type: "image", image: `data:${mimeType};base64,${base64}` },
        ]
        extractionPrompt = ""

        if (extractedDocumentText.trim().length > 0) {
          let supplemental = extractedDocumentText
          const maxSupplementalChars = 15_000
          if (supplemental.length > maxSupplementalChars) {
            supplemental = `${supplemental.slice(0, maxSupplementalChars)}\n\n[Truncated supplemental text due to length]`
            warnings.push(
              `Supplemental extracted text truncated to ${maxSupplementalChars} characters to stay within model limits.`,
            )
          }
          // Provide extracted text as supplemental context only when available
          documentContent.push({
            type: "text",
            text: `Supplemental extracted text (may be incomplete OCR):\n${supplemental}`,
          })
        }

        extractionPrompt = ""
      } else {
        console.log("[bytebeam] Processing as text-based document...", originalMimeType || fileMimeType || fileName)

        console.log("[bytebeam] Document text length:", extractedDocumentText.length)

        if (extractedDocumentText.trim().length === 0) {
          console.log("[bytebeam] No readable text detected; returning fallback results")
          const fallback = schemaTree && Array.isArray(schemaTree)
            ? buildFallbackFromTree(schemaTree)
            : buildFallbackFromFlat(schema)
          const reviewMeta = computeInitialReviewMeta(fallback, {
            handledWithFallback: true,
            fallbackReason: "No readable text detected.",
          })
          const confidenceMap = Object.fromEntries(
            Object.entries(reviewMeta).map(([fieldId, meta]) => [fieldId, meta.confidence ?? null]),
          )
          const fallbackWithMeta = mergeResultsWithMeta(fallback, {
            review: reviewMeta,
            confidence: confidenceMap,
          })
          warnings.push("No readable text detected. Returned '-' for all fields.")
          const ocrResult = ocrPromise ? await ocrPromise : null
          const markdownResult = markdownPromise ? await markdownPromise : null
          const completedAt = new Date()
          await syncJob({
            status: "completed",
            results: fallbackWithMeta,
            completedAt,
          errorMessage: "No readable text detected",
          ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
          ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
          originalFileUrl: markdownResult?.originalFileUrl ?? null,
          inputDocuments: sanitizedInputDocuments ?? undefined,
        })
          return NextResponse.json(
            {
              success: true,
              results: fallbackWithMeta,
              warnings,
              handledWithFallback: true,
              ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
              ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
              originalFileUrl: markdownResult?.originalFileUrl ?? null,
            },
            { status: 200 },
          )
        }

        extractionPrompt = extractionPromptOverride
          ? `${extractionPromptOverride}

Schema Fields (for reference):
${schemaSummary}

Document:
${extractedDocumentText}`
          : `You are a specialized AI model for structured data extraction. Your purpose is to accurately extract information from a given document based on a dynamic, user-provided schema.\n\n${schemaSummary}

Here are the guiding principles for your operation:

Strict Adherence to Schema: The primary goal is to populate the fields defined in the schema. You must not add, omit, or alter any fields. The structure of your output must perfectly match the provided schema.

Contextual Extraction: Do not just match keywords. Understand the context of the document to ensure the extracted data correctly corresponds to the schema's field descriptions.

No Hallucination: If a piece of information for a specific field cannot be found in the document, you must use "-" (a single hyphen) as the value for that field. Do not invent, infer, or guess information.

Data Type Integrity: Ensure the extracted data conforms to the data type specified in the schema (e.g., number, string, boolean, array). Format dates according to ISO 8601 (YYYY-MM-DD) unless the schema specifies otherwise. Use "-" only when the information is truly unavailable.

Select Field Constraints: For single_select and multi_select fields, you MUST only choose from the predefined options listed in parentheses. Do not create new values or variations - only use the exact options provided. If none of the options match the document, use "-".

Confidence Reporting: You must include a confidence entry for every field listed in the schema. Use 1.0 only when you are highly certain the extracted value is correct. Use 0.0 when the value is "-" or when you are unsure. Do not omit any fields from the confidence array.

Here is the document to process:
${extractedDocumentText}

Extract the information from the document according to the schema. Think about your answer first before you respond.

Follow these steps:
1. Carefully analyze the provided schema to understand each field, its data type, and its description.
2. Read through the entire document to locate the information corresponding to each field in the schema.
3. For each field, extract the precise data from the document that matches the field's description and context.
4. If information for a field is not present in the document, return "-" as its value.
5. Construct the final JSON object, ensuring it strictly validates against the provided schema and contains no extra text or explanations.
6. Add a "__meta__" object with a "confidence" array where each item includes a "fieldId" and a "value" between 0 and 1 indicating your confidence in that field's value. Every field must appear exactly once in this array.`
      }
    }

    console.log("[bytebeam] Processing with Gemini...")

    try {
      const result = await generateObject({
        temperature: 0.2,
        messages: documentContent
          ? [
            {
              role: "user",
              content: documentContent,
            },
          ]
          : [
            {
              role: "user",
              content: extractionPrompt,
            },
          ],
        schema: zodSchema,
      })

      console.log("[bytebeam] Extraction successful:", result.object)

      const { values: modelValues, meta: modelMeta } = extractResultsMeta(result.object as Record<string, any>)

      const rawForSanitization = modelValues ?? (result.object as Record<string, any>)

      let sanitizedResults = schemaTree && Array.isArray(schemaTree)
        ? sanitizeResultsFromTree(schemaTree, rawForSanitization)
        : sanitizeResultsFromFlat(schema, rawForSanitization)

      // Fill empty string results ("-") with the file name so inputs are not left blank
      sanitizedResults = schemaTree && Array.isArray(schemaTree)
        ? applyFileNameFallbackToTree(sanitizedResults, schemaTree, fileName)
        : applyFileNameFallbackToFlat(sanitizedResults, schema, fileName)

      const expectedFieldIds = schemaTree && Array.isArray(schemaTree)
        ? Array.from(
          new Set(
            flattenFields(schemaTree as any)
              .map((field) => field?.id)
              .filter((id): id is string => typeof id === "string" && !id.startsWith("__")),
          ),
        )
        : Object.keys((schema ?? result.schema ?? result.data?.schema ?? {})).filter((id) => !id.startsWith("__"))

      const reviewMeta = computeInitialReviewMeta(sanitizedResults, {
        confidenceByField: modelMeta?.confidence,
        confidenceThreshold: 0.5,
        fallbackReason: warnings.length > 0 ? warnings.join(" ") : undefined,
      })

      if (expectedFieldIds.length > 0) {
        const providedConfidence = modelMeta?.confidence ?? {}
        const missingConfidenceFields = expectedFieldIds.filter((fieldId) => !(fieldId in (providedConfidence || {})))
        if (missingConfidenceFields.length > 0) {
          console.warn(
            `[bytebeam] Missing confidence entries for fields: ${missingConfidenceFields.join(", ")}`,
          )
        }
      }

      const resultsWithMeta = mergeResultsWithMeta(sanitizedResults, {
        review: reviewMeta,
        confidence: modelMeta?.confidence,
      })

      const completedAt = new Date()
      const ocrResult = ocrPromise ? await ocrPromise : null
      const markdownResult = markdownPromise ? await markdownPromise : null

      console.log("[bytebeam] Final results before sync:", {
        ocrMarkdown: ocrResult?.markdown?.length || 0,
        ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl,
        originalFileUrl: markdownResult?.originalFileUrl,
        markdownFromGeneration: markdownResult?.markdown?.length || 0
      })

      const responsePayload = {
        success: true,
        results: resultsWithMeta,
        warnings,
        ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
        ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
        originalFileUrl: markdownResult?.originalFileUrl ?? null,
      }
      await syncJob({
        status: "completed",
        results: resultsWithMeta,
        completedAt,
        ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
        ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
        originalFileUrl: markdownResult?.originalFileUrl ?? null,
        inputDocuments: sanitizedInputDocuments ?? undefined,
      })
      return NextResponse.json(responsePayload)
    } catch (modelError) {
      console.error("[bytebeam] Model extraction failed, returning fallback:", modelError)
      const fallback = schemaTree && Array.isArray(schemaTree)
        ? buildFallbackFromTree(schemaTree)
        : buildFallbackFromFlat(schema)
      warnings.push(
        "Automatic extraction failed, so we returned '-' for each field instead. Please review and retry.",
      )
      const reviewMeta = computeInitialReviewMeta(fallback, {
        handledWithFallback: true,
        fallbackReason:
          modelError instanceof Error ? modelError.message : String(modelError ?? "Unknown error"),
      })
      const confidenceMap = Object.fromEntries(
        Object.entries(reviewMeta).map(([fieldId, meta]) => [fieldId, meta.confidence ?? null]),
      )
      const fallbackWithMeta = mergeResultsWithMeta(fallback, {
        review: reviewMeta,
        confidence: confidenceMap,
      })

      const ocrResult = ocrPromise ? await ocrPromise : null
      const markdownResult = markdownPromise ? await markdownPromise : null
      const completedAt = new Date()
      await syncJob({
        status: "completed",
        results: fallbackWithMeta,
        completedAt,
        errorMessage: modelError instanceof Error ? modelError.message : String(modelError ?? "Unknown error"),
        ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
        ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
        originalFileUrl: markdownResult?.originalFileUrl ?? null,
        inputDocuments: sanitizedInputDocuments ?? undefined,
      })
      return NextResponse.json({
        success: true,
        results: fallbackWithMeta,
        warnings,
        handledWithFallback: true,
        error: modelError instanceof Error ? modelError.message : String(modelError ?? "Unknown error"),
        ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
        ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
        originalFileUrl: markdownResult?.originalFileUrl ?? null,
      })
    }
  } catch (error) {
    console.error("[bytebeam] Extraction error:", error)
    const ocrResult = ocrPromise ? await ocrPromise : null
    const markdownResult = markdownPromise ? await markdownPromise : null
    const completedAt = new Date()
    await syncJob({
      status: "error",
      completedAt,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
      ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
      originalFileUrl: markdownResult?.originalFileUrl ?? null,
      inputDocuments: sanitizedInputDocuments ?? undefined,
    })
    return NextResponse.json(
      {
        error: "Failed to extract data",
        details: error instanceof Error ? error.message : "Unknown error",
        ocrMarkdown: markdownResult?.markdown ?? ocrResult?.markdown ?? null,
        ocrAnnotatedImageUrl: ocrResult?.annotatedImageUrl ?? null,
        originalFileUrl: markdownResult?.originalFileUrl ?? null,
      },
      { status: 500 },
    )
  }
}
