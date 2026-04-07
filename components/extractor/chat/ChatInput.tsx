"use client"

import { useRef, type KeyboardEvent } from "react"
import { Send } from "lucide-react"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

const MAX_LENGTH = 4000

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Ask anything about this document...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) onSend()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
    // Auto-grow up to ~6 lines
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  }

  const canSend = !disabled && value.trim().length > 0

  return (
    <div className="border border-border rounded-xl bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={MAX_LENGTH}
        className="w-full px-3.5 pt-2.5 pb-1 text-[13px] resize-none focus:outline-none placeholder:text-muted-foreground/60 bg-transparent disabled:opacity-50"
      />
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-[10px] text-muted-foreground ml-1">
          Free during beta
        </span>
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Send
          <Send className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
