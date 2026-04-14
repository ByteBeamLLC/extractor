import { NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { withErrorReporting, ApiError } from "@/lib/errorReporting"
import { structureMarkdownForExport } from "@/lib/export/structure"

export const runtime = "nodejs"
export const maxDuration = 30

export const POST = withErrorReporting(
  "/api/parsers/[parserId]/documents/[documentId]/structure",
  async (
    _request: Request,
    { params }: { params: { parserId: string; documentId: string } },
  ) => {
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

    // Call LLM to structure the markdown
    const structured = await structureMarkdownForExport(markdown)

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
