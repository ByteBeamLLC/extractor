import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// GET /api/extractor/parsers/[parserId]/activity
export async function GET(
  request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10)
  const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10)

  const { data, error, count } = await supabase
    .from("parser_processed_documents")
    .select("*", { count: "exact" })
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data, total: count })
}
