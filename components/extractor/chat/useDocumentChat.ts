"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ChatMessage, ChatResponseBody } from "@/lib/chat/types"
import { trackEvent } from "@/lib/analytics"

interface UseDocumentChatArgs {
  parserId: string
  documentId: string
  /** Bridge session token from ?handoff= URL param. Single-use — consumed on mount. */
  initialHandoffToken?: string
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
 * the page) starts a fresh conversation. The one exception is the handwriting
 * → app bridge handoff, which consumes a server-side bridge session on mount
 * and auto-fires the user's pending follow-up question.
 */
export function useDocumentChat({
  parserId,
  documentId,
  initialHandoffToken,
}: UseDocumentChatArgs): UseDocumentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<ChatResponseBody["blocked"] | null>(null)
  // Guard so the bridge hydration only ever runs once per mount.
  const hydratedRef = useRef(false)

  const send = useCallback(
    async (text: string, historyOverride?: ChatMessage[]) => {
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
      // which is sent separately as the `message` field). The hydration path
      // passes an explicit override because the React state hasn't flushed yet.
      const historyForApi = historyOverride ?? messages
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

  // Bridge handoff hydration: if the user arrived from the handwriting tool's
  // bridge chat via OAuth, the handoff token in the URL lets us consume a
  // server-side bridge session. We restore the prior conversation and auto-fire
  // the pending follow-up question.
  useEffect(() => {
    if (hydratedRef.current) return
    if (!initialHandoffToken) return
    hydratedRef.current = true

    async function consumeHandoff() {
      try {
        const res = await fetch(
          `/api/bridge-sessions/${encodeURIComponent(initialHandoffToken!)}/consume`,
          { method: "POST" }
        )

        if (!res.ok) {
          // Token expired or already used — not an error, just no hydration.
          return
        }

        const data = await res.json()
        const payload = data.payload as {
          messages?: ChatMessage[]
          pendingQuestion?: string
        } | undefined

        if (!payload) return

        const seedMessages = Array.isArray(payload.messages) ? payload.messages : []

        if (seedMessages.length > 0) {
          setMessages(seedMessages)
        }

        trackEvent("hwt_bridge_handoff_consumed", {
          parser_id: parserId,
          document_id: documentId,
        })

        if (payload.pendingQuestion) {
          // Pass the seed history explicitly — `send`'s closure has the empty
          // initial state at this point and would otherwise drop the bridge turns.
          void send(payload.pendingQuestion, seedMessages)
        }
      } catch (err) {
        console.error("[useDocumentChat] Failed to consume handoff:", err)
      }
    }

    void consumeHandoff()
    // Run only once on mount — this is a one-shot hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId])

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
    setBlocked(null)
  }, [])

  return { messages, isLoading, error, blocked, send, reset }
}
