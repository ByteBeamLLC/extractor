import { type NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { z } from "zod"

const calculatorTool = tool({
  description: "A comprehensive calculator tool for performing arithmetic operations. Use this whenever you need to calculate mathematical expressions, including basic arithmetic, exponentiation, square roots, and more. The calculator supports: addition (+), subtraction (-), multiplication (*), division (/), exponentiation (^), square root (sqrt), parentheses for grouping, and follows proper order of operations.",
  inputSchema: z.object({
    expression: z.string().describe("The mathematical expression to evaluate. Examples: '2 + 2', '(10 * 5) - 3', '2 ^ 3', 'sqrt(16)', '(5 + 3) * 2 / 4'"),
  }),
  execute: async ({ expression }) => {
    try {
      const result = evaluateExpression(expression)
      return { result, expression }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid expression", expression }
    }
  },
})

function evaluateExpression(expr: string): number {
  expr = expr.trim().toLowerCase()
  
  expr = expr.replace(/\s+/g, '')
  
  expr = expr.replace(/sqrt\(([^)]+)\)/g, (_, inner) => {
    const val = evaluateExpression(inner)
    if (val < 0) throw new Error("Cannot take square root of negative number")
    return String(Math.sqrt(val))
  })
  
  expr = expr.replace(/\^/g, '**')
  
  const isValidExpression = /^[0-9+\-*/(). **]+$/.test(expr)
  if (!isValidExpression) {
    throw new Error("Invalid characters in expression")
  }
  
  try {
    const result = Function('"use strict"; return (' + expr + ')')()
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error("Expression did not evaluate to a valid number")
    }
    return result
  } catch (error) {
    throw new Error("Invalid mathematical expression")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("[bytebeam] Transform API - Full request body:", JSON.stringify(body, null, 2))

    const inputSource: "document" | "column" = body.inputSource || "column"
    const prompt: string = String(body.prompt || "")

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Missing prompt" }, { status: 400 })
    }

    if (inputSource === "column") {
      const inputText: string = body.inputText ?? ""
      
      const substitutedPrompt = prompt.replace(/\{[^}]+\}/g, () => inputText)
      
      console.log("[bytebeam] Transform - Original prompt:", prompt)
      console.log("[bytebeam] Transform - Input text:", inputText)
      console.log("[bytebeam] Transform - Substituted prompt:", substitutedPrompt)
      
      const result = await generateText({
        model: google("gemini-2.5-pro"),
        temperature: 0.2,
        prompt: `You are a transformation assistant. Task: ${substitutedPrompt}\n\nInput value: ${inputText}\n\nReturn only the transformed value with no extra commentary.`,
        tools: {
          calculator: calculatorTool,
        },
        maxSteps: 5,
      })
      
      console.log("[bytebeam] Transform - Tool calls:", result.toolCalls)
      console.log("[bytebeam] Transform - Result text:", result.text)
      console.log("[bytebeam] Transform - Tool results:", result.toolResults)
      
      let finalResult = result.text
      
      if ((!finalResult || finalResult.trim() === '') && result.toolResults && result.toolResults.length > 0) {
        const lastToolResult = result.toolResults[result.toolResults.length - 1]
        console.log("[bytebeam] Transform - Last tool result:", lastToolResult)
        
        if (lastToolResult && lastToolResult.output) {
          const toolOutput = lastToolResult.output as any
          console.log("[bytebeam] Transform - Tool output:", toolOutput)
          
          if (toolOutput && typeof toolOutput.result === 'number') {
            finalResult = String(toolOutput.result)
            console.log("[bytebeam] Transform - Extracted number from toolOutput.result:", finalResult)
          } else if (typeof toolOutput === 'number') {
            finalResult = String(toolOutput)
            console.log("[bytebeam] Transform - Extracted number from toolOutput:", finalResult)
          } else {
            console.log("[bytebeam] Transform - Could not extract number, toolOutput type:", typeof toolOutput)
          }
        }
      }
      
      console.log("[bytebeam] Transform - Final result:", finalResult)
      
      return NextResponse.json({ success: true, result: finalResult || "Error: No result" })
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
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `You are a transformation assistant. Task: ${prompt}.\nReturn only the transformed value.` },
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
      prompt: `You are a transformation assistant. Task: ${prompt}\n\nDocument:\n${docText}\n\nReturn only the transformed value with no extra commentary.`,
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
