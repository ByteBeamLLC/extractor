
export interface CopilotChat {
    id: string
    user_id: string
    title: string
    created_at: string
    updated_at: string
}

export interface CopilotMessage {
    id: string
    chat_id: string
    role: 'user' | 'assistant'
    content: string | null
    tool_calls?: any[] // Using any[] for now to match AI SDK or custom structure
    tool_results?: any[]
    created_at: string
}

export interface CreateChatParams {
    title?: string
}

export interface SendMessageParams {
    chatId: string
    content: string
    attachments?: string[] // Base64 or URLs
}
