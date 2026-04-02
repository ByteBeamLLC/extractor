import { NextRequest, NextResponse } from "next/server"
import { generateText, isOpenRouterConfigured } from "@/lib/openrouter"
import { ARLO_SYSTEM_PROMPT } from "@/components/arlo/arlo-personality"

interface ChatMessage {
  role: "user" | "arlo"
  content: string
  file?: { name: string; type: string; size: number }
}

export async function POST(req: NextRequest) {
  try {
    if (!isOpenRouterConfigured()) {
      return NextResponse.json(
        { error: "AI not configured" },
        { status: 503 }
      )
    }

    const body = await req.json()
    const {
      message,
      history = [],
      context = {},
    } = body as {
      message: string
      history?: ChatMessage[]
      context?: {
        currentPath?: string
        hasParser?: boolean
        parserId?: string
        parserName?: string
        parserFieldCount?: number
        parserDocCount?: number
        isFirstTimeUser?: boolean
        hasFile?: boolean
        fileName?: string
      }
    }

    // Build context string
    const contextParts: string[] = []
    if (context.currentPath) contextParts.push(`Current page: ${context.currentPath}`)
    if (context.hasParser && context.parserId) {
      contextParts.push(`Active parser: "${context.parserName}" (ID: ${context.parserId})`)
      if (context.parserFieldCount !== undefined) contextParts.push(`Fields configured: ${context.parserFieldCount}`)
      if (context.parserDocCount !== undefined) contextParts.push(`Documents processed: ${context.parserDocCount}`)
    }
    if (context.isFirstTimeUser) contextParts.push("This is a first-time user with no parsers yet.")
    if (context.hasFile) contextParts.push(`User attached a file: "${context.fileName}"`)

    const contextString = contextParts.length > 0
      ? `\n\n## Current Context\n${contextParts.join("\n")}`
      : ""

    // Build message history for the LLM
    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      {
        role: "system",
        content: ARLO_SYSTEM_PROMPT + contextString,
      },
    ]

    // Add recent history (last 10 messages max)
    const recentHistory = history.slice(-10)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.file
          ? `${msg.content} [Attached file: ${msg.file.name} (${msg.file.type}, ${Math.round(msg.file.size / 1024)}KB)]`
          : msg.content,
      })
    }

    // Add current message
    messages.push({
      role: "user",
      content: context.hasFile
        ? `${message} [User attached file: "${context.fileName}"]`
        : message,
    })

    // Use generateText with JSON mode — single system prompt (Arlo's) so the
    // model sees one clear schema instead of competing system messages.
    const { text } = await generateText({
      messages,
      temperature: 0.7,
      responseFormat: { type: "json_object" },
    })

    // Parse the JSON response
    let parsed: { message?: string; actions?: any[]; emotion?: string }
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { message: text, actions: [] }
    }

    // Validate actions
    const validTypes = ["navigate", "click", "type", "upload", "wait", "speak", "celebrate"]
    const sanitizedActions = (parsed.actions || []).filter(
      (a: any) => a && typeof a.type === "string" && validTypes.includes(a.type)
    )

    console.log("[arlo] actions:", JSON.stringify(sanitizedActions))
    console.log("[arlo] raw_actions:", JSON.stringify(parsed.actions))

    return NextResponse.json({
      message: parsed.message || "Hmm, I got confused. Can you try again?",
      actions: sanitizedActions,
      emotion: parsed.emotion || "happy",
    })
  } catch (error) {
    console.error("[arlo/chat] Error:", error)
    return NextResponse.json(
      {
        message: "Woof, something went wrong on my end. Try again?",
        actions: [],
        emotion: "confused",
      },
      { status: 200 } // Return 200 so the chat still works
    )
  }
}
