"use client"

import { useEffect, useState } from "react"

export interface AdHeroAnimationProps {
  /** Document title shown in the mock document (e.g. "INVOICE", "EMAIL") */
  docTitle: string
  /** Document reference number (e.g. "#INV-38291") */
  docRef: string
  /** Lines shown on the mock document (e.g. ["Vendor: Acme Corp", "Amount: $500"]) */
  docLines: string[]
  /** Footer info for the document (left side) */
  docFooterLeft?: string
  /** Footer info for the document (right side) */
  docFooterRight?: string
  /** Extracted fields that appear in the output panel */
  fields: { key: string; value: string }[]
  /** Speed label shown when extraction completes (e.g. "< 3 seconds") */
  speedLabel?: string
}

type Phase = "upload" | "processing" | "extracted"

export function AdHeroAnimation({
  docTitle,
  docRef,
  docLines,
  docFooterLeft,
  docFooterRight,
  fields,
  speedLabel = "< 3 seconds",
}: AdHeroAnimationProps) {
  const [phase, setPhase] = useState<Phase>("upload")
  const [fieldIndex, setFieldIndex] = useState(-1)
  const [cycle, setCycle] = useState(0)

  const fieldKeys = fields.map((f) => f.key)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setPhase("processing"), 1800))
    timers.push(setTimeout(() => setPhase("extracted"), 3600))

    fields.forEach((_, i) => {
      timers.push(setTimeout(() => setFieldIndex(i), 3800 + i * 400))
    })

    timers.push(
      setTimeout(() => {
        setPhase("upload")
        setFieldIndex(-1)
        setCycle((c) => c + 1)
      }, 3800 + fields.length * 400 + 3000)
    )

    return () => timers.forEach(clearTimeout)
  }, [cycle, fields.length])

  return (
    <div className="relative w-full max-w-[540px] mx-auto">
      <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="text-[10px] text-muted-foreground/60 bg-muted/50 rounded-md px-3 py-0.5">
              app.parsli.co
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[300px] relative">
          <div className="grid grid-cols-2 gap-4">
            {/* Document panel */}
            <div className="space-y-3">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Document
              </div>
              <div
                className={`rounded-lg border-2 border-dashed p-3 transition-all duration-700 ${
                  phase === "upload"
                    ? "border-primary/40 bg-primary/[0.03]"
                    : phase === "processing"
                      ? "border-primary bg-primary/[0.06]"
                      : "border-muted-foreground/20 bg-muted/20"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] font-bold text-foreground/80">
                      {docTitle}
                    </div>
                    <div className="text-[8px] text-muted-foreground">
                      {docRef}
                    </div>
                  </div>
                  <div className="h-px bg-foreground/10" />

                  {docLines.map((line, i) => (
                    <div key={i} className="relative">
                      <div
                        className={`text-[8px] text-muted-foreground/70 font-mono transition-all duration-300 ${
                          phase === "processing" && fieldIndex < i
                            ? "bg-primary/10 text-primary/80"
                            : ""
                        } ${phase === "extracted" && i <= fieldIndex ? "text-primary/60" : ""}`}
                      >
                        {line}
                      </div>
                      {phase === "processing" && (
                        <div
                          className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 animate-scan-line"
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                      )}
                    </div>
                  ))}

                  {(docFooterLeft || docFooterRight) && (
                    <>
                      <div className="h-px bg-foreground/10 mt-1" />
                      <div className="flex justify-between">
                        <div className="text-[7px] text-muted-foreground/50">
                          {docFooterLeft}
                        </div>
                        <div className="text-[7px] text-muted-foreground/50">
                          {docFooterRight}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    phase === "upload"
                      ? "bg-muted-foreground/30"
                      : phase === "processing"
                        ? "bg-primary animate-pulse"
                        : "bg-green-500"
                  }`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {phase === "upload"
                    ? "Ready to process"
                    : phase === "processing"
                      ? "AI extracting..."
                      : "Extraction complete"}
                </span>
              </div>
            </div>

            {/* Extracted data panel */}
            <div className="space-y-3">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Extracted Data
              </div>
              <div className="rounded-lg border bg-card p-3 space-y-1.5 min-h-[160px]">
                {phase === "upload" && (
                  <div className="flex items-center justify-center h-[140px]">
                    <div className="text-center">
                      <div className="text-muted-foreground/30 text-2xl mb-1">
                        {"{ }"}
                      </div>
                      <div className="text-[9px] text-muted-foreground/40">
                        Waiting for document
                      </div>
                    </div>
                  </div>
                )}

                {phase === "processing" && (
                  <div className="space-y-2 animate-pulse">
                    {fieldKeys.map((field) => (
                      <div key={field} className="flex items-center gap-2">
                        <div className="w-16 h-3 rounded bg-muted" />
                        <div className="flex-1 h-3 rounded bg-muted/60" />
                      </div>
                    ))}
                  </div>
                )}

                {phase === "extracted" &&
                  fields.map((field, i) => (
                    <div
                      key={field.key}
                      className={`flex items-center gap-2 transition-all duration-400 ${
                        i <= fieldIndex
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2"
                      }`}
                    >
                      <span className="text-[9px] font-mono text-primary/70 w-20 shrink-0 truncate">
                        {field.key}
                      </span>
                      <span className="text-[9px] font-mono text-foreground/80 truncate">
                        {field.value}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {fieldKeys.map((field, i) => (
                  <div
                    key={field}
                    className={`text-[7px] font-mono px-1.5 py-0.5 rounded-full border transition-all duration-300 ${
                      phase === "extracted" && i <= fieldIndex
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-muted-foreground/15 text-muted-foreground/40"
                    }`}
                  >
                    {field}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center flow indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className={`transition-all duration-500 ${
                phase === "processing"
                  ? "text-primary scale-110"
                  : phase === "extracted"
                    ? "text-green-500 scale-100"
                    : "text-muted-foreground/30 scale-100"
              }`}
            >
              <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
              {phase === "processing" ? (
                <g className="animate-spin origin-center" style={{ transformOrigin: "16px 16px" }}>
                  <path d="M16 8 L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 20 L16 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                  <path d="M8 16 L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <path d="M20 16 L24 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                </g>
              ) : phase === "extracted" ? (
                <path d="M11 16.5 L14.5 20 L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M13 16 L19 16 M17 13 L20 16 L17 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="border-t px-4 py-2 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(["upload", "processing", "extracted"] as Phase[]).map((p, i) => (
              <div key={p} className="flex items-center gap-1.5">
                <div
                  className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-all duration-300 ${
                    phase === p
                      ? "bg-primary text-primary-foreground"
                      : (["upload", "processing", "extracted"] as Phase[]).indexOf(phase) > i
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground/50"
                  }`}
                >
                  {(["upload", "processing", "extracted"] as Phase[]).indexOf(phase) > i ? "\u2713" : i + 1}
                </div>
                <span className={`text-[9px] hidden sm:inline ${phase === p ? "text-foreground font-medium" : "text-muted-foreground/50"}`}>
                  {p === "upload" ? "Upload" : p === "processing" ? "Extract" : "Done"}
                </span>
                {i < 2 && (
                  <div className={`w-4 h-px mx-1 ${(["upload", "processing", "extracted"] as Phase[]).indexOf(phase) > i ? "bg-green-500" : "bg-muted-foreground/20"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-[9px] text-muted-foreground/50">
            {phase === "extracted" ? speedLabel : ""}
          </div>
        </div>
      </div>
    </div>
  )
}
