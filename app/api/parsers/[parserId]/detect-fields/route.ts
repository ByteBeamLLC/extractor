import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { generateText } from "@/lib/openrouter"
import {
  extractTextFromDocument,
  isImageFile,
  isPdfFile,
} from "@/lib/extraction/api"
import { getStorage } from "@/lib/infra/adapters/s3Storage"
import { getSignedFileUrl } from "@/lib/storage/fileUrl"
import { PDFDocument } from "pdf-lib"

export const runtime = "nodejs"

export const maxDuration = 60

/** Flash for simple docs, Pro for complex multi-page PDFs. */
const FLASH_MODEL = "google/gemini-2.5-flash"
/** Page threshold: PDFs with more pages than this use Pro. */
const PRO_PAGE_THRESHOLD = 3
/** Max pages to send for field detection (schema is established early). */
const MAX_SAMPLE_PAGES = 5

/**
 * POST /api/parsers/[parserId]/detect-fields
 *
 * Accepts a storage_path (file already uploaded to S3 via presigned URL)
 * and uses AI to suggest extraction fields.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify parser ownership
  const { data: parser, error: parserError } = await supabase
    .from("parsers" as any)
    .select("id, user_id")
    .eq("id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (parserError || !parser) {
    return NextResponse.json({ error: "Parser not found" }, { status: 404 })
  }

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const storagePath = body.storage_path as string | undefined
  const fileName = (body.file_name as string) ?? "uploaded"
  const mimeType = ((body.file_type as string) ?? "").toLowerCase()

  if (!storagePath) {
    return NextResponse.json({ error: "No storage_path provided" }, { status: 400 })
  }

  // Security: ensure the storage path belongs to this user
  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Paths to clean up after response
  const cleanupKeys: string[] = [storagePath]

  try {
    // Download file from S3
    const storage = getStorage()
    const fileBuffer = await storage.download(storagePath)
    const bytes = new Uint8Array(fileBuffer)

    if (bytes.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 })
    }

    const isImage = isImageFile(mimeType, fileName)
    const isPdf = isPdfFile(mimeType, fileName)

    let messages: any[]
    let model: string | undefined = FLASH_MODEL // Default to Flash

    const systemPrompt = `You are an expert document analysis AI. Given a document, you must identify all the key data fields that could be extracted from it.

Return a JSON object with a "fields" key containing an array of field objects. Each field object must have:
- "name": A clear, human-readable field name (e.g., "Invoice Number", "Total Amount", "Vendor Name")
- "type": One of: "string", "number", "decimal", "date", "email", "url", "phone", "address", "boolean", "table"
- "description": A brief description of what this field represents

For tables/line items, use type "table" and add a "columns" array where each column has "name", "type", and "description".

Guidelines:
- Identify ALL meaningful data points in the document
- Use appropriate types (dates for dates, numbers for amounts, email for emails, etc.)
- Keep names concise but descriptive
- Group related line items as a table
- Do NOT include meta fields like confidence scores
- Return ONLY the JSON object with a "fields" array

Example output:
{"fields": [
  {"name": "Invoice Number", "type": "string", "description": "Unique invoice identifier"},
  {"name": "Date", "type": "date", "description": "Invoice date"},
  {"name": "Total Amount", "type": "decimal", "description": "Total amount due"},
  {"name": "Line Items", "type": "table", "description": "List of items on the invoice", "columns": [
    {"name": "Description", "type": "string", "description": "Item description"},
    {"name": "Quantity", "type": "number", "description": "Number of units"},
    {"name": "Unit Price", "type": "decimal", "description": "Price per unit"},
    {"name": "Amount", "type": "decimal", "description": "Line total"}
  ]}
]}`

    if (isImage) {
      // Images: always Flash, use signed URL
      const signedUrl = await getSignedFileUrl("_", storagePath)
      if (!signedUrl) {
        return NextResponse.json({ error: "Failed to generate file URL" }, { status: 500 })
      }

      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this document and identify all extractable data fields.",
            },
            {
              type: "image_url",
              image_url: { url: signedUrl },
            },
          ],
        },
      ]
    } else if (isPdf) {
      // PDFs: count pages, trim if needed, route to Flash or Pro
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const pageCount = pdfDoc.getPageCount()

      // Route complex PDFs to Pro
      if (pageCount > PRO_PAGE_THRESHOLD) {
        model = undefined // Use env default (Pro)
      }

      // Trim large PDFs to first N pages
      let urlPath = storagePath
      if (pageCount > MAX_SAMPLE_PAGES) {
        const trimmedPdf = await PDFDocument.create()
        const pageIndices = Array.from({ length: MAX_SAMPLE_PAGES }, (_, i) => i)
        const copiedPages = await trimmedPdf.copyPages(pdfDoc, pageIndices)
        copiedPages.forEach((page) => trimmedPdf.addPage(page))
        const trimmedBytes = await trimmedPdf.save({ useObjectStreams: true })

        // Upload trimmed PDF to S3 for signed URL
        const trimmedKey = storagePath.replace(/\/([^/]+)$/, `/trimmed_$1`)
        await storage.upload(trimmedKey, Buffer.from(trimmedBytes), {
          contentType: "application/pdf",
        })
        cleanupKeys.push(trimmedKey)
        urlPath = trimmedKey
      }

      const signedUrl = await getSignedFileUrl("_", urlPath)
      if (!signedUrl) {
        return NextResponse.json({ error: "Failed to generate file URL" }, { status: 500 })
      }

      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${pageCount}-page document and identify all extractable data fields.`,
            },
            {
              type: "image_url",
              image_url: { url: signedUrl },
            },
          ],
        },
      ]
    } else {
      // Text-based document: extract text, always Flash
      const extraction = await extractTextFromDocument(bytes, fileName, mimeType)
      const text = extraction.text.trim()

      if (text.length === 0) {
        return NextResponse.json(
          { error: "Could not extract text from document" },
          { status: 400 }
        )
      }

      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this document and identify all extractable data fields.\n\nDocument:\n${text.slice(0, 15000)}`,
        },
      ]
    }

    const result = await generateText({
      messages,
      model,
      temperature: 0.2,
      responseFormat: { type: "json_object" },
      deadlineMs: Date.now() + 55_000, // 5 s safety margin before Vercel's maxDuration
    })

    // Parse the AI response
    let rawText = result.text.trim()
    // Strip markdown code fences if present
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
    }

    const parsed = JSON.parse(rawText)
    // Support both { fields: [...] } and bare array
    const suggestedFields = Array.isArray(parsed) ? parsed : parsed.fields
    if (!Array.isArray(suggestedFields)) {
      throw new Error("AI did not return a fields array")
    }

    // Convert to SchemaField format with IDs
    const schemaFields = suggestedFields.map((f: any) => {
      const id = f.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")

      const base: any = {
        id,
        name: f.name,
        type: f.type === "table" ? "table" : f.type,
        description: f.description || "",
        required: false,
      }

      if (f.type === "table" && Array.isArray(f.columns)) {
        base.columns = f.columns.map((col: any) => ({
          id: col.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, ""),
          name: col.name,
          type: col.type || "string",
          description: col.description || "",
          required: false,
        }))
      }

      return base
    })

    return NextResponse.json({ fields: schemaFields })
  } catch (err) {
    console.error("[detect-fields] AI field detection failed:", err)
    return NextResponse.json(
      { error: "Failed to detect fields from document. Please try again." },
      { status: 500 }
    )
  } finally {
    // Fire-and-forget cleanup of temp files from S3
    const storage = getStorage()
    for (const key of cleanupKeys) {
      storage.delete(key).catch(() => {})
    }
  }
}
