import { type NextRequest, NextResponse } from "next/server"
import { buildGoogleAuthUrl } from "@/lib/auth/google-oauth"

export const runtime = "nodejs"
export const maxDuration = 30

// GET /api/auth/google/connect?next=/dashboard
// Redirects user to Google OAuth consent screen.
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") || "/dashboard"
  const origin = request.nextUrl.origin
  const redirectUri = `${origin}/api/auth/google/callback`

  const state = Buffer.from(JSON.stringify({ next })).toString("base64url")
  const authUrl = buildGoogleAuthUrl(redirectUri, state)

  return NextResponse.redirect(authUrl)
}
