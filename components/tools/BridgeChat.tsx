"use client"

import { useCallback, useState } from "react"
import { Loader2, Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import { useSupabaseClient } from "@/lib/supabase/hooks"
import { trackEvent } from "@/lib/analytics"
import { MessageList } from "@/components/extractor/chat/MessageList"
import type { ChatMessage, ChatResponseBody } from "@/lib/chat/types"

interface StarterQuestion {
  label: string
  prompt: string
}

interface BridgeChatProps {
  text: string
  language: string
  docType: string
  starterQuestions: StarterQuestion[]
  image: {
    base64: string
    mimeType: string
    fileName: string
    fileSize?: number
  }
}

interface ProvisionedDoc {
  parserId: string
  documentId: string
}

// English headers we always show — these are part of the marketing-side UI chrome
// and not the document's content. Localized doc-language strings are reserved
// for the starter chips and the model's responses.
const HEADER_LABEL = "Chat with your document"
const HEADER_HINT = "Ask anything about what you just transcribed."
const SEND_PLACEHOLDER = "Type a follow-up question…"

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export function BridgeChat({
  text,
  language,
  docType,
  starterQuestions,
  image,
}: BridgeChatProps) {
  const { openAuthDialog } = useAuthDialog()
  const supabase = useSupabaseClient()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [provisioned, setProvisioned] = useState<ProvisionedDoc | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followup, setFollowup] = useState("")

  // True once the user has clicked a starter chip and gotten an answer.
  // After that, the chips are hidden and the input takes over.
  const hasFirstAnswer = messages.some((m) => m.role === "assistant")

  /**
   * Provision a parser + document the first time the user engages with the
   * bridge. Idempotent: subsequent calls return the cached IDs.
   *
   * Steps:
   *   1. Ensure there's an anonymous Supabase session (cookie-based)
   *   2. POST to /api/tools/handwriting-to-text/bridge with the transcription +
   *      original image, which inserts a parser and a processed_document under
   *      the anon user.id and returns their IDs.
   */
  const provision = useCallback(async (): Promise<ProvisionedDoc> => {
    if (provisioned) return provisioned

    // 1. Anonymous sign-in if we don't already have a session.
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      const { error: signinError } = await supabase.auth.signInAnonymously()
      if (signinError) {
        throw new Error(`Failed to start session: ${signinError.message}`)
      }
    }

    // 2. Create the parser + document.
    const res = await fetch("/api/tools/handwriting-to-text/bridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        language,
        doc_type: docType,
        image: image.base64,
        mimeType: image.mimeType,
        fileName: image.fileName,
        fileSize: image.fileSize,
      }),
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody?.error || `Bridge provisioning failed (${res.status})`)
    }

    const data = (await res.json()) as ProvisionedDoc
    setProvisioned(data)
    return data
  }, [provisioned, supabase, text, language, docType, image])

  /**
   * Click a starter chip → provision (if needed) → send the chip's prompt to
   * the real chat API → render the answer inline. Stays anonymous; no auth.
   */
  const handleChipClick = useCallback(
    async (chip: StarterQuestion, index: number) => {
      if (isLoading) return
      setError(null)
      setIsLoading(true)

      trackEvent("hwt_bridge_starter_clicked", {
        doc_type: docType,
        language,
        chip_index: index,
      })

      const userMessage: ChatMessage = {
        id: newId(),
        role: "user",
        content: chip.prompt,
        timestamp: Date.now(),
      }
      setMessages([userMessage])

      try {
        const ids = await provision()
        const response = await fetch(`/api/parsers/${ids.parserId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: ids.documentId,
            message: chip.prompt,
            history: [],
          }),
        })

        const data = (await response.json()) as ChatResponseBody & { error?: string }
        if (!response.ok) {
          throw new Error(data.error ?? "Chat request failed")
        }

        const assistantMessage: ChatMessage = {
          id: newId(),
          role: "assistant",
          content: data.answer,
          toolCallsMade: data.toolCallsMade ?? [],
          timestamp: Date.now(),
        }
        setMessages([userMessage, assistantMessage])
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        setError(msg)
        // Roll back the optimistic user message so the chips reappear.
        setMessages([])
      } finally {
        setIsLoading(false)
      }
    },
    [docType, language, provision, isLoading]
  )

  /**
   * Submit a follow-up question → create a server-side bridge session and
   * pop the auth dialog with the handoff token. We do NOT answer the follow-up
   * here. The user must authenticate; afterwards the in-app chat consumes
   * the bridge session and fires this exact question against the same
   * parser+document.
   */
  const handleFollowupSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = followup.trim()
      if (!trimmed) return

      setIsLoading(true)
      setError(null)

      // We need a provisioned parser+document to hand off. Normally provisioning
      // happened on the first chip click; if not, do it now.
      let ids = provisioned
      try {
        if (!ids) {
          ids = await provision()
        }

        // Create a server-side bridge session with the chat payload
        const res = await fetch("/api/bridge-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parserId: ids.parserId,
            documentId: ids.documentId,
            payload: {
              messages,
              pendingQuestion: trimmed,
            },
          }),
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody?.error || "Failed to create bridge session")
        }

        const { token } = (await res.json()) as { token: string }

        trackEvent("hwt_bridge_followup_sent", {
          parser_id: ids.parserId,
          document_id: ids.documentId,
          doc_type: docType,
        })

        const next = `/parsers/${ids.parserId}/documents/${ids.documentId}?tab=chat`
        openAuthDialog("sign-up", { next, bridgeToken: token })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save your conversation"
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [followup, provisioned, provision, messages, docType, openAuthDialog]
  )

  if (!starterQuestions || starterQuestions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-muted/30 to-transparent">
      {/* Chat content — fills available space */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold">{HEADER_LABEL}</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{HEADER_HINT}</p>

        {/* Starter chips — visible until the first answer arrives */}
        {!hasFirstAnswer && messages.length === 0 && (
          <div className="flex flex-col gap-2" data-mp-no-mask>
            {starterQuestions.map((chip, index) => (
              <button
                key={chip.label + index}
                type="button"
                onClick={() => handleChipClick(chip, index)}
                disabled={isLoading}
                className="text-left rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13px] leading-snug hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Conversation */}
        {messages.length > 0 && (
          <div className="mt-2">
            <MessageList messages={messages} isLoading={isLoading} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Follow-up input — only after the first answer is rendered */}
      {hasFirstAnswer && (
        <div className="px-4 py-3 border-t bg-card">
          <form onSubmit={handleFollowupSubmit}>
            <div className="flex items-end gap-2">
              <textarea
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                placeholder={SEND_PLACEHOLDER}
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void handleFollowupSubmit(e as unknown as React.FormEvent)
                  }
                }}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !followup.trim()}
                className="h-9"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Sign in to keep chatting and access your document anytime.
            </p>
          </form>
        </div>
      )}
    </div>
  )
}
