import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"

export const maxDuration = 30

export async function GET(
  _request: NextRequest,
  { params }: { params: { parserId: string; documentId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: doc, error } = await supabase
    .from("parser_processed_documents" as any)
    .select("id, status, results, error_message, processed_at, credits_used")
    .eq("id", params.documentId)
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  return NextResponse.json(doc)
}
