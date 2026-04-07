"use client"

import { Sparkles } from "lucide-react"

interface StarterQuestionsProps {
  onPick: (question: string) => void
  disabled?: boolean
}

/**
 * Hard-coded starter questions shown on the empty state. They're generic
 * enough to work for any parser type (invoices, receipts, contracts, etc.)
 * so we don't need to burn a model call on first open.
 */
const STARTERS = [
  "Summarize this document in 3 bullet points",
  "List every extracted field and its value",
  "Are there any obvious errors or missing values?",
  "Calculate totals from the extracted numbers",
] as const

export function StarterQuestions({ onPick, disabled }: StarterQuestionsProps) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3 w-3" />
        Try asking
      </div>
      <div className="flex flex-col gap-1.5">
        {STARTERS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onPick(q)}
            className="text-left text-[12.5px] px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/60 hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
