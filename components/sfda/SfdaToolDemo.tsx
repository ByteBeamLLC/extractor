"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Upload,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
  CalendarClock,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BOOK_DEMO_URL,
  DEFAULT_FREE_USES,
  type SfdaToolInput,
} from "@/lib/sfda/tools"

interface UploadedFile {
  inputId: string
  file: File
}

type DemoState = "idle" | "processing" | "done" | "blocked"

interface SfdaToolDemoProps {
  toolSlug: string
  toolName: string
  ctaLabel: string
  inputs: SfdaToolInput[]
  outputLabel: string
  outputFormat: string
  freeUses?: number
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatAccept(accept: string): string {
  return accept
    .split(",")
    .map((s) => s.trim().replace(/^\./, "").toUpperCase())
    .join(" · ")
}

function getStorageKey(slug: string): string {
  return `bytebeam_sfda_demo_used_${slug}`
}

export function SfdaToolDemo({
  toolSlug,
  toolName,
  ctaLabel,
  inputs,
  outputLabel,
  outputFormat,
  freeUses = DEFAULT_FREE_USES,
}: SfdaToolDemoProps) {
  const [state, setState] = useState<DemoState>("idle")
  const [files, setFiles] = useState<Record<string, UploadedFile>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [usageCount, setUsageCount] = useState(0)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Hydrate usage from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(getStorageKey(toolSlug))
      const count = raw ? parseInt(raw, 10) : 0
      setUsageCount(count)
      if (count >= freeUses) {
        setState("blocked")
      }
    } catch {
      // localStorage may be unavailable — leave state idle
    }
  }, [toolSlug, freeUses])

  const handleFile = useCallback((input: SfdaToolInput, file: File) => {
    if (file.size > input.maxSize) {
      setErrors((prev) => ({
        ...prev,
        [input.id]: `File exceeds ${Math.round(input.maxSize / (1024 * 1024))} MB limit.`,
      }))
      return
    }
    setErrors((prev) => {
      const next = { ...prev }
      delete next[input.id]
      return next
    })
    setFiles((prev) => ({
      ...prev,
      [input.id]: { inputId: input.id, file },
    }))
  }, [])

  const removeFile = useCallback((inputId: string) => {
    setFiles((prev) => {
      const next = { ...prev }
      delete next[inputId]
      return next
    })
  }, [])

  const requiredInputs = inputs.filter((i) => i.required)
  const allRequiredUploaded = requiredInputs.every((i) => files[i.id])
  const uploadedCount = Object.keys(files).length

  const handleSubmit = useCallback(() => {
    if (!allRequiredUploaded || state !== "idle") return
    setState("processing")
    // Simulated wait — replaced by real processing once the agent endpoint is wired.
    window.setTimeout(() => {
      try {
        const next = usageCount + 1
        localStorage.setItem(getStorageKey(toolSlug), String(next))
        setUsageCount(next)
      } catch {
        // ignore
      }
      setState("done")
    }, 2200)
  }, [allRequiredUploaded, state, toolSlug, usageCount])

  const handleResetForRetry = useCallback(() => {
    // Soft reset for the same session — won't reset localStorage.
    setFiles({})
    setErrors({})
    setState(usageCount >= freeUses ? "blocked" : "idle")
  }, [usageCount, freeUses])

  // ─── Blocked state (returning visitor or used up free runs) ───
  if (state === "blocked") {
    return (
      <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center max-w-xl mx-auto py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5">
            <CalendarClock className="h-7 w-7" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Free run used
          </p>
          <h3 className="text-xl sm:text-2xl font-bold mb-3">
            You've already tried {toolName}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Free preview is one run per tool. Want to run on your full portfolio,
            integrate with your QMS, and discuss licensing for your team? Walk
            through your output with us in a 30-min call.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button size="lg" asChild>
              <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer">
                <CalendarClock className="h-4 w-4 mr-2" />
                Book a 30-min demo
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Sales-led license · Per-team pricing discussed on the call
          </p>
        </div>
      </div>
    )
  }

  // ─── Done state (just ran the free preview) ───
  if (state === "done") {
    return (
      <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center max-w-xl mx-auto py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            Preview ready
          </p>
          <h3 className="text-xl sm:text-2xl font-bold mb-3">
            Your draft is being prepared
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            We received your files. Walk through the full output and discuss
            licensing for your team in a 30-min call.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Output: <span className="font-medium text-foreground">{outputLabel}</span>{" "}
            ({outputFormat})
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button size="lg" asChild>
              <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer">
                <CalendarClock className="h-4 w-4 mr-2" />
                Book a 30-min walkthrough
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" onClick={handleResetForRetry}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            {Math.max(0, freeUses - usageCount)} free run{freeUses - usageCount === 1 ? "" : "s"} remaining
          </p>
        </div>
      </div>
    )
  }

  // ─── Idle / Processing — file upload UI ───
  const isProcessing = state === "processing"

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Try it free · {freeUses} run included
          </p>
          <h3 className="text-lg font-semibold mt-0.5">{toolName}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1">
            Output: {outputFormat}
          </span>
        </div>
      </div>

      <fieldset disabled={isProcessing} className="space-y-4">
        {inputs.map((input) => {
          const uploaded = files[input.id]
          const error = errors[input.id]
          const isDragOver = dragOverId === input.id

          return (
            <div key={input.id}>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-sm font-medium">{input.label}</label>
                {!input.required && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Optional
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {input.description}
              </p>

              {uploaded ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploaded.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploaded.file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeFile(input.id)}
                    aria-label={`Remove ${input.label}`}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-6 transition-colors cursor-pointer",
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30",
                    isProcessing && "opacity-60 pointer-events-none"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverId(input.id)
                  }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverId(null)
                    const file = e.dataTransfer.files[0]
                    if (file) handleFile(input, file)
                  }}
                  onClick={() => fileRefs.current[input.id]?.click()}
                >
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or{" "}
                    <span className="text-primary font-medium">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatAccept(input.accept)} · Max{" "}
                    {Math.round(input.maxSize / (1024 * 1024))} MB
                  </p>
                  <input
                    ref={(el) => {
                      fileRefs.current[input.id] = el
                    }}
                    type="file"
                    accept={input.accept}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFile(input, file)
                      e.target.value = ""
                    }}
                  />
                </div>
              )}

              {error && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>
          )
        })}
      </fieldset>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 border-t pt-5">
        <div className="flex-1 text-xs text-muted-foreground">
          {isProcessing ? (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Preparing your output…
            </span>
          ) : allRequiredUploaded ? (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {uploadedCount} of {inputs.length} files ready
            </span>
          ) : (
            <span>
              {uploadedCount} of {requiredInputs.length} required uploaded
            </span>
          )}
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          disabled={!allRequiredUploaded || isProcessing}
          onClick={handleSubmit}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running preview…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {ctaLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground text-center">
        Files processed in your workspace, not stored externally · After your
        free run, walk through the output with our team
      </p>
    </div>
  )
}
