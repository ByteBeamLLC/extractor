"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { Send, Paperclip, X, FileText, Loader2 } from "lucide-react"
import type { ArloMessage } from "./arlo-types"
import { ARLO_NAME } from "./arlo-personality"
import { cn } from "@/lib/utils"

interface ArloChatProps {
  messages: ArloMessage[]
  isProcessing: boolean
  onSendMessage: (content: string, file?: File) => Promise<void>
  onClose: () => void
  mobile?: boolean
}

export function ArloChat({ messages, isProcessing, onSendMessage, onClose, mobile = false }: ArloChatProps) {
  const [input, setInput] = useState("")
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const content = input.trim()
      if (!content && !attachedFile) return

      setInput("")
      const file = attachedFile
      setAttachedFile(null)
      await onSendMessage(content || `Uploaded ${file?.name}`, file ?? undefined)
    },
    [input, attachedFile, onSendMessage]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
    // Reset so same file can be re-selected
    e.target.value = ""
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className={cn(
      "flex flex-col bg-background border shadow-xl overflow-hidden",
      mobile
        ? "w-full h-full rounded-t-xl"
        : "w-80 h-[420px] rounded-xl"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-semibold">{ARLO_NAME}</span>
          <span className="text-[10px] text-muted-foreground">your document buddy</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Close chat"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[85%] gap-0.5",
              msg.role === "user" ? "ml-auto items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "px-3 py-2 rounded-xl text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted rounded-bl-sm"
              )}
            >
              {msg.content}
              {msg.file && (
                <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/20 text-xs opacity-80">
                  <FileText className="h-3 w-3" />
                  {msg.file.name}
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground/60 px-1">
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {/* Typing indicator */}
        {isProcessing && (
          <div className="flex items-start">
            <div className="bg-muted px-3 py-2 rounded-xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File attachment preview */}
      {attachedFile && (
        <div className="mx-3 mb-1 flex items-center gap-2 px-2.5 py-1.5 bg-muted/50 rounded-lg text-xs">
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate flex-1">{attachedFile.name}</span>
          <button
            onClick={() => setAttachedFile(null)}
            className="p-0.5 rounded hover:bg-muted"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-1.5 border-t",
          mobile ? "px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" : "px-3 py-2.5"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.docx,.doc,.xlsx,.xls,.txt,.csv,.json"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "rounded-md hover:bg-muted transition-colors shrink-0",
            mobile ? "p-2" : "p-1.5"
          )}
          aria-label="Attach file"
        >
          <Paperclip className={cn(mobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Arlo anything..."
          disabled={isProcessing}
          className={cn(
            "flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50",
            mobile ? "text-base" : "text-sm"
          )}
        />
        <button
          type="submit"
          disabled={isProcessing || (!input.trim() && !attachedFile)}
          className={cn(
            "rounded-md transition-colors shrink-0",
            mobile ? "p-2" : "p-1.5",
            input.trim() || attachedFile
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-muted-foreground"
          )}
          aria-label="Send message"
        >
          {isProcessing ? (
            <Loader2 className={cn(mobile ? "h-5 w-5" : "h-4 w-4", "animate-spin")} />
          ) : (
            <Send className={cn(mobile ? "h-5 w-5" : "h-4 w-4")} />
          )}
        </button>
      </form>
    </div>
  )
}
