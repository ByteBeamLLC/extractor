import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  IntegrationDeliveryStatus,
  DocumentProcessedEvent,
} from "./types"
import type { ParserIntegration, WebhookConfig, ZapierMakeConfig } from "@/lib/extractor/types"
import { deliverWebhook } from "./webhookDelivery"

/**
 * Delivers extraction results to all active integrations for a parser.
 * Called after every successful extraction.
 */
export async function deliverToIntegrations(
  parserId: string,
  parserName: string,
  documentId: string,
  results: Record<string, any>,
  metadata: {
    file_name: string
    mime_type?: string
    source_type: string
    page_count: number
  },
  supabase: SupabaseClient
): Promise<Record<string, IntegrationDeliveryStatus>> {
  // Fetch active integrations
  const { data: integrations, error } = await supabase
    .from("parser_integrations")
    .select("*")
    .eq("parser_id", parserId)
    .eq("is_active", true)

  if (error || !integrations?.length) {
    return {}
  }

  // Strip __meta__ from results for delivery
  const { __meta__, ...cleanResults } = results

  const event: DocumentProcessedEvent = {
    event: "document.processed",
    parser_id: parserId,
    parser_name: parserName,
    document_id: documentId,
    timestamp: new Date().toISOString(),
    data: cleanResults,
    metadata,
  }

  const deliveryStatus: Record<string, IntegrationDeliveryStatus> = {}

  for (const integration of integrations) {
    try {
      switch (integration.type) {
        case "webhook": {
          const config = integration.config as WebhookConfig
          if (!config.url) {
            deliveryStatus[integration.id] = { status: "skipped", error: "No URL configured" }
            break
          }
          const result = await deliverWebhook(config.url, event, config)
          deliveryStatus[integration.id] = {
            status: result.success ? "delivered" : "failed",
            delivered_at: result.delivered_at,
            error: result.error,
          }
          break
        }

        case "zapier":
        case "make":
        case "power_automate": {
          const config = integration.config as ZapierMakeConfig
          if (!config.webhook_url) {
            deliveryStatus[integration.id] = { status: "skipped", error: "No webhook URL configured" }
            break
          }
          const result = await deliverWebhook(config.webhook_url, event)
          deliveryStatus[integration.id] = {
            status: result.success ? "delivered" : "failed",
            delivered_at: result.delivered_at,
            error: result.error,
          }
          break
        }

        case "google_sheets":
          // Google Sheets is pull-based (IMPORTDATA), no delivery needed
          deliveryStatus[integration.id] = { status: "skipped" }
          break

        default:
          deliveryStatus[integration.id] = { status: "skipped", error: "Unknown type" }
      }

      // Update integration last triggered
      if (deliveryStatus[integration.id]?.status === "delivered") {
        await supabase
          .from("parser_integrations")
          .update({
            last_triggered_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", integration.id)
      } else if (deliveryStatus[integration.id]?.status === "failed") {
        await supabase
          .from("parser_integrations")
          .update({
            last_error: deliveryStatus[integration.id].error ?? "Delivery failed",
          })
          .eq("id", integration.id)
      }
    } catch (err) {
      deliveryStatus[integration.id] = {
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      }
    }
  }

  // Update processed document with delivery status
  if (documentId) {
    await supabase
      .from("parser_processed_documents")
      .update({ integration_status: deliveryStatus })
      .eq("id", documentId)
  }

  return deliveryStatus
}
