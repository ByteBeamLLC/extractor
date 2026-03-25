import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { trackServerEvent } from "@/lib/analytics/server"

export const runtime = "nodejs"

// GET /api/parsers/[parserId]
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

// PATCH /api/parsers/[parserId]
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

  // Validate input lengths
  if (body.name !== undefined && (!body.name?.trim() || body.name.length > 255)) {
    return NextResponse.json({ error: "Name must be 1-255 characters" }, { status: 400 })
  }
  if (body.description !== undefined && body.description && body.description.length > 1000) {
    return NextResponse.json({ error: "Description too long (max 1000 characters)" }, { status: 400 })
  }
  if (body.extraction_prompt_override !== undefined && body.extraction_prompt_override && body.extraction_prompt_override.length > 5000) {
    return NextResponse.json({ error: "Prompt override too long (max 5000 characters)" }, { status: 400 })
  }

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

  // Track schema saves (fields were updated)
  if ("fields" in body && Array.isArray(body.fields)) {
    trackServerEvent("schema_saved", {
      distinct_id: user.id,
      user_id: user.id,
      parser_id: params.parserId,
      field_count: body.fields.length,
    })
  }

  return NextResponse.json({ parser: data })
}

// DELETE /api/parsers/[parserId]
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
