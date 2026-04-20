import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  IntegrationDeliveryStatus,
  DocumentProcessedEvent,
} from "./types"
import type {
  ParserIntegration,
  WebhookConfig,
  ZapierMakeConfig,
  GoogleDocsConfig,
  QuickBooksConfig,
} from "@/lib/extractor/types"
import { deliverWebhook } from "./webhookDelivery"
import { createGoogleDoc } from "@/lib/extractor/google-docs/create-doc"
import { deliverToQuickBooks } from "@/lib/extractor/quickbooks/deliver"

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

  console.log(
    `[orchestrator] parser=${parserId} doc=${documentId} found=${integrations?.length ?? 0} integrations err=${error?.message ?? "none"}`
  )

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

        case "google_docs": {
          const gdConfig = integration.config as GoogleDocsConfig
          if (!gdConfig.access_token || !gdConfig.refresh_token) {
            deliveryStatus[integration.id] = { status: "skipped", error: "Not connected" }
            break
          }
          const docResult = await createGoogleDoc(
            gdConfig,
            {
              results,
              fileName: metadata.file_name,
              parserName,
              processedAt: event.timestamp,
              folderId: gdConfig.folder_id,
            },
            integration.id,
            supabase
          )
          deliveryStatus[integration.id] = {
            status: "delivered",
            delivered_at: new Date().toISOString(),
            doc_url: docResult.docUrl,
          }
          break
        }

        case "gmail_inbox":
          // Input integration — no outbound delivery needed
          deliveryStatus[integration.id] = { status: "skipped" }
          break

        case "quickbooks": {
          console.log(`[orchestrator] qbo delivery starting for integration=${integration.id} doc=${documentId}`)
          const qbConfig = integration.config as QuickBooksConfig
          const result = await deliverToQuickBooks({
            config: qbConfig,
            integrationId: integration.id,
            parserId,
            documentId,
            results: cleanResults,
            metadata: {
              file_name: metadata.file_name,
              mime_type: metadata.mime_type,
            },
            supabase,
          })
          console.log(
            `[orchestrator] qbo result: ${result.status}${result.error ? ` error="${result.error}"` : ""}${result.qbo_entity_id ? ` entity=${result.qbo_entity_id}` : ""}`
          )
          deliveryStatus[integration.id] = {
            status: result.status,
            delivered_at: result.delivered_at,
            error: result.error ?? null,
            // Re-use doc_url slot for the QBO entity URL so existing UI surfaces it.
            doc_url: result.qbo_entity_url,
            // Persist the QBO identifiers so future reprocesses can dedup.
            // Without these, the dedup check in deliverToQuickBooks has nothing
            // to match against and we'd silently double-post on reprocess.
            qbo_entity_id: result.qbo_entity_id,
            qbo_entity_type: result.qbo_entity_type,
            qbo_entity_url: result.qbo_entity_url,
            qbo_attachable_id: result.attachable_id,
          }
          break
        }

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

  // Merge delivery status into existing integration_status (preserves email_message_id for dedup)
  if (documentId) {
    const { data: existing } = await supabase
      .from("parser_processed_documents")
      .select("integration_status")
      .eq("id", documentId)
      .single()

    const merged = { ...((existing as any)?.integration_status ?? {}), ...deliveryStatus }

    await supabase
      .from("parser_processed_documents")
      .update({ integration_status: merged })
      .eq("id", documentId)
  }

  return deliveryStatus
}
