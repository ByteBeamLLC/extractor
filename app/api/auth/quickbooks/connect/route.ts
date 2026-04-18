import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { buildQuickBooksAuthUrl } from "@/lib/extractor/quickbooks/oauth"
import { QBO_NO_CACHE_HEADERS } from "@/lib/extractor/quickbooks/httpHeaders"

export const runtime = "nodejs"
export const maxDuration = 30

// GET /api/auth/quickbooks/connect?parserId=xxx
// Sends the user to Intuit's OAuth consent screen. The state param carries
// the parserId + userId so the callback can attribute the new tokens.
export async function GET(request: NextRequest) {
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

  const parserId = request.nextUrl.searchParams.get("parserId")
  if (!parserId) {
    return NextResponse.json(
      { error: "parserId required" },
      { status: 400, headers: QBO_NO_CACHE_HEADERS }
    )
  }

  const { data: parser } = await supabase
    .from("parsers" as any)
    .select("id")
    .eq("id", parserId)
    .eq("user_id", user.id)
    .single()

  if (!parser) {
    return NextResponse.json(
      { error: "Parser not found" },
      { status: 404, headers: QBO_NO_CACHE_HEADERS }
    )
  }

  const state = Buffer.from(
    JSON.stringify({
      parserId,
      userId: user.id,
      nonce: crypto.randomUUID(),
    })
  ).toString("base64url")

  return NextResponse.redirect(buildQuickBooksAuthUrl(state), {
    headers: QBO_NO_CACHE_HEADERS,
  })
}
