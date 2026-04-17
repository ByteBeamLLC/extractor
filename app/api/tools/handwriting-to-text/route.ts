import { NextRequest, NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { z } from "zod"
import { generateObject } from "@/lib/openrouter"
import { trackServerEvent } from "@/lib/analytics/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export const maxDuration = 120

const PRIMARY_MODEL = "google/gemini-3-flash-preview"
const FALLBACK_MODEL = "google/gemini-2.5-flash"

// Doc-type taxonomy drives the contextual starter questions in the bridge chat.
// The model picks one of these; the UI localizes its header label off this value.
const DOC_TYPES = [
  "study_notes",
  "expense_list",
  "contact_list",
  "meeting_notes",
  "legal_doc",
  "homework_essay",
  "math_work",
  "credentials",
  "generic",
] as const

export type HandwritingDocType = (typeof DOC_TYPES)[number]

const HandwritingResponseSchema = z.object({
  text: z
    .string()
    .describe(
      "All handwritten text extracted from the image, preserving line breaks and paragraph structure. Empty string if no handwriting is present.",
    ),
  language: z
    .string()
    .describe(
      "BCP-47 language tag of the document's primary language (e.g. 'en', 'sq', 'tr', 'ml-IN', 'fr', 'de', 'hi'). Use 'en' if unsure.",
    ),
  doc_type: z.enum(DOC_TYPES),
  starter_questions: z
    .array(
      z.object({
        label: z
          .string()
          .describe("Short chip label, max ~40 chars, in the detected language."),
        prompt: z
          .string()
          .describe(
            "The full question sent verbatim to the chat model, in the detected language.",
          ),
      }),
    )
    .describe(
      "Exactly 3 contextual starter questions tailored to the doc_type, written in the detected language.",
    ),
})

export type HandwritingResponse = z.infer<typeof HandwritingResponseSchema>

const SYSTEM_PROMPT = `You are a handwriting recognition expert AND a document classifier. From the image, extract four things:

1. text — ALL handwritten text. Preserve paragraph structure and line breaks. Include your best guess for partial words. If the image has no handwritten text, return an empty string.

2. language — BCP-47 code for the document's primary language (e.g. "en", "sq", "tr", "ml-IN", "fr", "de", "hi", "es", "pt"). Default to "en" if unsure.

3. doc_type — exactly one of:
   - study_notes: class notes, lecture notes, textbook copies, revision material
   - expense_list: lists of amounts, bills, ledgers, receipts, budgets
   - contact_list: names paired with phone numbers, address books
   - meeting_notes: attendee lists, action items, decisions, brainstorm boards
   - legal_doc: court filings, contracts, affidavits, briefs
   - homework_essay: student essays, homework assignments, answer sheets
   - math_work: equations, proofs, whiteboard math, problem sets
   - credentials: passwords, login credentials, API keys, usernames
   - generic: anything else, or if unsure

4. starter_questions — exactly 3 short questions the user might want to ask about THIS specific document.

   CRITICAL: The starter questions MUST be written in the SAME language as the document (the language field above). If the doc is in Albanian, write the questions in Albanian. If it's in Turkish, write them in Turkish. If English, English. Never default to English when the doc is in another language.

   Each entry has:
   - "label": a short chip label (~40 chars max) in the detected language
   - "prompt": the full question sent to the chat (longer is fine), in the detected language

   Tailor the 3 questions to the doc_type:
   - study_notes → explain a key concept, quiz the user, summarize
   - expense_list → total all amounts, largest expense, group by category
   - contact_list → list all contacts as a table, count contacts, find by name
   - meeting_notes → action items, decisions made, open questions
   - legal_doc → summarize the brief facts, key dates, parties involved
   - homework_essay → grammar mistakes, suggest improvements, rewrite more clearly
   - math_work → walk through step by step, check for errors, explain the method
   - credentials → use the SAME three generic questions as the "generic" type. DO NOT mention passwords, credentials, security, or the sensitive nature of the content. Treat it exactly like a generic document.
   - generic → summarize, what is this about, translate to English

If there is no handwritten text at all, return: text="", language="en", doc_type="generic", starter_questions=[].`

async function extractWithModel(
  model: string,
  image: string,
  mimeType: string,
  deadlineMs?: number,
): Promise<{ object: HandwritingResponse }> {
  return generateObject({
    model,
    schema: HandwritingResponseSchema,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the text and metadata from this handwritten image.",
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
    timeoutMs: 25_000,
    deadlineMs,
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
    const SAFETY_MARGIN_MS = 3_000
    const deadlineMs = startTime + (maxDuration * 1000) - SAFETY_MARGIN_MS

    let result: { object: HandwritingResponse }
    let modelUsed = PRIMARY_MODEL

    try {
      result = await extractWithModel(PRIMARY_MODEL, image, mimeType, deadlineMs)
    } catch (primaryError) {
      // Check if there's enough time for fallback (at least 10s)
      const remaining = deadlineMs - Date.now()
      if (remaining < 10_000) {
        throw new Error(`Primary model timed out with ${Math.round(remaining / 1000)}s remaining — insufficient time for fallback`)
      }
      modelUsed = FALLBACK_MODEL
      result = await extractWithModel(FALLBACK_MODEL, image, mimeType, deadlineMs)
    }

    const text = result.object.text.trim()
    const language = result.object.language || "en"
    const docType = result.object.doc_type
    const starterQuestions = result.object.starter_questions ?? []
    const durationMs = Date.now() - startTime

    if (!text) {
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
            model_used: modelUsed,
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

      return NextResponse.json({
        text: "",
        language,
        doc_type: docType,
        starter_questions: [],
        error: "no_text",
      })
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
          model_used: modelUsed,
          doc_type: docType,
          language,
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

    return NextResponse.json({
      text,
      language,
      doc_type: docType,
      starter_questions: starterQuestions,
    })
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
