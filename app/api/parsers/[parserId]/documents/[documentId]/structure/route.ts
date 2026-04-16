import { NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { withErrorReporting, ApiError } from "@/lib/errorReporting"
import { structureMarkdownForExport } from "@/lib/export/structure"

export const runtime = "nodejs"
// Large documents structured via Anthropic Haiku can take ≫ 30 s end-to-end.
// Fluid Compute's 300 s default is available across Hobby/Pro/Enterprise, so
// aligning here is plan-agnostic and eliminates FUNCTION_INVOCATION_TIMEOUT
// 504s that the OpenRouter client's internal deadline-aware retry loop is
// otherwise powerless to prevent. (ai-sdk.dev/docs/troubleshooting/timeout-on-vercel)
export const maxDuration = 300

// Safety buffer subtracted from maxDuration when computing the upstream
// deadline. Mirrors the pattern already used in the chat route (5 s) and is
// the gRPC "recalc remaining time between hops" idiom scaled for Vercel's
// response-serialization overhead.
const DEADLINE_BUFFER_MS = 5_000

export const POST = withErrorReporting(
  "/api/parsers/[parserId]/documents/[documentId]/structure",
  async (
    _request: Request,
    { params }: { params: { parserId: string; documentId: string } },
  ) => {
    const startedAt = Date.now()
    const supabase = createSupabaseServerComponentClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new ApiError(401, "unauthorized", "Unauthorized")
    }

    // Fetch the document
    const { data: doc, error: docError } = await supabase
      .from("parser_processed_documents" as any)
      .select("id, results, status")
      .eq("id", params.documentId)
      .eq("parser_id", params.parserId)
      .eq("user_id", user.id)
      .single()

    if (docError || !doc) {
      throw new ApiError(404, "not_found", "Document not found")
    }

    if (doc.status !== "completed" || !doc.results) {
      throw new ApiError(400, "not_ready", "Document has not been processed yet")
    }

    // Return cached structured_export if it exists
    if (doc.results.structured_export) {
      return NextResponse.json(doc.results.structured_export)
    }

    const markdown =
      typeof doc.results.markdown === "string" ? doc.results.markdown : ""

    if (!markdown.trim()) {
      const empty = { sheets: [{ name: "Data", headers: ["Content"], rows: [] }] }
      return NextResponse.json(empty)
    }

    // Call LLM to structure the markdown. Propagate a deadline so the
    // upstream call fails fast (and retries respect the budget) instead of
    // outliving the serverless function and producing a 504.
    const deadlineMs = startedAt + maxDuration * 1000 - DEADLINE_BUFFER_MS
    const structured = await structureMarkdownForExport(markdown, {
      deadlineMs,
    })

    // Cache in the document's results for future requests
    await supabase
      .from("parser_processed_documents" as any)
      .update({
        results: { ...doc.results, structured_export: structured },
      })
      .eq("id", params.documentId)

    return NextResponse.json(structured)
  },
)
