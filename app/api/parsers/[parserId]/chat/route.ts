import { type NextRequest, NextResponse } from "next/server"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type ToolSet,
  type UIMessage,
} from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"

import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { calculateTool } from "@/lib/chat/tools/calculate"
import { createQueryExtractedDataTool } from "@/lib/chat/tools/queryExtractedData"
import { buildChatSystemPrompt } from "@/lib/chat/systemPrompt"
import type { Parser, ProcessedDocument } from "@/lib/extractor/types"
import { trackServerEvent } from "@/lib/analytics/server"
import { reportError } from "@/lib/errorReporting"

export const runtime = "nodejs"

// Raised from 60s → 800s. Vercel Pro + Fluid Compute supports up to 800s.
// Streaming keeps the TCP connection alive; the function is billed on wall
// clock so we still short-circuit idle loops via stopWhen below.
// https://vercel.com/docs/functions/configuring-functions/duration
export const maxDuration = 800

/**
 * Default model for the document chat. Picked deliberately:
 *  - Tool-calling reliable (we lean on `calculate` and `query_extracted_data`)
 *  - Fast + cheap — chat needs low latency, structured-data Q&A doesn't
 *    need a frontier reasoning model.
 *
 * Override per-environment with the OPENROUTER_CHAT_MODEL env var.
 */
const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini"

const MAX_USER_MESSAGE_LENGTH = 4000
const MAX_TOOL_STEPS = 5

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  appName: "Parsli",
  appUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://parsli.co",
})

interface ChatRequestBody {
  messages?: UIMessage[]
  documentId?: string
}

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

  let body: ChatRequestBody
  try {
    body = (await request.json()) as ChatRequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const documentId = typeof body.documentId === "string" ? body.documentId : ""
  const uiMessages = Array.isArray(body.messages) ? body.messages : []

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId is required" },
      { status: 400 }
    )
  }
  if (uiMessages.length === 0) {
    return NextResponse.json(
      { error: "messages is required" },
      { status: 400 }
    )
  }

  // Enforce the per-turn message size budget. Only the latest user turn is
  // examined — history turns already passed through this check on their way in.
  const latestUser = [...uiMessages].reverse().find((m) => m.role === "user")
  const latestUserText = latestUser
    ? latestUser.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("")
    : ""
  if (latestUserText.length > MAX_USER_MESSAGE_LENGTH) {
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

  // Soft-block states: stream back the canned answer so the client renders it
  // as an assistant message without a special wire format.
  if (doc.status === "processing" || doc.status === "pending") {
    return cannedStreamResponse(
      "This document is still being processed. Chat will be available once extraction completes."
    )
  }
  if (doc.status === "error") {
    return cannedStreamResponse(
      "Extraction failed for this document, so there's no data to chat about. Reprocess the document and try again."
    )
  }
  if (!doc.results || Object.keys(doc.results).length === 0) {
    return cannedStreamResponse(
      "No data was extracted from this document. There's nothing to chat about yet — try reprocessing or updating your parser fields."
    )
  }

  // Build the system prompt + tools (tools are bound to this document's data)
  const systemPrompt = buildChatSystemPrompt(parser, doc)
  // For full_content parsers (e.g. handwriting bridge) the document is plain text,
  // not a structured JSON — query_extracted_data has nothing meaningful to query.
  // We still expose `calculate` so totaling expense lists / quizzing math works.
  const tools: ToolSet =
    parser.extraction_type === "full_content"
      ? { calculate: calculateTool }
      : {
          calculate: calculateTool,
          query_extracted_data: createQueryExtractedDataTool(
            doc.results as Record<string, unknown>
          ),
        }

  const modelId =
    process.env.OPENROUTER_CHAT_MODEL || DEFAULT_CHAT_MODEL
  const startedAt = Date.now()

  try {
    const result = streamText({
      model: openrouter(modelId),
      system: systemPrompt,
      messages: await convertToModelMessages(uiMessages),
      tools,
      stopWhen: stepCountIs(MAX_TOOL_STEPS),
      temperature: 0.2,
      onFinish({ usage, steps }) {
        // `steps` is the full tool-loop trace. Count executed tool calls
        // across all steps for analytics parity with the old implementation.
        const toolCalls = steps.flatMap((s) => s.toolCalls ?? [])
        trackServerEvent("chat_message_sent", {
          distinct_id: user.id,
          user_id: user.id,
          parser_id: parser.id,
          document_id: doc.id,
          tool_calls: toolCalls.length,
          tool_names: toolCalls.map((t) => t.toolName),
          latency_ms: Date.now() - startedAt,
          input_tokens: usage.inputTokens ?? 0,
          output_tokens: usage.outputTokens ?? 0,
        })
      },
      onError({ error }) {
        // Errors inside streamText (LLM failure, tool execution throw) are
        // surfaced to the client via the UI message stream as error parts;
        // we still want them in our incident reporter for visibility.
        reportError(error, {
          route: "/api/parsers/[parserId]/chat",
          method: "POST",
          userId: user.id,
          extra: { parserId: parser.id, documentId: doc.id, stage: "stream" },
        })
      },
    })

    // SSE response. Vercel streams this through until the LLM is done or the
    // stop condition trips.
    return result.toUIMessageStreamResponse()
  } catch (err) {
    // Synchronous throws (auth against OpenRouter, bad config) land here.
    // Streaming-time errors are handled by onError above.
    reportError(err, {
      route: "/api/parsers/[parserId]/chat",
      method: "POST",
      userId: user.id,
      extra: { parserId: parser.id, documentId: doc.id, stage: "init" },
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

/**
 * Render a fixed string as a one-shot assistant message over the UI message
 * stream protocol. Used for blocked doc states (processing/error/no results)
 * where running the model would be wasteful.
 */
function cannedStreamResponse(text: string): Response {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const id = crypto.randomUUID()
      writer.write({ type: "text-start", id })
      writer.write({ type: "text-delta", id, delta: text })
      writer.write({ type: "text-end", id })
    },
  })
  return createUIMessageStreamResponse({ stream })
}
