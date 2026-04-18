/**
 * Thin typed REST client for the QuickBooks Online accounting API (v3).
 *
 * Why hand-rolled instead of `node-quickbooks`:
 *   - We need full control over RequestId injection and 429 backoff.
 *   - The community lib is callback-style and untyped; wrapping it loses more
 *     than it gives us.
 *   - We only hit ~10 endpoints; the surface is small.
 *
 * Rate-limit posture:
 *   - QBO caps at 500 req/min per realm with max 10 concurrent. We don't
 *     attempt to enforce concurrency here — at parsli's current volume a
 *     single document push is well under the cap. We do honor `Retry-After`
 *     on 429.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { QuickBooksConfig } from "@/lib/extractor/types"
import { ensureFreshAccessToken, getQuickBooksApiBase } from "./oauth"

const MINOR_VERSION = "73"
const MAX_RETRIES = 3

export interface QuickBooksClient {
  /** Issue an arbitrary v3 REST call against the company's realm. */
  request<T>(opts: QuickBooksRequestOptions): Promise<T>
  query<T>(qboQuery: string): Promise<T>
  /** Two-step Attachable upload (metadata + binary) linked to an existing entity. */
  attach(opts: AttachOptions): Promise<{ id: string; downloadUrl?: string }>
  /** The realm ID this client is bound to. */
  realmId: string
  /** Sandbox vs production. */
  environment: "sandbox" | "production"
  /** The latest config snapshot (after any token rotation during the call). */
  config: QuickBooksConfig
}

export interface QuickBooksRequestOptions {
  method: "GET" | "POST"
  /** Path under /v3/company/{realmId}/, leading slash optional. */
  path: string
  /** JSON body for mutating requests. */
  body?: unknown
  /** Idempotency key — required for any create/update. UUID, max 36 chars. */
  requestId?: string
  /** Override Accept header (e.g. for Attachable upload). */
  accept?: string
  /** Extra query params (minorversion is always added automatically). */
  query?: Record<string, string>
}

export interface AttachOptions {
  fileName: string
  contentType: string
  data: Buffer
  /** "Bill" | "Purchase" | "Invoice" | etc. */
  attachToType: string
  attachToId: string
  /** Set true to also include the attachment when emailing the entity. Defaults to false. */
  includeOnSend?: boolean
  requestId?: string
}

export class QuickBooksApiError extends Error {
  readonly status: number
  readonly body: string
  readonly intuitCode?: string
  readonly intuitDetail?: string
  constructor(status: number, body: string, intuitCode?: string, intuitDetail?: string) {
    super(`QBO API ${status}${intuitCode ? ` [${intuitCode}]` : ""}: ${intuitDetail ?? body.slice(0, 200)}`)
    this.name = "QuickBooksApiError"
    this.status = status
    this.body = body
    this.intuitCode = intuitCode
    this.intuitDetail = intuitDetail
  }
}

export async function getQuickBooksClient(
  initialConfig: QuickBooksConfig,
  integrationId: string,
  supabase: SupabaseClient
): Promise<QuickBooksClient> {
  let liveConfig = initialConfig

  async function authedFetch(url: string, init: RequestInit): Promise<Response> {
    const { accessToken, updatedConfig } = await ensureFreshAccessToken(
      liveConfig,
      integrationId,
      supabase
    )
    liveConfig = updatedConfig
    const headers = new Headers(init.headers)
    headers.set("Authorization", `Bearer ${accessToken}`)
    return fetch(url, { ...init, headers })
  }

  const apiBase = getQuickBooksApiBase(liveConfig.environment)

  async function request<T>(opts: QuickBooksRequestOptions): Promise<T> {
    const path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`
    const search = new URLSearchParams({
      minorversion: MINOR_VERSION,
      ...(opts.query ?? {}),
    })
    if (opts.requestId) search.set("requestid", opts.requestId)

    const url = `${apiBase}/v3/company/${liveConfig.realm_id}${path}?${search.toString()}`

    let attempt = 0
    while (true) {
      const headers: Record<string, string> = {
        Accept: opts.accept ?? "application/json",
      }
      if (opts.body !== undefined) headers["Content-Type"] = "application/json"

      const res = await authedFetch(url, {
        method: opts.method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      })

      if (res.ok) {
        const text = await res.text()
        if (!text) return undefined as T
        try {
          return JSON.parse(text) as T
        } catch {
          // Some endpoints return non-JSON (e.g. revoke). The caller's type
          // parameter is responsible for matching reality; we just return raw.
          return text as unknown as T
        }
      }

      // 429 / 503: respect Retry-After if present, otherwise exponential backoff.
      if ((res.status === 429 || res.status === 503) && attempt < MAX_RETRIES) {
        const retryAfter = Number(res.headers.get("Retry-After"))
        const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(2_000 * 2 ** attempt, 16_000)
        await sleep(delayMs)
        attempt++
        continue
      }

      const body = await res.text()
      const { code, detail } = parseIntuitFault(body)
      throw new QuickBooksApiError(res.status, body, code, detail)
    }
  }

  async function query<T>(qboQuery: string): Promise<T> {
    return request<T>({
      method: "GET",
      path: "/query",
      query: { query: qboQuery },
    })
  }

  async function attach(opts: AttachOptions): Promise<{ id: string; downloadUrl?: string }> {
    // Attachable upload is a two-part multipart/form-data POST to /upload.
    // Part 1: file_metadata_NN — JSON describing the Attachable.
    // Part 2: file_content_NN  — raw bytes.
    // Intuit indexes parts by NN suffix; we use 01.

    const boundary = `parsli_qbo_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const metadata = {
      AttachableRef: [
        {
          IncludeOnSend: opts.includeOnSend ?? false,
          EntityRef: { type: opts.attachToType, value: opts.attachToId },
        },
      ],
      FileName: opts.fileName,
      ContentType: opts.contentType,
    }

    const metadataPart =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file_metadata_01"\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n`

    const filePartHeader =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file_content_01"; filename="${escapeFilename(opts.fileName)}"\r\n` +
      `Content-Type: ${opts.contentType}\r\n\r\n`

    const tail = `\r\n--${boundary}--\r\n`

    const body = Buffer.concat([
      Buffer.from(metadataPart, "utf8"),
      Buffer.from(filePartHeader, "utf8"),
      opts.data,
      Buffer.from(tail, "utf8"),
    ])

    const search = new URLSearchParams({ minorversion: MINOR_VERSION })
    if (opts.requestId) search.set("requestid", opts.requestId)
    const url = `${apiBase}/v3/company/${liveConfig.realm_id}/upload?${search.toString()}`

    const res = await authedFetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    })

    if (!res.ok) {
      const respBody = await res.text()
      const { code, detail } = parseIntuitFault(respBody)
      throw new QuickBooksApiError(res.status, respBody, code, detail)
    }

    // QBO returns the upload result under `AttachableResponse` (per current docs).
    // We also accept the legacy `AttachableResponseArray` shape that older
    // community libraries reference, defensively. If a Fault appears in the
    // first entry, surface it instead of the generic "no Id" message.
    const rawText = await res.text()
    let json: {
      AttachableResponse?: Array<{
        Attachable?: { Id?: string; FileAccessUri?: string }
        Fault?: { Error?: Array<{ code?: string; Message?: string; Detail?: string }> }
      }>
      AttachableResponseArray?: Array<{
        Attachable?: { Id?: string; FileAccessUri?: string }
        Fault?: { Error?: Array<{ code?: string; Message?: string; Detail?: string }> }
      }>
    }
    try {
      json = JSON.parse(rawText)
    } catch {
      throw new QuickBooksApiError(
        res.status,
        rawText,
        undefined,
        "Attachable upload returned non-JSON body"
      )
    }

    const arr = json.AttachableResponse ?? json.AttachableResponseArray ?? []
    const firstEntry = arr[0]

    if (firstEntry?.Fault?.Error?.[0]) {
      const fault = firstEntry.Fault.Error[0]
      throw new QuickBooksApiError(
        res.status,
        rawText,
        fault.code,
        fault.Detail || fault.Message || "Attachable upload faulted"
      )
    }

    const attachable = firstEntry?.Attachable
    if (!attachable?.Id) {
      // Surface the raw body in the error so we can diagnose unexpected shapes
      // without asking customers for server logs.
      throw new QuickBooksApiError(
        res.status,
        rawText,
        undefined,
        `Attachable upload returned no Id (body: ${rawText.slice(0, 300)})`
      )
    }
    return { id: attachable.Id, downloadUrl: attachable.FileAccessUri }
  }

  return {
    get realmId() {
      return liveConfig.realm_id
    },
    get environment() {
      return liveConfig.environment
    },
    get config() {
      return liveConfig
    },
    request,
    query,
    attach,
  }
}

function parseIntuitFault(body: string): { code?: string; detail?: string } {
  try {
    const parsed = JSON.parse(body) as {
      Fault?: { Error?: Array<{ code?: string; Message?: string; Detail?: string }> }
    }
    const first = parsed.Fault?.Error?.[0]
    if (!first) return {}
    return {
      code: first.code,
      detail: first.Detail || first.Message,
    }
  } catch {
    return {}
  }
}

function escapeFilename(name: string): string {
  // RFC 5987 isn't strictly required here but quoting is. Strip quotes and CR/LF
  // to keep the multipart frame valid.
  return name.replace(/["\r\n]/g, "_")
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ---------- Reference-data helpers (used by setup UI + delivery) ----------

export interface QbAccountRow {
  Id: string
  Name: string
  AccountType: string
  AccountSubType?: string
  Classification?: string
  Active: boolean
}
export interface QbVendorRow {
  Id: string
  DisplayName: string
  Active: boolean
  CurrencyRef?: { value: string }
}
export interface QbCustomerRow {
  Id: string
  DisplayName: string
  Active: boolean
}
export interface QbTaxCodeRow {
  Id: string
  Name: string
  Active: boolean
  TaxGroup?: boolean
}

interface QueryResponse<TKey extends string, TRow> {
  QueryResponse: Partial<Record<TKey, TRow[]>> & { maxResults?: number; startPosition?: number }
}

export async function fetchAllAccounts(client: QuickBooksClient): Promise<QbAccountRow[]> {
  // Single-column ORDER BY — QBO's QBQL doesn't reliably accept multi-column
  // ORDER BY across all entities (Account specifically returns zero rows with
  // "ORDER BY AccountType, Name"). Sort by AccountType client-side later if
  // we want grouping in the UI.
  return paginate<QbAccountRow>(client, "Account", "Name")
}

export async function fetchAllVendors(client: QuickBooksClient): Promise<QbVendorRow[]> {
  return paginate<QbVendorRow>(client, "Vendor", "DisplayName")
}

export async function fetchAllCustomers(client: QuickBooksClient): Promise<QbCustomerRow[]> {
  return paginate<QbCustomerRow>(client, "Customer", "DisplayName")
}

export async function fetchAllTaxCodes(client: QuickBooksClient): Promise<QbTaxCodeRow[]> {
  return paginate<QbTaxCodeRow>(client, "TaxCode", "Name")
}

async function paginate<T>(
  client: QuickBooksClient,
  entity: string,
  orderBy: string
): Promise<T[]> {
  const PAGE = 1000 // QBO max
  const out: T[] = []
  let start = 1
  // Hard ceiling so a malformed response can't loop forever.
  for (let i = 0; i < 50; i++) {
    const q = `SELECT * FROM ${entity} WHERE Active = true ORDER BY ${orderBy} STARTPOSITION ${start} MAXRESULTS ${PAGE}`
    const res = await client.query<QueryResponse<typeof entity, T>>(q)
    const batch = (res.QueryResponse?.[entity] as T[] | undefined) ?? []
    out.push(...batch)
    if (batch.length < PAGE) break
    start += PAGE
  }
  return out
}

/**
 * Normalize a name for QBO lookup / creation:
 *   - Strip leading/trailing whitespace
 *   - Collapse internal runs of whitespace to a single space
 *
 * Handles the common extraction artefacts: "ByteBeam Agency Ltd. " (trailing
 * space), "ByteBeam  Agency" (double space from PDF text reflow), etc. Without
 * this, exact-match lookups silently miss existing vendors and we end up
 * auto-creating duplicates.
 */
export function normalizeQbName(name: string): string {
  return name.trim().replace(/\s+/g, " ")
}

/**
 * Fetch a vendor by exact DisplayName (case-insensitive). Returns null if not found.
 * Used for vendor matching at delivery time.
 *
 * Filters by Active = true: archived vendors with the same name should NOT
 * match — we'd silently post a Bill against an inactive vendor and QBO would
 * either reject with a cryptic error or accept and confuse the customer's
 * reporting.
 */
export async function findVendorByName(
  client: QuickBooksClient,
  name: string
): Promise<QbVendorRow | null> {
  const normalized = normalizeQbName(name)
  if (!normalized) return null
  // QBO SQL is case-insensitive for equality; we still escape single quotes.
  const safe = normalized.replace(/'/g, "\\'")
  const res = await client.query<QueryResponse<"Vendor", QbVendorRow>>(
    `SELECT * FROM Vendor WHERE Active = true AND DisplayName = '${safe}' MAXRESULTS 1`
  )
  return res.QueryResponse?.Vendor?.[0] ?? null
}

export async function findCustomerByName(
  client: QuickBooksClient,
  name: string
): Promise<QbCustomerRow | null> {
  const normalized = normalizeQbName(name)
  if (!normalized) return null
  const safe = normalized.replace(/'/g, "\\'")
  const res = await client.query<QueryResponse<"Customer", QbCustomerRow>>(
    `SELECT * FROM Customer WHERE Active = true AND DisplayName = '${safe}' MAXRESULTS 1`
  )
  return res.QueryResponse?.Customer?.[0] ?? null
}

export async function createVendor(
  client: QuickBooksClient,
  name: string,
  requestId: string
): Promise<QbVendorRow> {
  // Normalize before create so the new vendor matches what we'd look up next time.
  const normalized = normalizeQbName(name)
  const res = await client.request<{ Vendor: QbVendorRow }>({
    method: "POST",
    path: "/vendor",
    body: { DisplayName: normalized },
    requestId,
  })
  return res.Vendor
}

export async function getCompanyInfo(
  client: QuickBooksClient
): Promise<{ CompanyName: string; LegalName?: string; Country?: string }> {
  const res = await client.request<{ CompanyInfo: { CompanyName: string; LegalName?: string; Country?: string } }>(
    {
      method: "GET",
      path: `/companyinfo/${client.realmId}`,
    }
  )
  return res.CompanyInfo
}

/**
 * Check whether an entity (Bill / Purchase / Invoice) still exists in QBO and
 * is not in a deleted/voided state.
 *
 * Used by deliverToQuickBooks to dedup against prior deliveries: if we already
 * have a `qbo_entity_id` recorded and the entity is alive in QBO, we return it
 * verbatim instead of creating a second one. Without this, customers who
 * reprocess a document AFTER QBO's RequestId cache has expired (~hours) end
 * up with duplicate Bills.
 *
 * Behavior:
 *   - 200 + alive entity → returns true
 *   - 200 + entity has status "Deleted" or "Voided" → returns false
 *   - 4xx ObjectNotFound or 404 → returns false
 *   - Any other failure (auth, rate limit, network) → returns true (fail-safe:
 *     better to skip a duplicate-create than create one when we can't tell)
 */
export async function entityExistsInQbo(
  client: QuickBooksClient,
  entityType: "bill" | "purchase" | "invoice",
  entityId: string
): Promise<boolean> {
  // Response key is the entity name capitalized: "Bill", "Purchase", "Invoice"
  const responseKey = entityType[0].toUpperCase() + entityType.slice(1)
  try {
    const res = await client.request<Record<string, { Id?: string; status?: string } | undefined>>(
      {
        method: "GET",
        path: `/${entityType}/${entityId}`,
      }
    )
    const entity = res?.[responseKey]
    if (!entity?.Id) return false
    const status = entity.status
    if (status === "Deleted" || status === "Voided") return false
    return true
  } catch (err) {
    if (err instanceof QuickBooksApiError) {
      // 404 (or Intuit's "ObjectNotFound" fault) = entity is gone, recreate.
      if (err.status === 404 || err.intuitCode === "ObjectNotFound") return false
      // Any other error → fail safe and assume it exists. Creating a duplicate
      // is worse than skipping a delivery; the user can always trigger a
      // manual retry once the underlying issue (auth, rate limit) clears.
      return true
    }
    return true
  }
}
