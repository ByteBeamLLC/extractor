import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { deliverWebhook } from "@/lib/extractor/integrations/webhookDelivery"
import type { DocumentProcessedEvent } from "@/lib/extractor/integrations/types"

export const runtime = "nodejs"

// POST /api/extractor/parsers/[parserId]/integrations/[integrationId]/test
export async function POST(
  _request: NextRequest,
  { params }: { params: { parserId: string; integrationId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: integration } = await supabase
    .from("parser_integrations")
    .select("*, parsers(name)")
    .eq("id", params.integrationId)
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .single()

  if (!integration) return NextResponse.json({ error: "Integration not found" }, { status: 404 })

  // Build sample payload
  const sampleEvent: DocumentProcessedEvent = {
    event: "document.processed",
    parser_id: params.parserId,
    parser_name: (integration as any).parsers?.name ?? "Test Parser",
    document_id: "test-" + Date.now(),
    timestamp: new Date().toISOString(),
    data: {
      sample_field: "This is a test extraction result",
      test_number: 42,
      test_date: new Date().toISOString().split("T")[0],
    },
    metadata: {
      file_name: "test-document.pdf",
      mime_type: "application/pdf",
      source_type: "upload",
      page_count: 1,
    },
  }

  const url =
    integration.type === "webhook"
      ? integration.config?.url
      : integration.config?.webhook_url

  if (!url) {
    return NextResponse.json({ error: "No URL configured" }, { status: 400 })
  }

  const result = await deliverWebhook(url, sampleEvent, integration.config)

  return NextResponse.json({
    success: result.success,
    status: result.status,
    error: result.error,
  })
}
