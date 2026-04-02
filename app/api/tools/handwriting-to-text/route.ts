import { NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { generateText } from "@/lib/openrouter"
import { trackServerEvent } from "@/lib/analytics/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export const maxDuration = 60

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

async function storeUpload({
  distinctId,
  image,
  mimeType,
  fileName,
  fileSize,
  extractedText,
  wordCount,
  success,
  durationMs,
  ip,
  userAgent,
}: {
  distinctId: string
  image: string
  mimeType: string
  fileName?: string
  fileSize?: number
  extractedText: string | null
  wordCount: number
  success: boolean
  durationMs: number
  ip: string
  userAgent: string
}) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const ext = mimeType.split("/")[1] || "jpg"
    const storagePath = `${distinctId}/${Date.now()}.${ext}`

    // Upload image to storage
    const buffer = Buffer.from(image, "base64")
    await supabase.storage
      .from("handwriting-uploads")
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false })

    // Insert metadata row
    await supabase.from("handwriting_uploads").insert({
      distinct_id: distinctId,
      file_name: fileName ?? null,
      mime_type: mimeType,
      file_size_bytes: fileSize ?? buffer.length,
      storage_path: storagePath,
      extracted_text: extractedText,
      word_count: wordCount,
      success,
      duration_ms: durationMs,
      ip_address: ip,
      user_agent: userAgent,
    })
  } catch (e) {
    // Storage should never block the user response
    console.error("Failed to store handwriting upload:", e)
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  // Use IP + user-agent hash as anonymous distinct_id for free tool users
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  const ua = req.headers.get("user-agent") ?? "unknown"
  const distinctId = `hwt_${Buffer.from(`${ip}:${ua}`).toString("base64url").slice(0, 24)}`

  try {
    const { image, mimeType, source, fileName, fileSize } = await req.json()

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Missing image or mimeType" },
        { status: 400 }
      )
    }

    const isUserUpload = source === "upload"

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
      // Return response immediately — background tasks via waitUntil
      waitUntil(
        (async () => {
          trackServerEvent("hwt_server_extraction", {
            distinct_id: distinctId,
            file_type: mimeType,
            success: false,
            word_count: 0,
            duration_ms: durationMs,
            error_type: "no_text",
          })
          if (isUserUpload) {
            await storeUpload({
              distinctId, image, mimeType, fileName, fileSize,
              extractedText: null, wordCount: 0, success: false,
              durationMs, ip, userAgent: ua,
            })
          }
        })()
      )

      return NextResponse.json({ text: "", error: "no_text" })
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length

    // Return response immediately — analytics + storage run in background
    waitUntil(
      (async () => {
        trackServerEvent("hwt_server_extraction", {
          distinct_id: distinctId,
          file_type: mimeType,
          success: true,
          word_count: wordCount,
          duration_ms: durationMs,
        })
        if (isUserUpload) {
          await storeUpload({
            distinctId, image, mimeType, fileName, fileSize,
            extractedText: text, wordCount, success: true,
            durationMs, ip, userAgent: ua,
          })
        }
      })()
    )

    return NextResponse.json({ text })
  } catch (error) {
    console.error("Handwriting extraction error:", error)

    waitUntil(
      Promise.resolve(
        trackServerEvent("hwt_server_extraction", {
          distinct_id: distinctId,
          file_type: "unknown",
          success: false,
          word_count: 0,
          duration_ms: Date.now() - startTime,
          error_type: "server_error",
        })
      )
    )

    return NextResponse.json(
      { error: "Failed to extract text from image" },
      { status: 500 }
    )
  }
}
