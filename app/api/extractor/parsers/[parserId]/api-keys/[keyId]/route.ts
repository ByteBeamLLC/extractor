import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// DELETE /api/extractor/parsers/[parserId]/api-keys/[keyId] — revoke key
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { parserId: string; keyId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("parser_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", params.keyId)
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
