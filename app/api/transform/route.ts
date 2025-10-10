import { type NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText, generateObject, tool } from "ai"
import { z } from "zod"
import { tavily } from "@tavily/core"

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
      const apiKey = process.env.TAVILY_API_KEY
      if (!apiKey) {
        return { error: "TAVILY_API_KEY not configured" }
      }

      const tvly = tavily({ apiKey })
      const response = await tvly.search(query, {
        searchDepth: "basic",
        maxResults: 5,
      })

      const results = response.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
      }))

      return {
        query,
        results,
        answer: response.answer || "No direct answer available",
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Web search failed", query }
    }
  },
})

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
  let prop: z.ZodTypeAny
  
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

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Missing prompt" }, { status: 400 })
    }

    if (inputSource === "column") {
      const columnValues: Record<string, any> = body.columnValues || {}
      const fieldType = body.fieldType
      const fieldSchema = body.fieldSchema
      
      // Build a structured representation for the AI
      const columnContext: string[] = []
      const substitutedPrompt = prompt.replace(/\{([^}]+)\}/g, (match, columnName) => {
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
      console.log("[bytebeam] Transform - Field type:", fieldType)
      console.log("[bytebeam] Transform - Field schema:", fieldSchema)
      
      // Build the AI prompt with context
      let aiPrompt = `You are a transformation assistant. Task: ${substitutedPrompt}\n\n`
      
      if (columnContext.length > 0) {
        aiPrompt += `Available column data (as JSON):\n${columnContext.join('\n')}\n\n`
        aiPrompt += `When you see structured data (objects, tables, lists), analyze the fields and use the appropriate numeric values for calculations.\n\n`
      }
      
      aiPrompt += `Return only the transformed value with no extra commentary.`
      
      const result = await generateText({
        model: google("gemini-2.5-pro"),
        temperature: 0.2,
        prompt: aiPrompt,
        tools: {
          calculator: calculatorTool,
          webSearch: webSearchTool,
        },
      })
      
      console.log("[bytebeam] Transform - Tool calls:", result.toolCalls)
      console.log("[bytebeam] Transform - Result text:", result.text)
      console.log("[bytebeam] Transform - Tool results:", result.toolResults)
      
      let finalResult: any = result.text
      
      // Check if we have tool results
      const hasToolResults = result.toolResults && result.toolResults.length > 0
      const lastToolResult = hasToolResults ? result.toolResults[result.toolResults.length - 1] : null
      const toolOutput = lastToolResult?.output as any
      
      // If we have field type information, use type-aware formatting (for both tool results AND direct responses)
      if (fieldType && fieldSchema) {
        console.log("[bytebeam] Transform - Using type-aware formatting for type:", fieldType)
        
        try {
          // Build Zod schema for the field type
          let zodSchema = buildFieldSchema(fieldSchema)
          
          // For complex types (object, list, table), make schema more flexible with partial
          if (fieldType === 'object' || fieldType === 'list' || fieldType === 'table') {
            // Use partial() for objects to handle missing fields gracefully
            if (fieldType === 'object') {
              zodSchema = (zodSchema as z.ZodObject<any>).partial()
            }
          }
          
          // Build context from tool output OR direct LLM response
          let sourceContext = ""
          let isEmpty = false
          
          // Prefer tool output if available
          if (hasToolResults && toolOutput) {
            if (toolOutput.results && Array.isArray(toolOutput.results)) {
              if (toolOutput.results.length === 0) {
                isEmpty = true
                sourceContext = "No results found"
              } else {
                sourceContext = JSON.stringify(toolOutput.results, null, 2)
              }
            } else if (toolOutput.result !== undefined) {
              sourceContext = String(toolOutput.result)
            } else if (toolOutput.answer && toolOutput.answer !== "No direct answer available") {
              sourceContext = toolOutput.answer
            } else if (toolOutput.error) {
              isEmpty = true
              sourceContext = `Error: ${toolOutput.error}`
            } else {
              sourceContext = JSON.stringify(toolOutput, null, 2)
            }
          } else if (result.text && result.text.trim()) {
            // Use direct LLM response
            sourceContext = result.text.trim()
          } else {
            isEmpty = true
            sourceContext = "No content generated"
          }
          
          // Handle empty results
          if (isEmpty) {
            console.log("[bytebeam] Transform - Empty or error result")
            if (fieldType === 'list' || fieldType === 'table') {
              finalResult = []
            } else if (fieldType === 'object') {
              finalResult = {}
            } else {
              // For primitives, maintain backward compatibility with empty string
              finalResult = sourceContext
            }
          } else {
            // Use generateObject for structured formatting
            const formatPrompt = `Extract and format the following data according to the required schema.

Source Data:
${sourceContext}

Original Task: ${substitutedPrompt}

Instructions:
- For list/table types: Extract all items as an array of objects. If no data, return empty array.
- For object types: Extract fields matching the schema. Set missing fields to null.
- For primitive types: Extract the single most relevant value.
- Preserve all important information from the source data
- For web search results, extract store names, URLs, and prices if available
- Ensure data types match the schema (numbers as numbers, not strings)
- If information is not available, use null for that field rather than omitting it`

            const structuredResult = await generateObject({
              model: google("gemini-2.5-pro"),
              temperature: 0.1,
              schema: zodSchema,
              prompt: formatPrompt,
            })
            
            finalResult = structuredResult.object
            console.log("[bytebeam] Transform - Structured result:", JSON.stringify(finalResult, null, 2))
          }
          
        } catch (error) {
          console.error("[bytebeam] Transform - Type-aware formatting error:", error)
          // Fall back to text representation on error
          if (toolOutput?.results && Array.isArray(toolOutput.results)) {
            // Format web search results as text
            const formattedResults = toolOutput.results.map((r: any, idx: number) => 
              `${idx + 1}. ${r.title}\n   ${r.url}\n   ${r.content}`
            ).join('\n\n')
            finalResult = formattedResults
          } else if (toolOutput?.result !== undefined) {
            // Return calculator result
            finalResult = String(toolOutput.result)
          } else if (result.text && result.text.trim()) {
            // Fall back to direct LLM response text
            finalResult = result.text.trim()
          } else {
            // Last resort: error message
            finalResult = "Error formatting result: " + (error instanceof Error ? error.message : String(error))
          }
        }
      } else if ((!finalResult || finalResult.trim() === '') && hasToolResults && toolOutput) {
        // Fallback to legacy formatting for backward compatibility
        console.log("[bytebeam] Transform - Using legacy formatting (no type info)")
        
        if (toolOutput && typeof toolOutput.result === 'number') {
          finalResult = String(toolOutput.result)
          console.log("[bytebeam] Transform - Extracted number from toolOutput.result:", finalResult)
        } else if (typeof toolOutput === 'number') {
          finalResult = String(toolOutput)
          console.log("[bytebeam] Transform - Extracted number from toolOutput:", finalResult)
        } else if (toolOutput && toolOutput.results && Array.isArray(toolOutput.results)) {
          const formattedResults = toolOutput.results.map((r: any, idx: number) => 
            `${idx + 1}. ${r.title}\n   ${r.url}\n   ${r.content}`
          ).join('\n\n')
          finalResult = formattedResults
          console.log("[bytebeam] Transform - Extracted web search results, count:", toolOutput.results.length)
        } else if (toolOutput && toolOutput.answer && toolOutput.answer !== "No direct answer available") {
          finalResult = toolOutput.answer
          console.log("[bytebeam] Transform - Extracted answer from web search:", finalResult)
        } else {
          console.log("[bytebeam] Transform - Could not extract result, toolOutput type:", typeof toolOutput)
        }
      }
      
      console.log("[bytebeam] Transform - Final result:", finalResult)
      
      // Return the result (can be string, object, or array)
      return NextResponse.json({ 
        success: true, 
        result: typeof finalResult === 'object' ? JSON.stringify(finalResult) : (finalResult || "Error: No result")
      })
    }

    // inputSource === 'document'
    const file = body.file
    if (!file || !file.data) {
      return NextResponse.json({ success: false, error: "Missing file for document transformation" }, { status: 400 })
    }

    const binaryData = Buffer.from(file.data, "base64")
    const bytes = new Uint8Array(binaryData)

    const fileName = file.name || "document"
    const fileType = file.type || "application/octet-stream"
    const isImage = fileType.startsWith("image/") || /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(fileName)

    if (isImage) {
      const base64 = Buffer.from(bytes).toString("base64")
      const mimeType = fileType || "image/png"
      const { text } = await generateText({
        model: google("gemini-2.5-pro"),
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `You are a transformation assistant. Task: ${prompt}.\nReturn only the transformed value.` },
              { type: "image", image: `data:${mimeType};base64,${base64}` },
            ],
          },
        ],
        tools: {
          calculator: calculatorTool,
          webSearch: webSearchTool,
        },
      })
      return NextResponse.json({ success: true, result: text })
    }

    // Try to decode as UTF-8 text; if it's not text, the output may be garbled but still usable as context
    const docText = new TextDecoder().decode(bytes)
    const { text } = await generateText({
      model: google("gemini-2.5-pro"),
      temperature: 0.2,
      prompt: `You are a transformation assistant. Task: ${prompt}\n\nDocument:\n${docText}\n\nReturn only the transformed value with no extra commentary.`,
      tools: {
        calculator: calculatorTool,
        webSearch: webSearchTool,
      },
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
