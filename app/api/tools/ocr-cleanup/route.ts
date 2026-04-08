import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/openrouter"
import { ApiError, withErrorReporting } from "@/lib/errorReporting"

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

/**
 * Reference adoption of `withErrorReporting` + `ApiError`.
 *
 * Three failure-path patterns demonstrated here:
 *
 *   1. Expected 4xx (invalid JSON, missing field) — `throw new ApiError(400, ...)`.
 *      The wrapper turns this into a stable envelope WITHOUT a reporter call.
 *      These are user errors, not incidents.
 *
 *   2. Expected 5xx from upstream (model timeout) — `throw new ApiError(504, ...)`.
 *      Same idea: we know this can happen, we have a specific user-facing message,
 *      no reporter entry.
 *
 *   3. Unknown throw — we rethrow. The wrapper catches, reports with requestId,
 *      and returns a stable 500 envelope. This is the only path that creates an
 *      issue in the tracker, which is exactly what we want.
 */
export const POST = withErrorReporting(
  "/api/tools/ocr-cleanup",
  async (req: NextRequest) => {
    const startTime = Date.now()
    const SAFETY_MARGIN_MS = 3_000
    const deadlineMs = startTime + maxDuration * 1000 - SAFETY_MARGIN_MS

    let body: { rawText?: unknown }
    try {
      body = await req.json()
    } catch {
      throw new ApiError(400, "invalid_json", "Request body must be valid JSON.")
    }

    const rawText = body.rawText
    if (!rawText || typeof rawText !== "string") {
      throw new ApiError(400, "missing_raw_text", "Missing rawText in request body.")
    }

    if (rawText.trim().length === 0) {
      return NextResponse.json({ text: "" })
    }

    try {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const isTimeout =
        message.includes("time budget") ||
        message.includes("TimeoutError") ||
        message.includes("aborted") ||
        message.includes("timed out")

      if (isTimeout) {
        // Expected outcome when the upstream model takes too long — not
        // an incident, so do NOT let the wrapper report it. Surface a
        // user-facing message via ApiError at 504.
        throw new ApiError(
          504,
          "upstream_timeout",
          "OCR cleanup timed out — the text may be too long. Try a shorter excerpt.",
        )
      }

      // Anything else is unknown — rethrow so the wrapper reports it
      // with a requestId we can trace in logs + the issue tracker.
      throw err
    }
  },
)
