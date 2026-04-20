import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { revokeToken } from "@/lib/extractor/quickbooks/oauth"
import { decryptTokenOrLegacy } from "@/lib/extractor/quickbooks/tokenCrypto"
import { QBO_NO_CACHE_HEADERS } from "@/lib/extractor/quickbooks/httpHeaders"
import type { QuickBooksConfig } from "@/lib/extractor/types"

export const runtime = "nodejs"
export const maxDuration = 30

// POST /api/auth/quickbooks/disconnect
// Body: { integrationId: string }
//
// Revokes the refresh token at Intuit (which invalidates the entire grant)
// then deletes the integration row. Both steps are best-effort — even if the
// Intuit revoke call fails we remove the integration locally so the customer
// is no longer charged for stale connections.
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: QBO_NO_CACHE_HEADERS }
    )
  }

  let body: { integrationId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: QBO_NO_CACHE_HEADERS }
    )
  }

  if (!body.integrationId) {
    return NextResponse.json(
      { error: "integrationId required" },
      { status: 400, headers: QBO_NO_CACHE_HEADERS }
    )
  }

  const { data: integration, error } = await supabase
    .from("parser_integrations")
    .select("id, user_id, type, config")
    .eq("id", body.integrationId)
    .eq("user_id", user.id)
    .single()

  if (error || !integration) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 404, headers: QBO_NO_CACHE_HEADERS }
    )
  }
  if ((integration as any).type !== "quickbooks") {
    return NextResponse.json(
      { error: "Not a QuickBooks integration" },
      { status: 400, headers: QBO_NO_CACHE_HEADERS }
    )
  }

  const config = (integration as any).config as QuickBooksConfig
  if (config?.refresh_token) {
    try {
      // Stored refresh_token is AES-encrypted; Intuit's revoke endpoint needs
      // the plaintext. decryptTokenOrLegacy also handles the (rare) case of
      // a legacy plaintext row created before encryption was deployed.
      const plaintextRefresh = decryptTokenOrLegacy(config.refresh_token)
      await revokeToken(plaintextRefresh)
    } catch (err) {
      console.warn("[qbo-disconnect] Revoke failed (continuing):", err)
    }
  }

  await supabase.from("parser_integrations").delete().eq("id", (integration as any).id)
  return NextResponse.json({ ok: true }, { headers: QBO_NO_CACHE_HEADERS })
}
