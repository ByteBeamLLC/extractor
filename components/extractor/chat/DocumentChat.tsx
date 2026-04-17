"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Loader2, MessageSquare, Sparkles } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { Parser, ProcessedDocument } from "@/lib/extractor/types"
import type { ChatUIMessage, BridgeSessionPayload } from "@/lib/chat/types"
import { ChatInput } from "./ChatInput"
import { MessageList } from "./MessageList"
import { StarterQuestions } from "./StarterQuestions"
import { trackEvent } from "@/lib/analytics"

interface DocumentChatProps {
  parser: Parser
  doc: ProcessedDocument
  /** Bridge session token from ?handoff= URL param. Consumed once to hydrate chat. */
  handoffToken?: string
}

/**
 * Top-level chat panel rendered inside the right pane of DocumentDetailView
 * when the user selects the "Chat" tab.
 *
 * Single-document scope: each instance is bound to one parser/document pair.
 * Conversation state lives in component memory only — switching documents
 * unmounts this component and starts fresh.
 */
export function DocumentChat({ parser, doc, handoffToken }: DocumentChatProps) {
  // Show a friendly blocked state when the document isn't ready for chat.
  // We avoid hitting the API entirely in these cases.
  if (doc.status === "processing" || doc.status === "pending") {
    return (
      <BlockedState
        icon={<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        title="Document still processing"
        body="Chat will be available once extraction completes."
      />
    )
  }
  if (doc.status === "error") {
    return (
      <BlockedState
        icon={<AlertCircle className="h-5 w-5 text-destructive" />}
        title="Extraction failed"
        body="There's no extracted data to chat about. Reprocess the document and try again."
      />
    )
  }

  const hasResults = !!doc.results && Object.keys(doc.results).length > 0
  if (!hasResults) {
    return (
      <BlockedState
        icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
        title="No data extracted"
        body="There's nothing to chat about yet. Try reprocessing the document or updating your parser fields."
      />
    )
  }

  return (
    <ActiveChat parser={parser} doc={doc} handoffToken={handoffToken} />
  )
}

function ActiveChat({
  parser,
  doc,
  handoffToken,
}: Required<Pick<DocumentChatProps, "parser" | "doc">> & {
  handoffToken?: string
}) {
  const [draft, setDraft] = useState("")
  // Guard so the bridge hydration only ever runs once per mount.
  const hydratedRef = useRef(false)

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        api: `/api/parsers/${parser.id}/chat`,
        body: { documentId: doc.id },
      }),
    [parser.id, doc.id]
  )

  const { messages, sendMessage, status, error, setMessages } =
    useChat<ChatUIMessage>({ transport })

  const isLoading = status === "submitted" || status === "streaming"
  const isWaiting = status === "submitted"
  const isEmpty = messages.length === 0
  const fieldCount = (parser.fields ?? []).filter((f) => f.type !== "input").length

  // Bridge handoff hydration: if the user arrived from the handwriting tool's
  // bridge chat via OAuth, the handoff token in the URL lets us consume a
  // server-side bridge session. We restore the prior conversation and auto-fire
  // the pending follow-up question.
  useEffect(() => {
    if (hydratedRef.current) return
    if (!handoffToken) return
    hydratedRef.current = true

    async function consumeHandoff() {
      try {
        const res = await fetch(
          `/api/bridge-sessions/${encodeURIComponent(handoffToken!)}/consume`,
          { method: "POST" }
        )
        if (!res.ok) {
          // Token expired or already used — not an error, just no hydration.
          return
        }

        const data = await res.json()
        const payload = data.payload as BridgeSessionPayload | undefined
        if (!payload) return

        // Guard against pre-migration payloads (before BridgeChat switched to
        // UIMessage shape): old rows had `{id, role, content, timestamp}`
        // without a `parts` array, which useChat can't render. We discard
        // those — the pendingQuestion below still fires, so the user just
        // loses the 1-2 turns of transcript from before auth. 30-min TTL
        // means this window closes fast after deploy.
        const candidates = Array.isArray(payload.messages) ? payload.messages : []
        const seedMessages = candidates.filter(
          (m): m is ChatUIMessage =>
            !!m &&
            typeof m === "object" &&
            typeof (m as { role?: unknown }).role === "string" &&
            Array.isArray((m as { parts?: unknown }).parts)
        )
        if (seedMessages.length > 0) {
          setMessages(seedMessages)
        }

        trackEvent("hwt_bridge_handoff_consumed", {
          parser_id: parser.id,
          document_id: doc.id,
        })

        if (payload.pendingQuestion) {
          // sendMessage uses the current messages in useChat's state, which was
          // just populated via setMessages. React batches — useChat reads the
          // updated state before firing the request.
          void sendMessage({ text: payload.pendingQuestion })
        }
      } catch (err) {
        console.error("[DocumentChat] Failed to consume handoff:", err)
      }
    }

    void consumeHandoff()
    // Run only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id])

  async function handleSend() {
    const text = draft.trim()
    if (!text) return
    setDraft("")
    await sendMessage({ text })
  }

  async function handleStarter(question: string) {
    setDraft("")
    await sendMessage({ text: question })
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Scrollable conversation area */}
      <div className="flex-1 overflow-auto px-5 py-4 min-h-0">
        {/* Intro card — always visible at the top */}
        <div className="rounded-xl p-3.5 flex items-start gap-3 bg-gradient-to-br from-primary/5 to-indigo-500/5 border border-primary/15 mb-4">
          <div className="w-8 h-8 rounded-lg bg-card border border-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-foreground">
              Chat with this document
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              Ask questions about{" "}
              <span className="font-medium text-foreground">{doc.file_name}</span>
              . I have access to the {fieldCount} extracted{" "}
              {fieldCount === 1 ? "field" : "fields"} — but not the original
              file.
            </div>
          </div>
        </div>

        {isEmpty ? (
          <StarterQuestions onPick={handleStarter} disabled={isLoading} />
        ) : (
          <MessageList messages={messages} isWaiting={isWaiting} />
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{error.message ?? "Something went wrong"}</span>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t bg-card p-3 shrink-0">
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          disabled={isLoading}
        />
        <div className="text-[10px] text-muted-foreground/80 mt-1.5 px-1">
          Answers are based on extracted data only — verify against the document
          on the left.
        </div>
      </div>
    </div>
  )
}

function BlockedState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-2">
        <div className="flex justify-center">{icon}</div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{body}</div>
      </div>
    </div>
  )
}
