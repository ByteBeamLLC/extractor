import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// GET /api/extractor/parsers/[parserId]/integrations
export async function GET(
  _request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("parser_integrations")
    .select("*")
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ integrations: data })
}

// POST /api/extractor/parsers/[parserId]/integrations
export async function POST(
  request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verify parser ownership
  const { data: parser } = await supabase
    .from("parsers")
    .select("id")
    .eq("id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (!parser) return NextResponse.json({ error: "Parser not found" }, { status: 404 })

  const body = await request.json()
  const { type, name, config } = body

  if (!type || !name) {
    return NextResponse.json({ error: "Type and name are required" }, { status: 400 })
  }

  // For Google Sheets, generate a feed token
  const finalConfig = { ...config }
  if (type === "google_sheets") {
    finalConfig.feed_url_token = crypto.randomUUID().replace(/-/g, "")
  }

  const { data, error } = await supabase
    .from("parser_integrations")
    .insert({
      parser_id: params.parserId,
      user_id: user.id,
      type,
      name,
      config: finalConfig,
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ integration: data }, { status: 201 })
}
