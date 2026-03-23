import { NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/openrouter"

const MODEL = "google/gemini-3-flash-preview"

const SYSTEM_PROMPT = `You are a handwriting recognition expert. Your job is to extract ALL text from the handwritten content in the provided image.

Rules:
- Return ONLY the extracted text — no explanations, no commentary, no markdown formatting.
- Preserve the original paragraph structure and line breaks.
- If you can read partial words, include your best guess.
- If the image contains no handwritten text, respond with exactly: [NO_TEXT_FOUND]`

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json()

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Missing image or mimeType" },
        { status: 400 }
      )
    }

    const result = await generateText({
      model: MODEL,
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

    const text = result.text.trim()

    if (text === "[NO_TEXT_FOUND]") {
      return NextResponse.json({ text: "", error: "no_text" })
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error("Handwriting extraction error:", error)
    return NextResponse.json(
      { error: "Failed to extract text from image" },
      { status: 500 }
    )
  }
}
