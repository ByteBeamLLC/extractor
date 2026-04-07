import { type NextRequest, NextResponse } from "next/server"

import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { generateChatWithTools } from "@/lib/openrouter"
import { calculateTool } from "@/lib/chat/tools/calculate"
import { createQueryExtractedDataTool } from "@/lib/chat/tools/queryExtractedData"
import { buildChatSystemPrompt } from "@/lib/chat/systemPrompt"
import type { ChatMessage, ChatResponseBody } from "@/lib/chat/types"
import type { Parser, ProcessedDocument } from "@/lib/extractor/types"
import { trackServerEvent } from "@/lib/analytics/server"
import { reportError } from "@/lib/errorReporting"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Default model for the document chat. Picked deliberately:
 *  - Tool-calling reliable (we lean on `calculate` and `query_extracted_data`)
 *  - Fast + cheap — chat needs low latency, structured-data Q&A doesn't
 *    need a frontier reasoning model.
 *  - Routed via OpenRouter to OpenAI; provider order overrides the file-level
 *    Google default in `lib/openrouter.ts`.
 *
 * Override per-environment with the OPENROUTER_CHAT_MODEL env var.
 */
const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini"

const MAX_HISTORY_MESSAGES = 20
const MAX_USER_MESSAGE_LENGTH = 4000
const MAX_TOOL_ITERATIONS = 5

export async function POST(
  request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Parse request body
  let body: { documentId?: string; message?: string; history?: ChatMessage[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const documentId = typeof body.documentId === "string" ? body.documentId : ""
  const message = typeof body.message === "string" ? body.message.trim() : ""
  const history = Array.isArray(body.history) ? body.history : []

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 })
  }
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 })
  }
  if (message.length > MAX_USER_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message exceeds ${MAX_USER_MESSAGE_LENGTH} characters` },
      { status: 400 }
    )
  }

  // Load parser + verify ownership
  const { data: parserRow, error: parserError } = await supabase
    .from("parsers" as any)
    .select("*")
    .eq("id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (parserError || !parserRow) {
    return NextResponse.json({ error: "Parser not found" }, { status: 404 })
  }
  const parser = parserRow as Parser

  // Load document + verify it belongs to this parser AND this user
  const { data: docRow, error: docError } = await supabase
    .from("parser_processed_documents" as any)
    .select("*")
    .eq("id", documentId)
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (docError || !docRow) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }
  const doc = docRow as ProcessedDocument

  // Soft-block states return 200 with a `blocked` reason so the UI shows a
  // friendly empty state instead of an error.
  if (doc.status === "processing" || doc.status === "pending") {
    const reply: ChatResponseBody = {
      answer:
        "This document is still being processed. Chat will be available once extraction completes.",
      toolCallsMade: [],
      blocked: "processing",
    }
    return NextResponse.json(reply)
  }
  if (doc.status === "error") {
    const reply: ChatResponseBody = {
      answer:
        "Extraction failed for this document, so there's no data to chat about. Reprocess the document and try again.",
      toolCallsMade: [],
      blocked: "error",
    }
    return NextResponse.json(reply)
  }
  if (!doc.results || Object.keys(doc.results).length === 0) {
    const reply: ChatResponseBody = {
      answer:
        "No data was extracted from this document. There's nothing to chat about yet — try reprocessing or updating your parser fields.",
      toolCallsMade: [],
      blocked: "no_results",
    }
    return NextResponse.json(reply)
  }

  // Build the system prompt + tools (tools are bound to this document's data)
  const systemPrompt = buildChatSystemPrompt(parser, doc)
  const tools = [
    calculateTool,
    createQueryExtractedDataTool(doc.results as Record<string, unknown>),
  ]

  // Trim history to the last MAX_HISTORY_MESSAGES turns and strip extra fields
  // before sending to the model — only role + content go in the prompt.
  const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role,
    content: m.content,
  }))
  const conversation: Array<{ role: "user" | "assistant"; content: string }> = [
    ...trimmedHistory,
    { role: "user", content: message },
  ]

  const startedAt = Date.now()

  try {
    const result = await generateChatWithTools({
      model: process.env.OPENROUTER_CHAT_MODEL || DEFAULT_CHAT_MODEL,
      system: systemPrompt,
      messages: conversation,
      tools,
      maxIterations: MAX_TOOL_ITERATIONS,
      temperature: 0.2,
      // Route to OpenAI instead of the file-level Google default.
      provider: { order: ["openai"], allow_fallbacks: true },
      // Stay well under the 60s function deadline.
      deadlineMs: startedAt + 55_000,
    })

    trackServerEvent("chat_message_sent", {
      distinct_id: user.id,
      user_id: user.id,
      parser_id: parser.id,
      document_id: doc.id,
      tool_calls: result.toolCallsMade.length,
      tool_names: result.toolCallsMade.map((t) => t.name),
      latency_ms: Date.now() - startedAt,
    })

    const reply: ChatResponseBody = {
      answer: result.text,
      toolCallsMade: result.toolCallsMade,
    }
    return NextResponse.json(reply)
  } catch (err) {
    console.error("[chat] generation failed:", err)
    reportError(err, {
      route: "/api/parsers/[parserId]/chat",
      method: "POST",
      userId: user.id,
      extra: { parserId: parser.id, documentId: doc.id },
    })
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Chat failed to generate a response",
      },
      { status: 500 }
    )
  }
}
