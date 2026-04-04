import { NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/openrouter"

export const maxDuration = 60

const MODEL = "google/gemini-2.0-flash-lite"

const SYSTEM_PROMPT = `You are an OCR post-processor. You receive raw, noisy text extracted from an image by an OCR engine.

Your job:
- Fix garbled characters, broken words, and misrecognized symbols.
- Reconstruct proper sentence and paragraph structure.
- Remove obvious OCR artifacts (random symbols, repeated junk characters, stray punctuation).
- Preserve the original meaning and content — do NOT add, invent, or summarize.
- If the text contains a table or structured data, format it cleanly.
- Return ONLY the cleaned text — no explanations, no commentary, no markdown code fences.`

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const SAFETY_MARGIN_MS = 3_000
  const deadlineMs = startTime + (maxDuration * 1000) - SAFETY_MARGIN_MS

  try {
    const { rawText } = await req.json()

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json(
        { error: "Missing rawText" },
        { status: 400 }
      )
    }

    if (rawText.trim().length === 0) {
      return NextResponse.json({ text: "" })
    }

    const result = await generateText({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Clean up this raw OCR output:\n\n${rawText}`,
        },
      ],
      temperature: 0.1,
      timeoutMs: 25_000,
      deadlineMs,
    })

    return NextResponse.json({ text: result.text.trim() })
  } catch (error) {
    console.error("OCR cleanup error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    const isTimeout = message.includes('time budget') || message.includes('TimeoutError') || message.includes('aborted') || message.includes('timed out')
    return NextResponse.json(
      {
        error: isTimeout
          ? "OCR cleanup timed out — the text may be too long. Try a shorter excerpt."
          : `OCR cleanup failed: ${message}`
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
