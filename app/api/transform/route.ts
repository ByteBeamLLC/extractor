import { type NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { z } from "zod"

const BASE_SYSTEM_PROMPT = [
  "You are Bytebeam's transformation assistant.",
  "Follow the user's task precisely and base your response only on the provided inputs.",
  "When arithmetic is required, call the calculator tool with a concise expression using the numeric values you know.",
  "Return only the transformed value without extra commentary unless the user explicitly asks for a format like JSON.",
].join(" ")

const calculatorTool = tool({
  description: "Evaluate arithmetic expressions with +, -, *, /, and parentheses to produce an accurate numeric result.",
  parameters: z.object({
    expression: z
      .string()
      .max(200, "Expression too long")
      .describe("Math expression to evaluate. Example: '(subtotal + tax) * 1.15'"),
  }),
  execute: async ({ expression }) => {
    const result = evaluateMathExpression(expression)
    return result.toString()
  },
})

function evaluateMathExpression(rawExpression: string): number {
  if (typeof rawExpression !== "string") {
    throw new Error("Expression must be a string")
  }
  const normalized = rawExpression.replace(/,/g, "")
  const sanitized = normalized.replace(/[^0-9+\-*/(). ]/g, "")
  if (!sanitized.trim()) {
    throw new Error("Expression is empty")
  }

  try {
    const fn = new Function(`"use strict"; return (${sanitized})`)
    const value = fn()
    if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
      throw new Error("Expression did not produce a finite number")
    }
    return value
  } catch (error) {
    throw new Error(
      error instanceof Error ? `Failed to evaluate expression: ${error.message}` : "Failed to evaluate expression",
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const inputSource: "document" | "column" = body.inputSource || "column"
    const prompt: string = String(body.prompt || "")

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Missing prompt" }, { status: 400 })
    }

    if (inputSource === "column") {
      const inputText: string = body.inputText ?? ""
      const { text } = await generateText({
        model: google("gemini-2.5-pro"),
        temperature: 0.2,
        system: BASE_SYSTEM_PROMPT,
        prompt: `Task: ${prompt}\n\nInput:\n${inputText}\n\nReturn only the transformed value.`,
        tools: {
          calculator: calculatorTool,
        },
      })
      return NextResponse.json({ success: true, result: text })
    }

    // inputSource === 'document'
    const file = body.file
    if (!file || !file.data) {
      return NextResponse.json({ success: false, error: "Missing file for document transformation" }, { status: 400 })
    }

    const binaryData = Buffer.from(file.data, "base64")
    const bytes = new Uint8Array(binaryData)

    const fileName = file.name || "document"
    const fileType = file.type || "application/octet-stream"
    const isImage = fileType.startsWith("image/") || /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(fileName)

    if (isImage) {
      const base64 = Buffer.from(bytes).toString("base64")
      const mimeType = fileType || "image/png"
      const { text } = await generateText({
        model: google("gemini-2.5-pro"),
        temperature: 0.2,
        system: BASE_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Task: ${prompt}.\nReturn only the transformed value.` },
              { type: "image", image: `data:${mimeType};base64,${base64}` },
            ],
          },
        ],
        tools: {
          calculator: calculatorTool,
        },
      })
      return NextResponse.json({ success: true, result: text })
    }

    // Try to decode as UTF-8 text; if it's not text, the output may be garbled but still usable as context
    const docText = new TextDecoder().decode(bytes)
    const { text } = await generateText({
      model: google("gemini-2.5-pro"),
      temperature: 0.2,
      system: BASE_SYSTEM_PROMPT,
      prompt: `Task: ${prompt}\n\nDocument:\n${docText}\n\nReturn only the transformed value.`,
      tools: {
        calculator: calculatorTool,
      },
    })
    return NextResponse.json({ success: true, result: text })
  } catch (error) {
    console.error("[bytebeam] Transform error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
