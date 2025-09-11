import { NextResponse } from "next/server"

export async function GET() {
  const hasGoogleApiKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY

  return NextResponse.json({
    hasGoogleApiKey,
    message: hasGoogleApiKey ? "Setup complete" : "Google API key required",
  })
}
