import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// PATCH /api/extractor/parsers/[parserId]/integrations/[integrationId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { parserId: string; integrationId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const allowedFields = ["name", "config", "is_active"]
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }

  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from("parser_integrations")
    .update(updates)
    .eq("id", params.integrationId)
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .select("*")
    .single()

  if (error || !data) return NextResponse.json({ error: "Integration not found" }, { status: 404 })
  return NextResponse.json({ integration: data })
}

// DELETE /api/extractor/parsers/[parserId]/integrations/[integrationId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { parserId: string; integrationId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("parser_integrations")
    .delete()
    .eq("id", params.integrationId)
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
