/**
 * Shared types for the document chat feature.
 *
 * The chat lets users ask questions about a single document's extracted data.
 * It does NOT have access to the source file — only the structured `results`
 * JSON, parser schema, and document metadata.
 *
 * Runtime message state lives in Vercel AI SDK `UIMessage`s — see the
 * `@ai-sdk/react` `useChat` hook. The types here cover the small surface
 * outside the SDK (bridge session payload, starter questions).
 */

import type { UIMessage } from "ai"

/**
 * Alias for the AI SDK chat message shape used throughout Parsli's chat UI.
 * Keep the alias thin — add metadata slots only if/when we persist chats.
 */
export type ChatUIMessage = UIMessage

/**
 * Payload stored in a bridge session — used when a user moves from the
 * anonymous handwriting tool to the authenticated app and we want to
 * restore the conversation + auto-fire their pending question.
 */
export interface BridgeSessionPayload {
  messages?: ChatUIMessage[]
  pendingQuestion?: string
}
