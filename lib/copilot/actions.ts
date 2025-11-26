
'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CopilotChat, CopilotMessage, SendMessageParams } from './types'
import * as tools from './tools'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Tool Definitions for the LLM
const TOOL_DEFINITIONS = [
    {
        type: 'function',
        function: {
            name: 'list_jobs',
            description: 'List recent extraction jobs',
            parameters: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['pending', 'processing', 'completed', 'error'], description: 'Filter by status' },
                    limit: { type: 'number', description: 'Number of jobs to return' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_job',
            description: 'Get details of a specific extraction job',
            parameters: {
                type: 'object',
                properties: {
                    job_id: { type: 'string', description: 'The ID of the job' }
                },
                required: ['job_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_agents',
            description: 'List available agents (schema templates)',
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_agent',
            description: 'Get details of a specific agent (schema template)',
            parameters: {
                type: 'object',
                properties: {
                    agent_id: { type: 'string', description: 'The ID of the agent' }
                },
                required: ['agent_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_knowledge_hub',
            description: 'Get the structure of the knowledge base (folders)',
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_knowledge',
            description: 'Search for or get content of a knowledge document',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'The name or query to search for' }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_temp_job',
            description: 'Run a temporary extraction job on a file without saving to database',
            parameters: {
                type: 'object',
                properties: {
                    file_base64: { type: 'string', description: 'Base64 encoded file content' },
                    file_name: { type: 'string', description: 'Name of the file' },
                    schema_id: { type: 'string', description: 'The ID of the agent/schema to use' }
                },
                required: ['file_base64', 'file_name', 'schema_id']
            }
        }
    }
]

export async function createChat(title: string = 'New Chat'): Promise<CopilotChat> {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('copilot_chats')
        .insert({
            user_id: user.id,
            title
        })
        .select()
        .single()

    if (error) throw new Error(`Failed to create chat: ${error.message}`)
    return data
}

export async function getChats(): Promise<CopilotChat[]> {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
        .from('copilot_chats')
        .select('*')
        .order('updated_at', { ascending: false })

    if (error) return []
    return data
}

export async function getChatMessages(chatId: string): Promise<CopilotMessage[]> {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
        .from('copilot_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

    if (error) return []
    return data
}

export async function sendMessage({ chatId, content, attachments }: SendMessageParams) {
    const supabase = createSupabaseServerClient()

    // 1. Save User Message
    const { error: msgError } = await supabase
        .from('copilot_messages')
        .insert({
            chat_id: chatId,
            role: 'user',
            content,
            // Store attachments if needed, maybe in a separate column or metadata
        })

    if (msgError) throw new Error(`Failed to save message: ${msgError.message}`)

    // 2. Get History
    const history = await getChatMessages(chatId)

    // 3. Call LLM
    let messages = history.map(msg => ({
        role: msg.role,
        content: msg.content || ''
    }))

    // Add current user message with attachments
    const currentUserMessage: any = {
        role: 'user',
        content: content
    }

    if (attachments && attachments.length > 0) {
        currentUserMessage.content = [
            { type: 'text', text: content },
            ...attachments.map(att => ({
                type: 'image_url',
                image_url: { url: att }
            }))
        ]
    }

    // We need to append the new message to the history for the LLM
    // Note: We already inserted it into DB, but we need to format it for the API
    // The history from DB has 'content' as string (usually). 
    // If we want to support multimodal in history, we need to store JSON in content or a separate column.
    // For now, let's assume the current turn handles the attachment, and history is text-only.

    const apiKey = process.env.OPENROUTER_API_KEY
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-pro' // Use a capable model

    let currentMessages = [...messages, currentUserMessage]
    let turnCount = 0
    const MAX_TURNS = 5

    while (turnCount < MAX_TURNS) {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: currentMessages,
                tools: TOOL_DEFINITIONS,
                tool_choice: 'auto'
            })
        })

        const data = await response.json()
        const choice = data.choices?.[0]
        const message = choice?.message

        if (!message) break

        // Save Assistant Message
        const { data: savedMsg, error: saveError } = await supabase
            .from('copilot_messages')
            .insert({
                chat_id: chatId,
                role: 'assistant',
                content: message.content,
                tool_calls: message.tool_calls
            })
            .select()
            .single()

        if (message.tool_calls) {
            // Execute Tools
            const toolResults = []
            for (const call of message.tool_calls) {
                const fnName = call.function.name
                const args = JSON.parse(call.function.arguments)
                let result
                try {
                    // @ts-ignore
                    if (tools[fnName]) {
                        // @ts-ignore
                        result = await tools[fnName](...Object.values(args))
                    } else {
                        result = { error: 'Tool not found' }
                    }
                } catch (e: any) {
                    result = { error: e.message }
                }
                toolResults.push({
                    tool_call_id: call.id,
                    role: 'tool',
                    name: fnName,
                    content: JSON.stringify(result)
                })
            }

            // Save Tool Results (optional, or just append to context for next turn)
            // We need to append tool results to currentMessages for the next loop
            currentMessages.push(message)
            currentMessages.push(...toolResults)

            // Also update the saved message with results? 
            // Or save separate tool messages? 
            // For simplicity in this schema, we update the assistant message with results
            await supabase
                .from('copilot_messages')
                .update({ tool_results: toolResults })
                .eq('id', savedMsg.id)

            turnCount++
        } else {
            // Final response
            break
        }
    }

    revalidatePath('/copilot') // Revalidate appropriate path
    return await getChatMessages(chatId)
}
