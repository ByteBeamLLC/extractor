import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { google } from "@ai-sdk/google"

export const runtime = "nodejs"

const FALLBACK_VALUE = "-"

const pdfMimeTypes = new Set(["application/pdf"])
const docxMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])
const docMimeTypes = new Set(["application/msword"])

const textLikeMimePrefixes = ["text/", "application/json", "application/xml"]

const decoder = new TextDecoder()

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

function sanitizeResultsFromTree(fields: any[], raw: any): any {
  const out: Record<string, any> = {}
  for (const field of fields ?? []) {
    const value = raw?.[field.id]
    if (field.type === "object") {
      const nextRaw =
        value && typeof value === "object" && !Array.isArray(value) ? value : undefined
      out[field.id] = sanitizeResultsFromTree(field.children || [], nextRaw ?? {})
    } else if (field.type === "list" || field.type === "table") {
      if (Array.isArray(value) && value.length > 0) {
        out[field.id] = value
      } else {
        out[field.id] = FALLBACK_VALUE
      }
    } else {
      out[field.id] = normalizeScalarValue(value)
    }
  }
  return out
}

function sanitizeResultsFromFlat(schema: Record<string, any>, raw: any): any {
  const out: Record<string, any> = {}
  Object.entries(schema || {}).forEach(([key]) => {
    const value = raw?.[key]
    out[key] = normalizeScalarValue(value)
  })
  return out
}

function normalizeScalarValue(value: any): any {
  if (value === undefined || value === null) return FALLBACK_VALUE
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed === "" || trimmed === FALLBACK_VALUE ? FALLBACK_VALUE : value
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value : FALLBACK_VALUE
  }
  if (typeof value === "object") {
    return Object.keys(value).length > 0 ? value : FALLBACK_VALUE
  }
  if (typeof value === "number" && Number.isNaN(value)) return FALLBACK_VALUE
  return value
}

export async function POST(request: NextRequest) {
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

    const { file: fileData, schema, schemaTree, extractionPromptOverride } = requestData

    console.log("[bytebeam] Received file data:", fileData?.name, fileData?.type, fileData?.size)
    if (schemaTree) {
      console.log("[bytebeam] schemaTree received with", Array.isArray(schemaTree) ? schemaTree.length : 0, "fields")
    } else {
      console.log("[bytebeam] Schema keys:", Object.keys(schema || {}))
    }

    if (!fileData || !fileData.data) {
      console.log("[bytebeam] Error: No file data received")
      return NextResponse.json({ error: "No file was uploaded or file is invalid" }, { status: 400 })
    }

    if (!schema && !schemaTree) {
      console.log("[bytebeam] Error: No schema received")
      return NextResponse.json({ error: "No schema was provided" }, { status: 400 })
    }

    // Decode base64 safely in Node runtime
    const buffer = Buffer.from(String(fileData.data), "base64")
    const bytes = new Uint8Array(buffer)

    console.log("[bytebeam] File converted from base64, size:", bytes.length)

    if (bytes.length === 0) {
      console.log("[bytebeam] Error: Empty file received")
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 })
    }

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
        case "date":
          prop = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
          if (column.constraints?.minLength !== undefined) prop = prop.min(column.constraints.minLength)
          if (column.constraints?.maxLength !== undefined) prop = prop.max(column.constraints.maxLength)
          break
        case "email":
          prop = z.string().email()
          if (column.constraints?.minLength !== undefined) prop = prop.min(column.constraints.minLength)
          if (column.constraints?.maxLength !== undefined) prop = prop.max(column.constraints.maxLength)
          break
        case "url":
          prop = z.string().url()
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

    const buildObjectFromTree = (fields: any[]): z.ZodObject<any> => {
      const shape: Record<string, z.ZodTypeAny> = {}
      for (const field of fields) {
        const desc = `${field.description || ""} ${field.extractionInstructions || ""}`.trim()
        if (field.type === "object") {
          const obj = buildObjectFromTree(field.children || [])
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
            zItem = buildObjectFromTree(item.children || [])
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
          const rowObj = buildObjectFromTree(field.columns || [])
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
          schemaLines.push(`- ${field.name} [${typeLabel}]${desc ? `: ${desc}` : ""}`)
        }
      }
      return z.object(shape).strict()
    }

    let zodSchema: z.ZodObject<any>
    if (schemaTree && Array.isArray(schemaTree)) {
      zodSchema = buildObjectFromTree(schemaTree)
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
        schemaLines.push(`- ${name} [${typeLabel}]${desc ? `: ${desc}` : ""}`)
      })
      zodSchema = z.object(zodShape).strict()
    }
    console.log("[bytebeam] Built Zod schema for Gemini")

    const schemaSummary = `Schema Fields:\n${schemaLines.join("\n")}`

    let documentContent: any
    let extractionPrompt: string

    const fileName = fileData.name ?? "uploaded"
    const fileType = (fileData.type ?? "").toLowerCase()
    const fileExt = fileName.toLowerCase()
    const isImageFile =
      fileType.startsWith("image/") || fileExt.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/)
    const isPdfFile = fileType === "application/pdf" || fileExt.endsWith(".pdf")

    const warnings: string[] = []

    let extractedDocumentText = ""
    if (!isImageFile) {
      const extraction = await extractTextFromDocument(bytes, fileName, fileType)
      extractedDocumentText = extraction.text
      warnings.push(...extraction.warnings)
    }

    if (isImageFile) {
      console.log("[bytebeam] Processing as image file...")

      // Build base64 without spreading large arrays (prevents stack issues)
      const base64 = Buffer.from(bytes).toString("base64")
      const mimeType = fileType || "image/png"

      console.log("[bytebeam] Image processed, base64 length:", base64.length)

      const baseText = extractionPromptOverride
        ? `${extractionPromptOverride}\n\nSchema Fields (for reference):\n${schemaSummary}`
        : `You are a specialized AI model for structured data extraction. Your purpose is to accurately extract information from the given image based on a dynamic, user-provided schema.\n\n${schemaSummary}

Here are the guiding principles for your operation:

Strict Adherence to Schema: The primary goal is to populate the fields defined in the schema. You must not add, omit, or alter any fields. The structure of your output must perfectly match the provided schema.

Contextual Extraction: Analyze the image content carefully to understand the context and ensure the extracted data correctly corresponds to the schema's field descriptions.

No Hallucination: If a piece of information for a specific field cannot be found in the image, you must use "-" (a single hyphen) as the value for that field. Do not invent, infer, or guess information.

Data Type Integrity: Ensure the extracted data conforms to the data type specified in the schema (e.g., number, string, boolean, array). Format dates according to ISO 8601 (YYYY-MM-DD) unless the schema specifies otherwise. Use "-" only when the information is truly unavailable.

Extract the information from the image according to the schema. Think about your answer first before you respond.

Follow these steps:
1. Carefully analyze the provided schema to understand each field, its data type, and its description.
2. Examine the entire image to locate the information corresponding to each field in the schema.
3. For each field, extract the precise data from the image that matches the field's description and context.
4. If information for a field is not present in the image, return "-" as its value.
5. Construct the final JSON object, ensuring it strictly validates against the provided schema and contains no extra text or explanations.`

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
- Where possible, cross-verify values across the PDF to ensure accuracy.`

      documentContent = [
        { type: "text", text: baseInstructions },
        {
          type: "file",
          mediaType: fileType || "application/pdf",
          data: Buffer.from(bytes),
        },
      ]

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
      console.log("[bytebeam] Processing as text-based document...", fileType || fileName)

      console.log("[bytebeam] Document text length:", extractedDocumentText.length)

      if (extractedDocumentText.trim().length === 0) {
        console.log("[bytebeam] No readable text detected; returning fallback results")
        const fallback = schemaTree && Array.isArray(schemaTree)
          ? buildFallbackFromTree(schemaTree)
          : buildFallbackFromFlat(schema)
        warnings.push("No readable text detected. Returned '-' for all fields.")
        return NextResponse.json(
          {
            success: true,
            results: fallback,
            warnings,
            handledWithFallback: true,
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

Here is the document to process:
${extractedDocumentText}

Extract the information from the document according to the schema. Think about your answer first before you respond.

Follow these steps:
1. Carefully analyze the provided schema to understand each field, its data type, and its description.
2. Read through the entire document to locate the information corresponding to each field in the schema.
3. For each field, extract the precise data from the document that matches the field's description and context.
4. If information for a field is not present in the document, return "-" as its value.
5. Construct the final JSON object, ensuring it strictly validates against the provided schema and contains no extra text or explanations.`
    }

    console.log("[bytebeam] Processing with Gemini...")

    try {
      const result = await generateObject({
        model: google("gemini-2.5-pro"),
        temperature: 0.2,
        messages: documentContent
          ? [
              {
                role: "user",
                content: documentContent,
              },
            ]
          : undefined,
        prompt: documentContent ? undefined : extractionPrompt,
        schema: zodSchema,
      })

      console.log("[bytebeam] Extraction successful:", result.object)

      const sanitizedResults = schemaTree && Array.isArray(schemaTree)
        ? sanitizeResultsFromTree(schemaTree, result.object)
        : sanitizeResultsFromFlat(schema, result.object)

      return NextResponse.json({
        success: true,
        results: sanitizedResults,
        warnings,
      })
    } catch (modelError) {
      console.error("[bytebeam] Model extraction failed, returning fallback:", modelError)
      const fallback = schemaTree && Array.isArray(schemaTree)
        ? buildFallbackFromTree(schemaTree)
        : buildFallbackFromFlat(schema)
      warnings.push(
        "Automatic extraction failed, so we returned '-' for each field instead. Please review and retry.",
      )
      return NextResponse.json({
        success: true,
        results: fallback,
        warnings,
        handledWithFallback: true,
        error: modelError instanceof Error ? modelError.message : String(modelError ?? "Unknown error"),
      })
    }
  } catch (error) {
    console.error("[bytebeam] Extraction error:", error)
    return NextResponse.json(
      {
        error: "Failed to extract data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
