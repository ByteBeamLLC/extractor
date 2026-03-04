import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { generateApiKey } from "@/lib/extractor/auth/apiKeyAuth"

export const runtime = "nodejs"

// GET /api/extractor/parsers/[parserId]/api-keys
export async function GET(
  _request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("parser_api_keys")
    .select("id, name, key_prefix, permissions, last_used_at, expires_at, revoked_at, created_at")
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ keys: data })
}

// POST /api/extractor/parsers/[parserId]/api-keys — create new key
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
  const name = body.name?.trim() ?? "Default"

  const { plainKey, keyHash, keyPrefix } = generateApiKey()

  const { data, error } = await supabase
    .from("parser_api_keys")
    .insert({
      user_id: user.id,
      parser_id: params.parserId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select("id, name, key_prefix, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return the plain key ONLY on creation (it's never stored or shown again)
  return NextResponse.json({
    key: {
      ...data,
      api_key: plainKey, // Only shown once!
    },
  }, { status: 201 })
}
