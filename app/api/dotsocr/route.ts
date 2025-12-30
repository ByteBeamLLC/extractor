import { NextRequest, NextResponse } from "next/server"
import { callDotsOcr } from "@/lib/replicate"

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY

const rawDotsOcrEndpoint =
  process.env.HUGGINGFACE_DOTS_OCR_ENDPOINT ||
  process.env.HUGGINGFACE_DOTS_OCR_MODEL ||
  "dots/ocr"

const HUGGINGFACE_DOTS_OCR_ENDPOINT = rawDotsOcrEndpoint.startsWith("http")
  ? rawDotsOcrEndpoint
  : `https://api-inference.huggingface.co/models/${rawDotsOcrEndpoint}`

const DOTSOCR_SERVICE_TOKEN =
  process.env.DOTSOCR_SERVICE_TOKEN ||
  process.env.DOTS_OCR_SERVICE_TOKEN ||
  process.env.DOTSOCR_INTERNAL_TOKEN ||
  ""

function stripDataUrlPrefix(value: string): string {
  const match = value.match(/^data:([^;]+);base64,(.*)$/)
  if (match) {
    return match[2]
  }
  return value
}

async function ensureBase64Image(payload: {
  image_base64?: string
  imageBase64?: string
  image?: string
  image_url?: string
  imageUrl?: string
}): Promise<string | null> {
  const direct =
    payload.image_base64 ||
    payload.imageBase64 ||
    payload.image ||
    ""
  if (direct && direct.trim().length > 0) {
    return stripDataUrlPrefix(direct.trim())
  }

  const imageUrl = payload.image_url || payload.imageUrl
  if (!imageUrl) return null

  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length === 0) return null
    return buffer.toString("base64")
  } catch (error) {
    console.error("[dotsocr] Failed to fetch image URL:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  if (!HUGGINGFACE_API_KEY) {
    return NextResponse.json(
      { error: "HUGGINGFACE_API_KEY is not configured on the server." },
      { status: 503 },
    )
  }

  if (!HUGGINGFACE_DOTS_OCR_ENDPOINT) {
    return NextResponse.json(
      { error: "Hugging Face dots.ocr endpoint is not configured." },
      { status: 503 },
    )
  }

  if (DOTSOCR_SERVICE_TOKEN) {
    const authHeader = request.headers.get("authorization") ?? ""
    const expected = `Bearer ${DOTSOCR_SERVICE_TOKEN}`
    if (authHeader !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload. Expected base64-encoded image input." },
      { status: 400 },
    )
  }

  const base64 = await ensureBase64Image(body)
  if (!base64) {
    return NextResponse.json(
      { error: "Request must include an `image_base64` (or `image_url`) field." },
      { status: 400 },
    )
  }

  // Try Replicate first if available, then fallback to HuggingFace
  if (REPLICATE_API_TOKEN) {
    try {
      const bodyData = body as any
      const output = await callDotsOcr({
        image: base64,
        file_name: bodyData.file_name,
        mime_type: bodyData.mime_type,
      })

      return NextResponse.json({
        markdown: output.markdown,
        blocks: output.blocks || [],
        ...output,
      })
    } catch (replicateError) {
      console.error("[dotsocr] Replicate error:", replicateError)
      // Fall through to HuggingFace fallback
    }
  }

  // Fallback to HuggingFace
  if (!HUGGINGFACE_API_KEY) {
    return NextResponse.json(
      { error: "Neither REPLICATE_API_TOKEN nor HUGGINGFACE_API_KEY is configured." },
      { status: 503 },
    )
  }

  const requestPayload = {
    inputs: base64,
    parameters: {
      return_markdown: true,
      return_visualization: true,
    },
    options: {
      wait_for_model: true,
    },
  }

  try {
    const response = await fetch(HUGGINGFACE_DOTS_OCR_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestPayload),
    })

    const text = await response.text()
    if (!response.ok) {
      console.error("[dotsocr] Hugging Face error:", response.status, text)
      return NextResponse.json(
        {
          error: "dots.ocr model request failed.",
          status: response.status,
          details: text.slice(0, 2000),
        },
        { status: response.status },
      )
    }

    let payload: any
    try {
      payload = text ? JSON.parse(text) : {}
    } catch (error) {
      console.error("[dotsocr] Failed to parse Hugging Face response:", error)
      return NextResponse.json(
        { error: "Failed to parse Hugging Face dots.ocr response." },
        { status: 502 },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("[dotsocr] Unexpected failure:", error)
    return NextResponse.json(
      {
        error: "Unexpected error while processing dots.ocr request.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
