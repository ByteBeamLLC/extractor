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
  /** Google Docs URL when delivered via google_docs integration */
  doc_url?: string
  /** QBO entity Id (Bill / Purchase / Invoice) — used to dedup retries against
   *  prior deliveries so reprocesses don't create duplicate entities after
   *  QBO's request-id cache window has expired. */
  qbo_entity_id?: string
  qbo_entity_type?: "bill" | "purchase" | "invoice"
  qbo_entity_url?: string
  qbo_attachable_id?: string
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
