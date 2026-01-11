/**
 * OpenRouter Direct API Client
 * 
 * Provides direct HTTP requests to OpenRouter API, replacing AI SDK usage.
 * All LLM calls go through OpenRouter with API key and model from environment variables.
 */

import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

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
    const apiKey = getApiKey()
    const model = getModel(options.model)

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'ByteBeam Extractor'
        },
        body: JSON.stringify({
            model,
            messages: formatMessages(options.messages),
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    return { text }
}

export async function generateObject<T extends z.ZodSchema>(
    options: GenerateObjectOptions
): Promise<{ object: z.infer<T> }> {
    const apiKey = getApiKey()
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

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'ByteBeam Extractor'
        },
        body: JSON.stringify({
            model,
            messages: formatMessages(enhancedMessages),
            temperature: options.temperature ?? 0.1,
            response_format: { type: 'json_object' }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
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

/**
 * Check if OpenRouter is properly configured
 */
export function isOpenRouterConfigured(): boolean {
    return !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL)
}
