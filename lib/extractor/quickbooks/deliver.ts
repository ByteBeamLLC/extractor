/**
 * Delivery: take an extracted document's results + the parser_integrations
 * config, and create a Bill / Purchase / Invoice in QuickBooks Online,
 * optionally attaching the source PDF.
 *
 * Idempotency:
 *   - We pass a deterministic RequestId derived from (integration_id,
 *     document_id, target_entity). If the same delivery retries, QBO returns
 *     the cached result instead of double-creating. This is the only safe way
 *     to retry mutating calls against QBO.
 *
 * Vendor / Customer matching:
 *   - We look up by extracted name (case-insensitive). If `auto_create_vendor`
 *     is true and the vendor is missing, we create. Otherwise we fail loudly so
 *     the delivery is not silently routed to the wrong account.
 *
 * Line items:
 *   - Default to AccountBasedExpenseLineDetail with `default_account_id`. If the
 *     extracted line carries an `account` hint that matches an account by name,
 *     we use that instead. Item-based lines are not supported in this first
 *     iteration because the document-extraction use case rarely has clean
 *     item catalog mappings.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  QuickBooksConfig,
  QuickBooksFieldMapping,
  QuickBooksTargetEntity,
} from "@/lib/extractor/types"
import {
  createVendor,
  entityExistsInQbo,
  findVendorByName,
  findCustomerByName,
  getQuickBooksClient,
  QuickBooksApiError,
  type QuickBooksClient,
} from "./client"

const QBO_BUCKET = "parser-documents"

export interface QbDeliveryResult {
  status: "delivered" | "failed" | "skipped"
  delivered_at?: string
  error?: string
  /** QBO entity Id created (Bill / Purchase / Invoice). */
  qbo_entity_id?: string
  qbo_entity_type?: QuickBooksTargetEntity
  /** Direct link the user can open in QBO. */
  qbo_entity_url?: string
  /** Attachable Id if a source doc was attached. */
  attachable_id?: string
}

export interface DeliverToQuickBooksInput {
  config: QuickBooksConfig
  integrationId: string
  parserId: string
  documentId: string
  results: Record<string, unknown>
  metadata: {
    file_name: string
    mime_type?: string
  }
  supabase: SupabaseClient
}

export async function deliverToQuickBooks(
  input: DeliverToQuickBooksInput
): Promise<QbDeliveryResult> {
  const { config, integrationId, documentId } = input

  const requiredCheck = validateConfigForDelivery(config)
  if (requiredCheck) {
    return { status: "skipped", error: requiredCheck }
  }

  let client: QuickBooksClient
  try {
    client = await getQuickBooksClient(config, integrationId, input.supabase)
  } catch (err) {
    return {
      status: "failed",
      error: `Failed to authenticate with QuickBooks: ${errMsg(err)}`,
    }
  }

  // Build mapped fields once — used for vendor lookup and entity construction.
  const mapped = applyFieldMapping(config.field_mapping, input.results)

  try {
    const baseRequestId = deterministicRequestId(integrationId, documentId, config.target_entity)

    // ── Dedup against prior delivery ──
    // QBO's RequestId-based idempotency cache only protects retries within a
    // few hours. For reprocesses outside that window we'd silently create a
    // duplicate Bill/Invoice. Check our own integration_status JSONB for a
    // prior successful delivery; if the entity is still alive in QBO, return
    // the cached result instead of creating again.
    const prior = await loadPriorDelivery(input.supabase, documentId, integrationId)
    if (prior?.qbo_entity_id && prior.qbo_entity_type === config.target_entity) {
      const stillExists = await entityExistsInQbo(
        client,
        config.target_entity,
        prior.qbo_entity_id
      )
      if (stillExists) {
        return {
          status: "delivered",
          delivered_at: prior.delivered_at ?? new Date().toISOString(),
          qbo_entity_id: prior.qbo_entity_id,
          qbo_entity_type: prior.qbo_entity_type,
          qbo_entity_url:
            prior.qbo_entity_url ??
            buildEntityUrl(client.environment, client.realmId, config.target_entity, prior.qbo_entity_id),
          attachable_id: prior.attachable_id,
        }
      }
      // Fall through to create — entity was deleted in QBO since last sync.
    }

    let entityId: string
    switch (config.target_entity) {
      case "bill":
        entityId = await createBill(client, config, mapped, baseRequestId)
        break
      case "purchase":
        entityId = await createPurchase(client, config, mapped, baseRequestId)
        break
      case "invoice":
        entityId = await createInvoice(client, config, mapped, baseRequestId)
        break
      default:
        return { status: "skipped", error: `Unsupported target entity: ${config.target_entity}` }
    }

    let attachableId: string | undefined
    if (config.attach_source_document) {
      try {
        attachableId = await attachSourceDocument(client, input, entityId)
      } catch (err) {
        // Attaching is best-effort. Don't fail the whole delivery if the entity
        // was created successfully — the user can re-upload the doc later.
        console.warn(
          `[qbo-deliver] Entity ${entityId} created but attachment failed:`,
          errMsg(err)
        )
      }
    }

    return {
      status: "delivered",
      delivered_at: new Date().toISOString(),
      qbo_entity_id: entityId,
      qbo_entity_type: config.target_entity,
      qbo_entity_url: buildEntityUrl(client.environment, client.realmId, config.target_entity, entityId),
      attachable_id: attachableId,
    }
  } catch (err) {
    return { status: "failed", error: humanizeError(err) }
  }
}

export function validateConfigForDelivery(config: QuickBooksConfig): string | null {
  if (!config.realm_id || !config.access_token || !config.refresh_token) {
    return "QuickBooks integration not connected"
  }
  if (config.target_entity === "bill" || config.target_entity === "purchase") {
    if (!config.default_account_id) return "No default expense account configured"
  }
  if (config.target_entity === "purchase") {
    if (!config.default_payment_account_id) return "No default payment account configured"
    if (!config.payment_type) return "No payment type configured"
  }
  if (config.target_entity === "invoice" && !config.default_vendor_id && !config.field_mapping.customer_name) {
    return "No customer configured"
  }
  return null
}

// ---------------------------------------------------------------- Field mapping

interface MappedFields {
  vendor_name?: string
  customer_name?: string
  txn_date?: string
  due_date?: string
  doc_number?: string
  memo?: string
  currency?: string
  exchange_rate?: number
  total_amount?: number
  tax_amount?: number
  line_items?: MappedLineItem[]
}

interface MappedLineItem {
  description?: string
  amount: number
  quantity?: number
  account?: string
  tax_code?: string
}

export function applyFieldMapping(
  mapping: QuickBooksFieldMapping,
  results: Record<string, unknown>
): MappedFields {
  const get = (key: string): unknown => {
    const fieldId = mapping[key]
    if (!fieldId) return undefined
    return resolvePath(results, fieldId)
  }

  const lineItemsRaw = get("line_items")
  return {
    vendor_name: toStringOrUndef(get("vendor_name")),
    customer_name: toStringOrUndef(get("customer_name")),
    txn_date: toIsoDateOrUndef(get("txn_date")),
    due_date: toIsoDateOrUndef(get("due_date")),
    doc_number: toStringOrUndef(get("doc_number"), 21), // QBO max is 21 chars
    memo: toStringOrUndef(get("memo"), 4000),
    currency: toCurrencyOrUndef(get("currency")),
    exchange_rate: toNumberOrUndef(get("exchange_rate")),
    total_amount: toNumberOrUndef(get("total_amount")),
    tax_amount: toNumberOrUndef(get("tax_amount")),
    line_items: Array.isArray(lineItemsRaw) ? lineItemsRaw.map(normalizeLineItem) : undefined,
  }
}

export function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  // Supports dot/bracket paths emitted by the parsli schema (e.g. "items[0].total").
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean)
  let cur: unknown = obj
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return cur
}

export function normalizeLineItem(raw: unknown): MappedLineItem {
  if (!raw || typeof raw !== "object") return { amount: 0 }
  const r = raw as Record<string, unknown>
  return {
    // `desc` is a common abbreviation in extracted invoice data — accept it as
    // a fallback alongside the more verbose keys.
    description: toStringOrUndef(r.description ?? r.desc ?? r.name ?? r.item),
    amount:
      toNumberOrUndef(r.amount ?? r.total ?? r.line_total ?? r.subtotal) ??
      toNumberOrUndef(r.price) ??
      0,
    quantity: toNumberOrUndef(r.quantity ?? r.qty),
    account: toStringOrUndef(r.account ?? r.category),
    tax_code: toStringOrUndef(r.tax_code ?? r.taxCode),
  }
}

export function toStringOrUndef(v: unknown, max?: number): string | undefined {
  if (v == null) return undefined
  const s = String(v).trim()
  if (!s) return undefined
  return max && s.length > max ? s.slice(0, max) : s
}

export function toNumberOrUndef(v: unknown): number | undefined {
  if (v == null || v === "") return undefined
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string") {
    const cleaned = v.replace(/[,$€£\s]/g, "")
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

export function toCurrencyOrUndef(v: unknown): string | undefined {
  const s = toStringOrUndef(v)
  if (!s) return undefined
  const code = s.toUpperCase().slice(0, 3)
  return /^[A-Z]{3}$/.test(code) ? code : undefined
}

export function toIsoDateOrUndef(v: unknown): string | undefined {
  const s = toStringOrUndef(v)
  if (!s) return undefined
  // QBO accepts YYYY-MM-DD. Short-circuit the canonical shape to avoid timezone
  // drift entirely.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  const t = Date.parse(s)
  if (!Number.isFinite(t)) return undefined
  const d = new Date(t)

  // Critical for cross-timezone correctness: if the input had no timezone marker
  // (e.g. "April 15, 2026"), JS parses it as LOCAL midnight. Using getUTCDate()
  // would shift the day for any server east of UTC (or get back a different day
  // for inputs west of UTC). For tz-less strings we use the local-component
  // accessors so the day matches what the user typed regardless of server TZ.
  // For tz-aware inputs (Z suffix or ±HH:MM) we use UTC components — the user
  // supplied a precise instant.
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)
  const yyyy = hasTz ? d.getUTCFullYear() : d.getFullYear()
  const mm = String((hasTz ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, "0")
  const dd = String(hasTz ? d.getUTCDate() : d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

// ---------------------------------------------------------------- Entity creators

async function resolveVendorId(
  client: QuickBooksClient,
  config: QuickBooksConfig,
  vendorName: string | undefined,
  requestId: string
): Promise<string> {
  if (vendorName) {
    const existing = await findVendorByName(client, vendorName)
    if (existing) return existing.Id
    if (config.auto_create_vendor) {
      const created = await createVendor(client, vendorName, `${requestId}-vendor`)
      return created.Id
    }
  }
  if (config.default_vendor_id) return config.default_vendor_id
  throw new Error(
    vendorName
      ? `Vendor "${vendorName}" not found in QuickBooks and auto-create is disabled`
      : "No vendor mapped and no default vendor configured"
  )
}

async function resolveCustomerId(
  client: QuickBooksClient,
  config: QuickBooksConfig,
  customerName: string | undefined
): Promise<string> {
  if (customerName) {
    const existing = await findCustomerByName(client, customerName)
    if (existing) return existing.Id
  }
  if (config.default_vendor_id) {
    // For invoices we re-use default_vendor_id slot as default_customer_id to avoid bloating the config schema.
    // The setup UI labels it appropriately.
    return config.default_vendor_id
  }
  throw new Error(
    customerName
      ? `Customer "${customerName}" not found in QuickBooks`
      : "No customer mapped and no default customer configured"
  )
}

function buildExpenseLines(
  config: QuickBooksConfig,
  mapped: MappedFields
): Array<Record<string, unknown>> {
  // Three input shapes, in priority order:
  //   1. line_items array mapped → use as-is
  //   2. only total_amount mapped → synthesize a single line
  //   3. neither → empty array, caller will throw "no line items" so we don't
  //      silently create $0 Bills (which are valid in QBO but useless here and
  //      almost certainly indicate a misconfigured mapping)
  const items: MappedLineItem[] = mapped.line_items?.length
    ? mapped.line_items
    : mapped.total_amount !== undefined
      ? [{ description: mapped.memo, amount: mapped.total_amount }]
      : []

  return items
    .filter((li) => Number.isFinite(li.amount))
    .map((li) => {
      const accountId = resolveAccountIdByName(config, li.account) ?? config.default_account_id!
      const line: Record<string, unknown> = {
        Amount: round2(li.amount),
        DetailType: "AccountBasedExpenseLineDetail",
        Description: li.description,
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: accountId },
          ...(li.tax_code || config.default_tax_code_id
            ? { TaxCodeRef: { value: li.tax_code ?? config.default_tax_code_id! } }
            : {}),
        },
      }
      return line
    })
}

function resolveAccountIdByName(config: QuickBooksConfig, name: string | undefined): string | null {
  if (!name) return null
  const lower = name.toLowerCase()
  const hit = config.accounts_snapshot.find((a) => a.Name.toLowerCase() === lower)
  return hit?.Id ?? null
}

async function createBill(
  client: QuickBooksClient,
  config: QuickBooksConfig,
  mapped: MappedFields,
  requestId: string
): Promise<string> {
  const vendorId = await resolveVendorId(client, config, mapped.vendor_name, requestId)
  const lines = buildExpenseLines(config, mapped)
  if (lines.length === 0) {
    throw new Error("No line items to post — extracted total and line items are both empty")
  }

  const body: Record<string, unknown> = {
    VendorRef: { value: vendorId },
    Line: lines,
    ...(mapped.txn_date ? { TxnDate: mapped.txn_date } : {}),
    ...(mapped.due_date ? { DueDate: mapped.due_date } : {}),
    ...(mapped.doc_number ? { DocNumber: mapped.doc_number } : {}),
    ...(mapped.memo ? { PrivateNote: mapped.memo } : {}),
    ...(mapped.currency ? { CurrencyRef: { value: mapped.currency } } : {}),
    ...(mapped.exchange_rate ? { ExchangeRate: mapped.exchange_rate } : {}),
  }

  const res = await client.request<{ Bill: { Id: string } }>({
    method: "POST",
    path: "/bill",
    body,
    requestId,
  })
  return res.Bill.Id
}

async function createPurchase(
  client: QuickBooksClient,
  config: QuickBooksConfig,
  mapped: MappedFields,
  requestId: string
): Promise<string> {
  // Vendor on Purchase is optional but strongly recommended — without it the
  // expense is just a payment to "no one" and harder to reconcile.
  const vendorId = await resolveVendorId(client, config, mapped.vendor_name, requestId).catch(() => null)
  const lines = buildExpenseLines(config, mapped)
  if (lines.length === 0) {
    throw new Error("No line items to post — extracted total and line items are both empty")
  }

  const body: Record<string, unknown> = {
    AccountRef: { value: config.default_payment_account_id! },
    PaymentType: config.payment_type!,
    Line: lines,
    ...(vendorId ? { EntityRef: { value: vendorId, type: "Vendor" } } : {}),
    ...(mapped.txn_date ? { TxnDate: mapped.txn_date } : {}),
    ...(mapped.doc_number ? { DocNumber: mapped.doc_number } : {}),
    ...(mapped.memo ? { PrivateNote: mapped.memo } : {}),
    ...(mapped.currency ? { CurrencyRef: { value: mapped.currency } } : {}),
    ...(mapped.exchange_rate ? { ExchangeRate: mapped.exchange_rate } : {}),
  }

  const res = await client.request<{ Purchase: { Id: string } }>({
    method: "POST",
    path: "/purchase",
    body,
    requestId,
  })
  return res.Purchase.Id
}

async function createInvoice(
  client: QuickBooksClient,
  config: QuickBooksConfig,
  mapped: MappedFields,
  requestId: string
): Promise<string> {
  const customerId = await resolveCustomerId(client, config, mapped.customer_name)

  // Invoices require SalesItemLineDetail with an ItemRef. Document extraction
  // rarely has item-catalog mappings, so we require the user to designate a
  // default "Services" item via default_account_id (which doubles as Item Id
  // here when target_entity === "invoice" — the setup UI labels accordingly).
  if (!config.default_account_id) {
    throw new Error("No default item configured for invoice line items")
  }

  const items: MappedLineItem[] = mapped.line_items?.length
    ? mapped.line_items
    : mapped.total_amount !== undefined
      ? [{ description: mapped.memo, amount: mapped.total_amount }]
      : []

  const lines = items
    .filter((li) => Number.isFinite(li.amount))
    .map((li) => ({
      Amount: round2(li.amount),
      DetailType: "SalesItemLineDetail",
      Description: li.description,
      SalesItemLineDetail: {
        ItemRef: { value: config.default_account_id! },
        ...(li.quantity ? { Qty: li.quantity } : {}),
      },
    }))

  if (lines.length === 0) {
    throw new Error("No line items to post — extracted total and line items are both empty")
  }

  const body: Record<string, unknown> = {
    CustomerRef: { value: customerId },
    Line: lines,
    ...(mapped.txn_date ? { TxnDate: mapped.txn_date } : {}),
    ...(mapped.due_date ? { DueDate: mapped.due_date } : {}),
    ...(mapped.doc_number ? { DocNumber: mapped.doc_number } : {}),
    ...(mapped.memo ? { PrivateNote: mapped.memo } : {}),
    ...(mapped.currency ? { CurrencyRef: { value: mapped.currency } } : {}),
    ...(mapped.exchange_rate ? { ExchangeRate: mapped.exchange_rate } : {}),
  }

  const res = await client.request<{ Invoice: { Id: string } }>({
    method: "POST",
    path: "/invoice",
    body,
    requestId,
  })
  return res.Invoice.Id
}

// ---------------------------------------------------------------- Attachable

async function attachSourceDocument(
  client: QuickBooksClient,
  input: DeliverToQuickBooksInput,
  entityId: string
): Promise<string | undefined> {
  // Reconstruct the storage path the way process-document does: deterministic
  // from (user_id, parser_id, document_id, safe_file_name).
  const { data: doc, error } = await input.supabase
    .from("parser_processed_documents")
    .select("user_id, parser_id, file_name, mime_type")
    .eq("id", input.documentId)
    .single()

  if (error || !doc) {
    throw new Error(`Could not load document row for attachment: ${error?.message ?? "not found"}`)
  }

  const safeName = (doc.file_name ?? "document").replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${doc.user_id}/${doc.parser_id}/${input.documentId}/${safeName}`

  const { data: blob, error: dlError } = await input.supabase.storage
    .from(QBO_BUCKET)
    .download(storagePath)
  if (dlError || !blob) {
    throw new Error(`Source file not found at ${storagePath}: ${dlError?.message ?? "unknown"}`)
  }

  const buffer = Buffer.from(await blob.arrayBuffer())
  // QBO Attachable hard cap is 100 MB but practical PDF support degrades past
  // ~25 MB. We refuse anything > 25 MB up front; user can re-upload manually.
  if (buffer.byteLength > 25 * 1024 * 1024) {
    throw new Error(`File too large to attach (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB > 25 MB)`)
  }

  const result = await client.attach({
    fileName: safeName,
    contentType: doc.mime_type ?? input.metadata.mime_type ?? "application/octet-stream",
    data: buffer,
    attachToType: targetEntityToQboType(input.config.target_entity),
    attachToId: entityId,
    requestId: deterministicRequestId(input.integrationId, input.documentId, "attach"),
  })
  return result.id
}

function targetEntityToQboType(t: QuickBooksTargetEntity): string {
  switch (t) {
    case "bill":
      return "Bill"
    case "purchase":
      return "Purchase"
    case "invoice":
      return "Invoice"
  }
}

// ---------------------------------------------------------------- Helpers

export function buildEntityUrl(
  env: "sandbox" | "production",
  realmId: string,
  type: QuickBooksTargetEntity,
  id: string
): string {
  // QBO web UI URLs differ between sandbox and prod, but the path is stable.
  const host = env === "production" ? "https://qbo.intuit.com" : "https://sandbox.qbo.intuit.com"
  // ?txnId works for Bill/Purchase/Invoice in the modern UI.
  const slug = type === "bill" ? "bill" : type === "purchase" ? "expense" : "invoice"
  return `${host}/app/${slug}?txnId=${id}&realmId=${realmId}`
}

export function deterministicRequestId(integrationId: string, documentId: string, suffix: string): string {
  // Must be ≤ 36 chars. We hash with a quick stable function (FNV-1a) and hex
  // it so the result fits and is deterministic across retries.
  const raw = `${integrationId}:${documentId}:${suffix}`
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < raw.length; i++) {
    h1 ^= raw.charCodeAt(i)
    h1 = Math.imul(h1, 0x01000193) >>> 0
    h2 ^= raw.charCodeAt(raw.length - 1 - i)
    h2 = Math.imul(h2, 0x811c9dc5) >>> 0
  }
  return `psl-${h1.toString(16).padStart(8, "0")}-${h2.toString(16).padStart(8, "0")}-${suffix.slice(0, 6)}`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Read the prior QBO delivery record for this (document, integration) pair.
 *
 * Lives in `parser_processed_documents.integration_status` as a JSONB map
 * keyed by integration id. Used by deliverToQuickBooks to decide whether to
 * skip a redundant create.
 *
 * Returns null if there's no prior record, the prior delivery wasn't
 * successful, or the row read fails. We never throw — failure to read just
 * falls through to the normal create path (RequestId still protects within
 * QBO's cache window).
 */
async function loadPriorDelivery(
  supabase: SupabaseClient,
  documentId: string,
  integrationId: string
): Promise<{
  status: string
  delivered_at?: string
  qbo_entity_id?: string
  qbo_entity_type?: QuickBooksTargetEntity
  qbo_entity_url?: string
  attachable_id?: string
} | null> {
  try {
    const { data, error } = await supabase
      .from("parser_processed_documents")
      .select("integration_status")
      .eq("id", documentId)
      .single()
    if (error || !data) return null
    const status = (data as any).integration_status as Record<string, any> | null
    const entry = status?.[integrationId]
    if (!entry || entry.status !== "delivered") return null

    // Backfill path: rows written by older orchestrator code only stored doc_url
    // (the QBO entity URL). Extract the entity Id and type from the URL so the
    // dedup check still works for those records. New rows have these fields
    // explicitly set and skip the regex.
    const entityId = entry.qbo_entity_id ?? extractEntityIdFromUrl(entry.qbo_entity_url ?? entry.doc_url)
    const entityType =
      entry.qbo_entity_type ?? extractEntityTypeFromUrl(entry.qbo_entity_url ?? entry.doc_url)
    if (!entityId || !entityType) return null

    return {
      status: entry.status,
      delivered_at: entry.delivered_at,
      qbo_entity_id: entityId,
      qbo_entity_type: entityType,
      qbo_entity_url: entry.qbo_entity_url ?? entry.doc_url,
      attachable_id: entry.attachable_id ?? entry.qbo_attachable_id,
    }
  } catch {
    return null
  }
}

function extractEntityIdFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  const m = url.match(/[?&]txnId=(\d+)/)
  return m?.[1]
}

function extractEntityTypeFromUrl(url: string | undefined): QuickBooksTargetEntity | undefined {
  if (!url) return undefined
  // URLs look like /app/bill?txnId=… , /app/expense?…, /app/invoice?…
  if (/\/app\/bill\?/.test(url)) return "bill"
  if (/\/app\/expense\?/.test(url)) return "purchase"
  if (/\/app\/invoice\?/.test(url)) return "invoice"
  return undefined
}

export function humanizeError(err: unknown): string {
  if (err instanceof QuickBooksApiError) {
    if (err.status === 401) return "QuickBooks authentication expired — please reconnect"
    if (err.status === 403) return "QuickBooks denied permission — check your scopes"
    if (err.status === 429) return "QuickBooks rate limit hit — will retry on next document"
    if (err.intuitDetail) return `QuickBooks: ${err.intuitDetail}`
    return err.message
  }
  return errMsg(err)
}
