"use client"

import { useCallback, useState } from "react"
import type { ChatMessage, ChatResponseBody } from "@/lib/chat/types"

interface UseDocumentChatArgs {
  parserId: string
  documentId: string
}

interface UseDocumentChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  blocked: ChatResponseBody["blocked"] | null
  send: (text: string) => Promise<void>
  reset: () => void
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

/**
 * Owns the chat conversation state for a single document.
 *
 * State lives in component memory only — switching documents (or refreshing
 * the page) starts a fresh conversation. Persisting history is a Phase 2 task.
 */
export function useDocumentChat({
  parserId,
  documentId,
}: UseDocumentChatArgs): UseDocumentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<ChatResponseBody["blocked"] | null>(null)

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMessage: ChatMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      }

      // Snapshot history BEFORE we mutate state, so what we send to the API
      // matches what the user can see (and excludes the brand-new message,
      // which is sent separately as the `message` field).
      const historyForApi = messages
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/parsers/${parserId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            message: trimmed,
            history: historyForApi,
          }),
        })

        const data = (await response.json()) as ChatResponseBody & {
          error?: string
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Chat request failed")
        }

        if (data.blocked) {
          setBlocked(data.blocked)
        }

        const assistantMessage: ChatMessage = {
          id: newId(),
          role: "assistant",
          content: data.answer,
          toolCallsMade: data.toolCallsMade ?? [],
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        setError(msg)
        // Roll back the optimistic user message so the user can retry without
        // having an orphaned bubble.
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      } finally {
        setIsLoading(false)
      }
    },
    [parserId, documentId, messages, isLoading]
  )

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
    setBlocked(null)
  }, [])

  return { messages, isLoading, error, blocked, send, reset }
}
