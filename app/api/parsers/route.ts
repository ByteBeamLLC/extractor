import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { generateInboundEmail } from "@/lib/extractor/inbound-email"
import { trackServerEvent } from "@/lib/analytics/server"

export const runtime = "nodejs"
export const maxDuration = 30

// GET /api/parsers — list user's parsers
export async function GET() {
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
    .eq("user_id", user.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ parsers: data })
}

// POST /api/parsers — create a new parser
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, fields, extraction_mode, extraction_prompt_override } = body

  if (!name?.trim() || name.length > 255) {
    return NextResponse.json({ error: "Name is required (max 255 characters)" }, { status: 400 })
  }

  if (description && description.length > 1000) {
    return NextResponse.json({ error: "Description too long (max 1000 characters)" }, { status: 400 })
  }

  if (extraction_prompt_override && extraction_prompt_override.length > 5000) {
    return NextResponse.json({ error: "Prompt override too long (max 5000 characters)" }, { status: 400 })
  }

  // Check parser limit
  const { count } = await supabase
    .from("parsers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "archived")

  // Get subscription to check limits
  const { data: sub } = await supabase
    .from("extractor_subscriptions")
    .select("max_parsers")
    .eq("user_id", user.id)
    .maybeSingle()

  const maxParsers = sub?.max_parsers ?? 5
  if ((count ?? 0) >= maxParsers) {
    return NextResponse.json(
      { error: `Parser limit reached (${maxParsers}). Upgrade to create more.` },
      { status: 403 }
    )
  }

  // Generate unique tokens
  const webhookToken = crypto.randomUUID().replace(/-/g, "")

  const { data, error } = await supabase
    .from("parsers")
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      fields: fields ?? [],
      extraction_mode: extraction_mode ?? "ai",
      extraction_prompt_override: extraction_prompt_override ?? null,
      inbound_email: generateInboundEmail(name),
      inbound_webhook_token: webhookToken,
    })
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Track parser creation (critical activation event)
  trackServerEvent("parser_created", {
    distinct_id: user.id,
    user_id: user.id,
    parser_id: (data as any).id,
    parser_name: (data as any).name,
    extraction_type: (data as any).extraction_mode ?? "ai",
    has_template: !!(fields && fields.length > 0),
    is_first_parser: (count ?? 0) === 0,
  })

  return NextResponse.json({ parser: data }, { status: 201 })
}
