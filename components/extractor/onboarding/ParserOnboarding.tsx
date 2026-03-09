"use client"

import Link from "next/link"
import {
  ListChecks,
  Upload,
  BarChart3,
  Plug,
  Check,
  ChevronRight,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ONBOARDING_STEPS = [
  {
    id: "schema",
    route: "schema",
    icon: ListChecks,
    title: "Review your fields",
    description:
      "We've pre-configured extraction fields for you. Review them, add new ones, or update any field to match your documents.",
  },
  {
    id: "upload",
    route: "documents",
    icon: Upload,
    title: "Upload a document",
    description:
      "Upload a sample document to test the extraction. Drag and drop or click to browse.",
  },
  {
    id: "results",
    route: "documents",
    icon: BarChart3,
    title: "Review results",
    description:
      "Check the extracted data and confidence scores. Edit any field if needed.",
  },
  {
    id: "integrations",
    route: "export",
    icon: Plug,
    title: "Connect integrations",
    description:
      "Send extracted data to Google Sheets, Zapier, Make, webhooks, or use the API.",
  },
]

interface ParserOnboardingProps {
  currentStep: number
  parserId: string
  onStepClick: (stepIndex: number) => void
  onDismiss: () => void
}

export function ParserOnboarding({
  currentStep,
  parserId,
  onStepClick,
  onDismiss,
}: ParserOnboardingProps) {
  const step = ONBOARDING_STEPS[currentStep]
  if (!step) return null

  return (
    <div className="rounded-xl border bg-primary/[0.03] border-primary/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-primary/10 bg-primary/[0.02]">
        <p className="text-xs font-medium text-primary">
          Getting started &mdash; Step {currentStep + 1} of{" "}
          {ONBOARDING_STEPS.length}
        </p>
        <button
          onClick={onDismiss}
          className="p-1 rounded-md hover:bg-primary/10 transition-colors"
          aria-label="Dismiss onboarding"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Steps */}
      <div className="px-5 py-4">
        <div className="flex gap-3 mb-4">
          {ONBOARDING_STEPS.map((s, i) => {
            const Icon = s.icon
            const isCompleted = i < currentStep
            const isCurrent = i === currentStep
            const isFuture = i > currentStep

            return (
              <button
                key={s.id}
                onClick={() => onStepClick(i)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  isCurrent &&
                    "bg-primary text-primary-foreground shadow-sm",
                  isCompleted &&
                    "bg-primary/10 text-primary hover:bg-primary/15",
                  isFuture &&
                    "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            )
          })}
        </div>

        {/* Current step detail */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <step.icon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{step.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step.description}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="text-xs shrink-0" asChild>
            <Link href={`/parsers/${parserId}/${step.route}`}>
              Go
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export { ONBOARDING_STEPS }
