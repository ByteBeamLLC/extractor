import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { exchangeCodeForTokens } from "@/lib/extractor/google-docs/oauth"
import type { GoogleDocsConfig } from "@/lib/extractor/types"

export const runtime = "nodejs"

export const maxDuration = 60

// GET /api/auth/google-docs/callback?code=...&state=...
// Google redirects here after user grants Drive consent.
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
  const redirectBase = `${request.nextUrl.origin}/parsers/${parserId}/export`

  if (error || !code) {
    return NextResponse.redirect(`${redirectBase}?googleDocsError=${error ?? "access_denied"}`)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    const supabase = createSupabaseServiceRoleClient()

    // Verify parser belongs to user
    const { data: parser } = await supabase
      .from("parsers")
      .select("id")
      .eq("id", parserId)
      .eq("user_id", userId)
      .single()

    if (!parser) {
      return NextResponse.redirect(`${redirectBase}?googleDocsError=unauthorized`)
    }

    // Check if a Google Docs integration already exists
    const { data: existing } = await supabase
      .from("parser_integrations")
      .select("id, config")
      .eq("parser_id", parserId)
      .eq("type", "google_docs")
      .single()

    const config: GoogleDocsConfig = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date).toISOString(),
      google_email: tokens.email,
      folder_id: (existing as any)?.config?.folder_id ?? null,
    }

    if (existing) {
      await supabase
        .from("parser_integrations")
        .update({
          config,
          is_active: true,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (existing as any).id)
    } else {
      await supabase
        .from("parser_integrations")
        .insert({
          parser_id: parserId,
          user_id: userId,
          type: "google_docs",
          name: `Google Docs (${tokens.email})`,
          config,
          is_active: true,
        })
    }

    return NextResponse.redirect(`${redirectBase}?googleDocsConnected=true`)
  } catch (err) {
    console.error("[google-docs-callback] Error:", err)
    return NextResponse.redirect(`${redirectBase}?googleDocsError=token_exchange_failed`)
  }
}
