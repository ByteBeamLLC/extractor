/**
 * OpenRouter Direct API Client
 * 
 * Provides direct HTTP requests to OpenRouter API, replacing AI SDK usage.
 * All LLM calls go through OpenRouter with API key and model from environment variables.
 */

import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 1000
const DEFAULT_TIMEOUT_MS = 120_000 // 120s per-request fetch timeout

/**
 * Provider routing preferences.
 * Prefer Google AI Studio first (more reliable for large payloads),
 * then Vertex AI as fallback. OpenRouter auto-falls back on 5xx.
 */
const PROVIDER_PREFERENCES = {
    order: ['google', 'google-vertex'],
    allow_fallbacks: true,
}

/**
 * Returns true for errors that are worth retrying (transient network/API issues).
 * Timeout errors (from AbortSignal.timeout) are retryable — the model was slow.
 */
function isTransientError(error: unknown): boolean {
    if (error instanceof TypeError) return true // fetch network failures
    // AbortSignal.timeout: Node 18 throws AbortError, Node 20+ throws TimeoutError
    if (error instanceof DOMException) {
        return error.name === 'TimeoutError' || error.name === 'AbortError'
    }
    const msg = error instanceof Error ? error.message : String(error)
    return (
        msg.includes('Unexpected end of JSON input') ||
        msg.includes('network') ||
        msg.includes('ECONNRESET') ||
        msg.includes('socket hang up') ||
        msg.includes('UND_ERR') ||
        msg.includes('timed out') ||
        msg.includes('time budget exhausted')
    )
}

/**
 * Returns true for HTTP status codes that are worth retrying.
 */
function isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500
}

interface FetchOptions {
    retries?: number
    /** Per-request fetch timeout in milliseconds (default 45s). */
    timeoutMs?: number
    /** Absolute deadline (Date.now()-based). Prevents starting requests/retries that would exceed the route's maxDuration. */
    deadlineMs?: number
}

/**
 * Calls OpenRouter with automatic retry on transient failures.
 * Retries on: network errors, truncated JSON responses, 5xx, 429.
 * Respects per-request timeout and absolute deadline to prevent 504s.
 */
async function fetchOpenRouterWithRetry(
    body: Record<string, unknown>,
    options: FetchOptions = {},
): Promise<{ data: any }> {
    const retries = options.retries ?? MAX_RETRIES
    const perRequestTimeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

    const apiKey = getApiKey()
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Parsli',
    }

    // Apply provider routing preferences to all requests
    const bodyWithProvider = {
        ...body,
        provider: { ...PROVIDER_PREFERENCES, ...(body.provider as object || {}) },
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
        // Check deadline before starting a request
        let effectiveTimeout = perRequestTimeout
        if (options.deadlineMs) {
            const remaining = options.deadlineMs - Date.now()
            if (remaining <= 0) {
                throw new Error('OpenRouter request aborted: time budget exhausted')
            }
            effectiveTimeout = Math.min(perRequestTimeout, remaining)
        }

        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(bodyWithProvider),
                signal: AbortSignal.timeout(effectiveTimeout),
            })

            if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText)
                console.error(`[openrouter] API error ${response.status} (attempt ${attempt + 1}/${retries + 1}): ${errorText}`)
                if (isRetryableStatus(response.status) && attempt < retries) {
                    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
                    // Check if retry + delay would exceed deadline
                    if (options.deadlineMs && (Date.now() + delay) >= options.deadlineMs) {
                        throw new Error(`OpenRouter API error (${response.status}): ${errorText} [no time for retry]`)
                    }
                    console.warn(`[openrouter] Retrying in ${delay}ms...`)
                    await new Promise((r) => setTimeout(r, delay))
                    continue
                }
                throw new Error(`OpenRouter API error (${response.status}): ${errorText}`)
            }

            const data = await response.json()
            return { data }
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))
            if (isTransientError(error) && attempt < retries) {
                const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
                // Check if retry + delay would exceed deadline
                if (options.deadlineMs && (Date.now() + delay) >= options.deadlineMs) {
                    throw new Error(`${lastError.message} [no time for retry]`)
                }
                console.warn(`[openrouter] Transient error, attempt ${attempt + 1}/${retries + 1}, waiting ${delay}ms: ${lastError.message}`)
                await new Promise((r) => setTimeout(r, delay))
                continue
            }
            throw lastError
        }
    }

    throw lastError ?? new Error('OpenRouter request failed after retries')
}

/**
 * Defensive parser for LLM JSON responses.
 *
 * Provider-native `response_format: json_object` is respected by OpenAI but
 * only partially by Anthropic / some Google provider routes. When the model
 * ignores the directive we can still receive JSON wrapped in a markdown code
 * fence, or JSON with leading/trailing prose. We apply three progressive
 * strategies; the first that parses wins. This mirrors the "three layers of
 * defense" pattern from the LLM tooling ecosystem (LangChain, llm-exe,
 * ai-json-safe-parse) and intentionally preserves the fast path: valid JSON
 * still parses on the first attempt with no extra work.
 *
 * Returns the parsed value, or throws the original parse error if every
 * strategy fails — the caller surfaces that via
 * `Failed to parse JSON response from OpenRouter: …`.
 */
function safeParseLlmJson(content: string): unknown {
    // 1. Fast path — already-valid JSON.
    try {
        return JSON.parse(content)
    } catch (initialError) {
        // 2. Strip a markdown code fence (```json … ``` or ``` … ```), then retry.
        //    Matches fences anywhere in the string — model sometimes emits prose
        //    before/after. We reconstruct the inner payload only.
        const fence = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
        if (fence && fence[1]) {
            try {
                return JSON.parse(fence[1])
            } catch {
                /* fall through */
            }
        }

        // 3. Last resort — find the first balanced {…} or […] block in the text
        //    and parse that. Handles "Here is your JSON: { … }" style prefaces.
        const firstBrace = content.search(/[\[{]/)
        if (firstBrace >= 0) {
            const open = content[firstBrace]
            const close = open === '{' ? '}' : ']'
            const lastClose = content.lastIndexOf(close)
            if (lastClose > firstBrace) {
                const slice = content.slice(firstBrace, lastClose + 1)
                try {
                    return JSON.parse(slice)
                } catch {
                    /* fall through */
                }
            }
        }

        throw initialError
    }
}

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string | Array<{
        type: 'text' | 'image_url'
        text?: string
        image_url?: { url: string }
    }>
}

interface GenerateTextOptions {
    messages: Message[]
    temperature?: number
    maxTokens?: number
    model?: string // Optional override
    responseFormat?: { type: string } // e.g. { type: 'json_object' }
    timeoutMs?: number   // Per-request fetch timeout
    deadlineMs?: number  // Absolute time budget
}

interface GenerateObjectOptions {
    messages: Message[]
    schema: z.ZodSchema
    temperature?: number
    model?: string // Optional override
    timeoutMs?: number   // Per-request fetch timeout
    deadlineMs?: number  // Absolute time budget
}

/**
 * Get the configured OpenRouter API key
 */
function getApiKey(): string {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
        throw new Error(
            'OPENROUTER_API_KEY environment variable is not set. ' +
            'Please add it to your .env file.'
        )
    }
    return apiKey
}

/**
 * Get the configured model name
 */
function getModel(override?: string): string {
    const model = override || process.env.OPENROUTER_MODEL
    if (!model) {
        throw new Error(
            'OPENROUTER_MODEL environment variable is not set. ' +
            'Please add it to your .env file (e.g., "google/gemini-2.5-pro").'
        )
    }
    return model
}

interface FormattedMessage {
    role: 'user' | 'assistant' | 'system'
    content: string | Array<Record<string, any>>
}

interface ContentItemWithImage {
    type: 'text' | 'image_url' | 'file'
    text?: string
    image_url?: { url: string }
    image?: string
    // File-type fields (OpenRouter PDF/file URL support)
    filename?: string
    fileUrl?: string
}

/**
 * Convert AI SDK message format to OpenRouter format
 */
function formatMessages(messages: Message[]): FormattedMessage[] {
    return messages.map(msg => {
        if (typeof msg.content === 'string') {
            return { role: msg.role, content: msg.content }
        }

        // Handle multimodal content (text + images + files)
        const content = msg.content.map(item => {
            if (item.type === 'text') {
                return { type: 'text', text: item.text }
            }

            // File type: send URL directly to OpenRouter (no base64)
            const itemAny = item as ContentItemWithImage
            if (itemAny.type === 'file' && itemAny.fileUrl) {
                return {
                    type: 'file',
                    file: {
                        filename: itemAny.filename ?? 'document',
                        file_data: itemAny.fileUrl,
                    }
                }
            }

            // Image type: handle both 'image' and 'image_url' formats
            const imageData = itemAny.image || itemAny.image_url?.url
            if (imageData) {
                // If it's already a URL (not data:), use it directly
                if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
                    return {
                        type: 'image_url',
                        image_url: { url: imageData }
                    }
                }
                return {
                    type: 'image_url',
                    image_url: {
                        url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
                    }
                }
            }

            return item
        })

        return { role: msg.role, content }
    })
}

/**
 * Generate text using OpenRouter API
 * 
 * This replaces the AI SDK's generateText function
 */
export async function generateText(options: GenerateTextOptions): Promise<{ text: string }> {
    const model = getModel(options.model)

    const body: Record<string, unknown> = {
        model,
        messages: formatMessages(options.messages),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
    }
    if (options.responseFormat) {
        body.response_format = options.responseFormat
    }

    const { data } = await fetchOpenRouterWithRetry(body, {
        timeoutMs: options.timeoutMs,
        deadlineMs: options.deadlineMs,
    })

    const text = data.choices?.[0]?.message?.content || ''
    return { text }
}

export async function generateObject<T extends z.ZodSchema>(
    options: GenerateObjectOptions
): Promise<{ object: z.infer<T> }> {
    const model = getModel(options.model)

    // Add JSON schema instruction to the system message
    const jsonSchema = zodToJsonSchema(options.schema, "result")
    const schemaString = JSON.stringify(jsonSchema, null, 2)

    const enhancedMessages = [
        {
            role: 'system' as const,
            content: `You must respond with valid JSON only. No explanations, no markdown, just the JSON object matching the following schema:\n\n${schemaString}`
        },
        ...options.messages
    ]

    const { data } = await fetchOpenRouterWithRetry({
        model,
        messages: formatMessages(enhancedMessages),
        temperature: options.temperature ?? 0.1,
        response_format: { type: 'json_object' },
    }, {
        timeoutMs: options.timeoutMs,
        deadlineMs: options.deadlineMs,
    })

    const content = data.choices?.[0]?.message?.content || '{}'

    // Parse JSON response — tolerates markdown fences / prose around the JSON.
    let parsedObject
    try {
        parsedObject = safeParseLlmJson(content)
    } catch {
        throw new Error(`Failed to parse JSON response from OpenRouter: ${content}`)
    }

    // IMPORTANT: zodToJsonSchema wraps the schema in a "result" field
    // The LLM returns {"result": actualValue}, so we need to unwrap it
    // before validating with the actual schema
    let actualValue = parsedObject
    if (parsedObject && typeof parsedObject === 'object' && 'result' in parsedObject) {
        actualValue = parsedObject.result
    }

    // Validate against schema
    const validated = options.schema.parse(actualValue)

    return { object: validated }
}

interface GenerateFreeformJsonOptions {
    messages: Message[]
    temperature?: number
    model?: string
    timeoutMs?: number   // Per-request fetch timeout
    deadlineMs?: number  // Absolute time budget
    /** Provider routing override (e.g. { order: ['openai'], allow_fallbacks: true }). */
    provider?: { order?: string[]; allow_fallbacks?: boolean }
}

/**
 * Generate a freeform JSON object from the model without Zod schema enforcement.
 * Used for full_content extraction where the model decides the output structure.
 */
export async function generateFreeformJson(
    options: GenerateFreeformJsonOptions
): Promise<{ object: Record<string, any> }> {
    const model = getModel(options.model)

    const enhancedMessages = [
        {
            role: 'system' as const,
            content: 'You must respond with valid JSON only. No explanations, no markdown, no extra text — just the JSON object.'
        },
        ...options.messages
    ]

    const body: Record<string, unknown> = {
        model,
        messages: formatMessages(enhancedMessages),
        temperature: options.temperature ?? 0.2,
        response_format: { type: 'json_object' },
    }
    if (options.provider) {
        body.provider = options.provider
    }

    const { data } = await fetchOpenRouterWithRetry(body, {
        timeoutMs: options.timeoutMs,
        deadlineMs: options.deadlineMs,
    })

    const content = data.choices?.[0]?.message?.content || '{}'

    // Parse JSON response — tolerates markdown fences / prose around the JSON.
    let parsedObject: Record<string, any>
    try {
        const parsed = safeParseLlmJson(content)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('parsed value is not a JSON object')
        }
        parsedObject = parsed as Record<string, any>
    } catch {
        throw new Error(`Failed to parse JSON response from OpenRouter: ${content}`)
    }

    return { object: parsedObject }
}

/**
 * Check if OpenRouter is properly configured
 */
export function isOpenRouterConfigured(): boolean {
    return !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL)
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool / function calling
// ─────────────────────────────────────────────────────────────────────────────
//
// Used by the document chat feature. Supports OpenAI-style function calling
// via OpenRouter (which forwards transparently to the underlying provider).
// Runs a server-side tool execution loop: model proposes tool calls →
// handlers run in parallel → results are appended → model is called again →
// repeat until the model returns a plain text answer or hits maxIterations.

interface OpenRouterToolDefinition {
    type: 'function'
    function: {
        name: string
        description: string
        parameters: Record<string, unknown>
    }
}

interface OpenRouterToolCall {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: string
    }
}

interface OpenRouterChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool'
    content: string | null
    tool_calls?: OpenRouterToolCall[]
    tool_call_id?: string
    name?: string
}

export interface ChatToolForRouter {
    definition: {
        name: string
        description: string
        parameters: Record<string, unknown>
    }
    handler: (
        args: Record<string, unknown>,
    ) => Promise<
        { ok: true; result: unknown } | { ok: false; error: string }
    >
}

export interface ToolCallExecutionRecord {
    name: string
    args: Record<string, unknown>
    result: unknown
    ok: boolean
    error?: string
}

interface GenerateChatWithToolsOptions {
    /** Model id (e.g. 'openai/gpt-4.1-mini'). Falls back to OPENROUTER_MODEL env var. */
    model?: string
    /** System prompt — sent as the first message. */
    system: string
    /** User/assistant turns so far. The function appends the new exchange itself. */
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    /** Available tools. Names must be unique. */
    tools: ChatToolForRouter[]
    /** Max tool-loop rounds before giving up. Default 5. */
    maxIterations?: number
    /** Default 0.2 — chat over structured data should be deterministic. */
    temperature?: number
    /** Per-request fetch timeout in ms. */
    timeoutMs?: number
    /** Absolute deadline (Date.now()-based). */
    deadlineMs?: number
    /**
     * Provider routing override. By default `fetchOpenRouterWithRetry` injects
     * the Google provider order; pass e.g. `{ order: ['openai'], allow_fallbacks: true }`
     * to route to OpenAI models instead.
     */
    provider?: { order?: string[]; allow_fallbacks?: boolean }
}

/**
 * Run a chat completion with function calling and an automatic tool execution loop.
 *
 * Returns the final assistant text plus a record of every tool call that was
 * executed along the way (so the caller can surface them in the UI).
 *
 * Throws if the model is still calling tools after `maxIterations` rounds — that
 * usually means the model is stuck in a loop and the caller should bail.
 */
export async function generateChatWithTools(
    options: GenerateChatWithToolsOptions,
): Promise<{ text: string; toolCallsMade: ToolCallExecutionRecord[] }> {
    const model = getModel(options.model)
    const maxIterations = options.maxIterations ?? 5
    const temperature = options.temperature ?? 0.2

    const routerTools: OpenRouterToolDefinition[] = options.tools.map((t) => ({
        type: 'function',
        function: {
            name: t.definition.name,
            description: t.definition.description,
            parameters: t.definition.parameters,
        },
    }))
    const handlers = new Map(
        options.tools.map((t) => [t.definition.name, t.handler] as const),
    )

    const conversation: OpenRouterChatMessage[] = [
        { role: 'system', content: options.system },
        ...options.messages.map(
            (m) => ({ role: m.role, content: m.content }) as OpenRouterChatMessage,
        ),
    ]

    const toolCallsMade: ToolCallExecutionRecord[] = []

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        const body: Record<string, unknown> = {
            model,
            messages: conversation,
            temperature,
            tools: routerTools,
            tool_choice: 'auto',
        }
        if (options.provider) {
            body.provider = options.provider
        }

        const { data } = await fetchOpenRouterWithRetry(body, {
            timeoutMs: options.timeoutMs,
            deadlineMs: options.deadlineMs,
        })

        const choice = data.choices?.[0]
        if (!choice) {
            throw new Error('OpenRouter returned no choices')
        }

        const message = choice.message ?? {}
        const toolCalls: OpenRouterToolCall[] = message.tool_calls ?? []

        // No tool calls → model produced its final answer.
        if (toolCalls.length === 0) {
            const text = typeof message.content === 'string' ? message.content : ''
            return { text, toolCallsMade }
        }

        // Echo the assistant's tool-call message back into the conversation.
        // The OpenAI/OpenRouter contract requires this BEFORE the tool replies.
        conversation.push({
            role: 'assistant',
            content: typeof message.content === 'string' ? message.content : null,
            tool_calls: toolCalls,
        })

        // Run every tool call in parallel.
        const executions = await Promise.all(
            toolCalls.map(async (call) => {
                const record: ToolCallExecutionRecord = {
                    name: call.function.name,
                    args: {},
                    result: null,
                    ok: false,
                }

                let parsedArgs: Record<string, unknown> = {}
                try {
                    parsedArgs = call.function.arguments
                        ? JSON.parse(call.function.arguments)
                        : {}
                } catch (err) {
                    record.error = `Invalid tool arguments JSON: ${
                        err instanceof Error ? err.message : String(err)
                    }`
                    return { call, record }
                }
                record.args = parsedArgs

                const handler = handlers.get(call.function.name)
                if (!handler) {
                    record.error = `Unknown tool: ${call.function.name}`
                    return { call, record }
                }

                try {
                    const handlerResult = await handler(parsedArgs)
                    if (handlerResult.ok) {
                        record.ok = true
                        record.result = handlerResult.result
                    } else {
                        record.error = handlerResult.error
                    }
                } catch (err) {
                    record.error = err instanceof Error ? err.message : String(err)
                }
                return { call, record }
            }),
        )

        for (const { call, record } of executions) {
            toolCallsMade.push(record)
            const toolResponseBody = record.ok
                ? { result: record.result }
                : { error: record.error ?? 'Unknown error' }
            conversation.push({
                role: 'tool',
                tool_call_id: call.id,
                name: call.function.name,
                content: JSON.stringify(toolResponseBody),
            })
        }
    }

    throw new Error(
        `Tool loop exceeded ${maxIterations} iterations without a final answer`,
    )
}
