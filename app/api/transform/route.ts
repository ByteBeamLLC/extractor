import { type NextRequest, NextResponse } from "next/server"
import { generateText, generateObject } from "@/lib/openrouter"
import { z } from "zod"
import { getKnowledgeContentForTransformation, findKnowledgeItemByName } from "@/lib/knowledge-actions"

// Note: 'tool' functionality from AI SDK is not directly used in OpenRouter
// If tools are needed, they would be implemented differently

/*
const calculatorTool = tool({
  description: "A comprehensive calculator tool for performing arithmetic operations. Use this whenever you need to calculate mathematical expressions, including basic arithmetic, exponentiation, square roots, and more. The calculator supports: addition (+), subtraction (-), multiplication (*), division (/), exponentiation (^), square root (sqrt), parentheses for grouping, and follows proper order of operations.",
  inputSchema: z.object({
    expression: z.string().describe("The mathematical expression to evaluate. Examples: '2 + 2', '(10 * 5) - 3', '2 ^ 3', 'sqrt(16)', '(5 + 3) * 2 / 4'"),
  }),
  execute: async ({ expression }) => {
    try {
      const result = evaluateExpression(expression)
      return { result, expression }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid expression", expression }
    }
  },
})

const webSearchTool = tool({
  description: "Search the web for current information, facts, news, or any information that requires up-to-date knowledge. Use this tool when you need to find information that may not be in your training data or when you need current/recent information. The search returns relevant web results with titles, URLs, and content snippets.",
  inputSchema: z.object({
    query: z.string().describe("The search query to look up on the web. Be specific and clear about what information you're looking for."),
  }),
  execute: async ({ query }) => {
    try {
      const apiKey = process.env.JINA_API_KEY
      console.log("[bytebeam] Jina API Key check:", apiKey ? "Present" : "Missing")

      if (!apiKey) {
        return { error: "JINA_API_KEY not configured. Please set the JINA_API_KEY environment variable to enable web search." }
      }

      console.log("[bytebeam] Calling Jina Search API with query:", query)

      const response = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'X-Retain-Images': 'none',
        },
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`Jina API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log("[bytebeam] Jina response received:", data)

      // Transform Jina response to match expected format
      const results = (data.data || []).slice(0, 5).map((result: any) => ({
        title: result.title || result.breadcrumb || '',
        url: result.url || '',
        content: result.content || result.description || '',
      }))

      return {
        query,
        results,
        answer: data.answer || results[0]?.content || "No direct answer available",
      }
    } catch (error) {
      console.error("[bytebeam] Jina search error:", error)
      return { error: error instanceof Error ? error.message : "Web search failed", query }
    }
  },
})

const webReaderTool = tool({
  description: "Read and extract full content from a specific URL. Use this tool when you need detailed information from a particular webpage that was found in search results, or when you need to read the content of a known URL. This provides the complete text content of the page in a clean, readable format.",
  inputSchema: z.object({
    url: z.string().describe("The URL of the webpage to read and extract content from. Must be a valid HTTP/HTTPS URL."),
  }),
  execute: async ({ url }) => {
    try {
      const apiKey = process.env.JINA_API_KEY
      console.log("[bytebeam] Jina Reader API - Reading URL:", url)

      if (!apiKey) {
        return { error: "JINA_API_KEY not configured. Please set the JINA_API_KEY environment variable to enable web reading." }
      }

      // Validate URL format
      try {
        new URL(url)
      } catch {
        return { error: "Invalid URL format", url }
      }

      const response = await fetch(`https://r.jina.ai/${url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'X-Return-Format': 'json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`Jina Reader API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log("[bytebeam] Jina Reader response received for:", url)

      return {
        url,
        title: data.title || '',
        content: data.content || data.text || '',
        description: data.description || '',
      }
    } catch (error) {
      console.error("[bytebeam] Jina Reader error:", error)
      return { error: error instanceof Error ? error.message : "Web reading failed", url }
    }
  },
})
*/

// ===== ONE-SHOT TRANSFORMATION WITH STRUCTURED OUTPUT =====
// All transformation logic is now handled directly in the POST handler below
// using generateObject with structured schemas

function evaluateExpression(expr: string): number {
  expr = expr.trim().toLowerCase()

  expr = expr.replace(/\s+/g, '')

  expr = expr.replace(/sqrt\(([^)]+)\)/g, (_, inner) => {
    const val = evaluateExpression(inner)
    if (val < 0) throw new Error("Cannot take square root of negative number")
    return String(Math.sqrt(val))
  })

  expr = expr.replace(/\^/g, '**')

  const isValidExpression = /^[0-9+\-*/(). **]+$/.test(expr)
  if (!isValidExpression) {
    throw new Error("Invalid characters in expression")
  }

  try {
    const result = Function('"use strict"; return (' + expr + ')')()
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error("Expression did not evaluate to a valid number")
    }
    return result
  } catch (error) {
    throw new Error("Invalid mathematical expression")
  }
}

// Schema builder utilities for type-aware transformations
function makePrimitive(fieldSchema: any): z.ZodTypeAny {
  const type = fieldSchema.type === "decimal" ? "number" : fieldSchema.type
  let prop: any

  switch (type) {
    case "number":
      prop = z.number()
      if (fieldSchema.constraints?.min !== undefined) prop = prop.min(fieldSchema.constraints.min)
      if (fieldSchema.constraints?.max !== undefined) prop = prop.max(fieldSchema.constraints.max)
      break
    case "boolean":
      prop = z.boolean()
      break
    case "date":
      prop = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
      if (fieldSchema.constraints?.minLength !== undefined) prop = prop.min(fieldSchema.constraints.minLength)
      if (fieldSchema.constraints?.maxLength !== undefined) prop = prop.max(fieldSchema.constraints.maxLength)
      break
    case "email":
      prop = z.string().email()
      if (fieldSchema.constraints?.minLength !== undefined) prop = prop.min(fieldSchema.constraints.minLength)
      if (fieldSchema.constraints?.maxLength !== undefined) prop = prop.max(fieldSchema.constraints.maxLength)
      break
    case "url":
      prop = z.string().url()
      if (fieldSchema.constraints?.minLength !== undefined) prop = prop.min(fieldSchema.constraints.minLength)
      if (fieldSchema.constraints?.maxLength !== undefined) prop = prop.max(fieldSchema.constraints.maxLength)
      break
    case "richtext":
    case "address":
    case "phone":
    case "string":
    default:
      prop = z.string()
      if (fieldSchema.constraints?.minLength !== undefined) prop = prop.min(fieldSchema.constraints.minLength)
      if (fieldSchema.constraints?.maxLength !== undefined) prop = prop.max(fieldSchema.constraints.maxLength)
      break
  }

  return prop
}

function buildFieldSchema(fieldSchema: any): z.ZodTypeAny {
  if (!fieldSchema || !fieldSchema.type) {
    return z.string()
  }

  const desc = `${fieldSchema.description || ""} ${fieldSchema.extractionInstructions || ""}`.trim()

  if (fieldSchema.type === "object") {
    const shape: Record<string, z.ZodTypeAny> = {}
    const children = fieldSchema.children || []

    for (const child of children) {
      const childSchema = buildFieldSchema(child)
      // Use id, name, or generate a key
      const key = child.id || child.name || `field_${Object.keys(shape).length}`
      shape[key] = childSchema
    }

    let prop: z.ZodTypeAny = z.object(shape)
    if (desc) prop = prop.describe(desc)
    return prop
  } else if (fieldSchema.type === "list") {
    const item = fieldSchema.item
    let zItem: z.ZodTypeAny

    if (item?.type === "object") {
      zItem = buildFieldSchema(item)
    } else if (item) {
      zItem = makePrimitive(item)
    } else {
      zItem = z.string()
    }

    let prop: z.ZodTypeAny = z.array(zItem)
    if (desc) prop = prop.describe(desc)
    return prop
  } else if (fieldSchema.type === "table") {
    const shape: Record<string, z.ZodTypeAny> = {}
    const columns = fieldSchema.columns || []

    for (const col of columns) {
      const colSchema = buildFieldSchema(col)
      // Use id, name, or generate a key
      const key = col.id || col.name || `col_${Object.keys(shape).length}`
      shape[key] = colSchema
    }

    let prop: z.ZodTypeAny = z.array(z.object(shape))
    if (desc) prop = prop.describe(desc)
    return prop
  } else {
    let prop = makePrimitive(fieldSchema)
    if (desc) prop = prop.describe(desc)
    return prop
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[bytebeam] Transform API - Full request body:", JSON.stringify(body, null, 2))

    const inputSource: "document" | "column" = body.inputSource || "column"
    const prompt: string = String(body.prompt || "")
    const selectedTools: string[] = body.selectedTools || [] // New: manual tool selection

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Missing prompt" }, { status: 400 })
    }

    if (inputSource === "column") {
      const columnValues: Record<string, any> = body.columnValues || {}
      const fieldType = body.fieldType
      const fieldSchema = body.fieldSchema

      // Build a structured representation for the AI
      const columnContext: string[] = []
      const knowledgeContext: string[] = []
      let totalTokens = 0

      // 1. Handle Knowledge References {kb:name}
      const knowledgeRegex = /\{kb:([^}]+)\}/g
      let match
      const knowledgeItems = new Set<string>()

      while ((match = knowledgeRegex.exec(prompt)) !== null) {
        knowledgeItems.add(match[1])
      }

      for (const kbName of knowledgeItems) {
        console.log(`[bytebeam] Resolving knowledge item: ${kbName}`)
        const item = await findKnowledgeItemByName(kbName)

        if (item) {
          const { content, tokenEstimate } = await getKnowledgeContentForTransformation(item)
          if (content) {
            knowledgeContext.push(content)
            totalTokens += tokenEstimate
            console.log(`[bytebeam] Added knowledge content for ${kbName} (~${tokenEstimate} tokens)`)
          }
        } else {
          console.warn(`[bytebeam] Knowledge item not found: ${kbName}`)
        }
      }

      // Check token limit (100k safety limit)
      if (totalTokens > 100000) {
        return NextResponse.json({
          success: false,
          error: `Knowledge content too large (~${totalTokens} tokens). Please use smaller documents or fewer references.`
        }, { status: 400 })
      }

      // 2. Handle Column References {column}
      // We replace {kb:name} with just the name for readability in the final prompt, 
      // as the content is added to context
      let substitutedPrompt = prompt.replace(/\{kb:([^}]+)\}/g, "$1")

      substitutedPrompt = substitutedPrompt.replace(/\{([^}]+)\}/g, (match, columnName) => {
        const value = columnValues[columnName.trim()]
        if (value === undefined) return match

        // If value is an object/structured type, provide it as JSON context
        if (typeof value === 'object' && value !== null) {
          const jsonValue = JSON.stringify(value, null, 2)
          columnContext.push(`${columnName.trim()}: ${jsonValue}`)
          return `{${columnName.trim()}}`
        }

        // For primitive values, substitute directly
        return String(value)
      })

      console.log("[bytebeam] Transform - Original prompt:", prompt)
      console.log("[bytebeam] Transform - Column values:", columnValues)
      console.log("[bytebeam] Transform - Substituted prompt:", substitutedPrompt)
      console.log("[bytebeam] Transform - Column context:", columnContext)
      console.log("[bytebeam] Transform - Knowledge context size:", knowledgeContext.length)
      console.log("[bytebeam] Transform - Field type:", fieldType)
      console.log("[bytebeam] Transform - Field schema:", fieldSchema)
      console.log("[bytebeam] Transform - Selected tools:", selectedTools)

      // ===== NEW ONE-SHOT STRUCTURED OUTPUT APPROACH =====

      // Build the tool map based on selected tools
      const toolMap: Record<string, any> = {}
      /*
      if (selectedTools.includes('calculator')) {
        toolMap.calculator = calculatorTool
      }
      if (selectedTools.includes('webSearch')) {
        toolMap.webSearch = webSearchTool
      }
      if (selectedTools.includes('webReader')) {
        toolMap.webReader = webReaderTool
      }
      */

      console.log("[bytebeam] Transform - Available tools:", Object.keys(toolMap))

      // Build context for the AI
      let contextInfo = ""

      if (columnContext.length > 0) {
        contextInfo += `Available data:\n${columnContext.join('\n')}\n\n`
      }

      if (knowledgeContext.length > 0) {
        contextInfo += `Reference Knowledge:\n${knowledgeContext.join('\n\n')}\n\n`
      }

      let finalResult: any = null

      // Build Zod schema for structured output
      if (fieldType && fieldSchema) {
        console.log("[bytebeam] Transform - Using structured output for type:", fieldType)

        try {
          let zodSchema = buildFieldSchema(fieldSchema)

          // For complex types, make schema more flexible with partial
          if (fieldType === 'object') {
            zodSchema = (zodSchema as z.ZodObject<any>).partial()
          }

          // Build the comprehensive prompt for one-shot generation
          const fullPrompt = `${substitutedPrompt}

${contextInfo}

Instructions:
- Perform the task described above
- Return the result in the exact schema format required
- For list/table types: Return all items as an array of objects
- For object types: Return all fields matching the schema
- For primitive types: Return the single value
- If you need to perform calculations, use the calculator tool
- If you need to search for information, use the webSearch tool
- Ensure data types match the schema (numbers as numbers, not strings)
- If information is not available, use null for that field
- Use the provided Reference Knowledge to answer questions or perform tasks if applicable`

          // Use generateObject with tools for one-shot structured output
          const structuredResult = await generateObject({
            temperature: 0.1,
            schema: zodSchema,
            messages: [{ role: "user", content: fullPrompt }]
            // Note: Tool support temporarily disabled during OpenRouter migration
            // ...(Object.keys(toolMap).length > 0 ? { tools: toolMap, maxSteps: 5 } : {})
          })

          finalResult = structuredResult.object
          console.log("[bytebeam] Transform - Structured result:", JSON.stringify(finalResult, null, 2))

        } catch (error) {
          console.error("[bytebeam] Transform - Structured output error:", error)
          throw error
        }
      } else {
        // Fallback for fields without type information (backward compatibility)
        console.log("[bytebeam] Transform - Using text-based output (no type info)")

        const fullPrompt = `${substitutedPrompt}

${contextInfo}

Instructions:
- Perform the task described above
- Return ONLY the final result, nothing else
- If you need to perform calculations, use the calculator tool
- If you need to search for information, use the webSearch tool
- Use the provided Reference Knowledge to answer questions or perform tasks if applicable`

        const { text } = await generateText({
          temperature: 0.1,
          messages: [{ role: "user", content: fullPrompt }]
          // Note: Tool support temporarily disabled during OpenRouter migration
          // ...(Object.keys(toolMap).length > 0 ? { tools: toolMap, maxSteps: 5 } : {})
        })

        finalResult = text
        console.log("[bytebeam] Transform - Text result:", finalResult)
      }

      // Return the result (can be string, object, or array)
      // For objects and arrays, return them directly (don't stringify)
      // The UI will handle them properly
      return NextResponse.json({
        success: true,
        result: finalResult || "Error: No result"
      })
    }

    // inputSource === 'document'
    const file = body.file
    // selectedTools already declared at top of function

    if (!file || !file.data) {
      return NextResponse.json({ success: false, error: "Missing file for document transformation" }, { status: 400 })
    }

    const binaryData = Buffer.from(file.data, "base64")
    const bytes = new Uint8Array(binaryData)

    const fileName = file.name || "document"
    const fileType = file.type || "application/octet-stream"
    const isImage = fileType.startsWith("image/") || /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(fileName)

    // Build the tool map based on selected tools
    const docToolMap: Record<string, any> = {}
    /*
    if (selectedTools.includes('calculator')) {
      docToolMap.calculator = calculatorTool
    }
    if (selectedTools.includes('webSearch')) {
      docToolMap.webSearch = webSearchTool
    }
    if (selectedTools.includes('webReader')) {
      docToolMap.webReader = webReaderTool
    }
    */

    console.log("[bytebeam] Transform (document) - Available tools:", Object.keys(docToolMap))

    if (isImage) {
      const base64 = Buffer.from(bytes).toString("base64")
      const mimeType = fileType || "image/png"

      const taskInstructions = `Task: ${prompt}

Instructions:
- Analyze the image and perform the requested task
- Return ONLY the final result
- Use tools if needed for calculations or information lookup`

      const { text } = await generateText({
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: taskInstructions },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ]
        // Note: Tool support temporarily disabled during OpenRouter migration
        // ...(Object.keys(docToolMap).length > 0 ? { tools: docToolMap, maxSteps: 5 } : {})
      })

      return NextResponse.json({ success: true, result: text })
    }

    // Try to decode as UTF-8 text; if it's not text, the output may be garbled but still usable as context
    const docText = new TextDecoder().decode(bytes)

    const docTaskPrompt = `Task: ${prompt}

Document:
${docText}

Instructions:
- Analyze the document and perform the requested task
- Return ONLY the final result
- Use tools if needed for calculations or information lookup`

    const { text } = await generateText({
      temperature: 0.1,
      messages: [{ role: "user", content: docTaskPrompt }]
      // Note: Tool support temporarily disabled during OpenRouter migration
      // ...(Object.keys(docToolMap).length > 0 ? { tools: docToolMap, maxSteps: 5 } : {})
    })

    return NextResponse.json({ success: true, result: text })
  } catch (error) {
    console.error("[bytebeam] Transform error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

