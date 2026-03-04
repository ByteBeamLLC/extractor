export interface WebhookDeliveryResult {
  success: boolean
  status?: number
  error?: string
  delivered_at?: string
}

export interface IntegrationDeliveryStatus {
  status: "delivered" | "failed" | "skipped"
  delivered_at?: string
  error?: string | null
}

export interface DocumentProcessedEvent {
  event: "document.processed"
  parser_id: string
  parser_name: string
  document_id: string
  timestamp: string
  data: Record<string, any>
  metadata: {
    file_name: string
    mime_type?: string
    source_type: string
    page_count: number
  }
}
