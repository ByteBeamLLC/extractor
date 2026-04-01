"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { CheckCircle2, Loader2 } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Slide data — REAL extraction results from each document            */
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
    image: "/samples/invoice.png",
    alt: "Invoice from East Repair Inc. with line items and totals",
    statusLabel: "EXTRACTING FIELDS FROM",
    statusHighlight: "INVOICE",
    mode: "fields",
    fields: [
      { label: "Vendor", value: "East Repair Inc." },
      { label: "Invoice #", value: "US-001" },
      { label: "Date", value: "11/02/2019" },
      { label: "Items", value: "Brake cables, pedal arms, labor" },
      { label: "Tax", value: "$9.06 (6.25%)" },
      { label: "Total", value: "$154.06" },
    ],
  },
  {
    image: "/samples/bol.png",
    alt: "Bill of Lading shipping document from Konkan Sweetness Ltd.",
    statusLabel: "PARSING DATA FROM",
    statusHighlight: "BILL OF LADING",
    mode: "fields",
    fields: [
      { label: "BOL #", value: "65682" },
      { label: "Date", value: "21/01/2024" },
      { label: "Shipper", value: "Konkan Sweetness Ltd." },
      { label: "Consignee", value: "Don Foods Ltd." },
      { label: "Carrier", value: "Voyages Carriers — Trailer 986" },
      { label: "Total", value: "100 packages / 450 KG / £1,903" },
    ],
  },
  {
    image: "/samples/email.png",
    alt: "Email from Talal Bazerbachi with resume introduction",
    statusLabel: "PARSING",
    statusHighlight: "EMAIL",
    mode: "fields",
    fields: [
      { label: "From", value: "Talal Bazerbachi" },
      { label: "Email", value: "talal@bytebeam.co" },
      { label: "To", value: "resume.3236.faOc" },
      { label: "Time", value: "12:10 PM" },
      { label: "Role", value: "Software Engineer — 4 years" },
      { label: "Skills", value: "Python, FastAPI, production systems" },
    ],
  },
  {
    image: "/samples/survey-doc.png",
    alt: "Handwritten survey field observation log with recording parameters",
    statusLabel: "EXTRACTING FIELDS FROM",
    statusHighlight: "FIELD SURVEY",
    mode: "fields",
    fields: [
      { label: "Area", value: "Survey Field" },
      { label: "Observer", value: "Steensama / Boyd" },
      { label: "Date", value: "11/2/95" },
      { label: "Instrument", value: "ES-2420" },
      { label: "Source", value: "Betsy / Sledge" },
      { label: "Weather", value: "Overcast, snow on the ground" },
    ],
  },
  {
    image: "/samples/handwritten-letter.png",
    alt: "Handwritten letter in blue ink on white paper",
    statusLabel: "READING",
    statusHighlight: "HANDWRITTEN LETTER",
    mode: "text",
    fullText: `Hello Rachel,
It was a pleasure seeing you again at our open house the other week! You're always the first person I think of when I am out networking and building relationships. Please let me know if I can ever be of assistance to you or anyone you know!
See you soon!
Diane`,
  },
]

/* Timing */
const SCAN_MS = 2200
const REVEAL_STAGGER = 140
const TYPING_SPEED = 14
const HOLD_MS = 3500
const TRANSITION_MS = 600

type Phase = "scanning" | "revealing" | "complete" | "transitioning"

export function AdHeroDemo() {
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
          <div className="relative aspect-[4/3] overflow-hidden bg-white">
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-contain p-2"
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
