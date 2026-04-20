import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  applyFieldMapping,
  buildEntityUrl,
  deliverToQuickBooks,
  deterministicRequestId,
  humanizeError,
  normalizeLineItem,
  resolvePath,
  toCurrencyOrUndef,
  toIsoDateOrUndef,
  toNumberOrUndef,
  toStringOrUndef,
  validateConfigForDelivery,
} from "./deliver"
import { QuickBooksApiError } from "./client"
import type { QuickBooksConfig } from "@/lib/extractor/types"

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env.QUICKBOOKS_CLIENT_ID = "cid"
  process.env.QUICKBOOKS_CLIENT_SECRET = "csec"
  process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com"
  process.env.QUICKBOOKS_ENV = "sandbox"
  // Required by tokenCrypto — deliver transitively refreshes tokens which
  // encrypts the rotated refresh_token before persisting.
  process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY = "a".repeat(64)
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

const cfg = (over: Partial<QuickBooksConfig> = {}): QuickBooksConfig => ({
  realm_id: "REALM_1",
  access_token: "AT",
  refresh_token: "RT",
  token_expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  refresh_token_issued_at: new Date().toISOString(),
  environment: "sandbox",
  company_name: "Acme",
  target_entity: "bill",
  field_mapping: {},
  default_vendor_id: null,
  default_account_id: null,
  default_tax_code_id: null,
  default_payment_account_id: null,
  payment_type: null,
  auto_create_vendor: false,
  attach_source_document: false,
  accounts_snapshot: [],
  vendors_snapshot: [],
  customers_snapshot: [],
  tax_codes_snapshot: [],
  snapshot_refreshed_at: null,
  ...over,
})

// ─── Pure helpers ─────────────────────────────────────────────────────────────

describe("toStringOrUndef", () => {
  it.each([
    [null, undefined],
    [undefined, undefined],
    ["", undefined],
    ["   ", undefined],
    ["hello", "hello"],
    [123, "123"],
    [true, "true"],
  ])("(%s) → %s", (input, expected) => {
    expect(toStringOrUndef(input)).toBe(expected)
  })

  it("truncates to max length when supplied", () => {
    expect(toStringOrUndef("abcdefghij", 5)).toBe("abcde")
  })

  it("does not truncate when value is shorter than max", () => {
    expect(toStringOrUndef("abc", 10)).toBe("abc")
  })
})

describe("toNumberOrUndef", () => {
  it.each([
    [null, undefined],
    [undefined, undefined],
    ["", undefined],
    [123, 123],
    [0, 0],
    [-50.5, -50.5],
    [Number.NaN, undefined],
    [Infinity, undefined],
  ])("(%s) → %s", (input, expected) => {
    expect(toNumberOrUndef(input)).toBe(expected)
  })

  it("strips currency symbols, commas, and whitespace from strings", () => {
    expect(toNumberOrUndef("$1,234.56")).toBe(1234.56)
    expect(toNumberOrUndef("€99.99")).toBe(99.99)
    expect(toNumberOrUndef(" £ 50 ")).toBe(50)
  })

  it("returns undefined for non-numeric strings", () => {
    expect(toNumberOrUndef("abc")).toBeUndefined()
    expect(toNumberOrUndef("$abc")).toBeUndefined()
  })
})

describe("toCurrencyOrUndef", () => {
  it("returns ISO 4217 code (uppercased)", () => {
    expect(toCurrencyOrUndef("usd")).toBe("USD")
    expect(toCurrencyOrUndef("EUR")).toBe("EUR")
  })
  it("rejects values that aren't 3 letters", () => {
    expect(toCurrencyOrUndef("US")).toBeUndefined()
    expect(toCurrencyOrUndef("US$")).toBeUndefined()
    expect(toCurrencyOrUndef("123")).toBeUndefined()
  })
  it("returns undefined for blank / nullish", () => {
    expect(toCurrencyOrUndef(null)).toBeUndefined()
    expect(toCurrencyOrUndef("")).toBeUndefined()
  })
  it("only takes the first 3 characters (after trim)", () => {
    expect(toCurrencyOrUndef("usdcrap")).toBe("USD")
  })
})

describe("toIsoDateOrUndef", () => {
  it.each([
    ["2026-04-15", "2026-04-15"],
    ["April 15, 2026", "2026-04-15"],
    ["2026-04-15T10:30:00Z", "2026-04-15"],
  ])("(%s) → %s", (input, expected) => {
    expect(toIsoDateOrUndef(input)).toBe(expected)
  })

  it("returns undefined for unparseable strings", () => {
    expect(toIsoDateOrUndef("yesterday")).toBeUndefined()
    expect(toIsoDateOrUndef("")).toBeUndefined()
    expect(toIsoDateOrUndef(null)).toBeUndefined()
  })
})

describe("resolvePath", () => {
  const obj = {
    invoice: { total: 100, vendor: { name: "Acme" } },
    items: [{ price: 5 }, { price: 10 }],
  }

  it("returns top-level value", () => {
    expect(resolvePath(obj, "invoice")).toEqual(obj.invoice)
  })
  it("walks nested object paths", () => {
    expect(resolvePath(obj, "invoice.total")).toBe(100)
    expect(resolvePath(obj, "invoice.vendor.name")).toBe("Acme")
  })
  it("supports bracket array indexing", () => {
    expect(resolvePath(obj, "items[0].price")).toBe(5)
    expect(resolvePath(obj, "items[1].price")).toBe(10)
  })
  it("returns undefined for missing keys (no throw)", () => {
    expect(resolvePath(obj, "invoice.missing")).toBeUndefined()
    expect(resolvePath(obj, "missing.path")).toBeUndefined()
    expect(resolvePath(obj, "items[99].price")).toBeUndefined()
  })
})

describe("normalizeLineItem", () => {
  it("returns amount=0 for non-objects (defensive)", () => {
    expect(normalizeLineItem(null)).toEqual({ amount: 0 })
    expect(normalizeLineItem("string")).toEqual({ amount: 0 })
  })
  it("falls through alternative key names for amount", () => {
    expect(normalizeLineItem({ total: 50 }).amount).toBe(50)
    expect(normalizeLineItem({ line_total: 25 }).amount).toBe(25)
    expect(normalizeLineItem({ subtotal: 12.5 }).amount).toBe(12.5)
    expect(normalizeLineItem({ price: 7 }).amount).toBe(7)
  })
  it("prefers amount over alternatives when both present", () => {
    expect(normalizeLineItem({ amount: 100, total: 99 }).amount).toBe(100)
  })
  it("strips currency strings", () => {
    expect(normalizeLineItem({ amount: "$1,500.00" }).amount).toBe(1500)
  })
  it("falls through alternative description keys", () => {
    expect(normalizeLineItem({ name: "Widget" }).description).toBe("Widget")
    expect(normalizeLineItem({ item: "Service" }).description).toBe("Service")
    expect(normalizeLineItem({ desc: "Abbrev" }).description).toBe("Abbrev")
  })
  it("captures account/category and tax_code variations", () => {
    expect(normalizeLineItem({ amount: 1, category: "Office" }).account).toBe("Office")
    expect(normalizeLineItem({ amount: 1, taxCode: "GST" }).tax_code).toBe("GST")
  })
})

describe("applyFieldMapping", () => {
  const results = {
    vendor: { name: "Globex" },
    invoice_no: "INV-001",
    date: "2026-01-02",
    total: "$1,234.56",
    items: [{ desc: "Widget", price: 100 }],
  }

  it("resolves dotted paths", () => {
    const mapped = applyFieldMapping({ vendor_name: "vendor.name", doc_number: "invoice_no" }, results)
    expect(mapped.vendor_name).toBe("Globex")
    expect(mapped.doc_number).toBe("INV-001")
  })

  it("normalizes total amount and date", () => {
    const mapped = applyFieldMapping({ total_amount: "total", txn_date: "date" }, results)
    expect(mapped.total_amount).toBe(1234.56)
    expect(mapped.txn_date).toBe("2026-01-02")
  })

  it("returns line_items array when mapped to a list path", () => {
    const mapped = applyFieldMapping({ line_items: "items" }, results)
    expect(mapped.line_items).toHaveLength(1)
    // `desc` is accepted as a fallback for description.
    expect(mapped.line_items?.[0].description).toBe("Widget")
    expect(mapped.line_items?.[0].amount).toBe(100)
  })

  it("ignores unmapped fields entirely", () => {
    const mapped = applyFieldMapping({}, results)
    expect(mapped.vendor_name).toBeUndefined()
    expect(mapped.total_amount).toBeUndefined()
  })

  it("ignores null mapping values (explicit unmap)", () => {
    const mapped = applyFieldMapping({ vendor_name: null }, results)
    expect(mapped.vendor_name).toBeUndefined()
  })

  it("truncates doc_number to QBO's 21-char limit", () => {
    const long = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const mapped = applyFieldMapping({ doc_number: "n" }, { n: long })
    expect(mapped.doc_number?.length).toBe(21)
  })
})

describe("buildEntityUrl", () => {
  it("returns sandbox host + correct slug per entity", () => {
    expect(buildEntityUrl("sandbox", "R1", "bill", "B1")).toBe(
      "https://sandbox.qbo.intuit.com/app/bill?txnId=B1&realmId=R1"
    )
    expect(buildEntityUrl("sandbox", "R1", "purchase", "P1")).toBe(
      "https://sandbox.qbo.intuit.com/app/expense?txnId=P1&realmId=R1"
    )
    expect(buildEntityUrl("sandbox", "R1", "invoice", "I1")).toBe(
      "https://sandbox.qbo.intuit.com/app/invoice?txnId=I1&realmId=R1"
    )
  })
  it("returns production host when env is production", () => {
    expect(buildEntityUrl("production", "R2", "bill", "B7")).toBe(
      "https://qbo.intuit.com/app/bill?txnId=B7&realmId=R2"
    )
  })
})

describe("deterministicRequestId", () => {
  it("is stable for the same inputs (idempotency invariant)", () => {
    const a = deterministicRequestId("INTEG_1", "DOC_1", "bill")
    const b = deterministicRequestId("INTEG_1", "DOC_1", "bill")
    expect(a).toBe(b)
  })
  it("differs when any input differs", () => {
    const a = deterministicRequestId("INTEG_1", "DOC_1", "bill")
    expect(deterministicRequestId("INTEG_2", "DOC_1", "bill")).not.toBe(a)
    expect(deterministicRequestId("INTEG_1", "DOC_2", "bill")).not.toBe(a)
    expect(deterministicRequestId("INTEG_1", "DOC_1", "purchase")).not.toBe(a)
  })
  it("fits within QBO's 36-char RequestId limit", () => {
    const id = deterministicRequestId("uuid-with-some-length-1234", "doc-uuid-5678", "attach")
    expect(id.length).toBeLessThanOrEqual(36)
  })
  it("starts with the parsli prefix so we can identify our own retries in QBO logs", () => {
    expect(deterministicRequestId("a", "b", "c")).toMatch(/^psl-/)
  })
})

describe("validateConfigForDelivery", () => {
  it("rejects when not connected", () => {
    expect(validateConfigForDelivery(cfg({ access_token: "" }))).toMatch(/not connected/)
    expect(validateConfigForDelivery(cfg({ refresh_token: "" }))).toMatch(/not connected/)
    expect(validateConfigForDelivery(cfg({ realm_id: "" }))).toMatch(/not connected/)
  })
  it("requires default_account_id for Bill", () => {
    expect(validateConfigForDelivery(cfg({ target_entity: "bill", default_account_id: null }))).toMatch(
      /default expense account/
    )
  })
  it("requires default_account_id for Purchase", () => {
    expect(
      validateConfigForDelivery(
        cfg({ target_entity: "purchase", default_account_id: null, default_payment_account_id: "p1", payment_type: "Cash" })
      )
    ).toMatch(/default expense account/)
  })
  it("requires payment account + type for Purchase", () => {
    expect(
      validateConfigForDelivery(
        cfg({
          target_entity: "purchase",
          default_account_id: "a1",
          default_payment_account_id: null,
          payment_type: "Cash",
        })
      )
    ).toMatch(/payment account/)
    expect(
      validateConfigForDelivery(
        cfg({
          target_entity: "purchase",
          default_account_id: "a1",
          default_payment_account_id: "p1",
          payment_type: null,
        })
      )
    ).toMatch(/payment type/)
  })
  it("requires either default_vendor_id or customer_name mapping for Invoice", () => {
    expect(
      validateConfigForDelivery(cfg({ target_entity: "invoice", default_vendor_id: null, field_mapping: {} }))
    ).toMatch(/customer/)
  })
  it("returns null when config is valid", () => {
    expect(
      validateConfigForDelivery(cfg({ target_entity: "bill", default_account_id: "a1" }))
    ).toBeNull()
  })
})

describe("humanizeError", () => {
  it("turns 401 into a reconnect hint", () => {
    expect(humanizeError(new QuickBooksApiError(401, "{}", undefined, "AuthFailed"))).toMatch(
      /authentication expired/i
    )
  })
  it("turns 403 into a permission hint", () => {
    expect(humanizeError(new QuickBooksApiError(403, "{}", undefined, "Forbidden"))).toMatch(
      /denied permission/i
    )
  })
  it("turns 429 into a rate-limit hint", () => {
    expect(humanizeError(new QuickBooksApiError(429, "{}"))).toMatch(/rate limit/i)
  })
  it("surfaces Intuit detail when present", () => {
    expect(
      humanizeError(new QuickBooksApiError(500, "{}", "9999", "VendorRef.value invalid"))
    ).toMatch(/VendorRef\.value invalid/)
  })
  it("falls through for non-QuickBooksApiError throws", () => {
    expect(humanizeError(new Error("kaboom"))).toBe("kaboom")
    expect(humanizeError("string error")).toBe("string error")
  })
})

// ─── Integration: deliverToQuickBooks ─────────────────────────────────────────

interface CapturedRequest {
  url: string
  init: RequestInit
}
function recordingFetch(handlers: Array<(url: string, init: RequestInit) => Response | Promise<Response>>) {
  const calls: CapturedRequest[] = []
  let i = 0
  const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
    calls.push({ url: String(url), init: (init ?? {}) as RequestInit })
    const handler = handlers[Math.min(i, handlers.length - 1)]
    i++
    return handler(String(url), (init ?? {}) as RequestInit)
  })
  return { calls, spy }
}

function jsonRes(body: unknown, status = 200) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status })
}

function makeSupabase(documentRow: any | null = null) {
  const tableState = {
    parser_integrations: {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    },
    parser_processed_documents: {
      single: vi.fn().mockResolvedValue({ data: documentRow, error: documentRow ? null : { message: "not found" } }),
    },
  }
  const storage = {
    from: vi.fn().mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: null, error: { message: "no file" } }),
    }),
  }
  const supabase: any = {
    from: vi.fn().mockImplementation((tableName: string) => {
      if (tableName === "parser_integrations") {
        return { update: tableState.parser_integrations.update }
      }
      // parser_processed_documents
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: tableState.parser_processed_documents.single }),
        }),
      }
    }),
    storage,
  }
  return { supabase, storage, tableState }
}

describe("deliverToQuickBooks — Bill happy path", () => {
  it("creates a vendor lookup → Bill in one POST and returns the URL", async () => {
    const { supabase } = makeSupabase()
    const { calls } = recordingFetch([
      // 1: vendor lookup
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V1", DisplayName: "Globex", Active: true }] } }),
      // 2: Bill POST
      () => jsonRes({ Bill: { Id: "BILL_77" } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "ACC_5",
        field_mapping: {
          vendor_name: "vendor",
          total_amount: "total",
          memo: "notes",
          doc_number: "inv",
        },
      }),
      integrationId: "INTEG_1",
      parserId: "P1",
      documentId: "D1",
      results: { vendor: "Globex", total: "$500.00", notes: "Q1 supplies", inv: "INV-9" },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    expect(result.qbo_entity_id).toBe("BILL_77")
    expect(result.qbo_entity_type).toBe("bill")
    expect(result.qbo_entity_url).toContain("BILL_77")

    // The POST body must reference the looked-up vendor + the default account + the extracted total.
    const billCall = calls[1]
    expect(billCall.url).toMatch(/\/bill\?/)
    const body = JSON.parse(billCall.init.body as string)
    expect(body.VendorRef.value).toBe("V1")
    expect(body.Line[0].Amount).toBe(500)
    expect(body.Line[0].AccountBasedExpenseLineDetail.AccountRef.value).toBe("ACC_5")
    expect(body.DocNumber).toBe("INV-9")
    expect(body.PrivateNote).toBe("Q1 supplies")
  })

  it("uses extracted line_items when mapped instead of a single total", async () => {
    const { supabase } = makeSupabase()
    const { calls } = recordingFetch([
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V1", DisplayName: "X", Active: true }] } }),
      () => jsonRes({ Bill: { Id: "BILL_2" } }),
    ])

    await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "ACC_DEFAULT",
        field_mapping: { vendor_name: "v", line_items: "items" },
        accounts_snapshot: [
          { Id: "ACC_OFFICE", Name: "Office Supplies", AccountType: "Expense" },
          { Id: "ACC_FUEL", Name: "Fuel", AccountType: "Expense" },
        ],
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: {
        v: "X",
        items: [
          { description: "Pens", amount: 10, account: "Office Supplies" },
          { description: "Gas", amount: 50, account: "Fuel" },
        ],
      },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    const body = JSON.parse(calls[1].init.body as string)
    expect(body.Line).toHaveLength(2)
    expect(body.Line[0].AccountBasedExpenseLineDetail.AccountRef.value).toBe("ACC_OFFICE")
    expect(body.Line[1].AccountBasedExpenseLineDetail.AccountRef.value).toBe("ACC_FUEL")
  })

  it("propagates a stable RequestId so QBO can dedup retries", async () => {
    const { supabase } = makeSupabase()
    const { calls } = recordingFetch([
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V1", DisplayName: "X", Active: true }] } }),
      () => jsonRes({ Bill: { Id: "B" } }),
    ])

    await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "INTEG_X",
      parserId: "P",
      documentId: "DOC_Y",
      results: { v: "X", t: 1 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    const billUrl = new URL(calls[1].url)
    const reqId = billUrl.searchParams.get("requestid")
    expect(reqId).toBeDefined()
    expect(reqId).toBe(deterministicRequestId("INTEG_X", "DOC_Y", "bill"))
  })
})

describe("deliverToQuickBooks — vendor resolution", () => {
  it("auto-creates vendor when name doesn't match and auto_create_vendor=true", async () => {
    const { supabase } = makeSupabase()
    const { calls } = recordingFetch([
      // 1: lookup → empty
      () => jsonRes({ QueryResponse: {} }),
      // 2: createVendor
      () => jsonRes({ Vendor: { Id: "VNEW", DisplayName: "Brand New Co", Active: true } }),
      // 3: Bill
      () => jsonRes({ Bill: { Id: "B" } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        auto_create_vendor: true,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { v: "Brand New Co", t: 100 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    // The Bill POST must use the newly-created vendor Id.
    const billBody = JSON.parse(calls[2].init.body as string)
    expect(billBody.VendorRef.value).toBe("VNEW")
  })

  it("FAILS when vendor not found and auto-create disabled (no silent re-routing)", async () => {
    const { supabase } = makeSupabase()
    recordingFetch([() => jsonRes({ QueryResponse: {} })])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        auto_create_vendor: false,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { v: "Mystery LLC", t: 1 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("failed")
    expect(result.error).toMatch(/Mystery LLC.*not found.*auto-create is disabled/i)
  })

  it("falls back to default_vendor_id when no vendor name is mapped", async () => {
    const { supabase } = makeSupabase()
    const { calls } = recordingFetch([() => jsonRes({ Bill: { Id: "B" } })])

    await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        default_vendor_id: "V_DEFAULT",
        field_mapping: { total_amount: "t" }, // no vendor_name
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { t: 1 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    // Only one fetch (Bill POST) — no vendor lookup needed.
    expect(calls).toHaveLength(1)
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.VendorRef.value).toBe("V_DEFAULT")
  })
})

describe("deliverToQuickBooks — Purchase happy path", () => {
  it("creates a Purchase with payment account + payment type", async () => {
    const { supabase } = makeSupabase()
    const { calls } = recordingFetch([
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V1", DisplayName: "Shell", Active: true }] } }),
      () => jsonRes({ Purchase: { Id: "PUR_5" } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "purchase",
        default_account_id: "EXP_1",
        default_payment_account_id: "PAY_CC",
        payment_type: "CreditCard",
        field_mapping: { vendor_name: "v", total_amount: "t", txn_date: "d" },
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { v: "Shell", t: 47.5, d: "2026-04-10" },
      metadata: { file_name: "receipt.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    expect(result.qbo_entity_type).toBe("purchase")
    expect(result.qbo_entity_url).toContain("/expense")

    const body = JSON.parse(calls[1].init.body as string)
    expect(body.AccountRef.value).toBe("PAY_CC")
    expect(body.PaymentType).toBe("CreditCard")
    expect(body.EntityRef).toEqual({ value: "V1", type: "Vendor" })
    expect(body.TxnDate).toBe("2026-04-10")
    expect(body.Line[0].Amount).toBe(47.5)
  })
})

describe("deliverToQuickBooks — Invoice happy path", () => {
  it("creates an Invoice with SalesItemLineDetail referencing default item", async () => {
    const { supabase } = makeSupabase()
    const { calls } = recordingFetch([
      () => jsonRes({ QueryResponse: { Customer: [{ Id: "C1", DisplayName: "Acme Customer", Active: true }] } }),
      () => jsonRes({ Invoice: { Id: "INV_99" } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "invoice",
        default_account_id: "ITEM_SERVICES", // doubles as Item Id for invoices
        default_vendor_id: "C_FALLBACK",
        field_mapping: { customer_name: "c", total_amount: "t" },
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { c: "Acme Customer", t: 250 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    expect(result.qbo_entity_type).toBe("invoice")
    const body = JSON.parse(calls[1].init.body as string)
    expect(body.CustomerRef.value).toBe("C1")
    expect(body.Line[0].DetailType).toBe("SalesItemLineDetail")
    expect(body.Line[0].SalesItemLineDetail.ItemRef.value).toBe("ITEM_SERVICES")
    expect(body.Line[0].Amount).toBe(250)
  })
})

describe("deliverToQuickBooks — config validation gates", () => {
  it("returns skipped when not connected (no fetch)", async () => {
    const { supabase } = makeSupabase()
    const fetchSpy = vi.spyOn(globalThis, "fetch")

    const result = await deliverToQuickBooks({
      config: cfg({ access_token: "" }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: {},
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("skipped")
    expect(result.error).toMatch(/not connected/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("returns skipped when default_account_id missing for Bill", async () => {
    const { supabase } = makeSupabase()
    const fetchSpy = vi.spyOn(globalThis, "fetch")

    const result = await deliverToQuickBooks({
      config: cfg({ target_entity: "bill", default_account_id: null }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { v: "X" },
      metadata: { file_name: "f.pdf" },
      supabase,
    })
    expect(result.status).toBe("skipped")
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe("deliverToQuickBooks — attachment behavior", () => {
  it("does not attach when attach_source_document is false", async () => {
    const { supabase, storage } = makeSupabase({
      user_id: "U", parser_id: "P", file_name: "f.pdf", mime_type: "application/pdf",
    })
    recordingFetch([
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V", DisplayName: "X", Active: true }] } }),
      () => jsonRes({ Bill: { Id: "B" } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        attach_source_document: false,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { v: "X", t: 1 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })
    expect(result.status).toBe("delivered")
    expect(result.attachable_id).toBeUndefined()
    // Storage not consulted.
    expect(storage.from).not.toHaveBeenCalled()
  })

  it("attempts attachment when attach_source_document is true", async () => {
    // Mock document row + storage download → small buffer.
    const docRow = { user_id: "U", parser_id: "P", file_name: "f.pdf", mime_type: "application/pdf" }
    const blob = new Blob([Buffer.from([1, 2, 3])], { type: "application/pdf" })
    const supabase: any = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "parser_integrations") {
          return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: docRow, error: null }),
            }),
          }),
        }
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({ data: blob, error: null }),
        }),
      },
    }

    const { calls } = recordingFetch([
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V", DisplayName: "X", Active: true }] } }),
      () => jsonRes({ Bill: { Id: "BILL_42" } }),
      () => jsonRes({ AttachableResponse: [{ Attachable: { Id: "ATT_99" } }] }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        attach_source_document: true,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { v: "X", t: 1 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    expect(result.attachable_id).toBe("ATT_99")
    // Third call hit /upload.
    expect(calls[2].url).toMatch(/\/upload\?/)
  })

  it("succeeds (delivered) even if attachment step fails — entity creation must not roll back", async () => {
    const docRow = { user_id: "U", parser_id: "P", file_name: "f.pdf", mime_type: "application/pdf" }
    const blob = new Blob([Buffer.from([1, 2, 3])], { type: "application/pdf" })
    const supabase: any = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "parser_integrations") {
          return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: docRow, error: null }),
            }),
          }),
        }
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({ data: blob, error: null }),
        }),
      },
    }

    recordingFetch([
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V", DisplayName: "X", Active: true }] } }),
      () => jsonRes({ Bill: { Id: "BILL_42" } }),
      // Attachable upload fails.
      () => jsonRes({ Fault: { Error: [{ Detail: "too big" }] } }, 413),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        attach_source_document: true,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { v: "X", t: 1 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    expect(result.qbo_entity_id).toBe("BILL_42")
    expect(result.attachable_id).toBeUndefined()
  })

  it("rejects attachments over 25MB up front", async () => {
    const big = new Uint8Array(26 * 1024 * 1024)
    const docRow = { user_id: "U", parser_id: "P", file_name: "huge.pdf", mime_type: "application/pdf" }
    const blob = new Blob([big], { type: "application/pdf" })
    const supabase: any = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "parser_integrations") {
          return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: docRow, error: null }),
            }),
          }),
        }
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({ data: blob, error: null }),
        }),
      },
    }

    const { calls } = recordingFetch([
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V", DisplayName: "X", Active: true }] } }),
      () => jsonRes({ Bill: { Id: "B" } }),
      // Should NOT be hit — we bail before /upload.
      () => jsonRes({ AttachableResponse: [{ Attachable: { Id: "ATT" } }] }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        attach_source_document: true,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { v: "X", t: 1 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    // Entity still delivered, attachment skipped.
    expect(result.status).toBe("delivered")
    expect(result.attachable_id).toBeUndefined()
    // Only 2 fetches: vendor lookup + Bill POST. Upload never attempted.
    expect(calls).toHaveLength(2)
  })
})

describe("deliverToQuickBooks — error surfaces", () => {
  it("returns failed with humanized message on QBO 500 fault", async () => {
    const { supabase } = makeSupabase()
    recordingFetch([
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V", DisplayName: "X", Active: true }] } }),
      () => jsonRes({ Fault: { Error: [{ Detail: "VendorRef invalid" }] } }, 500),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { v: "X", t: 1 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("failed")
    expect(result.error).toMatch(/VendorRef invalid/)
  })

  it("returns failed when there are no extractable line items + no total mapped", async () => {
    const { supabase } = makeSupabase()
    recordingFetch([
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V", DisplayName: "X", Active: true }] } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        field_mapping: { vendor_name: "v" }, // no total_amount, no line_items
      }),
      integrationId: "I",
      parserId: "P",
      documentId: "D",
      results: { v: "X" },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    // We refuse to silently post empty Bills — the user almost certainly
    // misconfigured their mapping. Surface a clear error instead.
    expect(result.status).toBe("failed")
    expect(result.error).toMatch(/line items/i)
  })
})

// ─── Dedup against prior delivery (audit fix #1) ──────────────────────────────

/**
 * Build a supabase mock where the prior `integration_status` for a doc is
 * pre-populated. The dedup check reads from this BEFORE any QBO call.
 */
function makeSupabaseWithPriorDelivery(integrationStatus: Record<string, any>) {
  const supabase: any = {
    from: vi.fn().mockImplementation((tableName: string) => {
      if (tableName === "parser_integrations") {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      // parser_processed_documents — return a row with the requested integration_status
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { integration_status: integrationStatus },
              error: null,
            }),
          }),
        }),
      }
    }),
  }
  return supabase
}

describe("deliverToQuickBooks — dedup against prior delivery", () => {
  it("SKIPS create when entity is recorded AND still alive in QBO", async () => {
    const supabase = makeSupabaseWithPriorDelivery({
      INTEG_DEDUP: {
        status: "delivered",
        delivered_at: "2026-04-17T16:00:00.000Z",
        qbo_entity_id: "BILL_OLD",
        qbo_entity_type: "bill",
        qbo_entity_url: "https://sandbox.qbo.intuit.com/app/bill?txnId=BILL_OLD&realmId=R",
      },
    })
    const { calls } = recordingFetch([
      // GET /bill/BILL_OLD — returns 200 with the entity, so it's alive.
      () => jsonRes({ Bill: { Id: "BILL_OLD" } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        attach_source_document: false,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "INTEG_DEDUP",
      parserId: "P",
      documentId: "D",
      results: { v: "Whoever", t: 100 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    expect(result.qbo_entity_id).toBe("BILL_OLD")
    // Crucially: the cached delivered_at is preserved (not overwritten with now)
    expect(result.delivered_at).toBe("2026-04-17T16:00:00.000Z")
    // Only one fetch — the existence check. NO create call.
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toMatch(/\/bill\/BILL_OLD/)
  })

  it("RECREATES when entity was deleted in QBO since last sync", async () => {
    const supabase = makeSupabaseWithPriorDelivery({
      INTEG_DEDUP: {
        status: "delivered",
        delivered_at: "2026-04-17T16:00:00.000Z",
        qbo_entity_id: "BILL_DELETED",
        qbo_entity_type: "bill",
        qbo_entity_url: "https://sandbox.qbo.intuit.com/app/bill?txnId=BILL_DELETED&realmId=R",
      },
    })
    const { calls } = recordingFetch([
      // 1. Existence check — QBO returns 200 with status="Deleted"
      () => jsonRes({ Bill: { Id: "BILL_DELETED", status: "Deleted" } }),
      // 2. Vendor lookup
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V1", DisplayName: "X", Active: true }] } }),
      // 3. New Bill create
      () => jsonRes({ Bill: { Id: "BILL_NEW" } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        attach_source_document: false,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "INTEG_DEDUP",
      parserId: "P",
      documentId: "D",
      results: { v: "X", t: 100 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    expect(result.qbo_entity_id).toBe("BILL_NEW")
    // 3 calls: existence check, vendor lookup, Bill create.
    expect(calls).toHaveLength(3)
  })

  it("RECREATES when entity is hard-404'd in QBO", async () => {
    const supabase = makeSupabaseWithPriorDelivery({
      INTEG_DEDUP: {
        status: "delivered",
        qbo_entity_id: "BILL_404",
        qbo_entity_type: "bill",
        qbo_entity_url: "https://sandbox.qbo.intuit.com/app/bill?txnId=BILL_404&realmId=R",
      },
    })
    const { calls } = recordingFetch([
      () => jsonRes({}, 404),
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V1", DisplayName: "X", Active: true }] } }),
      () => jsonRes({ Bill: { Id: "BILL_REPLACEMENT" } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        attach_source_document: false,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "INTEG_DEDUP",
      parserId: "P",
      documentId: "D",
      results: { v: "X", t: 100 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    expect(result.qbo_entity_id).toBe("BILL_REPLACEMENT")
    expect(calls).toHaveLength(3)
  })

  it("BACKFILL: works on legacy rows that only stored doc_url (extracts entity Id from URL)", async () => {
    // Old orchestrator code only persisted doc_url. Make sure the dedup check
    // still works for those rows by parsing the txnId from the URL.
    const supabase = makeSupabaseWithPriorDelivery({
      INTEG_OLD: {
        status: "delivered",
        // Note: NO qbo_entity_id, NO qbo_entity_type — old shape
        doc_url: "https://sandbox.qbo.intuit.com/app/bill?txnId=145&realmId=R",
      },
    })
    const { calls } = recordingFetch([
      () => jsonRes({ Bill: { Id: "145" } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "bill",
        default_account_id: "A",
        attach_source_document: false,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "INTEG_OLD",
      parserId: "P",
      documentId: "D",
      results: { v: "X", t: 100 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    expect(result.qbo_entity_id).toBe("145")
    expect(calls).toHaveLength(1)
  })

  it("does NOT short-circuit when prior delivery was for a different entity type", async () => {
    // Edge case: user changed target_entity from Bill to Purchase. The Bill
    // record is in integration_status but doesn't apply to a Purchase delivery.
    const supabase = makeSupabaseWithPriorDelivery({
      INTEG_DEDUP: {
        status: "delivered",
        qbo_entity_id: "BILL_99",
        qbo_entity_type: "bill",
      },
    })
    const { calls } = recordingFetch([
      () => jsonRes({ QueryResponse: { Vendor: [{ Id: "V1", DisplayName: "X", Active: true }] } }),
      () => jsonRes({ Purchase: { Id: "PUR_50" } }),
    ])

    const result = await deliverToQuickBooks({
      config: cfg({
        target_entity: "purchase",
        default_account_id: "A",
        default_payment_account_id: "PAY",
        payment_type: "Cash",
        attach_source_document: false,
        field_mapping: { vendor_name: "v", total_amount: "t" },
      }),
      integrationId: "INTEG_DEDUP",
      parserId: "P",
      documentId: "D",
      results: { v: "X", t: 100 },
      metadata: { file_name: "f.pdf" },
      supabase,
    })

    expect(result.status).toBe("delivered")
    expect(result.qbo_entity_id).toBe("PUR_50")
    // No existence check — 2 calls (vendor lookup, Purchase create)
    expect(calls).toHaveLength(2)
  })
})
