import type { WebhookDeliveryResult, DocumentProcessedEvent } from "./types"
import type { WebhookConfig } from "@/lib/extractor/types"

export async function deliverWebhook(
  url: string,
  payload: DocumentProcessedEvent,
  config: Partial<WebhookConfig> = {}
): Promise<WebhookDeliveryResult> {
  const method = config.method ?? "POST"
  const retryCount = config.retry_count ?? 3
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Bytebeam-Extractor/1.0",
    ...(config.headers ?? {}),
  }

  // Add auth header
  if (config.auth_type === "bearer" && config.auth_token) {
    headers["Authorization"] = `Bearer ${config.auth_token}`
  } else if (config.auth_type === "basic" && config.auth_token) {
    headers["Authorization"] = `Basic ${config.auth_token}`
  }

  const body = JSON.stringify(payload)

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(30_000),
      })

      if (response.ok) {
        return {
          success: true,
          status: response.status,
          delivered_at: new Date().toISOString(),
        }
      }

      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      // Server errors (5xx) — retry
    } catch (err) {
      if (attempt === retryCount - 1) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Request failed",
        }
      }
    }

    // Exponential backoff between retries
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
  }

  return { success: false, error: "Max retries exceeded" }
}
