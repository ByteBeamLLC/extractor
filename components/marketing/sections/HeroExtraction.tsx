"use client"

import { useEffect, useState, useCallback, useRef } from "react"

/*
 * docY is calculated as: textBaseline - 14  (covers 14px above baseline, 6px below)
 * docH = 20 for generous coverage of the text glyphs
 * docX starts 4px before the text x position
 *
 * Text baselines on the left panel (from the <text y="..."> values):
 *   Invoice # value: y=69   → docY = 55
 *   Date value:      y=93   → docY = 79
 *   Vendor value:    y=146  → docY = 132
 *   Item 1 row:      y=205  → docY = 191
 *   Item 2 row:      y=227  → docY = 213
 *   Subtotal:        y=267  → docY = 253
 *   Tax:             y=289  → docY = 275
 *   Total:           y=319  → docY = 305
 */
const FIELDS = [
  { id: "inv",      label: "Invoice #", value: "INV-2026-001",      color: "#d97706", docX: 126, docY: 53,  docW: 108, docH: 20 },
  { id: "date",     label: "Date",      value: "Mar 8, 2026",       color: "#ec4899", docX: 126, docY: 77,  docW: 90,  docH: 20 },
  { id: "vendor",   label: "Vendor",    value: "Acme Corp",         color: "#8b5cf6", docX: 16,  docY: 130, docW: 100, docH: 20 },
  { id: "item1",    label: "Item 1",    value: "Widget A — $1,000", color: "#f97316", docX: 16,  docY: 193, docW: 264, docH: 16 },
  { id: "item2",    label: "Item 2",    value: "Widget B — $250",   color: "#f97316", docX: 16,  docY: 215, docW: 264, docH: 16 },
  { id: "subtotal", label: "Subtotal",  value: "$1,250.00",         color: "#22c55e", docX: 142, docY: 255, docW: 130, docH: 16 },
  { id: "tax",      label: "Tax",       value: "$112.50",           color: "#06b6d4", docX: 142, docY: 277, docW: 130, docH: 16 },
  { id: "total",    label: "Total",     value: "$1,362.50",         color: "#ef4444", docX: 142, docY: 307, docW: 130, docH: 16 },
]

const ANIM_INTERVAL = 1200
const HOLD_DURATION  = 4000
const INITIAL_DELAY  = 1500

export function HeroExtraction() {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [visibleFields, setVisibleFields] = useState<number[]>([])
  const [phase, setPhase] = useState<"idle" | "extracting" | "complete">("idle")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const runAnimation = useCallback(() => {
    cleanup()
    setActiveIndex(-1)
    setVisibleFields([])
    setPhase("extracting")

    let i = 0
    timerRef.current = setInterval(() => {
      if (i < FIELDS.length) {
        // Capture current value before incrementing —
        // without this, the closure reads i AFTER i++ runs
        const idx = i
        setActiveIndex(idx)
        setVisibleFields((prev) => [...prev, idx])
        i++
      } else {
        if (timerRef.current) clearInterval(timerRef.current)
        setPhase("complete")
        setActiveIndex(-1)
        timeoutRef.current = setTimeout(runAnimation, HOLD_DURATION)
      }
    }, ANIM_INTERVAL)
  }, [cleanup])

  useEffect(() => {
    const t = setTimeout(runAnimation, INITIAL_DELAY)
    return () => { clearTimeout(t); cleanup() }
  }, [runAnimation, cleanup])

  // Right-panel row positions (relative to the right-panel <g>)
  const rightFieldY = (index: number) => 54 + index * 40

  return (
    <div className="relative mx-auto w-full">
      <svg
        viewBox="0 0 700 400"
        className="w-full h-auto"
        role="img"
        aria-label="Interactive visualization showing AI extracting structured data from an invoice document"
      >
        <defs>
          <filter id="panelShadow" x="-4%" y="-4%" width="108%" height="112%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.08)" />
          </filter>
        </defs>

        {/* ═══════ LEFT PANEL — Invoice Document ═══════ */}
        <g transform="translate(10, 10)">
          {/* Paper */}
          <rect x="0" y="0" width="290" height="380" rx="8"
            fill="var(--color-card)" stroke="var(--color-border)" strokeWidth="1"
            filter="url(#panelShadow)" />

          {/* Header bar */}
          <rect x="0" y="0" width="290" height="40" rx="8" fill="var(--color-muted)" />
          <rect x="0" y="32" width="290" height="8" fill="var(--color-muted)" />
          <text x="145" y="26" textAnchor="middle" className="text-[11px] font-semibold"
            fill="var(--color-muted-foreground)">INVOICE</text>

          {/* Invoice # (baseline y=69) */}
          <text x="22" y="69" className="text-[9px]" fill="var(--color-muted-foreground)">Invoice Number:</text>
          <text x="132" y="69" className="text-[10px] font-mono font-medium" fill="var(--color-foreground)">INV-2026-001</text>

          {/* Date (baseline y=93) */}
          <text x="22" y="93" className="text-[9px]" fill="var(--color-muted-foreground)">Date:</text>
          <text x="132" y="93" className="text-[10px] font-mono font-medium" fill="var(--color-foreground)">Mar 8, 2026</text>

          {/* Divider */}
          <line x1="22" y1="110" x2="268" y2="110" stroke="var(--color-border)" strokeWidth="0.5" />

          {/* Vendor (label baseline y=128, value baseline y=146) */}
          <text x="22" y="128" className="text-[9px] font-semibold" fill="var(--color-muted-foreground)">BILL FROM:</text>
          <text x="22" y="146" className="text-[11px] font-semibold" fill="var(--color-foreground)">Acme Corp</text>

          {/* Divider */}
          <line x1="22" y1="162" x2="268" y2="162" stroke="var(--color-border)" strokeWidth="0.5" />

          {/* Table header */}
          <text x="22"  y="180" className="text-[9px] font-semibold" fill="var(--color-muted-foreground)">ITEM</text>
          <text x="168" y="180" className="text-[9px] font-semibold" fill="var(--color-muted-foreground)">QTY</text>
          <text x="220" y="180" className="text-[9px] font-semibold" fill="var(--color-muted-foreground)">PRICE</text>
          <line x1="22" y1="186" x2="268" y2="186" stroke="var(--color-border)" strokeWidth="0.5" />

          {/* Item 1 (baseline y=205) */}
          <text x="22"  y="205" className="text-[10px]" fill="var(--color-foreground)">Widget A</text>
          <text x="176" y="205" className="text-[10px]" fill="var(--color-foreground)">10</text>
          <text x="220" y="205" className="text-[10px] font-mono" fill="var(--color-foreground)">$1,000.00</text>

          {/* Item 2 (baseline y=227) */}
          <text x="22"  y="227" className="text-[10px]" fill="var(--color-foreground)">Widget B</text>
          <text x="176" y="227" className="text-[10px]" fill="var(--color-foreground)">5</text>
          <text x="220" y="227" className="text-[10px] font-mono" fill="var(--color-foreground)">$250.00</text>

          {/* Divider */}
          <line x1="140" y1="242" x2="268" y2="242" stroke="var(--color-border)" strokeWidth="0.5" />

          {/* Subtotal (baseline y=267) */}
          <text x="148" y="267" className="text-[9px]" fill="var(--color-muted-foreground)">Subtotal:</text>
          <text x="210" y="267" className="text-[10px] font-mono" fill="var(--color-foreground)">$1,250.00</text>

          {/* Tax (baseline y=289) */}
          <text x="148" y="289" className="text-[9px]" fill="var(--color-muted-foreground)">Tax (9%):</text>
          <text x="210" y="289" className="text-[10px] font-mono" fill="var(--color-foreground)">$112.50</text>

          {/* Bold divider */}
          <line x1="140" y1="300" x2="268" y2="300" stroke="var(--color-border)" strokeWidth="1" />

          {/* Total (baseline y=319) */}
          <text x="148" y="319" className="text-[10px] font-bold" fill="var(--color-foreground)">Total:</text>
          <text x="210" y="319" className="text-[11px] font-bold font-mono" fill="var(--color-foreground)">$1,362.50</text>

          {/* ── Highlight overlays ── */}
          {FIELDS.map((field, i) => {
            const isActive  = activeIndex === i
            const isVisible = visibleFields.includes(i)
            return (
              <rect key={field.id}
                x={field.docX} y={field.docY}
                width={field.docW} height={field.docH}
                rx="3"
                fill={field.color}
                opacity={isActive ? 0.30 : isVisible ? 0.12 : 0}
                stroke={field.color}
                strokeWidth={isActive ? 1.5 : isVisible ? 0.5 : 0}
                strokeOpacity={isActive ? 0.7 : 0.3}
                style={{ transition: "opacity 0.5s ease, stroke-width 0.4s ease" }}
              />
            )
          })}
        </g>

        {/* ═══════ CENTER — AI Processing Badge ═══════ */}
        <g transform="translate(312, 165)">
          <circle cx="30" cy="30" r="28"
            fill="var(--color-muted)"
            stroke="var(--color-primary)"
            strokeWidth={phase === "extracting" ? "2" : "1.5"}
            strokeOpacity={phase === "extracting" ? 0.9 : 0.3}
            style={{ transition: "stroke-width 0.4s, stroke-opacity 0.4s" }}
          />
          <g transform="translate(17, 17)" fill="var(--color-primary)">
            <path d="M13 0 L15.5 8.5 L24 11 L15.5 13.5 L13 22 L10.5 13.5 L2 11 L10.5 8.5 Z"
              opacity={phase === "extracting" ? 1 : 0.5}
              style={{ transition: "opacity 0.4s" }}
            >
              {phase === "extracting" && (
                <animateTransform attributeName="transform" type="rotate"
                  from="0 13 11" to="360 13 11" dur="3s" repeatCount="indefinite" />
              )}
            </path>
          </g>
          <text x="30" y="72" textAnchor="middle" className="text-[9px] font-medium"
            fill="var(--color-primary)">
            {phase === "extracting" ? "Extracting..." : phase === "complete" ? "Complete" : ""}
          </text>
        </g>

        {/* ═══════ CONNECTION LINES ═══════ */}
        {FIELDS.map((field, i) => {
          const isActive  = activeIndex === i
          const isVisible = visibleFields.includes(i)

          const startX = 10 + field.docX + field.docW + 4
          const startY = 10 + field.docY + field.docH / 2

          const endX = 390
          const endY = 10 + rightFieldY(i) + 17

          const cpX1 = startX + 50
          const cpX2 = endX   - 50

          return (
            <path key={`line-${field.id}`}
              d={`M ${startX} ${startY} C ${cpX1} ${startY}, ${cpX2} ${endY}, ${endX} ${endY}`}
              fill="none"
              stroke={field.color}
              strokeWidth={isActive ? 1.8 : 0.8}
              strokeOpacity={isActive ? 0.7 : isVisible ? 0.15 : 0}
              strokeDasharray={isActive ? "6 4" : "none"}
              style={{ transition: "stroke-opacity 0.5s ease, stroke-width 0.4s ease" }}
            >
              {isActive && (
                <animate attributeName="stroke-dashoffset"
                  from="20" to="0" dur="0.8s" repeatCount="indefinite" />
              )}
            </path>
          )
        })}

        {/* ═══════ RIGHT PANEL — Extracted Data ═══════ */}
        <g transform="translate(390, 10)">
          <rect x="0" y="0" width="295" height="380" rx="8"
            fill="var(--color-card)" stroke="var(--color-border)" strokeWidth="1"
            filter="url(#panelShadow)" />

          {/* Header */}
          <rect x="0" y="0" width="295" height="40" rx="8" fill="var(--color-primary)" fillOpacity="0.07" />
          <rect x="0" y="32" width="295" height="8" fill="var(--color-primary)" fillOpacity="0.07" />
          <text x="147" y="26" textAnchor="middle" className="text-[11px] font-semibold"
            fill="var(--color-primary)">EXTRACTED DATA</text>

          {/* Rows */}
          {FIELDS.map((field, i) => {
            const isVisible = visibleFields.includes(i)
            const isActive  = activeIndex === i
            const y = rightFieldY(i)

            return (
              <g key={`ext-${field.id}`}
                opacity={isVisible ? 1 : 0}
                style={{ transition: "opacity 0.6s ease" }}
              >
                <rect x="12" y={y} width="271" height="34" rx="6"
                  fill={field.color}
                  fillOpacity={isActive ? 0.14 : 0.05}
                  stroke={field.color}
                  strokeWidth={isActive ? 1.2 : 0.5}
                  strokeOpacity={isActive ? 0.5 : 0.12}
                  style={{ transition: "fill-opacity 0.4s, stroke-width 0.4s, stroke-opacity 0.4s" }}
                />
                <circle cx="28" cy={y + 17} r="4.5" fill={field.color} fillOpacity="0.75" />
                <text x="42" y={y + 21} className="text-[10px] font-medium"
                  fill="var(--color-muted-foreground)">{field.label}</text>
                <text x="270" y={y + 21} textAnchor="end"
                  className="text-[10px] font-mono font-semibold"
                  fill="var(--color-foreground)">{field.value}</text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
