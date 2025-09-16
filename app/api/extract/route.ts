import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { google } from "@ai-sdk/google"

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

    const fileName = fileData.name
    const fileType = fileData.type
    const isImageFile = fileType.startsWith("image/") || fileName.toLowerCase().match(/\.(png|jpg|jpeg|gif|bmp|webp)$/)

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

No Hallucination: If a piece of information for a specific field cannot be found in the image, you must use null as the value for that field. Do not invent, infer, or guess information.

Data Type Integrity: Ensure the extracted data conforms to the data type specified in the schema (e.g., number, string, boolean, array). Format dates according to ISO 8601 (YYYY-MM-DD) unless the schema specifies otherwise.

Extract the information from the image according to the schema. Think about your answer first before you respond.

Follow these steps:
1. Carefully analyze the provided schema to understand each field, its data type, and its description.
2. Examine the entire image to locate the information corresponding to each field in the schema.
3. For each field, extract the precise data from the image that matches the field's description and context.
4. If information for a field is not present in the image, assign null as its value.
5. Construct the final JSON object, ensuring it strictly validates against the provided schema and contains no extra text or explanations.`

      documentContent = [
        { type: "text", text: baseText },
        { type: "image", image: `data:${mimeType};base64,${base64}` },
      ]

      extractionPrompt = "" // Not used for multimodal content
    } else {
      console.log("[bytebeam] Processing as text file...")

      const documentText = new TextDecoder().decode(bytes)

      console.log("[bytebeam] Document text length:", documentText.length)

      if (documentText.length === 0) {
        console.log("[bytebeam] Error: Empty document")
        return NextResponse.json({ error: "Document appears to be empty" }, { status: 400 })
      }

      extractionPrompt = extractionPromptOverride
        ? `${extractionPromptOverride}

Schema Fields (for reference):
${schemaSummary}

Document:
${documentText}`
        : `You are a specialized AI model for structured data extraction. Your purpose is to accurately extract information from a given document based on a dynamic, user-provided schema.\n\n${schemaSummary}

Here are the guiding principles for your operation:

Strict Adherence to Schema: The primary goal is to populate the fields defined in the schema. You must not add, omit, or alter any fields. The structure of your output must perfectly match the provided schema.

Contextual Extraction: Do not just match keywords. Understand the context of the document to ensure the extracted data correctly corresponds to the schema's field descriptions.

No Hallucination: If a piece of information for a specific field cannot be found in the document, you must use null as the value for that field. Do not invent, infer, or guess information.

Data Type Integrity: Ensure the extracted data conforms to the data type specified in the schema (e.g., number, string, boolean, array). Format dates according to ISO 8601 (YYYY-MM-DD) unless the schema specifies otherwise.

Here is the document to process:
${documentText}

Extract the information from the document according to the schema. Think about your answer first before you respond.

Follow these steps:
1. Carefully analyze the provided schema to understand each field, its data type, and its description.
2. Read through the entire document to locate the information corresponding to each field in the schema.
3. For each field, extract the precise data from the document that matches the field's description and context.
4. If information for a field is not present in the document, assign null as its value.
5. Construct the final JSON object, ensuring it strictly validates against the provided schema and contains no extra text or explanations.`
    }

    console.log("[bytebeam] Processing with Gemini...")

    const result = await generateObject({
      model: google("gemini-2.5-pro"),
      temperature: 0.2,
      messages: isImageFile
        ? [
            {
              role: "user",
              content: documentContent,
            },
          ]
        : undefined,
      prompt: isImageFile ? undefined : extractionPrompt,
      schema: zodSchema,
    })

    console.log("[bytebeam] Extraction successful:", result.object)

    return NextResponse.json({
      success: true,
      results: result.object,
    })
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
