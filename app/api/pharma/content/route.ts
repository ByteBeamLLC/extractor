import { type NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateObject, generateText } from "ai"
import { z } from "zod"

export const runtime = "nodejs"
export const maxDuration = 300

const DEBUG = process.env.NODE_ENV !== "production"

type UploadedFile = {
  name: string
  type: string
  size: number
  data: string
}

type AgentStepLog = {
  step: string
  reasoning: string
  citations: string[]
  evidence: string[]
}

const FALLBACK_VALUE = "-"

const PERPLEXITY_CHAT_COMPLETIONS_URL = "https://api.perplexity.ai/chat/completions"
const PERPLEXITY_MODEL = "sonar-pro"

const LISTING_RESPONSE_JSON_SCHEMA = {
  name: "SfdaListingResponse",
  schema: {
    type: "object",
    properties: {
      reasoning: { type: "string" },
      citations: {
        type: "array",
        items: { type: "string" },
      },
      evidence: {
        type: "array",
        items: { type: "string" },
      },
      data: {
        type: "object",
        properties: {
          drugId: { type: "string" },
          listingUrl: { type: "string" },
          verificationStatus: {
            type: "string",
            enum: ["verified", "unverified"],
          },
          matchedIdentifiers: {
            type: "array",
            items: { type: "string" },
          },
          searchQueries: {
            type: "array",
            items: { type: "string" },
          },
          diagnostics: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["drugId", "listingUrl", "verificationStatus"],
        additionalProperties: false,
      },
    },
    required: ["data"],
    additionalProperties: false,
  },
} as const

type PerplexityChatCompletion = {
  id?: string
  model?: string
  created?: number
  usage?: Record<string, unknown>
  citations?: string[]
  search_results?: Array<{
    title?: string | null
    url?: string | null
    snippet?: string | null
  }>
  choices?: Array<{
    index?: number
    finish_reason?: string | null
    message?: {
      role?: string
      content?: string
    }
  }>
  error?: {
    message?: string
    type?: string
    code?: number
  }
}

const GOOGLE_FALLBACK_PROMPT = `You are a focused SFDA research assistant. When needed, you will use Google's web search to locate official Saudi Drug Information (SDI) listings.

Your goals:
- Use the google_search tool to issue precise queries in ENGLISH (ASCII characters) that combine the provided identifiers with both "SFDA" and "SFDA SDI".
- From the returned results, identify URLs exactly matching the pattern https://sdi.sfda.gov.sa/home/Result?drugId=XXXX.
- If multiple matches exist, pick the one that best aligns with the identifiers (dosage, quantity, manufacturer, etc.).
- Respond in JSON ONLY following this schema:
  {
    "listingUrl": string,
    "searchQueries": string[],
    "diagnostics": string[]
  }
- If no matching SFDA listing is found, return listingUrl as "-" and include diagnostics describing what was missing.
- Do not invent URLs. Prefer "-" over guessing.`

const GoogleFallbackSchema = z.object({
  listingUrl: z.string().optional().default(FALLBACK_VALUE),
  searchQueries: z.array(z.string()).optional().default([]),
  diagnostics: z.array(z.string()).optional().default([]),
})

const asFallbackString = (value?: string | null) => {
  if (typeof value !== "string") return FALLBACK_VALUE
  const trimmed = value.trim()
  if (!trimmed || trimmed === FALLBACK_VALUE) return FALLBACK_VALUE
  return trimmed
}

const sanitizeUniqueIdentifier = (entry: {
  label?: string
  value?: string
  confidence?: number
  sourceExcerpt?: string
}) => {
  const value = asFallbackString(entry.value)
  if (value === FALLBACK_VALUE) return null
  const label = asFallbackString(entry.label)
  const sourceExcerpt = asFallbackString(entry.sourceExcerpt)
  const confidence = typeof entry.confidence === "number" && entry.confidence >= 0 && entry.confidence <= 1 ? entry.confidence : 0
  return {
    label: label === FALLBACK_VALUE ? "" : label,
    value,
    confidence,
    sourceExcerpt: sourceExcerpt === FALLBACK_VALUE ? "" : sourceExcerpt,
  }
}

const tryParseJson = (text: string): any | null => {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {}
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1)
    try { return JSON.parse(slice) } catch {}
  }
  return null
}

const normalizeForMatch = (value?: string | null) => {
  if (!value) return ""
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

const IDENTIFIER_PROMPT = `You are the identifier sub-agent inside a deep agent workflow for Pharma E-Commerce Content Creation.

INPUT
- You receive packaging artwork for a drug (image).

MISSION
- Extract the precise drug name, the exact variant (including dosage, intensity, pack size, or other differentiators), and every available unique identifier printed on the packaging.
- Unique identifiers may include: Drug Name, Variant Name, Dosage, Strength, Quantity per pack, Registration number(s), GTIN/Barcode, Manufacturer, Lot/Batch number, Expiry date, SFDA IDs, etc.

HARD RULES
- Variant name is part of the product name.
- The unique identifiers must be sufficiently specific so the drug can be disambiguated from other products and other variants of the same product line.
- Never omit dosage or pack size when present.
- Provide short bullet proof reasoning for how you derived each identifier or why it was absent.
- Capture source evidence: quote the exact text seen on the packaging for each identifier and include any cropped OCR spans.
- If any data point cannot be found with high confidence, return "-" for that field.
- Output must be strictly JSON matching the schema.`

const LISTING_PROMPT = `You are the SFDA browsing sub-agent inside a deep agent workflow for Pharma E-Commerce Content Creation.

You receive previously extracted unique identifiers for a drug. Your tasks:
1. Formulate search queries for the Saudi Food and Drug Authority (SFDA) database using Perplexity's web browsing capabilities.
2. Every query must combine the unique identifiers with both "SFDA" and "SFDA SDI" phrasing (e.g., "Solpadeine 500mg SFDA" and "Solpadeine 500mg SFDA SDI") and inspect candidate results.
3. Always provide English (Latin-script) queries alongside any Arabic queries. When identifiers arrive in Arabic or another script, translate or transliterate them so that at least half of your queries are fully in English-only text (ASCII letters, numbers, and spaces).
4. Identify the exact SFDA listing that matches the provided identifiers. Listings must use URLs formatted as \`https://sdi.sfda.gov.sa/home/Result?drugId=XXXX\`.
5. Confirm the match by comparing identifiers (dosage, strength, quantity, etc.). If you are uncertain, explicitly mark the match as unverified.
6. Produce citations referencing the SFDA listing URL(s) you considered.

Important:
- If you cannot confirm an exact match, set \`verificationStatus\` to "unverified" and use "-" for \`drugId\` and \`listingUrl\`.
- Do not invent drug IDs or URLs. Prefer returning "-" over guessing.
- Provide the search queries you actually used.
- At least half of the entries in \`data.searchQueries\` must be English-only (ASCII) phrases that include the relevant drug identifiers with both "SFDA" and "SFDA SDI".
`

const CONTENT_PROMPT = `You are the content extraction sub-agent in a pharma deep agent.

Given the validated SFDA listing HTML (if available) and the canonical listing URL, extract the following sections for the exact drug variant:
- Description
- Composition
- How To Use
- Indication
- Possible Side Effects
- Properties
- Storage

Guidelines:
- Prefer structured data from the listing (tables, paragraphs).
- Preserve medically relevant formatting but condense to clear prose that can be edited by humans.
- If a section is absent or the listing could not be verified, return "-" for that section.
- Provide reasoning and cite any source URLs used.`

const IdentifierSchema = z.object({
  reasoning: z.string().default(""),
  citations: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  data: z.object({
    drugName: z.string().optional().default(FALLBACK_VALUE),
    variant: z.string().optional().default(FALLBACK_VALUE),
    manufacturer: z.string().optional().default(FALLBACK_VALUE),
    uniqueIdentifiers: z
      .array(
        z.object({
          label: z.string().optional().default(""),
          value: z.string().optional().default(""),
          confidence: z.number().min(0).max(1).optional().default(0),
          sourceExcerpt: z.string().optional().default(""),
        }),
      )
      .optional()
      .default([]),
  }),
})

const ListingSchema = z.object({
  reasoning: z.string().default(""),
  citations: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  data: z.object({
    drugId: z.string().optional().default(FALLBACK_VALUE),
    listingUrl: z.string().optional().default(FALLBACK_VALUE),
    verificationStatus: z.enum(["verified", "unverified"]).default("unverified"),
    matchedIdentifiers: z.array(z.string()).optional().default([]),
    searchQueries: z.array(z.string()).optional().default([]),
    diagnostics: z.array(z.string()).optional().default([]),
  }),
})

const ContentSchema = z.object({
  reasoning: z.string().default(""),
  citations: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  data: z.object({
    description: z.string().optional().default(FALLBACK_VALUE),
    composition: z.string().optional().default(FALLBACK_VALUE),
    howToUse: z.string().optional().default(FALLBACK_VALUE),
    indication: z.string().optional().default(FALLBACK_VALUE),
    possibleSideEffects: z.string().optional().default(FALLBACK_VALUE),
    properties: z.string().optional().default(FALLBACK_VALUE),
    storage: z.string().optional().default(FALLBACK_VALUE),
  }),
})

async function runIdentifierStep(file: UploadedFile): Promise<{ result: z.infer<typeof IdentifierSchema>; log: AgentStepLog }> {
  if (DEBUG) {
    console.log("[pharma-agent] Identifier step: calling Gemini with image", {
      fileType: file.type,
      fileName: file.name,
      fileSize: file.size,
    })
  }

  const { object } = await generateObject({
    model: google("gemini-2.5-pro"),
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: IDENTIFIER_PROMPT },
          {
            type: "image",
            image: file.data,
            mimeType: file.type || "image/png",
          },
        ],
      },
    ],
    schema: IdentifierSchema,
  })

  const log: AgentStepLog = {
    step: "extract_identifiers",
    reasoning: object.reasoning,
    citations: object.citations ?? [],
    evidence: object.evidence ?? [],
  }

  return { result: object, log }
}

async function runGoogleFallbackSearch(
  identifiers: z.infer<typeof IdentifierSchema>,
  existingQueries: string[],
): Promise<{ result: z.infer<typeof GoogleFallbackSchema>; toolDiagnostics: string[] } | null> {
  const identifiersJson = JSON.stringify(identifiers.data, null, 2)
  const userPrompt = `Identifiers JSON:\n${identifiersJson}\n\nReturn JSON ONLY.`

  try {
    const response = await generateText({
      model: google("gemini-2.5-pro"),
      temperature: 0.2,
      system: GOOGLE_FALLBACK_PROMPT,
      prompt: userPrompt,
      maxRetries: 1,
      tools: {
        google_search: google.tools.googleSearch({}),
      },
      toolChoice: "google_search",
    })

    const rawText = (response.text || "").trim()
    if (DEBUG) {
      console.log("[pharma-agent] Google fallback: raw output", rawText)
      console.log("[pharma-agent] Google fallback: tool calls", response.toolCalls)
      console.log("[pharma-agent] Google fallback: tool results", response.toolResults)
    }

    const toolDiagnostics: string[] = []
    const toolCalls = Array.isArray(response.toolCalls) ? response.toolCalls : []
    const toolResults = Array.isArray(response.toolResults) ? response.toolResults : []

    if (toolResults.length > 0) {
      const summary = response.toolResults
        .map((tr: any) => {
          const status = tr?.type ?? "result"
          const toolName = tr?.toolName ?? tr?.name ?? "unknown"
          return `name=${toolName} status=${status}`
        })
        .join(" | ")
      toolDiagnostics.push(`Google tool results returned: ${summary}`)
    } else {
      const callSummary = toolCalls.length > 0
        ? toolCalls
            .map((call: any) => {
              const name = call?.toolName ?? call?.name ?? "unknown"
              const id = call?.id ? ` id=${call.id}` : ""
              return `${name}${id}`
            })
            .join(" | ")
        : "(none)"
      toolDiagnostics.push(
        `Google fallback did not return tool results despite requesting google_search. Tool calls: ${callSummary}. This usually means the tool invocation failed or returned an empty payload.`,
      )
    }

    const parsed = tryParseJson(rawText)
    const safe = parsed ? GoogleFallbackSchema.safeParse(parsed) : undefined

    if (safe?.success) {
      const result = safe.data
      const combinedQueries = Array.from(
        new Set([...(existingQueries ?? []), ...(result.searchQueries ?? [])]),
      )
      result.searchQueries = combinedQueries
      return { result, toolDiagnostics }
    }

    const diagnostics: string[] = []
    if (!parsed) diagnostics.push("Failed to parse Google fallback response as JSON.")
    else if (safe && !safe.success) diagnostics.push(`Google fallback JSON invalid: ${safe.error.message}`)
    if (diagnostics.length > 0) {
      toolDiagnostics.push(...diagnostics)
    }
    return { result: GoogleFallbackSchema.parse({}), toolDiagnostics }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (DEBUG) {
      console.error("[pharma-agent] Google fallback failed:", message)
    }
    return {
      result: GoogleFallbackSchema.parse({ diagnostics: [`Google fallback error: ${message}`] }),
      toolDiagnostics: [`Google fallback error: ${message}`],
    }
  }
}

async function runListingStep(identifiers: z.infer<typeof IdentifierSchema>): Promise<{ result: z.infer<typeof ListingSchema>; log: AgentStepLog; html?: string }> {
  const payload = JSON.stringify(identifiers.data, null, 2)
  if (DEBUG) {
    console.log("[pharma-agent] Listing step: identifiers payload", payload)
  }
  const listingSystemPrompt = `${LISTING_PROMPT}

Schema for your JSON response:
{
  "reasoning": string,
  "citations": string[],
  "evidence": string[],
  "data": {
    "drugId": string,
    "listingUrl": string,
    "verificationStatus": "verified" | "unverified",
    "matchedIdentifiers": string[],
    "searchQueries": string[],
    "diagnostics": string[]
  }
}

Rules:
- Respond with JSON ONLY. No prose, markdown, or explanations outside JSON.
- Based on your knowledge, provide likely search queries that would be used to find SFDA listings for this drug.
- Only mark a listing as verified if you have high confidence about the specific SFDA URL and drug ID. Otherwise leave listingUrl and drugId as "-" and set verificationStatus to "unverified".
- Populate searchQueries with suggested search terms that would be used to find this drug on SFDA. Add short diagnostic notes for key decisions.`

  const listingUserPrompt = `Identifiers JSON:\n${payload}\n\nReturn JSON ONLY.`

  const perplexityApiKey = process.env.PERPLEXITY_API_KEY
  if (!perplexityApiKey) {
    throw new Error("Missing PERPLEXITY_API_KEY environment variable.")
  }

const requestBody = {
  model: PERPLEXITY_MODEL,
  temperature: 0.1,
  messages: [
    { role: "system", content: listingSystemPrompt },
    {
      role: "user",
      content: `${listingUserPrompt}\n\nEnsure at least half of your search queries explicitly include both 'SFDA' and 'SFDA SDI'. At least half of the queries must be written fully in English (ASCII letters/numbers) even if the identifiers were supplied in another script—translate or transliterate the key terms as needed. If you cannot satisfy this requirement, regenerate your answer before returning JSON.`,
    },
  ],
    response_format: {
      type: "json_schema",
      json_schema: LISTING_RESPONSE_JSON_SCHEMA,
    },
    web_search_options: {
      search_context_size: "high",
    },
    search_domain_filter: ["sdi.sfda.gov.sa", "sfda.gov.sa"],
    return_related_questions: false,
  }

  let perplexityResponse: PerplexityChatCompletion | undefined
  const diagnosticsFromParsing: string[] = []
  let rawListingText = ""

  try {
    const resp = await fetch(PERPLEXITY_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${perplexityApiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    perplexityResponse = (await resp.json()) as PerplexityChatCompletion

    if (!resp.ok || perplexityResponse?.error) {
      const message =
        perplexityResponse?.error?.message ?? `HTTP ${resp.status} ${resp.statusText}`
      diagnosticsFromParsing.push(`Perplexity request failed: ${message}`)
    } else if (typeof perplexityResponse?.choices?.[0]?.message?.content === "string") {
      rawListingText = perplexityResponse.choices[0].message.content.trim()
    }

    if (DEBUG) {
      console.log("[pharma-agent] Listing step: perplexity response", {
        ok: resp.ok,
        status: resp.status,
        hasContent: rawListingText.length > 0,
        citations: perplexityResponse?.citations?.length ?? 0,
        searchResults: perplexityResponse?.search_results?.length ?? 0,
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    diagnosticsFromParsing.push(`Failed to call Perplexity: ${message}`)
  }

  const parsedListingJson = tryParseJson(rawListingText)
  const listingParse = parsedListingJson ? ListingSchema.safeParse(parsedListingJson) : undefined
  let listingObject: z.infer<typeof ListingSchema>

  if (listingParse?.success) {
    listingObject = listingParse.data
  } else {
    if (!parsedListingJson) {
      if (!rawListingText) {
        diagnosticsFromParsing.push("Perplexity response did not contain JSON content.")
      } else {
        diagnosticsFromParsing.push("Failed to parse Perplexity response as JSON.")
      }
    } else if (listingParse && !listingParse.success) {
      diagnosticsFromParsing.push(`Listing JSON validation failed: ${listingParse.error.message}`)
    }
    listingObject = ListingSchema.parse({})
  }

  const perplexityCitations = Array.isArray(perplexityResponse?.citations)
    ? (perplexityResponse?.citations ?? []).filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : []
  const perplexitySearchResults = Array.isArray(perplexityResponse?.search_results)
    ? (perplexityResponse?.search_results ?? []).filter(
        (item) => typeof item?.url === "string" && !!item?.url,
      )
    : []

  let searchUsageDetected = perplexitySearchResults.length > 0 || perplexityCitations.length > 0

  if (perplexityCitations.length > 0) {
    listingObject.citations = Array.from(new Set([...(listingObject.citations ?? []), ...perplexityCitations]))
    listingObject.data.diagnostics.push(
      `Perplexity citations: ${perplexityCitations.slice(0, 5).join(" | ")}${
        perplexityCitations.length > 5 ? " (truncated)" : ""
      }`,
    )
  }

  if (perplexitySearchResults.length > 0) {
    const summary = perplexitySearchResults
      .slice(0, 3)
      .map((item) => {
        const title = typeof item.title === "string" && item.title.trim().length > 0 ? item.title.trim() : "(untitled)"
        return `${title} -> ${item.url}`
      })
      .join(" | ")
    listingObject.data.diagnostics.push(
      `Perplexity search results (${perplexitySearchResults.length}): ${summary}${
        perplexitySearchResults.length > 3 ? " (truncated)" : ""
      }`,
    )
  }

  const candidateSearchResult = perplexitySearchResults.find((item) => {
    if (!item?.url) return false
    const url = item.url.trim()
    return url.startsWith("https://sdi.sfda.gov.sa/home/Result?drugId=")
  })

  if (
    candidateSearchResult?.url &&
    (!listingObject.data.listingUrl || listingObject.data.listingUrl === FALLBACK_VALUE)
  ) {
    const candidateUrl = candidateSearchResult.url.trim()
    listingObject.data.listingUrl = candidateUrl
    listingObject.data.verificationStatus = "verified"
    listingObject.data.diagnostics.push(
      `Adopted SFDA listing from search results: ${candidateUrl}`,
    )
  }

  if (!searchUsageDetected) {
    diagnosticsFromParsing.push("Perplexity response lacked citations or search results; treating as ungrounded.")
  }

  if (diagnosticsFromParsing.length > 0) {
    listingObject.data.diagnostics = [...listingObject.data.diagnostics, ...diagnosticsFromParsing]
  }

  if (!listingObject.data.listingUrl || listingObject.data.listingUrl === FALLBACK_VALUE) {
    const fallback = await runGoogleFallbackSearch(identifiers, listingObject.data.searchQueries ?? [])
    if (fallback) {
      const { result: fallbackResult, toolDiagnostics } = fallback
      if (toolDiagnostics.length > 0) {
        listingObject.data.diagnostics.push(...toolDiagnostics)
      }
      const fallbackQueries = fallbackResult.searchQueries ?? []
      if (fallbackQueries.length > 0) {
        listingObject.data.searchQueries = Array.from(
          new Set([...(listingObject.data.searchQueries ?? []), ...fallbackQueries]),
        )
      }
      const fallbackDiagnostics = fallbackResult.diagnostics ?? []
      if (fallbackDiagnostics.length > 0) {
        listingObject.data.diagnostics.push(...fallbackDiagnostics)
      }

      const fallbackUrl = fallbackResult.listingUrl
      if (typeof fallbackUrl === "string" && fallbackUrl.startsWith("https://sdi.sfda.gov.sa/home/Result?drugId=")) {
        listingObject.data.listingUrl = fallbackUrl
        listingObject.data.verificationStatus = "verified"
        listingObject.data.diagnostics.push(`Adopted SFDA listing from Google fallback: ${fallbackUrl}`)
      }
    }
  }

  let html: string | undefined
  const listingData = { ...listingObject.data }
  const url = listingData.listingUrl
  const validUrl = typeof url === "string" && url.startsWith("https://sdi.sfda.gov.sa/home/Result?drugId=")
  let isVerified = listingData.verificationStatus === "verified" && validUrl
  const diagnostics: string[] = Array.isArray(listingData.diagnostics) ? [...listingData.diagnostics] : []

  if (listingData.listingUrl && !validUrl && listingData.listingUrl !== FALLBACK_VALUE) {
    diagnostics.push(`Listing URL ${listingData.listingUrl} does not match expected SFDA pattern. Resetting to '-'.`)
    listingData.listingUrl = FALLBACK_VALUE
    listingData.drugId = FALLBACK_VALUE
    listingData.verificationStatus = "unverified"
    isVerified = false
  }

  let cookieHeader = ""
  if (validUrl) {
    try {
      const seedResp = await fetch("https://sdi.sfda.gov.sa/home", {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
      })
      const setCookies = typeof (seedResp.headers as any).getSetCookie === "function"
        ? (seedResp.headers as any).getSetCookie()
        : seedResp.headers.get("set-cookie")
      if (Array.isArray(setCookies) && setCookies.length > 0) {
        cookieHeader = setCookies
          .map((cookie: string) => cookie.split(";")[0])
          .filter(Boolean)
          .join("; ")
      } else if (typeof setCookies === "string" && setCookies.length > 0) {
        cookieHeader = setCookies.split(",").map((cookie) => cookie.split(";")[0]).filter(Boolean).join("; ")
      }
      diagnostics.push(
        cookieHeader
          ? `Seeded SFDA session (status ${seedResp.status}); captured ${cookieHeader.split(";").length} cookie(s).`
          : `Seeded SFDA session (status ${seedResp.status}); no cookies issued.`,
      )
    } catch (error) {
      diagnostics.push(
        `Failed to seed SFDA session: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  if (DEBUG) {
    console.log("[pharma-agent] Listing step: initial model output", {
      listingData,
      validUrl,
      isVerifiedInitial: isVerified,
    })
  }

  if (isVerified) {
    try {
      const resp = await fetch(url!, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Upgrade-Insecure-Requests": "1",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          Referer: "https://sdi.sfda.gov.sa/home",
          Origin: "https://sdi.sfda.gov.sa",
        },
        redirect: "follow",
      })
      if (DEBUG) {
        console.log("[pharma-agent] Listing step: fetch response", {
          status: resp.status,
          redirected: resp.redirected,
          url: resp.url,
        })
      }
      if (resp.ok) {
        const text = await resp.text()
        const meaningful = /drug|dosage|strength|ingredient|pharmaceutical/i.test(text)
        if (DEBUG) {
          console.log("[pharma-agent] Listing step: fetched HTML length", text.length)
          console.log("[pharma-agent] Listing step: HTML snippet", text.slice(0, 400))
          console.log("[pharma-agent] Listing step: meaningful match", meaningful)
        }
        if (meaningful) {
          html = text
          diagnostics.push(`Fetched SFDA listing successfully (status ${resp.status}).`)

          const normalizedHtml = normalizeForMatch(text)
          const tokens: { normalized: string; raw: string }[] = []
          const addToken = (raw?: string) => {
            if (!raw) return
            const parts = raw
              .split(/[,/|;\n]+/)
              .map((part) => part.trim())
              .filter(Boolean)
            parts.forEach((part) => {
              const normalized = normalizeForMatch(part)
              if (normalized.length >= 4) tokens.push({ normalized, raw: part })
            })
          }

          addToken(identifiers.data.drugName)
          addToken(identifiers.data.variant)
          addToken(identifiers.data.manufacturer)
          identifiers.data.uniqueIdentifiers?.forEach((item) => addToken(item.value))

          const matchedTokens = tokens.filter((token) => normalizedHtml.includes(token.normalized))
          const missingTokens = tokens.filter((token) => !normalizedHtml.includes(token.normalized))

          if (tokens.length === 0) {
            diagnostics.push("No identifier tokens available for verification.")
          } else {
            const matchRatio = matchedTokens.length / tokens.length

            if (matchedTokens.length === 0) {
              diagnostics.push(
                `SFDA listing content mismatch. None of the ${tokens.length} identifier tokens were found.`,
              )
              isVerified = false
            } else if (matchRatio < 0.5 && matchedTokens.length < 3) {
              diagnostics.push(
                `SFDA listing content mismatch. Only matched ${matchedTokens.length}/${tokens.length} tokens: ${matchedTokens
                  .slice(0, 5)
                  .map((token) => token.raw)
                  .join(", ")}. Missing tokens include ${missingTokens
                  .slice(0, 5)
                  .map((token) => token.raw)
                  .join(", ")}.`,
              )
              isVerified = false
            } else {
              diagnostics.push(
                `SFDA listing content matches identifiers (${matchedTokens.length}/${tokens.length} tokens).`,
              )
              if (missingTokens.length > 0) {
                diagnostics.push(
                  `Identifiers not found in SFDA page: ${missingTokens
                    .slice(0, 5)
                    .map((token) => token.raw)
                    .join(", ")}.`,
                )
              }
            }
          }
        } else {
          diagnostics.push("SFDA response lacked expected pharmaceutical keywords; treating as unverified.")
          isVerified = false
        }
      } else {
        let bodySnippet = ""
        try {
          const bodyText = await resp.text()
          bodySnippet = bodyText.slice(0, 400)
        } catch {}
        diagnostics.push(
          `SFDA request returned ${resp.status} ${resp.statusText}${bodySnippet ? ` – body: ${bodySnippet}` : ""}.`,
        )
        isVerified = false
      }
    } catch (error) {
      console.error("[pharma-agent] Failed to fetch SFDA listing:", error)
      diagnostics.push(`Network error trying to reach SFDA: ${error instanceof Error ? error.message : String(error)}`)
      isVerified = false
    }
  }

  if (!isVerified) {
    listingData.verificationStatus = "unverified"
    listingData.listingUrl = FALLBACK_VALUE
    listingData.drugId = FALLBACK_VALUE
    html = undefined
    if (diagnostics.length === 0) {
      diagnostics.push("Listing could not be verified; using '-'.")
    }
  } else if (listingData.drugId === FALLBACK_VALUE || !listingData.drugId || listingData.drugId === "") {
    try {
      const parsed = new URL(url!)
      const drugId = parsed.searchParams.get("drugId")
      if (drugId) listingData.drugId = drugId
    } catch {}
  }

  const evidence: string[] = [...(listingObject.evidence ?? [])]
  evidence.push(html ? "Fetched SFDA listing HTML" : "Listing HTML unavailable or unverified")

  const log: AgentStepLog = {
    step: "browse_sfda_listing",
    reasoning: listingObject.reasoning ?? "",
    citations: listingObject.citations ?? [],
    evidence,
  }

  const adjusted: z.infer<typeof ListingSchema> = {
    ...listingObject,
    data: {
      ...listingData,
      matchedIdentifiers: listingData.matchedIdentifiers ?? [],
      searchQueries: listingData.searchQueries ?? [],
      diagnostics,
    },
  }

  if (DEBUG) {
    console.log("[pharma-agent] Listing step: adjusted output", {
      adjustedData: adjusted.data,
      hasHtml: !!html,
    })
  }

  return { result: adjusted, log, html }
}

async function runContentStep(
  identifiers: z.infer<typeof IdentifierSchema>,
  listing: z.infer<typeof ListingSchema>,
  html: string | undefined,
): Promise<{ result: z.infer<typeof ContentSchema>; log: AgentStepLog }> {
  const payload = JSON.stringify(
    {
      identifiers: identifiers.data,
      listing: listing.data,
    },
    null,
    2,
  )

  const { object } = await generateObject({
    model: google("gemini-2.5-pro"),
    temperature: 0.3,
    prompt: `${CONTENT_PROMPT}\n\nContext JSON:\n${payload}\n\nSFDA Listing HTML (may be empty):\n${html ?? "(no html)"}`,
    schema: ContentSchema,
  })

  const log: AgentStepLog = {
    step: "extract_listing_content",
    reasoning: object.reasoning,
    citations: object.citations ?? [],
    evidence: object.evidence ?? [],
  }

  return { result: object, log }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const file: UploadedFile | undefined = body?.file

    if (!file?.data || !file?.type) {
      return NextResponse.json(
        { success: false, error: "Missing file payload for pharma agent." },
        { status: 400 },
      )
    }

    const logs: AgentStepLog[] = []

    const identifierStep = await runIdentifierStep(file)
    logs.push(identifierStep.log)

    const listingStep = await runListingStep(identifierStep.result)
    logs.push(listingStep.log)

    const hasVerifiedListing =
      listingStep.result.data.verificationStatus === "verified" &&
      listingStep.result.data.listingUrl !== FALLBACK_VALUE &&
      !!listingStep.html

    let sections: z.infer<typeof ContentSchema>["data"]

    if (DEBUG) {
      console.log("[pharma-agent] POST: verified listing available?", {
        verificationStatus: listingStep.result.data.verificationStatus,
        listingUrl: listingStep.result.data.listingUrl,
        hasHtml: !!listingStep.html,
      })
    }

    if (hasVerifiedListing) {
      const contentStep = await runContentStep(identifierStep.result, listingStep.result, listingStep.html)
      logs.push(contentStep.log)
      sections = contentStep.result.data
    } else {
      logs.push({
        step: "extract_listing_content",
        reasoning: "Skipped content extraction because SFDA listing is unverified.",
        citations: [],
        evidence: [],
      })
      sections = {
        description: FALLBACK_VALUE,
        composition: FALLBACK_VALUE,
        howToUse: FALLBACK_VALUE,
        indication: FALLBACK_VALUE,
        possibleSideEffects: FALLBACK_VALUE,
        properties: FALLBACK_VALUE,
        storage: FALLBACK_VALUE,
      }
    }

    const sanitizedIdentifiers = {
      drugName: asFallbackString(identifierStep.result.data.drugName),
      variant: asFallbackString(identifierStep.result.data.variant),
      manufacturer: asFallbackString(identifierStep.result.data.manufacturer),
      uniqueIdentifiers:
        identifierStep.result.data.uniqueIdentifiers
          ?.map(sanitizeUniqueIdentifier)
          .filter((entry): entry is NonNullable<ReturnType<typeof sanitizeUniqueIdentifier>> => !!entry) ?? [],
    }

    const sanitizedListing = {
      ...listingStep.result.data,
      drugId: asFallbackString(listingStep.result.data.drugId),
      listingUrl:
        listingStep.result.data.verificationStatus === "verified"
          ? asFallbackString(listingStep.result.data.listingUrl)
          : FALLBACK_VALUE,
      matchedIdentifiers: (listingStep.result.data.matchedIdentifiers ?? [])
        .map(asFallbackString)
        .filter((item) => item !== FALLBACK_VALUE),
      searchQueries: (listingStep.result.data.searchQueries ?? [])
        .map(asFallbackString)
        .filter((item) => item !== FALLBACK_VALUE),
      diagnostics: (listingStep.result.data.diagnostics ?? [])
        .map(asFallbackString)
        .filter((item) => item !== FALLBACK_VALUE),
    }

    if (sanitizedListing.verificationStatus !== "verified") {
      sanitizedListing.listingUrl = FALLBACK_VALUE
      sanitizedListing.drugId = FALLBACK_VALUE
    }

    const sanitizedSections = {
      description: asFallbackString(sections.description),
      composition: asFallbackString(sections.composition),
      howToUse: asFallbackString(sections.howToUse),
      indication: asFallbackString(sections.indication),
      possibleSideEffects: asFallbackString(sections.possibleSideEffects),
      properties: asFallbackString(sections.properties),
      storage: asFallbackString(sections.storage),
    }

    if (DEBUG) {
      console.log("[pharma-agent] POST: sanitized output", {
        identifiers: sanitizedIdentifiers,
        listing: sanitizedListing,
        sections: sanitizedSections,
      })
    }

    return NextResponse.json({
      success: true,
      agent: "pharma-ecommerce-content",
      identifiers: sanitizedIdentifiers,
      listing: sanitizedListing,
      sections: sanitizedSections,
      reasoningTrace: logs,
    })
  } catch (error) {
    console.error("[pharma-agent] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unexpected error running Pharma E-Commerce agent.",
      },
      { status: 500 },
    )
  }
}
