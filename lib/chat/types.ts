/**
 * Shared types for the document chat feature.
 *
 * The chat lets users ask questions about a single document's extracted data.
 * It does NOT have access to the source file — only the structured `results`
 * JSON, parser schema, and document metadata.
 */

export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  /** Stable id for React keys; generated client-side */
  id: string
  role: ChatRole
  content: string
  /** Tool invocations made by the model while producing this assistant message */
  toolCallsMade?: ToolCallRecord[]
  /** Unix ms timestamp */
  timestamp: number
}

/**
 * Record of one tool call made during an assistant turn.
 * Surfaced in the UI as a small "Calculated 541.27 × 0.17 = 92.0159" chip
 * so users can see what the model actually did.
 */
export interface ToolCallRecord {
  name: string
  args: Record<string, unknown>
  result: unknown
  ok: boolean
  error?: string
}

/** Result shape returned by every tool handler. */
export type ToolHandlerResult =
  | { ok: true; result: unknown }
  | { ok: false; error: string }

/**
 * OpenAI/OpenRouter-compatible tool definition.
 * `parameters` is JSON Schema, not Zod — OpenRouter passes it straight to
 * the underlying provider's function-calling API.
 */
export interface ChatToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface ChatTool {
  definition: ChatToolDefinition
  handler: (args: Record<string, unknown>) => Promise<ToolHandlerResult>
}

/** POST /api/parsers/[parserId]/chat — request body */
export interface ChatRequestBody {
  documentId: string
  message: string
  history: ChatMessage[]
}

/** POST /api/parsers/[parserId]/chat — response body */
export interface ChatResponseBody {
  answer: string
  toolCallsMade: ToolCallRecord[]
  /** Set when the document isn't ready (processing/error/no results) */
  blocked?: "processing" | "error" | "no_results"
}
