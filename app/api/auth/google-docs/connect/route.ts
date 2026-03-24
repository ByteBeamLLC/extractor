import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { buildGoogleDocsAuthUrl } from "@/lib/extractor/google-docs/oauth"

export const runtime = "nodejs"

// GET /api/auth/google-docs/connect?parserId=xxx
// Redirects user to Google's OAuth consent screen for Drive access.
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parserId = request.nextUrl.searchParams.get("parserId")
  if (!parserId) {
    return NextResponse.json({ error: "parserId required" }, { status: 400 })
  }

  // Verify parser ownership
  const { data: parser } = await supabase
    .from("parsers" as any)
    .select("id")
    .eq("id", parserId)
    .eq("user_id", user.id)
    .single()

  if (!parser) {
    return NextResponse.json({ error: "Parser not found" }, { status: 404 })
  }

  const state = Buffer.from(
    JSON.stringify({
      parserId,
      userId: user.id,
      nonce: crypto.randomUUID(),
    })
  ).toString("base64url")

  const authUrl = buildGoogleDocsAuthUrl(state)
  return NextResponse.redirect(authUrl)
}
