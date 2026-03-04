import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// GET /api/extractor/parsers/[parserId]
export async function GET(
  _request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("parsers")
    .select("*")
    .eq("id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Parser not found" }, { status: 404 })
  }

  return NextResponse.json({ parser: data })
}

// PATCH /api/extractor/parsers/[parserId]
export async function PATCH(
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

  const body = await request.json()
  const allowedFields = [
    "name",
    "description",
    "fields",
    "extraction_mode",
    "extraction_prompt_override",
    "status",
  ]

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  const { data, error } = await supabase
    .from("parsers")
    .update(updates)
    .eq("id", params.parserId)
    .eq("user_id", user.id)
    .select("*")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Parser not found" }, { status: 404 })
  }

  return NextResponse.json({ parser: data })
}

// DELETE /api/extractor/parsers/[parserId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("parsers")
    .delete()
    .eq("id", params.parserId)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
