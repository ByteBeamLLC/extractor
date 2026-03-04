import type { SchemaField } from "@/lib/schema"

export interface Parser {
  id: string
  user_id: string
  name: string
  description: string | null
  fields: SchemaField[]
  extraction_mode: "ai" | "template" | "hybrid"
  extraction_prompt_override: string | null
  inbound_email: string | null
  inbound_webhook_token: string | null
  status: "active" | "paused" | "archived"
  document_count: number
  last_processed_at: string | null
  created_at: string
  updated_at: string
}

export interface ParserIntegration {
  id: string
  parser_id: string
  user_id: string
  type: IntegrationType
  name: string
  config: Record<string, any>
  is_active: boolean
  last_triggered_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export type IntegrationType =
  | "webhook"
  | "google_sheets"
  | "zapier"
  | "make"
  | "power_automate"
  | "email_notification"
  | "gmail_inbox"

export interface WebhookConfig {
  url: string
  method?: "POST" | "PUT"
  headers?: Record<string, string>
  auth_type?: "none" | "bearer" | "basic"
  auth_token?: string
  retry_count?: number
}

export interface GoogleSheetsConfig {
  feed_url_token: string
}

export interface ZapierMakeConfig {
  webhook_url: string
}

export interface GmailInboxConfig {
  access_token: string
  refresh_token: string
  token_expiry: string
  gmail_address: string
  from_filter: string
  last_history_id: string | null
  last_polled_at: string | null
}

export interface ParserApiKey {
  id: string
  user_id: string
  parser_id: string
  name: string
  key_hash: string
  key_prefix: string
  permissions: string[]
  rate_limit_per_minute: number
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

export interface ProcessedDocument {
  id: string
  parser_id: string
  user_id: string
  source_type: "upload" | "email" | "api" | "webhook" | "zapier" | "gmail"
  file_name: string
  mime_type: string | null
  file_size: number | null
  page_count: number
  status: "pending" | "processing" | "completed" | "error"
  error_message: string | null
  results: Record<string, any> | null
  confidence: Record<string, any> | null
  integration_status: Record<string, any>
  credits_used: number
  processed_at: string | null
  created_at: string
  expires_at: string
}

export interface ExtractorSubscription {
  id: string
  user_id: string
  credits_free: number
  credits_used: number
  credits_reset_at: string
  max_parsers: number
  api_access: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}
