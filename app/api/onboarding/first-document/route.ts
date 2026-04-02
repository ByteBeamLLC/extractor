import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { generateInboundEmail } from "@/lib/extractor/inbound-email"
import { trackServerEvent } from "@/lib/analytics/server"

export const runtime = "nodejs"
export const maxDuration = 30

/**
 * POST /api/onboarding/first-document
 *
 * Creates a parser for first-time users. The actual extraction is handled
 * separately by POST /api/parsers/[parserId]/extract, which the client
 * calls after this endpoint returns.
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Guard: only for users with 0 parsers
  const { count: parserCount } = await supabase
    .from("parsers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "archived")

  if ((parserCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "This endpoint is for first-time users only." },
      { status: 400 }
    )
  }

  const parserName = "My Parser"
  const webhookToken = crypto.randomUUID().replace(/-/g, "")

  const { data: parser, error: parserError } = await supabase
    .from("parsers" as any)
    .insert({
      user_id: user.id,
      name: parserName,
      description: null,
      fields: [],
      extraction_type: "full_content",
      extraction_mode: "ai",
      inbound_email: generateInboundEmail(parserName),
      inbound_webhook_token: webhookToken,
    } as any)
    .select("id")
    .single()

  if (parserError || !parser) {
    return NextResponse.json(
      { error: "Failed to create parser" },
      { status: 500 }
    )
  }

  const parserId = (parser as any).id

  trackServerEvent("parser_created", {
    distinct_id: user.id,
    user_id: user.id,
    parser_id: parserId,
    parser_name: parserName,
    extraction_type: "full_content",
    has_template: false,
    is_first_parser: true,
  })

  return NextResponse.json({
    success: true,
    parser_id: parserId,
  })
}
