"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { CheckCircle2, Loader2 } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Slide data — REAL text from each sample image                      */
/* ------------------------------------------------------------------ */
interface Slide {
  image: string
  alt: string
  statusLabel: string
  statusHighlight: string
  mode: "fields" | "text"
  fields?: { label: string; value: string }[]
  fullText?: string
}

const slides: Slide[] = [
  {
    image: "/samples/handwriting-cursive.jpg",
    alt: "Cursive journal entry on lined notebook paper",
    statusLabel: "READING",
    statusHighlight: "CURSIVE HANDWRITING",
    mode: "text",
    fullText: `April 19, 2024

My handwriting hasn't changed since I was about seventeen. It is strange to look at early journals and to realize the entries could have been written yesterday (except for their content).`,
  },
  {
    image: "/samples/handwriting-notes.jpg",
    alt: "Handwritten psychology textbook definitions with highlighted terms",
    statusLabel: "EXTRACTING FIELDS FROM",
    statusHighlight: "STUDY NOTES",
    mode: "fields",
    fields: [
      { label: "Subject", value: "Chapter 1 — Definitions (Lifespan Devt.)" },
      { label: "Term 1", value: "Science of Human Development" },
      { label: "Def.", value: "The science that seeks to understand how and why people of all ages change over time" },
      { label: "Term 2", value: "Scientific Method" },
      { label: "Def.", value: "A way to answer questions using empirical research and data-based conclusions" },
      { label: "Term 3", value: "Hypothesis" },
      { label: "Def.", value: "A specific prediction that can be tested and proven or disproved" },
    ],
  },
  {
    image: "/samples/handwriting-sticky.jpg",
    alt: "Teacher's handwritten note to student on yellow sticky note",
    statusLabel: "TRANSCRIBING",
    statusHighlight: "TEACHER'S NOTE",
    mode: "text",
    fullText: `I know you're a highly intelligent, capable student who doesn't hear that enough. So I'll tell you again — You are a good reader who notices things that many others don't. Please use those gifts and show me what you can really do on the Reading EOG.

Mr. Parmentor

PS — Don't go to sleep during the test!`,
  },
]

/* Timing */
const SCAN_MS = 2200
const REVEAL_STAGGER = 140
const TYPING_SPEED = 14
const HOLD_MS = 3500
const TRANSITION_MS = 600

type Phase = "scanning" | "revealing" | "complete" | "transitioning"

export function HeroDemo() {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>("scanning")
  const [scanPct, setScanPct] = useState(0)
  const [revealedRows, setRevealedRows] = useState(0)
  const [typedChars, setTypedChars] = useState(0)

  const slide = slides[idx]

  /* ---- Scanning ---- */
  useEffect(() => {
    if (phase !== "scanning") return
    setScanPct(0)
    const start = performance.now()
    let raf: number
    function tick(now: number) {
      const pct = Math.min((now - start) / SCAN_MS, 1)
      setScanPct(pct * 100)
      if (pct < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setPhase("revealing")
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, idx])

  /* ---- Revealing ---- */
  useEffect(() => {
    if (phase !== "revealing") return
    setRevealedRows(0)
    setTypedChars(0)

    if (slide.mode === "fields") {
      const total = slide.fields!.length
      let row = 0
      const iv = setInterval(() => {
        row++
        setRevealedRows(row)
        if (row >= total) {
          clearInterval(iv)
          setPhase("complete")
        }
      }, REVEAL_STAGGER)
      return () => clearInterval(iv)
    } else {
      const text = slide.fullText!
      let i = 0
      const iv = setInterval(() => {
        i++
        setTypedChars(i)
        if (i >= text.length) {
          clearInterval(iv)
          setPhase("complete")
        }
      }, TYPING_SPEED)
      return () => clearInterval(iv)
    }
  }, [phase, slide])

  /* ---- Complete → hold then transition ---- */
  useEffect(() => {
    if (phase !== "complete") return
    const t = setTimeout(() => setPhase("transitioning"), HOLD_MS)
    return () => clearTimeout(t)
  }, [phase])

  /* ---- Transition → next slide ---- */
  useEffect(() => {
    if (phase !== "transitioning") return
    const t = setTimeout(() => {
      setIdx((prev) => (prev + 1) % slides.length)
      setPhase("scanning")
    }, TRANSITION_MS)
    return () => clearTimeout(t)
  }, [phase])

  const isComplete = phase === "complete"
  const isTransitioning = phase === "transitioning"
  const showPanel = phase === "revealing" || phase === "complete"

  return (
    <div className="relative w-full max-w-[480px] mx-auto lg:mx-0 lg:max-w-none">
      {/* Glow */}
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-primary/[0.04] blur-2xl" />

      {/* App window */}
      <div
        className={`relative overflow-hidden rounded-2xl border bg-white shadow-2xl shadow-slate-900/10 transition-all duration-500 ${
          isComplete
            ? "border-emerald-400/50 shadow-emerald-500/10"
            : "border-slate-200"
        } ${isTransitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"}`}
      >
        {/* macOS title bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
          <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <div className="h-3 w-3 rounded-full bg-[#28C840]" />
          <span className="ml-2 text-[11px] font-medium text-slate-400">
            parsli.co
          </span>
        </div>

        {/* Image area */}
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
            />

            {/* Scan overlay */}
            {phase === "scanning" && (
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute inset-x-0 top-0 bg-primary/[0.06] backdrop-blur-[0.5px]"
                  style={{ height: `${scanPct}%` }}
                />
                <div
                  className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_16px_4px_rgba(39,130,255,0.4)]"
                  style={{ top: `${scanPct}%` }}
                />
              </div>
            )}

            {/* Dim when panel showing */}
            {showPanel && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            )}
          </div>

          {/* Result panel — slides up from bottom */}
          <div
            className={`absolute inset-x-0 bottom-0 transition-all duration-500 ease-out ${
              showPanel || isComplete
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            }`}
          >
            <div
              className={`mx-3 mb-3 rounded-xl border bg-white/95 shadow-xl backdrop-blur-sm transition-colors duration-500 ${
                isComplete ? "border-emerald-400/60" : "border-primary/30"
              }`}
            >
              {/* Status bar */}
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-2.5">
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                )}
                <p className="text-xs font-semibold tracking-wide text-slate-600">
                  {isComplete ? (
                    <span className="text-emerald-600">COMPLETE</span>
                  ) : (
                    <>
                      {slide.statusLabel}{" "}
                      <span className="text-primary">
                        {slide.statusHighlight}
                      </span>
                      ...
                    </>
                  )}
                </p>
              </div>

              {/* Progress bar */}
              {phase === "revealing" && (
                <div className="h-[2px] bg-slate-100">
                  <div
                    className="h-full bg-primary transition-all duration-150 ease-linear"
                    style={{
                      width:
                        slide.mode === "fields"
                          ? `${(revealedRows / slide.fields!.length) * 100}%`
                          : `${(typedChars / slide.fullText!.length) * 100}%`,
                    }}
                  />
                </div>
              )}
              {isComplete && <div className="h-[2px] bg-emerald-400" />}

              {/* Content */}
              <div className="max-h-[180px] overflow-y-auto px-4 py-3 sm:max-h-[220px]">
                {slide.mode === "fields" ? (
                  <div className="space-y-2">
                    {slide.fields!.map((field, i) => (
                      <div
                        key={`${field.label}-${i}`}
                        className={`flex items-baseline gap-3 transition-all duration-300 ${
                          i < revealedRows
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2"
                        }`}
                      >
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-16 sm:w-20">
                          {field.label}
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {slide.fullText!.slice(0, typedChars)}
                    {phase === "revealing" && (
                      <span className="inline-block w-[2px] h-4 bg-primary ml-[1px] animate-pulse align-text-bottom" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setIdx(i)
              setPhase("scanning")
            }}
            aria-label={`Demo ${i + 1}: ${slides[i].statusHighlight}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === idx
                ? "w-7 bg-primary"
                : "w-2 bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="mt-2 flex justify-center gap-6">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              setIdx(i)
              setPhase("scanning")
            }}
            className={`text-[10px] font-medium transition-colors ${
              i === idx ? "text-primary" : "text-slate-400 hover:text-slate-500"
            }`}
          >
            {s.statusHighlight
              .split(" ")
              .map((w) => w[0] + w.slice(1).toLowerCase())
              .join(" ")}
          </button>
        ))}
      </div>
    </div>
  )
}
