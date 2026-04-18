import type { SchemaField } from "@/lib/schema"

export type ExtractionType = "fields" | "full_content"

export interface Parser {
  id: string
  user_id: string
  name: string
  description: string | null
  fields: SchemaField[]
  extraction_type: ExtractionType
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
  | "google_docs"
  | "zapier"
  | "make"
  | "power_automate"
  | "email_notification"
  | "gmail_inbox"
  | "quickbooks"

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

export interface GoogleDocsConfig {
  access_token: string
  refresh_token: string
  token_expiry: string
  google_email: string
  folder_id: string | null
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

/**
 * Snapshot of a QuickBooks reference list cached at setup time so the mapping UI
 * can render dropdowns without round-tripping to QBO on every render. Refreshed
 * on demand via the QuickBooks reference endpoint.
 */
export interface QuickBooksRef {
  Id: string
  Name: string
}

export interface QuickBooksAccountRef extends QuickBooksRef {
  AccountType?: string
  AccountSubType?: string
  Classification?: string
}

export interface QuickBooksVendorRef extends QuickBooksRef {
  CurrencyRef?: string
}

export interface QuickBooksTaxCodeRef extends QuickBooksRef {
  TaxGroup?: boolean
}

/**
 * QuickBooks Online integration config.
 *
 * Token storage notes:
 *   - access_token expires in 1 hour
 *   - refresh_token rotates roughly every 24h on use; the Nov 2025 policy
 *     change introduced a hard 5-year cap. The orchestrator MUST persist any
 *     new refresh_token returned by Intuit immediately or the next call will
 *     fail with `invalid_grant` and lock the customer out.
 *   - realm_id scopes everything to a single QBO company. A user with multiple
 *     QBO companies must connect each parser separately.
 *
 * Field mapping notes:
 *   - We default to AccountBasedExpenseLineDetail because invoice-extraction
 *     flows almost never have item catalog mappings. Users opt in to
 *     ItemBasedExpenseLineDetail by mapping a parsli field to "line_item".
 *   - Vendor matching: we look up by DisplayName (case-insensitive) at delivery
 *     time. If `auto_create_vendor` is true, we create on miss; otherwise the
 *     delivery is marked failed and surfaces in the UI.
 */
export type QuickBooksTargetEntity = "bill" | "purchase" | "invoice"

export type QuickBooksFieldKey =
  | "vendor_name"
  | "customer_name"
  | "txn_date"
  | "due_date"
  | "doc_number"
  | "memo"
  | "currency"
  | "exchange_rate"
  | "total_amount"
  | "tax_amount"
  | "line_items" // expects an array of { description, amount, quantity?, account?, tax_code? }

export interface QuickBooksFieldMapping {
  // Maps a logical QBO field to the parsli field id (or constant value) that fills it.
  // null means "leave unset / use default_*".
  [qboField: string]: string | null
}

export interface QuickBooksConfig {
  realm_id: string
  access_token: string
  refresh_token: string
  /** ISO timestamp; refreshed in-place on every refresh call. */
  token_expiry: string
  /** ISO timestamp captured the last time we successfully rotated the refresh token. */
  refresh_token_issued_at: string
  environment: "sandbox" | "production"
  company_name: string

  target_entity: QuickBooksTargetEntity

  /** Mapping from QBO field name → parsli field id. */
  field_mapping: QuickBooksFieldMapping

  /** Required for Bill/Purchase if vendor_name is unmapped or unmatched and auto_create is false. */
  default_vendor_id: string | null
  /** Required if no per-line account is mapped. */
  default_account_id: string | null
  /** Optional. For US AST set to "TAX" or "NON"; for non-US locales must be a real TaxCode Id. */
  default_tax_code_id: string | null
  /** Purchase only — the paying account (cash/credit-card/checking). */
  default_payment_account_id: string | null
  /** Purchase only. */
  payment_type: "Cash" | "Check" | "CreditCard" | null

  /** When true, create missing vendors on the fly using the extracted vendor_name. */
  auto_create_vendor: boolean
  /** When true, attach the source document to the created entity via Attachable. */
  attach_source_document: boolean

  /** Cached lookup lists, populated at setup and refreshable from the UI. */
  accounts_snapshot: QuickBooksAccountRef[]
  vendors_snapshot: QuickBooksVendorRef[]
  customers_snapshot: QuickBooksRef[]
  tax_codes_snapshot: QuickBooksTaxCodeRef[]
  snapshot_refreshed_at: string | null
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
  // Waterfall enrichments: IDs of fields currently being enriched
  enriching_fields: string[] | null
}

export interface ExtractorSubscription {
  id: string
  user_id: string
  tier: "anonymous" | "free" | "starter" | "growth" | "pro" | "business"
  credits_free: number
  credits_used: number
  credits_reset_at: string
  max_parsers: number
  api_access: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  notification_email_enabled: boolean
  notification_push_enabled: boolean
  timezone: string
  created_at: string
  updated_at: string
}
