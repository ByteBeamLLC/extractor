import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { generateText } from "@/lib/openrouter"
import {
  extractTextFromDocument,
  isImageFile,
  isPdfFile,
} from "@/lib/extraction/api"

export const runtime = "nodejs"

export const maxDuration = 60

/**
 * POST /api/parsers/[parserId]/detect-fields
 *
 * Accepts a sample document and uses AI to suggest extraction fields.
 * Returns an array of suggested SchemaField objects.
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

  const fileData = body.file as {
    name?: string
    type?: string
    data?: string
  } | undefined

  if (!fileData?.data) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const buffer = Buffer.from(fileData.data, "base64")
  const bytes = new Uint8Array(buffer)
  const fileName = fileData.name ?? "uploaded"
  const mimeType = (fileData.type ?? "").toLowerCase()

  if (bytes.length === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 })
  }

  // Build a prompt describing the document content
  const isImage = isImageFile(mimeType, fileName)
  const isPdf = isPdfFile(mimeType, fileName)

  let messages: any[]

  const systemPrompt = `You are an expert document analysis AI. Given a document, you must identify all the key data fields that could be extracted from it.

Return a JSON array of field objects. Each field object must have:
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
- Return ONLY the JSON array, no other text

Example output:
[
  {"name": "Invoice Number", "type": "string", "description": "Unique invoice identifier"},
  {"name": "Date", "type": "date", "description": "Invoice date"},
  {"name": "Total Amount", "type": "decimal", "description": "Total amount due"},
  {"name": "Line Items", "type": "table", "description": "List of items on the invoice", "columns": [
    {"name": "Description", "type": "string", "description": "Item description"},
    {"name": "Quantity", "type": "number", "description": "Number of units"},
    {"name": "Unit Price", "type": "decimal", "description": "Price per unit"},
    {"name": "Amount", "type": "decimal", "description": "Line total"}
  ]}
]`

  if (isImage || isPdf) {
    const base64 = Buffer.from(bytes).toString("base64")
    const dataUrl = `data:${mimeType || (isImage ? "image/png" : "application/pdf")};base64,${base64}`

    messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this document and identify all extractable data fields. Return only the JSON array.",
          },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ]
  } else {
    // Text-based document
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
        content: `Analyze this document and identify all extractable data fields. Return only the JSON array.\n\nDocument:\n${text.slice(0, 15000)}`,
      },
    ]
  }

  try {
    const result = await generateText({
      messages,
      temperature: 0.2,
    })

    // Parse the AI response as JSON
    let rawText = result.text.trim()
    // Strip markdown code fences if present
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
    }

    const suggestedFields = JSON.parse(rawText)

    if (!Array.isArray(suggestedFields)) {
      throw new Error("AI did not return an array")
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
  }
}
