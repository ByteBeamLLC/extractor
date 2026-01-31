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

      const rawText = await response.text()
      const truncated = rawText.length > 4000 ? `${rawText.slice(0, 4000)} ... [truncated]` : rawText
      console.log("[bytebeam] Jina search raw response:", truncated || "<empty body>")

      if (!response.ok) {
        throw new Error(`Jina API error: ${response.status} ${rawText || response.statusText}`)
      }

      let data: any
      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch (parseError) {
        console.error("[bytebeam] Jina search JSON parse error:", parseError)
        throw new Error("Jina API returned non-JSON response")
      }

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

      const rawText = await response.text()
      const truncated = rawText.length > 4000 ? `${rawText.slice(0, 4000)} ... [truncated]` : rawText
      console.log("[bytebeam] Jina Reader raw response:", truncated || "<empty body>")

      if (!response.ok) {
        throw new Error(`Jina Reader API error: ${response.status} ${rawText || response.statusText}`)
      }

      let data: any
      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch (parseError) {
        console.error("[bytebeam] Jina Reader JSON parse error:", parseError)
        throw new Error("Jina Reader returned non-JSON response")
      }

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

const brailleTool = tool({
  description: "Convert text to Braille format. Use this tool when you need to translate regular text into Braille characters. This tool takes any text string and returns its Braille representation.",
  inputSchema: z.object({
    text: z.string().describe("The text to convert to Braille. Can be any string of text that needs to be translated to Braille format."),
  }),
  execute: async ({ text }) => {
    try {
      console.log("[bytebeam] Braille API - Converting text to Braille:", text)

      const response = await fetch('http://localhost:5001/api/translate/text-to-braille', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`Braille API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log("[bytebeam] Braille API response received")

      return {
        text,
        braille: data.braille || data.result || data.text || '',
        original: text,
      }
    } catch (error) {
      console.error("[bytebeam] Braille API error:", error)
      return { error: error instanceof Error ? error.message : "Braille conversion failed", text }
    }
  },
})
*/

// ===== ONE-SHOT TRANSFORMATION WITH STRUCTURED OUTPUT =====
// All transformation logic is now handled directly in the POST handler below
// using generateObject with structured schemas

const MAX_LOG_BODY = 4000

const TEXT_MIME_PREFIXES = ["text/", "application/json", "application/xml"]

function isTextLikeMime(mimeType?: string | null): boolean {
  if (!mimeType) return false
  const normalized = mimeType.toLowerCase()
  return TEXT_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

function truncateBody(body: string): string {
  return body.length > MAX_LOG_BODY ? `${body.slice(0, MAX_LOG_BODY)} ... [truncated]` : body
}

function extractUrls(text: string): string[] {
  if (!text) return []
  const matches = Array.from(text.matchAll(/https?:\/\/\S+/g)).map((m) =>
    m[0].replace(/[)\}>'"]+$/, ""),
  )
  return Array.from(new Set(matches))
}

type PrimitiveValue = string | number | boolean

function isPrimitiveValue(value: unknown): value is PrimitiveValue {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
}

function getValueByPath(source: Record<string, any>, path: string): unknown {
  const parts = path.split(".").map((p) => p.trim()).filter(Boolean)
  let current: any = source

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part]
      continue
    }
    return undefined
  }

  return current
}

function flattenPrimitiveValues(value: unknown, prefix?: string): Record<string, PrimitiveValue> {
  const result: Record<string, PrimitiveValue> = {}

  if (isPrimitiveValue(value)) {
    if (prefix) {
      result[prefix] = value
    }
    return result
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result
  }

  for (const [key, val] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key

    if (isPrimitiveValue(val)) {
      result[nextPrefix] = val
      continue
    }

    if (val && typeof val === "object" && !Array.isArray(val)) {
      const nested = flattenPrimitiveValues(val, nextPrefix)
      Object.assign(result, nested)
    }
  }

  return result
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function resolveUrlWithValues(
  url: string,
  replacements: Record<string, string>,
  candidates: Set<string>,
): { original: string; resolved: string; replacedTokens: string[]; unresolvedTokens: string[] } {
  let resolved = url
  const replacedTokens: string[] = []

  for (const [token, value] of Object.entries(replacements)) {
    const encodedValue = encodeURIComponent(value)
    let matched = false

    // Replace [token] style placeholders first
    const bracketPattern = new RegExp(`\\[\\s*${escapeRegExp(token)}\\s*\\]`, "g")
    if (bracketPattern.test(resolved)) {
      resolved = resolved.replace(bracketPattern, encodedValue)
      matched = true
    }

    // Then replace bare token occurrences
    const pattern = new RegExp(`\\b${escapeRegExp(token)}\\b`, "g")
    if (pattern.test(resolved)) {
      resolved = resolved.replace(pattern, encodedValue)
      matched = true
    }

    if (matched) {
      replacedTokens.push(token)
    }
  }

  const unresolvedTokens: string[] = []
  candidates.forEach((token) => {
    if (replacedTokens.includes(token)) return
    const pattern = new RegExp(`\\b${escapeRegExp(token)}\\b`)
    if (pattern.test(resolved)) {
      unresolvedTokens.push(token)
    }
  })

  return { original: url, resolved, replacedTokens, unresolvedTokens }
}

async function performWebSearch(query: string) {
  const apiKey = process.env.JINA_API_KEY
  console.log(`[bytebeam] Web search requested for "${query}" (API key ${apiKey ? "present" : "missing"})`)

  if (!apiKey) {
    return { error: "JINA_API_KEY not configured. Please set the JINA_API_KEY environment variable to enable web search.", query }
  }

  try {
    const response = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "X-Retain-Images": "none",
      },
    })

    const rawText = await response.text()
    console.log(`[bytebeam] Jina search raw response (${response.status}):`, truncateBody(rawText) || "<empty body>")

    if (!response.ok) {
      return { error: `Jina API error: ${response.status} ${rawText || response.statusText}`, query }
    }

    let data: any
    try {
      data = rawText ? JSON.parse(rawText) : {}
    } catch (parseError) {
      console.error("[bytebeam] Jina search JSON parse error:", parseError)
      return { error: "Jina API returned non-JSON response", query }
    }

    const results = (data.data || []).slice(0, 5).map((result: any) => ({
      title: result.title || result.breadcrumb || "",
      url: result.url || "",
      content: result.content || result.description || "",
    }))

    return {
      query,
      results,
      answer: data.answer || results[0]?.content || "No direct answer available",
      raw: data,
    }
  } catch (error) {
    console.error("[bytebeam] Jina search error:", error)
    return { error: error instanceof Error ? error.message : "Web search failed", query }
  }
}

async function performWebReader(url: string) {
  const apiKey = process.env.JINA_API_KEY
  console.log("[bytebeam] Web reader requested for URL:", url, `(API key ${apiKey ? "present" : "missing"})`)

  if (!apiKey) {
    return { error: "JINA_API_KEY not configured. Please set the JINA_API_KEY environment variable to enable web reading.", url }
  }

  try {
    new URL(url)
  } catch {
    return { error: "Invalid URL format", url }
  }

  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "X-Return-Format": "json",
      },
    })

    const rawText = await response.text()
    console.log(`[bytebeam] Jina Reader raw response (${response.status}):`, truncateBody(rawText) || "<empty body>")

    if (!response.ok) {
      return { error: `Jina Reader API error: ${response.status} ${rawText || response.statusText}`, url }
    }

    let data: any
    try {
      data = rawText ? JSON.parse(rawText) : {}
    } catch (parseError) {
      console.error("[bytebeam] Jina Reader JSON parse error:", parseError)
      return { error: "Jina Reader returned non-JSON response", url }
    }

    const payload = data?.data ?? data

    return {
      url,
      title: payload.title || payload.data?.title || "",
      content: payload.content || payload.text || payload.data?.content || "",
      description: payload.description || payload.data?.description || "",
      raw: data,
    }
  } catch (error) {
    console.error("[bytebeam] Jina Reader error:", error)
    return { error: error instanceof Error ? error.message : "Web reading failed", url }
  }
}

interface ImageSearchResult {
  url: string
  alt?: string
  caption?: string
  sourceUrl?: string
  sourceTitle?: string
}

async function performImageSearch(query: string): Promise<{
  query: string
  images: ImageSearchResult[]
  error?: string
}> {
  const apiKey = process.env.JINA_API_KEY
  console.log(`[bytebeam] Image search requested for "${query}" (API key ${apiKey ? "present" : "missing"})`)

  if (!apiKey) {
    return {
      error: "JINA_API_KEY not configured. Please set the JINA_API_KEY environment variable to enable image search.",
      query,
      images: []
    }
  }

  try {
    const response = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "X-With-Images-Summary": "all",  // Include images with captions
      },
    })

    const rawText = await response.text()
    console.log(`[bytebeam] Jina image search raw response (${response.status}):`, truncateBody(rawText) || "<empty body>")

    if (!response.ok) {
      return { error: `Jina API error: ${response.status} ${rawText || response.statusText}`, query, images: [] }
    }

    let data: any
    try {
      data = rawText ? JSON.parse(rawText) : {}
    } catch (parseError) {
      console.error("[bytebeam] Jina image search JSON parse error:", parseError)
      return { error: "Jina API returned non-JSON response", query, images: [] }
    }

    // Extract images from the search results
    const images: ImageSearchResult[] = []
    const results = data.data || []

    for (const result of results) {
      // Check if the result has images array
      if (result.images && Array.isArray(result.images)) {
        for (const img of result.images) {
          if (img.url || img.src) {
            images.push({
              url: img.url || img.src,
              alt: img.alt || img.title || "",
              caption: img.caption || img.description || "",
              sourceUrl: result.url || "",
              sourceTitle: result.title || "",
            })
          }
        }
      }

      // Also check for image property (single image)
      if (result.image) {
        images.push({
          url: typeof result.image === "string" ? result.image : result.image.url || result.image.src,
          alt: result.image?.alt || "",
          caption: result.image?.caption || "",
          sourceUrl: result.url || "",
          sourceTitle: result.title || "",
        })
      }

      // Check content for image references (markdown format)
      if (result.content) {
        const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
        let match
        while ((match = imgRegex.exec(result.content)) !== null) {
          const [, alt, url] = match
          if (url && !images.some(img => img.url === url)) {
            images.push({
              url,
              alt: alt || "",
              caption: "",
              sourceUrl: result.url || "",
              sourceTitle: result.title || "",
            })
          }
        }
      }
    }

    console.log(`[bytebeam] Image search found ${images.length} images for "${query}"`)

    // Log first few images for debugging
    if (images.length > 0) {
      console.log("[bytebeam] First 5 images found:")
      images.slice(0, 5).forEach((img, idx) => {
        console.log(`  ${idx + 1}. ${img.url}`)
        console.log(`     Alt: ${img.alt || '(none)'}`)
        console.log(`     Source: ${img.sourceTitle || img.sourceUrl || '(unknown)'}`)
      })
    }

    return {
      query,
      images: images.slice(0, 20), // Limit to 20 images
    }
  } catch (error) {
    console.error("[bytebeam] Jina image search error:", error)
    return { error: error instanceof Error ? error.message : "Image search failed", query, images: [] }
  }
}

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
    default: {
      const toStringSafe = (val: unknown): string => {
        if (val === undefined || val === null) return ""
        if (typeof val === "string") return val
        if (typeof val === "number" || typeof val === "boolean") return String(val)
        try {
          return JSON.stringify(val)
        } catch {
          return String(val)
        }
      }

      // Accept any incoming type, coerce to string, then apply string constraints via pipe
      let stringTarget = z.string()
      if (fieldSchema.constraints?.minLength !== undefined) stringTarget = stringTarget.min(fieldSchema.constraints.minLength)
      if (fieldSchema.constraints?.maxLength !== undefined) stringTarget = stringTarget.max(fieldSchema.constraints.maxLength)

      prop = z.any().transform(toStringSafe).pipe(stringTarget)
      break
    }
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
    const inputDocuments: Array<{ fieldId?: string; name?: string; type?: string; data?: string; text?: string; inputType?: string }> = Array.isArray(body.inputDocuments)
      ? body.inputDocuments
      : []

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
      const primitiveSubstitutions: Record<string, string> = {}
      const primitiveTokenCandidates = new Set<string>()

      const registerPrimitiveToken = (token: string, value: unknown) => {
        primitiveTokenCandidates.add(token)
        const leaf = token.split(".").pop()
        if (leaf) primitiveTokenCandidates.add(leaf)

        if (isPrimitiveValue(value)) {
          const valueAsString = String(value)
          if (!(token in primitiveSubstitutions)) {
            primitiveSubstitutions[token] = valueAsString
          }
          if (leaf && !(leaf in primitiveSubstitutions)) {
            primitiveSubstitutions[leaf] = valueAsString
          }
        }
      }

      substitutedPrompt = substitutedPrompt.replace(/\{([^}]+)\}/g, (match, columnName) => {
        const key = columnName.trim()
        const value = getValueByPath(columnValues, key)
        if (value === undefined) return match

        // If value is an object/structured type, provide it as JSON context
        if (typeof value === 'object' && value !== null) {
          const jsonValue = JSON.stringify(value, null, 2)
          columnContext.push(`${key}: ${jsonValue}`)

          const flattened = flattenPrimitiveValues(value, key)
          Object.entries(flattened).forEach(([flatKey, flatValue]) => {
            registerPrimitiveToken(flatKey, flatValue)
          })

          return `{${key}}`
        }

        // For primitive values, substitute directly
        registerPrimitiveToken(key, value)
        return String(value)
      })

      const detectedUrls = extractUrls(substitutedPrompt)
      const urlPlaceholderTokens = new Set<string>()

      detectedUrls.forEach((url) => {
        Array.from(url.matchAll(/\[([^\]]+)\]/g)).forEach(([, token]) => urlPlaceholderTokens.add(token.trim()))
        Array.from(url.matchAll(/\{([^}]+)\}/g)).forEach(([, token]) => urlPlaceholderTokens.add(token.trim()))
      })

      const placeholderTokensLower = new Set(Array.from(urlPlaceholderTokens).map((t) => t.toLowerCase()))

      urlPlaceholderTokens.forEach((token) => {
        const value = getValueByPath(columnValues, token)
        if (value !== undefined) {
          registerPrimitiveToken(token, value)
        } else {
          primitiveTokenCandidates.add(token)
        }
      })

      const buildAutoQuery = (): string | null => {
        const stringEntries = Object.entries(primitiveSubstitutions)
          .map(([key, val]) => [key, String(val).trim()] as const)
          .filter(([, val]) => val.length > 0)

        if (stringEntries.length === 0) return null

        const preferred = stringEntries
          .filter(([key]) => /query|search|drug|name|title|product|generic|brand|variant|form/i.test(key))
          .map(([, val]) => val)

        const parts = preferred.length > 0 ? preferred : stringEntries.map(([, val]) => val)
        const uniqueParts = Array.from(new Set(parts))
        if (uniqueParts.length === 0) return null

        return uniqueParts.slice(0, 3).join(" ")
      }

      const needsQuery =
        placeholderTokensLower.has("query") ||
        placeholderTokensLower.has("search_query") ||
        placeholderTokensLower.has("sfda_search_query")

      const autoQueryValue = needsQuery ? buildAutoQuery() : null
      if (autoQueryValue) {
        if (!primitiveSubstitutions["query"]) {
          primitiveSubstitutions["query"] = autoQueryValue
        }
        if (!primitiveSubstitutions["search_query"]) {
          primitiveSubstitutions["search_query"] = autoQueryValue
        }
        if (!primitiveSubstitutions["sfda_search_query"]) {
          primitiveSubstitutions["sfda_search_query"] = autoQueryValue
        }
        primitiveTokenCandidates.add("query")
        primitiveTokenCandidates.add("search_query")
        primitiveTokenCandidates.add("sfda_search_query")
      }

      console.log("[bytebeam] Transform - Original prompt:", prompt)
      const resolvedUrls = detectedUrls.map((url) =>
        resolveUrlWithValues(url, primitiveSubstitutions, primitiveTokenCandidates)
      )

      let promptWithResolvedUrls = substitutedPrompt
      resolvedUrls.forEach(({ original, resolved }) => {
        if (original === resolved) return
        const pattern = new RegExp(escapeRegExp(original), "g")
        promptWithResolvedUrls = promptWithResolvedUrls.replace(pattern, resolved)
      })

      const urlsInPrompt = extractUrls(promptWithResolvedUrls)
      const hasExplicitUrl = urlsInPrompt.length > 0

      console.log("[bytebeam] Transform - URL resolutions:", resolvedUrls)
      console.log("[bytebeam] Transform - Prompt after URL resolution:", promptWithResolvedUrls)
      console.log("[bytebeam] Transform - Column values:", columnValues)
      console.log("[bytebeam] Transform - Substituted prompt:", substitutedPrompt)
      console.log("[bytebeam] Transform - Column context:", columnContext)
      console.log("[bytebeam] Transform - Knowledge context size:", knowledgeContext.length)
      console.log("[bytebeam] Transform - Field type:", fieldType)
      console.log("[bytebeam] Transform - Field schema:", fieldSchema)
      console.log("[bytebeam] Transform - Selected tools:", selectedTools)
      if (inputDocuments.length > 0) {
        console.log("[bytebeam] Transform - Attached input documents:", inputDocuments.length)
      }

      // Execute web tools server-side (OpenRouter tool calls are disabled)
      let webSearchData: any = null
      let webReaderData: any = null
      let imageSearchData: any = null

      if (selectedTools.includes('webSearch') && !hasExplicitUrl) {
        const queryCandidate =
          primitiveSubstitutions['sfda_search_query'] ??
          primitiveSubstitutions['search_query'] ??
          primitiveSubstitutions['query'] ??
          Object.values(primitiveSubstitutions)[0]

        if (queryCandidate) {
          console.log("[bytebeam] Transform - Running web search for:", queryCandidate)
          webSearchData = await performWebSearch(queryCandidate)
        } else {
          console.warn("[bytebeam] Transform - No query found for web search tool")
        }
      } else if (selectedTools.includes('webSearch') && hasExplicitUrl) {
        console.log("[bytebeam] Transform - Skipping web search because URL is explicitly provided")
      }

      if (selectedTools.includes('webReader')) {
        const targetUrlInfo = resolvedUrls[0]
        const targetUrl = targetUrlInfo?.resolved || urlsInPrompt[0]
        const hasUnresolvedTokens = (targetUrlInfo?.unresolvedTokens || []).length > 0

        if (targetUrl && !hasUnresolvedTokens) {
          console.log("[bytebeam] Transform - Running web reader for:", targetUrl)
          webReaderData = await performWebReader(targetUrl)
        } else if (hasUnresolvedTokens && targetUrlInfo) {
          console.warn("[bytebeam] Transform - Skipping web reader; unresolved tokens:", targetUrlInfo.unresolvedTokens)
          webReaderData = {
            error: `Missing values for ${targetUrlInfo.unresolvedTokens.join(", ")}`,
            url: targetUrlInfo.original,
          }
        } else {
          console.warn("[bytebeam] Transform - No URL found in prompt for web reader tool")
        }
      }

      // Execute image search if selected
      if (selectedTools.includes('imageSearch')) {
        const queryCandidate =
          primitiveSubstitutions['image_query'] ??
          primitiveSubstitutions['image_search_query'] ??
          primitiveSubstitutions['sfda_search_query'] ??
          primitiveSubstitutions['search_query'] ??
          primitiveSubstitutions['query'] ??
          Object.values(primitiveSubstitutions).filter(v => typeof v === 'string' && v.length > 0)[0]

        if (queryCandidate) {
          // Extract contextual keywords from the prompt to enhance image search
          const promptLower = promptWithResolvedUrls.toLowerCase()
          const contextKeywords: string[] = []

          // Regional/market context
          if (promptLower.includes('saudi') || promptLower.includes('ksa')) contextKeywords.push('Saudi Arabia')
          if (promptLower.includes('gcc') || promptLower.includes('gulf')) contextKeywords.push('GCC')
          if (promptLower.includes('arabic') || promptLower.includes('arab')) contextKeywords.push('Arabic')
          if (promptLower.includes('middle east') || promptLower.includes('mena')) contextKeywords.push('Middle East')
          if (promptLower.includes('uae') || promptLower.includes('emirates')) contextKeywords.push('UAE')
          if (promptLower.includes('sfda')) contextKeywords.push('SFDA')
          if (promptLower.includes('localized') || promptLower.includes('local')) contextKeywords.push('local market')

          // Product type context
          if (promptLower.includes('packaging') || promptLower.includes('package')) contextKeywords.push('packaging')
          if (promptLower.includes('box')) contextKeywords.push('box')
          if (promptLower.includes('label')) contextKeywords.push('label')
          if (promptLower.includes('product')) contextKeywords.push('product')

          // Build enhanced query
          const contextString = contextKeywords.length > 0 ? contextKeywords.join(' ') : 'product image'
          const imageQuery = `${queryCandidate} ${contextString}`

          console.log("[bytebeam] Transform - Running image search for:", imageQuery)
          console.log("[bytebeam] Transform - Context keywords extracted:", contextKeywords)
          imageSearchData = await performImageSearch(imageQuery)
        } else {
          console.warn("[bytebeam] Transform - No query found for image search tool")
        }
      }

      // If prompt explicitly asks for full content and we have a reader result, return it directly to avoid hallucinations
      const wantsFullContent = /entire content|full content|whole content/i.test(promptWithResolvedUrls)
      if (fieldType === 'string' && webReaderData && !webReaderData.error) {
        const directContent = webReaderData.content || webReaderData.description || ""
        if (wantsFullContent || (hasExplicitUrl && !selectedTools.includes('webSearch'))) {
          console.log("[bytebeam] Transform - Returning webReader content directly")
          return NextResponse.json({
            success: true,
            result: directContent || "no results found",
          })
        }
      }

      // ===== NEW ONE-SHOT STRUCTURED OUTPUT APPROACH =====

      // Helper function to convert text to braille
      const convertToBraille = async (text: string): Promise<string> => {
        try {
          console.log("[bytebeam] Braille API - Converting text to Braille:", text)
          const response = await fetch('http://localhost:5001/api/translate/text-to-braille', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ text }),
          })

          if (!response.ok) {
            const errorText = await response.text().catch(() => response.statusText)
            throw new Error(`Braille API error: ${response.status} ${errorText}`)
          }

          const data = await response.json()
          console.log("[bytebeam] Braille API response received")
          return data.braille || data.result || data.text || text
        } catch (error) {
          console.error("[bytebeam] Braille API error:", error)
          throw error
        }
      }

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
      if (selectedTools.includes('braille')) {
        toolMap.braille = brailleTool
      }
      */

      console.log("[bytebeam] Transform - Available tools:", Object.keys(toolMap))

      // Build context for the AI
      let contextInfo = ""

      if (columnContext.length > 0) {
        contextInfo += `Available data:\n${columnContext.join('\n')}\n\n`
      }

      const primitiveEntries = Object.entries(primitiveSubstitutions)
      if (primitiveEntries.length > 0) {
        const primitiveLines = primitiveEntries.map(([k, v]) => `- ${k}: ${v}`)
        contextInfo += `Available primitive values:\n${primitiveLines.join("\n")}\n\n`
      }

      if (resolvedUrls.length > 0) {
        const urlLines = resolvedUrls.map(({ original, resolved, unresolvedTokens }) => {
          const resolutionNote = original === resolved ? "" : ` -> ${resolved}`
          const unresolved = unresolvedTokens.length > 0 ? ` (missing: ${unresolvedTokens.join(", ")})` : ""
          return `- ${original}${resolutionNote}${unresolved}`
        })
        contextInfo += `URL resolution:\n${urlLines.join("\n")}\n\n`
      }

      if (knowledgeContext.length > 0) {
        contextInfo += `Reference Knowledge:\n${knowledgeContext.join('\n\n')}\n\n`
      }

      const toolContextParts: string[] = []
      if (webSearchData) {
        if (webSearchData.error) {
          toolContextParts.push(`Web search error${webSearchData.query ? ` for "${webSearchData.query}"` : ""}: ${webSearchData.error}`)
        } else {
          const searchSummaries = (webSearchData.results || [])
            .map((r: any, idx: number) => `${idx + 1}. ${r.title || r.url}\n${truncateBody(r.content || "")}`)
            .join('\n')
          toolContextParts.push(`Web search results for "${webSearchData.query}":\n${searchSummaries || "(no results)"}`)
        }
      }
      if (webReaderData) {
        if (webReaderData.error) {
          toolContextParts.push(`Web reader error${webReaderData.url ? ` for ${webReaderData.url}` : ""}: ${webReaderData.error}`)
        } else {
          const readerContent = webReaderData.content || webReaderData.description || ""
          toolContextParts.push(`Web reader content from ${webReaderData.url}:\n${truncateBody(readerContent)}`)
        }
      }
      if (imageSearchData) {
        if (imageSearchData.error) {
          toolContextParts.push(`Image search error${imageSearchData.query ? ` for "${imageSearchData.query}"` : ""}: ${imageSearchData.error}`)
        } else {
          const imageList = (imageSearchData.images || [])
            .map((img: ImageSearchResult, idx: number) =>
              `${idx + 1}. URL: ${img.url}\n   Alt: ${img.alt || "(none)"}\n   Caption: ${img.caption || "(none)"}\n   Source: ${img.sourceTitle || img.sourceUrl || "(unknown)"}`
            )
            .join('\n')
          toolContextParts.push(`Image search results for "${imageSearchData.query}" (${imageSearchData.images?.length || 0} images found):\n${imageList || "(no images found)"}`)
        }
      }
      if (toolContextParts.length > 0) {
        contextInfo += `Tool outputs (do not hallucinate beyond these):\n${toolContextParts.join('\n\n')}\n\n`
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

          const attachmentNote =
            inputDocuments.length > 0
              ? `\nAttached documents: ${inputDocuments
                .map((doc) => doc.name || doc.fieldId || "document")
                .join(", ")}. Use them when they match referenced input fields.`
              : ""

          const buildInputDocMessages = (docs: typeof inputDocuments) =>
            docs.flatMap((doc) => {
              if (!doc) return []
              const mimeType = doc.type || "application/octet-stream"
              const isTextDoc = typeof doc.text === "string" || isTextLikeMime(mimeType)
              const decodedText =
                typeof doc.text === "string"
                  ? doc.text
                  : isTextDoc && doc.data
                    ? Buffer.from(String(doc.data), "base64").toString("utf-8")
                    : null
              const label = `Document "${doc.name || doc.fieldId || "input document"}"${doc.fieldId ? ` (input id: ${doc.fieldId})` : ""
                }`

              if (decodedText) {
                return [{ type: "text", text: `${label}\n\n${decodedText}` }]
              }

              if (doc.data) {
                return [
                  { type: "text", text: label },
                  { type: "image", image: `data:${mimeType};base64,${doc.data}` },
                ]
              }

              return [{ type: "text", text: label }]
            })

          // Build the comprehensive prompt for one-shot generation
          let fullPrompt = `${promptWithResolvedUrls}

${contextInfo}${attachmentNote}

Instructions:
- Perform the task described above
- Return the result in the exact schema format required
- For list/table types: Return all items as an array of objects
- For object types: Return all fields matching the schema
- For primitive types: Return the single value
- If a URL contains placeholders or missing parameters, replace them using the available primitive values before proceeding
- If you need to perform calculations, use the calculator tool
- If you need to search for information, use the webSearch tool
- If you need to convert text to Braille, use the braille tool
- Use the Tool outputs above as ground truth for web search/reader content; do not invent details
- Ensure data types match the schema (numbers as numbers, not strings)
- If information is not available, use null for that field
- Use the provided Reference Knowledge to answer questions or perform tasks if applicable`

          // If outputAsFile is enabled, append markdown formatting instructions
          if (fieldSchema?.outputAsFile) {
            fullPrompt += `

Format your response using proper Markdown syntax:
- Use ## for main sections and ### for subsections
- Use **bold** for emphasis and key terms
- Use bullet lists (-) and numbered lists (1.) where appropriate
- Use tables (| col | col |) for structured data
- Use clear paragraph breaks between sections
- Structure the content as a professional document`
          }

          // Build user message content; if input docs are attached, include them as images after the prompt text
          const userMessageContent =
            inputDocuments.length > 0
              ? [
                { type: "text", text: fullPrompt },
                ...buildInputDocMessages(inputDocuments),
              ]
              : fullPrompt

          // Use generateObject with tools for one-shot structured output
          const structuredResult = await generateObject({
            temperature: 0.1,
            schema: zodSchema,
            messages: [{ role: "user", content: userMessageContent }]
            // Note: Tool support temporarily disabled during OpenRouter migration
            // ...(Object.keys(toolMap).length > 0 ? { tools: toolMap, maxSteps: 5 } : {})
          })

          finalResult = structuredResult.object
          console.log("[bytebeam] Transform - Structured result:", JSON.stringify(finalResult, null, 2))

        } catch (error) {
          console.error("[bytebeam] Transform - Structured output error:", error)
          // Fallback to plain text generation to avoid 500s when the model returns non-conforming JSON
          const fallbackPrompt = `${promptWithResolvedUrls}

${contextInfo}

Instructions:
- Perform the task described above
- Return ONLY the final result, nothing else
- If a URL contains placeholders or missing parameters, replace them using the available primitive values before proceeding
- Use the Tool outputs above as ground truth for web search/reader content; do not invent details
- Use the provided Reference Knowledge to answer questions or perform tasks if applicable`

          const fallbackMessageContent =
            inputDocuments.length > 0
              ? [
                { type: "text", text: fallbackPrompt },
                ...buildInputDocMessages(inputDocuments),
              ]
              : fallbackPrompt

          const { text } = await generateText({
            temperature: 0.1,
            messages: [{ role: "user", content: fallbackMessageContent }]
          })

          finalResult = text
          console.log("[bytebeam] Transform - Fallback text result:", finalResult)
        }
      } else {
        // Fallback for fields without type information (backward compatibility)
        console.log("[bytebeam] Transform - Using text-based output (no type info)")

        const fullPrompt = `${promptWithResolvedUrls}

${contextInfo}

Instructions:
- Perform the task described above
- Return ONLY the final result, nothing else
- If you need to perform calculations, use the calculator tool
- If you need to search for information, use the webSearch tool
- If you need to convert text to Braille, use the braille tool
- If a URL contains placeholders or missing parameters, replace them using the available primitive values before proceeding
- Use the Tool outputs above as ground truth for web search/reader content; do not invent details
- Use the provided Reference Knowledge to answer questions or perform tasks if applicable`

        const userMessageContent =
          inputDocuments.length > 0
            ? [
              { type: "text", text: fullPrompt },
              ...inputDocuments.flatMap((doc) => {
                if (!doc?.data) return []
                const mimeType = doc.type || "application/octet-stream"
                return [
                  {
                    type: "text",
                    text: `Document "${doc.name || doc.fieldId || "input document"}"${doc.fieldId ? ` (input id: ${doc.fieldId})` : ""
                      }`,
                  },
                  {
                    type: "image",
                    image: `data:${mimeType};base64,${doc.data}`,
                  },
                ]
              }),
            ]
            : fullPrompt

        const { text } = await generateText({
          temperature: 0.1,
          messages: [{ role: "user", content: userMessageContent }]
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
