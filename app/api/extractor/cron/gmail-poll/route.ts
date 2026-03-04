import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { pollGmailIntegration } from "@/lib/extractor/gmail/poller"

export const runtime = "nodejs"
export const maxDuration = 300

// GET /api/extractor/cron/gmail-poll
// Called by Vercel Cron every 5 minutes.
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceRoleClient()

  // Fetch all active Gmail integrations
  const { data: integrations, error } = await supabase
    .from("parser_integrations")
    .select("*")
    .eq("type", "gmail_inbox")
    .eq("is_active", true)

  if (error) {
    console.error("[gmail-cron] Failed to fetch integrations:", error)
    return NextResponse.json({ error: "DB error" }, { status: 500 })
  }

  if (!integrations?.length) {
    return NextResponse.json({ processed: 0, message: "No active Gmail integrations" })
  }

  // Poll each integration sequentially (respect Gmail rate limits)
  const results = []
  for (const integration of integrations) {
    try {
      const result = await pollGmailIntegration(integration as any, supabase)
      results.push(result)
    } catch (err) {
      console.error(`[gmail-cron] Failed for integration ${integration.id}:`, err)
      results.push({
        integrationId: integration.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
