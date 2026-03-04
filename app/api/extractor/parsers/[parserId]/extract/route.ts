import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { runExtraction } from "@/lib/extraction/runExtraction"
import type { SchemaField } from "@/lib/schema"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"

export const runtime = "nodejs"

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

  // Load parser
  const { data: parser, error: parserError } = await supabase
    .from("parsers" as any)
    .select("*")
    .eq("id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (parserError || !parser) {
    return NextResponse.json({ error: "Parser not found" }, { status: 404 })
  }

  const p = parser as any

  if (p.status !== "active") {
    return NextResponse.json({ error: "Parser is paused" }, { status: 400 })
  }

  const schemaTree: SchemaField[] = p.fields ?? []
  if (schemaTree.length === 0) {
    return NextResponse.json(
      { error: "Parser has no fields defined. Add fields in the Schema tab." },
      { status: 400 }
    )
  }

  // Parse request body
  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const fileData = body.file as {
    name?: string
    type?: string
    data?: string
    size?: number
  } | undefined

  if (!fileData?.data) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const sourceType = (body.source_type ?? "upload") as string

  // Check credits
  const { data: sub } = await supabase
    .from("extractor_subscriptions" as any)
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  const s = sub as any
  if (s) {
    if (new Date(s.credits_reset_at) < new Date()) {
      await supabase
        .from("extractor_subscriptions" as any)
        .update({
          credits_used: 0,
          credits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as any)
        .eq("id", s.id)
      s.credits_used = 0
    }

    if (s.credits_used >= s.credits_free) {
      return NextResponse.json(
        { error: "Monthly credit limit reached. Upgrade your plan for more pages." },
        { status: 402 }
      )
    }
  }

  // Create processing log entry
  const { data: processedDoc } = await supabase
    .from("parser_processed_documents" as any)
    .insert({
      parser_id: p.id,
      user_id: user.id,
      source_type: sourceType,
      file_name: fileData.name ?? "uploaded",
      mime_type: fileData.type,
      file_size: fileData.size,
      status: "processing",
    } as any)
    .select("id")
    .single()

  const docId = (processedDoc as any)?.id

  // Run extraction using the SAME shared logic as the main app
  const extractionResult = await runExtraction({
    fileData: fileData.data,
    fileName: fileData.name ?? "uploaded",
    mimeType: fileData.type ?? "",
    schemaTree,
    extractionPromptOverride: p.extraction_prompt_override,
  })

  // Deduct credits
  const creditsUsed = 1
  if (s) {
    await supabase
      .from("extractor_subscriptions" as any)
      .update({ credits_used: (s.credits_used ?? 0) + creditsUsed } as any)
      .eq("id", s.id)
  }

  // Update processing log
  if (docId) {
    await supabase
      .from("parser_processed_documents" as any)
      .update({
        status: extractionResult.handledWithFallback && extractionResult.error ? "error" : "completed",
        results: extractionResult.results,
        processed_at: new Date().toISOString(),
        credits_used: creditsUsed,
        error_message: extractionResult.error ?? null,
      } as any)
      .eq("id", docId)
  }

  // Increment parser document count
  await supabase
    .from("parsers" as any)
    .update({
      document_count: (p.document_count ?? 0) + 1,
      last_processed_at: new Date().toISOString(),
    } as any)
    .eq("id", p.id)

  // Deliver to integrations (fire-and-forget)
  if (docId) {
    deliverToIntegrations(
      p.id,
      p.name,
      docId,
      extractionResult.results,
      { file_name: fileData.name ?? "uploaded", mime_type: fileData.type ?? "", source_type: sourceType, page_count: 1 },
      supabase as any
    ).catch((err) => console.error("[extractor] Integration delivery failed:", err))
  }

  return NextResponse.json({
    success: extractionResult.success,
    results: extractionResult.results,
    warnings: extractionResult.warnings,
    handledWithFallback: extractionResult.handledWithFallback,
    document_id: docId,
  })
}
