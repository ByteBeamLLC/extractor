import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { exchangeCodeForTokens } from "@/lib/extractor/gmail/oauth"
import type { GmailInboxConfig } from "@/lib/extractor/types"

export const runtime = "nodejs"

// GET /api/extractor/auth/gmail/callback?code=...&state=...
// Google redirects here after user grants consent.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const stateRaw = searchParams.get("state")
  const error = searchParams.get("error")

  if (!stateRaw) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 })
  }

  let state: { parserId: string; userId: string }
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64url").toString())
  } catch {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 })
  }

  const { parserId, userId } = state
  const redirectBase = `${request.nextUrl.origin}/extractor/parsers/${parserId}?tab=integrations`

  if (error || !code) {
    return NextResponse.redirect(`${redirectBase}&gmailError=${error ?? "access_denied"}`)
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Use service role (callback may not carry user session)
    const supabase = createSupabaseServiceRoleClient()

    // Verify parser belongs to user from state
    const { data: parser } = await supabase
      .from("parsers")
      .select("id")
      .eq("id", parserId)
      .eq("user_id", userId)
      .single()

    if (!parser) {
      return NextResponse.redirect(`${redirectBase}&gmailError=unauthorized`)
    }

    // Check if a Gmail integration already exists for this parser
    const { data: existing } = await supabase
      .from("parser_integrations")
      .select("id, config")
      .eq("parser_id", parserId)
      .eq("type", "gmail_inbox")
      .single()

    const config: GmailInboxConfig = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date).toISOString(),
      gmail_address: tokens.email,
      from_filter: (existing as any)?.config?.from_filter ?? "",
      last_history_id: null,
      last_polled_at: null,
    }

    if (existing) {
      // Re-auth: update tokens, keep existing from_filter
      await supabase
        .from("parser_integrations")
        .update({
          config,
          is_active: !!(existing as any)?.config?.from_filter,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (existing as any).id)
    } else {
      // Create new integration (inactive until user sets from_filter)
      await supabase
        .from("parser_integrations")
        .insert({
          parser_id: parserId,
          user_id: userId,
          type: "gmail_inbox",
          name: `Gmail (${tokens.email})`,
          config,
          is_active: false,
        })
    }

    return NextResponse.redirect(`${redirectBase}&gmailConnected=true`)
  } catch (err) {
    console.error("[gmail-callback] Error:", err)
    return NextResponse.redirect(`${redirectBase}&gmailError=token_exchange_failed`)
  }
}
