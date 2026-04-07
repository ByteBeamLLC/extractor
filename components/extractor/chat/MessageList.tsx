"use client"

import { useEffect, useRef } from "react"
import { Calculator, Database, Sparkles } from "lucide-react"
import type { ChatMessage, ToolCallRecord } from "@/lib/chat/types"
import { MarkdownContent } from "./MarkdownContent"

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to the latest message whenever the list changes.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isLoading])

  return (
    <div className="space-y-4">
      {messages.map((m) =>
        m.role === "user" ? (
          <UserBubble key={m.id} content={m.content} />
        ) : (
          <AssistantBubble
            key={m.id}
            content={m.content}
            toolCallsMade={m.toolCallsMade}
          />
        )
      )}
      {isLoading && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2.5">
        <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  )
}

function AssistantBubble({
  content,
  toolCallsMade,
}: {
  content: string
  toolCallsMade?: ToolCallRecord[]
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <MarkdownContent>{content}</MarkdownContent>
        {toolCallsMade && toolCallsMade.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {toolCallsMade.map((tc, i) => (
              <ToolCallChip key={i} call={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ToolCallChip({ call }: { call: ToolCallRecord }) {
  const Icon = call.name === "calculate" ? Calculator : Database

  let label = ""
  if (call.name === "calculate") {
    const expr = typeof call.args.expression === "string" ? call.args.expression : ""
    label = call.ok
      ? `${expr} = ${formatResult(call.result)}`
      : `${expr} → error`
  } else if (call.name === "query_extracted_data") {
    const path = typeof call.args.path === "string" ? call.args.path : ""
    const op = typeof call.args.operation === "string" ? call.args.operation : ""
    label = call.ok
      ? `${op}(${path}) → ${formatResult(call.result)}`
      : `${op}(${path}) → ${call.error ?? "error"}`
  } else {
    label = call.name
  }

  return (
    <span
      title={call.error ?? undefined}
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded font-mono ${
        call.ok
          ? "bg-blue-50 text-primary border border-blue-100"
          : "bg-amber-50 text-amber-700 border border-amber-100"
      }`}
    >
      <Icon className="h-2.5 w-2.5" />
      <span className="truncate max-w-[260px]">{label}</span>
    </span>
  )
}

function formatResult(value: unknown): string {
  if (value === null || value === undefined) return "null"
  if (typeof value === "number") {
    // Trim trailing zeros from floats so 92.0159 doesn't display as 92.01590000
    return Number.isInteger(value) ? String(value) : String(value)
  }
  if (typeof value === "string") return value
  if (Array.isArray(value)) return `[${value.length} items]`
  if (typeof value === "object") return "{…}"
  return String(value)
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex items-center gap-1 px-3 py-2.5 bg-muted/50 rounded-2xl rounded-tl-md">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}
