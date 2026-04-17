"use client"

import { useEffect, useRef } from "react"
import { Calculator, Database, Sparkles } from "lucide-react"
import type { UIMessage, UIMessagePart, UIDataTypes, UITools } from "ai"
import { MarkdownContent } from "./MarkdownContent"

interface MessageListProps {
  messages: UIMessage[]
  /** True while we're waiting on the first chunk of the assistant's response. */
  isWaiting: boolean
}

export function MessageList({ messages, isWaiting }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to the latest message whenever the list changes. Streaming
  // also triggers this on every delta, which is what we want: the view chases
  // the growing assistant bubble until it fills the viewport.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isWaiting])

  return (
    <div className="space-y-4">
      {messages.map((m) =>
        m.role === "user" ? (
          <UserBubble key={m.id} parts={m.parts} />
        ) : (
          <AssistantBubble key={m.id} parts={m.parts} />
        )
      )}
      {isWaiting && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  )
}

type AnyPart = UIMessagePart<UIDataTypes, UITools>

function joinText(parts: AnyPart[]): string {
  return parts
    .filter((p): p is AnyPart & { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

function UserBubble({ parts }: { parts: AnyPart[] }) {
  const content = joinText(parts)
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2.5">
        <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  )
}

function AssistantBubble({ parts }: { parts: AnyPart[] }) {
  // Tool-call parts surface as `tool-<name>` or `dynamic-tool`. Pull them out
  // into chips; concat every text part into the main bubble copy.
  const text = joinText(parts)
  const toolParts = parts.filter(isToolPart)

  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        {text && <MarkdownContent>{text}</MarkdownContent>}
        {toolParts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {toolParts.map((part, i) => (
              <ToolCallChip key={i} part={part} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

type ToolPart = AnyPart & {
  type: `tool-${string}` | "dynamic-tool"
  toolCallId?: string
  state?: string
  input?: unknown
  output?: unknown
  errorText?: string
}

function isToolPart(part: AnyPart): part is ToolPart {
  return (
    typeof part.type === "string" &&
    (part.type.startsWith("tool-") || part.type === "dynamic-tool")
  )
}

function getToolName(part: ToolPart): string {
  if (part.type === "dynamic-tool") {
    // dynamic tools carry name in a separate field
    const dyn = part as ToolPart & { toolName?: string }
    return dyn.toolName ?? "tool"
  }
  // Static tools are `tool-<name>` — strip the prefix
  return part.type.slice("tool-".length)
}

function ToolCallChip({ part }: { part: ToolPart }) {
  const name = getToolName(part)
  const Icon = name === "calculate" ? Calculator : Database
  const failed = part.state === "output-error"
  const input = part.input as Record<string, unknown> | undefined

  let label = name
  if (name === "calculate") {
    const expr = typeof input?.expression === "string" ? input.expression : ""
    label = failed
      ? `${expr} → ${part.errorText ?? "error"}`
      : part.state === "output-available"
      ? `${expr} = ${formatResult(part.output)}`
      : expr || "calculate"
  } else if (name === "query_extracted_data") {
    const path = typeof input?.path === "string" ? input.path : ""
    const op = typeof input?.operation === "string" ? input.operation : ""
    label = failed
      ? `${op}(${path}) → ${part.errorText ?? "error"}`
      : part.state === "output-available"
      ? `${op}(${path}) → ${formatResult(part.output)}`
      : `${op}(${path})` || "query"
  }

  return (
    <span
      title={part.errorText ?? undefined}
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded font-mono ${
        failed
          ? "bg-amber-50 text-amber-700 border border-amber-100"
          : "bg-blue-50 text-primary border border-blue-100"
      }`}
    >
      <Icon className="h-2.5 w-2.5" />
      <span className="truncate max-w-[260px]">{label}</span>
    </span>
  )
}

function formatResult(value: unknown): string {
  if (value === null || value === undefined) return "null"
  if (typeof value === "number" || typeof value === "string") return String(value)
  if (typeof value === "boolean") return String(value)
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
