import { NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/openrouter"
import { trackServerEvent } from "@/lib/analytics/server"

const PRIMARY_MODEL = "google/gemini-3-flash-preview"
const FALLBACK_MODEL = "google/gemini-2.5-flash"

const SYSTEM_PROMPT = `You are a handwriting recognition expert. Your job is to extract ALL text from the handwritten content in the provided image.

Rules:
- Return ONLY the extracted text — no explanations, no commentary, no markdown formatting.
- Preserve the original paragraph structure and line breaks.
- If you can read partial words, include your best guess.
- If the image contains no handwritten text, respond with exactly: [NO_TEXT_FOUND]`

async function extractWithModel(model: string, image: string, mimeType: string) {
  return generateText({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all handwritten text from this image.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${image}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
  })
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  // Use IP + user-agent hash as anonymous distinct_id for free tool users
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  const ua = req.headers.get("user-agent") ?? "unknown"
  const distinctId = `hwt_${Buffer.from(`${ip}:${ua}`).toString("base64url").slice(0, 24)}`

  try {
    const { image, mimeType } = await req.json()

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Missing image or mimeType" },
        { status: 400 }
      )
    }

    let result: { text: string }
    let modelUsed = PRIMARY_MODEL

    try {
      result = await extractWithModel(PRIMARY_MODEL, image, mimeType)
    } catch {
      // Primary model failed — fall back to stable model
      modelUsed = FALLBACK_MODEL
      result = await extractWithModel(FALLBACK_MODEL, image, mimeType)
    }

    const text = result.text.trim()
    const durationMs = Date.now() - startTime

    if (text === "[NO_TEXT_FOUND]") {
      trackServerEvent("hwt_server_extraction", {
        distinct_id: distinctId,
        file_type: mimeType,
        success: false,
        word_count: 0,
        duration_ms: durationMs,
        error_type: "no_text",
      })
      return NextResponse.json({ text: "", error: "no_text" })
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length

    trackServerEvent("hwt_server_extraction", {
      distinct_id: distinctId,
      file_type: mimeType,
      success: true,
      word_count: wordCount,
      duration_ms: durationMs,
    })

    return NextResponse.json({ text })
  } catch (error) {
    console.error("Handwriting extraction error:", error)

    trackServerEvent("hwt_server_extraction", {
      distinct_id: distinctId,
      file_type: "unknown",
      success: false,
      word_count: 0,
      duration_ms: Date.now() - startTime,
      error_type: "server_error",
    })

    return NextResponse.json(
      { error: "Failed to extract text from image" },
      { status: 500 }
    )
  }
}
