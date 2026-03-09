import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { getTemplateById } from "@/lib/parser-templates"
import { generateInboundEmail } from "@/lib/extractor/inbound-email"

export const runtime = "nodejs"

// POST /api/parsers/from-template — create a parser from a predefined template
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { templateId } = body

  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 })
  }

  const template = getTemplateById(templateId)
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }

  // Check parser limit
  const { count } = await supabase
    .from("parsers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "archived")

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
      name: template.name,
      description: template.description,
      fields: template.buildFields(),
      extraction_mode: "ai",
      inbound_email: generateInboundEmail(template.name),
      inbound_webhook_token: webhookToken,
    })
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ parser: data }, { status: 201 })
}
