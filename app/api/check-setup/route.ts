import { NextResponse } from "next/server"
import { isOpenRouterConfigured } from "@/lib/openrouter"

export async function GET() {
  const isConfigured = isOpenRouterConfigured()

  return NextResponse.json({
    isConfigured,
    hasOpenRouterApiKey: !!process.env.OPENROUTER_API_KEY,
    hasOpenRouterModel: !!process.env.OPENROUTER_MODEL,
    message: isConfigured ? "OpenRouter setup complete" : "OpenRouter API key and model required",
  })
}
