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

/**
 * Returns true for errors that are worth retrying (transient network/API issues).
 */
function isTransientError(error: unknown): boolean {
    if (error instanceof TypeError) return true // fetch network failures
    const msg = error instanceof Error ? error.message : String(error)
    return (
        msg.includes('Unexpected end of JSON input') ||
        msg.includes('network') ||
        msg.includes('ECONNRESET') ||
        msg.includes('socket hang up') ||
        msg.includes('UND_ERR')
    )
}

/**
 * Returns true for HTTP status codes that are worth retrying.
 */
function isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500
}

/**
 * Calls OpenRouter with automatic retry on transient failures.
 * Retries on: network errors, truncated JSON responses, 5xx, 429.
 */
async function fetchOpenRouterWithRetry(
    body: Record<string, unknown>,
    retries = MAX_RETRIES,
): Promise<{ data: any }> {
    const apiKey = getApiKey()
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Parsli',
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText)
                if (isRetryableStatus(response.status) && attempt < retries) {
                    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
                    console.warn(`[openrouter] Retryable ${response.status}, attempt ${attempt + 1}/${retries + 1}, waiting ${delay}ms`)
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
                console.warn(`[openrouter] Transient error, attempt ${attempt + 1}/${retries + 1}, waiting ${delay}ms: ${lastError.message}`)
                await new Promise((r) => setTimeout(r, delay))
                continue
            }
            throw lastError
        }
    }

    throw lastError ?? new Error('OpenRouter request failed after retries')
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
}

interface GenerateObjectOptions {
    messages: Message[]
    schema: z.ZodSchema
    temperature?: number
    model?: string // Optional override
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
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

interface ContentItemWithImage {
    type: 'text' | 'image_url'
    text?: string
    image_url?: { url: string }
    image?: string
}

/**
 * Convert AI SDK message format to OpenRouter format
 */
function formatMessages(messages: Message[]): FormattedMessage[] {
    return messages.map(msg => {
        if (typeof msg.content === 'string') {
            return { role: msg.role, content: msg.content }
        }

        // Handle multimodal content (text + images)
        const content = msg.content.map(item => {
            if (item.type === 'text') {
                return { type: 'text', text: item.text }
            } else {
                // Handle both 'image' and 'image_url' types
                const itemWithImage = item as ContentItemWithImage
                const imageData = itemWithImage.image || itemWithImage.image_url?.url
                if (imageData) {
                    return {
                        type: 'image_url',
                        image_url: {
                            url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
                        }
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

    const { data } = await fetchOpenRouterWithRetry(body)

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
    })

    const content = data.choices?.[0]?.message?.content || '{}'

    // Parse JSON response
    let parsedObject
    try {
        parsedObject = JSON.parse(content)
    } catch (error) {
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

    const { data } = await fetchOpenRouterWithRetry({
        model,
        messages: formatMessages(enhancedMessages),
        temperature: options.temperature ?? 0.2,
        response_format: { type: 'json_object' },
    })

    const content = data.choices?.[0]?.message?.content || '{}'

    let parsedObject: Record<string, any>
    try {
        parsedObject = JSON.parse(content)
    } catch (error) {
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
