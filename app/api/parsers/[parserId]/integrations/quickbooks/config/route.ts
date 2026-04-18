import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import type { QuickBooksConfig } from "@/lib/extractor/types"

export const runtime = "nodejs"
export const maxDuration = 30

// PATCH /api/parsers/[parserId]/integrations/quickbooks/config
// Body: subset of QuickBooksConfig (target_entity, defaults, field_mapping, etc.)
//
// Updates the user-controlled fields of the QBO integration config. Token
// fields (access_token, refresh_token, realm_id, environment) are never
// accepted from the client — those are owned by the OAuth flow.
const ALLOWED_KEYS: ReadonlyArray<keyof QuickBooksConfig> = [
  "target_entity",
  "field_mapping",
  "default_vendor_id",
  "default_account_id",
  "default_tax_code_id",
  "default_payment_account_id",
  "payment_type",
  "auto_create_vendor",
  "attach_source_document",
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: integration, error } = await supabase
    .from("parser_integrations")
    .select("id, user_id, type, config")
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .eq("type", "quickbooks")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!integration) {
    return NextResponse.json({ error: "QuickBooks integration not found" }, { status: 404 })
  }

  let body: Partial<QuickBooksConfig>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const current = (integration as any).config as QuickBooksConfig
  const next: QuickBooksConfig = { ...current }

  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      ;(next as any)[key] = (body as any)[key]
    }
  }

  // Sanity: reject configs that won't deliver. The setup UI enforces these
  // already but we double-check server-side.
  if ((next.target_entity === "bill" || next.target_entity === "purchase") && !next.default_account_id) {
    return NextResponse.json({ error: "default_account_id is required for Bill / Purchase" }, { status: 400 })
  }
  if (next.target_entity === "purchase") {
    if (!next.default_payment_account_id || !next.payment_type) {
      return NextResponse.json(
        { error: "default_payment_account_id and payment_type are required for Purchase" },
        { status: 400 }
      )
    }
  }

  const { error: updateError } = await supabase
    .from("parser_integrations")
    .update({ config: next, updated_at: new Date().toISOString() })
    .eq("id", (integration as any).id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
