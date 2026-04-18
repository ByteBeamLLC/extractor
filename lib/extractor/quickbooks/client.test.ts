import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  createVendor,
  entityExistsInQbo,
  fetchAllAccounts,
  fetchAllVendors,
  findCustomerByName,
  findVendorByName,
  getCompanyInfo,
  getQuickBooksClient,
  QuickBooksApiError,
  type QuickBooksClient,
} from "./client"
import type { QuickBooksConfig } from "@/lib/extractor/types"

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env.QUICKBOOKS_CLIENT_ID = "cid"
  process.env.QUICKBOOKS_CLIENT_SECRET = "csec"
  process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com"
  process.env.QUICKBOOKS_ENV = "sandbox"
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

const baseConfig = (over: Partial<QuickBooksConfig> = {}): QuickBooksConfig => ({
  realm_id: "REALM_42",
  access_token: "AT",
  refresh_token: "RT",
  token_expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  refresh_token_issued_at: new Date().toISOString(),
  environment: "sandbox",
  company_name: "Acme Co",
  target_entity: "bill",
  field_mapping: {},
  default_vendor_id: null,
  default_account_id: null,
  default_tax_code_id: null,
  default_payment_account_id: null,
  payment_type: null,
  auto_create_vendor: false,
  attach_source_document: true,
  accounts_snapshot: [],
  vendors_snapshot: [],
  customers_snapshot: [],
  tax_codes_snapshot: [],
  snapshot_refreshed_at: null,
  ...over,
})

const noopSupabase = (): any => ({
  from: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
  }),
})

function jsonRes(body: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers })
}

async function newClient(over: Partial<QuickBooksConfig> = {}): Promise<QuickBooksClient> {
  return getQuickBooksClient(baseConfig(over), "INTEG_1", noopSupabase())
}

// ─── request() basic shape ────────────────────────────────────────────────────

describe("QuickBooksClient.request", () => {
  it("targets the v3 path under /company/{realmId} with minorversion + auth header", async () => {
    const client = await newClient()
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes({ Vendor: { Id: "1", DisplayName: "X" } })
    )

    const out = await client.request<{ Vendor: { Id: string } }>({
      method: "POST",
      path: "/vendor",
      body: { DisplayName: "X" },
      requestId: "REQID-1",
    })

    expect(out.Vendor.Id).toBe("1")
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(
      /^https:\/\/sandbox-quickbooks\.api\.intuit\.com\/v3\/company\/REALM_42\/vendor\?/
    )
    const u = new URL(String(url))
    expect(u.searchParams.get("minorversion")).toBe("73")
    expect(u.searchParams.get("requestid")).toBe("REQID-1")

    const headers = new Headers((init as RequestInit).headers)
    expect(headers.get("Authorization")).toBe("Bearer AT")
    expect(headers.get("Accept")).toBe("application/json")
    expect(headers.get("Content-Type")).toBe("application/json")
    expect((init as RequestInit).body).toBe(JSON.stringify({ DisplayName: "X" }))
  })

  it("uses the production host when environment is production", async () => {
    const client = await newClient({ environment: "production" })
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonRes({}))
    await client.request({ method: "GET", path: "/companyinfo/REALM_42" })
    expect(String(fetchSpy.mock.calls[0][0])).toMatch(/^https:\/\/quickbooks\.api\.intuit\.com\//)
  })

  it("returns undefined for empty 200 bodies", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 200 }))
    const out = await client.request({ method: "POST", path: "/foo" })
    expect(out).toBeUndefined()
  })

  it("returns raw text when the body isn't JSON", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("not-json", { status: 200 }))
    const out = await client.request<string>({ method: "GET", path: "/x" })
    expect(out).toBe("not-json")
  })

  it("throws QuickBooksApiError with parsed Intuit fault on non-OK", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes(
        {
          Fault: {
            Error: [
              { code: "5010", Message: "Stale Object Update", Detail: "Bill version mismatch" },
            ],
          },
        },
        500
      )
    )
    await expect(client.request({ method: "POST", path: "/bill", body: {} })).rejects.toMatchObject({
      name: "QuickBooksApiError",
      status: 500,
      intuitCode: "5010",
      intuitDetail: "Bill version mismatch",
    })
  })
})

// ─── 429 / 503 backoff with Retry-After ───────────────────────────────────────

describe("rate-limit handling", () => {
  it("retries on 429 honoring Retry-After (seconds), then succeeds", async () => {
    const client = await newClient()
    // First 429 with Retry-After 1, second OK.
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes("rate limited", 429, { "Retry-After": "1" }))
      .mockResolvedValueOnce(jsonRes({ ok: true }))

    vi.useFakeTimers()
    const promise = client.request<{ ok: boolean }>({ method: "GET", path: "/x" })
    // Advance past the 1s retry-after.
    await vi.advanceTimersByTimeAsync(1_500)
    const out = await promise
    vi.useRealTimers()

    expect(out).toEqual({ ok: true })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it("retries on 503 with exponential backoff when no Retry-After header", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes("svc down", 503))
      .mockResolvedValueOnce(jsonRes({ ok: true }))

    vi.useFakeTimers()
    const promise = client.request<{ ok: boolean }>({ method: "GET", path: "/y" })
    // First retry waits ~2s (2_000 * 2^0).
    await vi.advanceTimersByTimeAsync(2_500)
    const out = await promise
    vi.useRealTimers()

    expect(out).toEqual({ ok: true })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it("gives up after MAX_RETRIES on persistent 429 and throws", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonRes("rate limited", 429, { "Retry-After": "0" }))

    vi.useFakeTimers()
    // Attach catch-handler immediately so the rejection isn't "unhandled" while
    // we drain timers. We assert below.
    const promise = client.request({ method: "GET", path: "/z" })
    const settled = promise.then(
      () => ({ ok: true as const }),
      (e: unknown) => ({ ok: false as const, err: e })
    )
    // Exponential fallback (Retry-After 0 → "no header" branch): 2s + 4s + 8s = 14s
    await vi.advanceTimersByTimeAsync(20_000)
    const result = await settled
    vi.useRealTimers()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.err).toBeInstanceOf(QuickBooksApiError)
    }
    // 1 initial attempt + 3 retries = 4 calls.
    expect(fetchSpy).toHaveBeenCalledTimes(4)
  })

  it("does NOT retry on 4xx other than 429", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ Fault: { Error: [{ Detail: "bad" }] } }, 400))

    await expect(client.request({ method: "POST", path: "/x", body: {} })).rejects.toBeInstanceOf(
      QuickBooksApiError
    )
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})

// ─── attach() multipart upload ────────────────────────────────────────────────

describe("QuickBooksClient.attach", () => {
  it("posts multipart/form-data with metadata + binary parts to /upload", async () => {
    const client = await newClient()
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes({
        // QBO returns this under `AttachableResponse` (singular). Older code
        // referenced `AttachableResponseArray` which is the legacy shape — we
        // still accept it but the canonical / current key is this one.
        AttachableResponse: [{ Attachable: { Id: "ATT_77", FileAccessUri: "/dl" } }],
      })
    )

    const res = await client.attach({
      fileName: "invoice.pdf",
      contentType: "application/pdf",
      data: Buffer.from([1, 2, 3, 4]),
      attachToType: "Bill",
      attachToId: "BILL_5",
      requestId: "REQ-A",
    })

    expect(res.id).toBe("ATT_77")
    expect(res.downloadUrl).toBe("/dl")

    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/\/v3\/company\/REALM_42\/upload\?/)
    const headers = new Headers((init as RequestInit).headers)
    expect(headers.get("Content-Type")).toMatch(/^multipart\/form-data; boundary=parsli_qbo_/)

    // Body must contain both parts and the boundary.
    const body = init?.body
    expect(Buffer.isBuffer(body)).toBe(true)
    const bodyStr = (body as Buffer).toString("utf8")
    expect(bodyStr).toMatch(/Content-Disposition: form-data; name="file_metadata_01"/)
    expect(bodyStr).toMatch(/Content-Disposition: form-data; name="file_content_01"; filename="invoice.pdf"/)
    expect(bodyStr).toContain('"AttachableRef"')
    expect(bodyStr).toContain('"value":"BILL_5"')
    expect(bodyStr).toContain('"type":"Bill"')
  })

  it("throws QuickBooksApiError when /upload responds non-OK", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes({ Fault: { Error: [{ Detail: "Too big", code: "6000" }] } }, 413)
    )
    await expect(
      client.attach({
        fileName: "x.pdf",
        contentType: "application/pdf",
        data: Buffer.from([0]),
        attachToType: "Bill",
        attachToId: "B1",
      })
    ).rejects.toMatchObject({ name: "QuickBooksApiError", status: 413, intuitCode: "6000" })
  })

  it("throws when QBO returns 200 but no Attachable.Id", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonRes({ AttachableResponse: [{}] }))
    await expect(
      client.attach({
        fileName: "x.pdf",
        contentType: "application/pdf",
        data: Buffer.from([0]),
        attachToType: "Bill",
        attachToId: "B1",
      })
    ).rejects.toThrow(/Attachable upload returned no Id/)
  })

  it("accepts the legacy AttachableResponseArray shape (defensive fallback)", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes({ AttachableResponseArray: [{ Attachable: { Id: "ATT_LEGACY" } }] })
    )
    const out = await client.attach({
      fileName: "x.pdf",
      contentType: "application/pdf",
      data: Buffer.from([0]),
      attachToType: "Bill",
      attachToId: "B1",
    })
    expect(out.id).toBe("ATT_LEGACY")
  })

  it("surfaces a per-entry Fault as a QuickBooksApiError instead of a generic 'no Id'", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes({
        AttachableResponse: [
          {
            Fault: {
              Error: [{ code: "6000", Message: "File too big", Detail: "25MB max" }],
            },
          },
        ],
      })
    )
    await expect(
      client.attach({
        fileName: "x.pdf",
        contentType: "application/pdf",
        data: Buffer.from([0]),
        attachToType: "Bill",
        attachToId: "B1",
      })
    ).rejects.toMatchObject({
      name: "QuickBooksApiError",
      intuitCode: "6000",
      intuitDetail: "25MB max",
    })
  })

  it("includes the raw body snippet when shape is totally unexpected (debugging aid)", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonRes({ unexpected: "shape" }))
    await expect(
      client.attach({
        fileName: "x.pdf",
        contentType: "application/pdf",
        data: Buffer.from([0]),
        attachToType: "Bill",
        attachToId: "B1",
      })
    ).rejects.toThrow(/Attachable upload returned no Id.*unexpected/)
  })

  it("escapes filename quotes / CRLF to keep multipart frame valid", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ AttachableResponseArray: [{ Attachable: { Id: "X" } }] }))

    await client.attach({
      fileName: 'evil"\rname\n.pdf',
      contentType: "application/pdf",
      data: Buffer.from([0]),
      attachToType: "Bill",
      attachToId: "B1",
    })

    const body = (fetchSpy.mock.calls[0][1] as RequestInit).body as Buffer
    const str = body.toString("utf8")
    // " → _, \r → _, \n → _ ; three replacements make "evil__name_.pdf"
    expect(str).toContain('filename="evil__name_.pdf"')
    // The Content-Disposition line itself must not break out via raw quote/CRLF.
    const disposition = str
      .split("\r\n")
      .find((l) => l.startsWith("Content-Disposition: form-data; name=\"file_content_01\""))
    expect(disposition).toBeDefined()
    expect(disposition).not.toMatch(/[\r\n]evil/)
  })
})

// ─── query() + lookups + paginate ─────────────────────────────────────────────

describe("query helpers", () => {
  it("query() sends the SQL via the ?query= param", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ QueryResponse: { Vendor: [] } }))
    await client.query("SELECT * FROM Vendor")
    const u = new URL(String(fetchSpy.mock.calls[0][0]))
    expect(u.pathname).toMatch(/\/query$/)
    expect(u.searchParams.get("query")).toBe("SELECT * FROM Vendor")
  })

  it("findVendorByName escapes single quotes to prevent SQL break-out", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ QueryResponse: { Vendor: [{ Id: "1", DisplayName: "O'Brien", Active: true }] } }))
    await findVendorByName(client, "O'Brien & Sons")
    const u = new URL(String(fetchSpy.mock.calls[0][0]))
    expect(u.searchParams.get("query")).toBe(
      "SELECT * FROM Vendor WHERE Active = true AND DisplayName = 'O\\'Brien & Sons' MAXRESULTS 1"
    )
  })

  it("findVendorByName filters out inactive vendors (audit fix #2)", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ QueryResponse: {} }))
    await findVendorByName(client, "Globex")
    const u = new URL(String(fetchSpy.mock.calls[0][0]))
    // Active = true must be in the WHERE clause so we don't silently match
    // archived vendors and try to post Bills against them.
    expect(u.searchParams.get("query")).toMatch(/Active = true AND DisplayName = 'Globex'/)
  })

  it("findVendorByName trims + collapses whitespace (audit fix #3)", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ QueryResponse: {} }))
    await findVendorByName(client, "  ByteBeam   Agency  ")
    const u = new URL(String(fetchSpy.mock.calls[0][0]))
    expect(u.searchParams.get("query")).toContain("DisplayName = 'ByteBeam Agency'")
  })

  it("findVendorByName returns null for empty/whitespace-only name (no DB call)", async () => {
    const client = await newClient()
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    expect(await findVendorByName(client, "   ")).toBeNull()
    expect(await findVendorByName(client, "")).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("findVendorByName returns null when QBO returns no rows", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonRes({ QueryResponse: {} }))
    expect(await findVendorByName(client, "Nobody")).toBeNull()
  })

  it("findCustomerByName escapes single quotes and filters Active=true", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ QueryResponse: { Customer: [{ Id: "C1", DisplayName: "Foo's Bar", Active: true }] } }))
    const result = await findCustomerByName(client, "Foo's Bar")
    expect(result?.Id).toBe("C1")
    const u = new URL(String(fetchSpy.mock.calls[0][0]))
    expect(u.searchParams.get("query")).toContain("Active = true AND DisplayName = 'Foo\\'s Bar'")
  })

  it("createVendor POSTs to /vendor with the requestid and unwraps Vendor", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ Vendor: { Id: "V99", DisplayName: "New Vendor", Active: true } }))
    const v = await createVendor(client, "New Vendor", "REQ-V")
    expect(v.Id).toBe("V99")
    const [url, init] = fetchSpy.mock.calls[0]
    const u = new URL(String(url))
    expect(u.pathname).toMatch(/\/vendor$/)
    expect(u.searchParams.get("requestid")).toBe("REQ-V")
    expect(JSON.parse(init?.body as string)).toEqual({ DisplayName: "New Vendor" })
  })

  it("createVendor normalizes the name before POSTing (audit fix #3)", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ Vendor: { Id: "V100", DisplayName: "Acme Co", Active: true } }))
    await createVendor(client, "  Acme   Co  ", "REQ-X")
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
    // Critical so that lookup-then-create roundtrip is symmetric: the vendor we
    // create has the same normalized name we'd look up next time.
    expect(body.DisplayName).toBe("Acme Co")
  })

  it("getCompanyInfo unwraps the CompanyInfo object", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes({ CompanyInfo: { CompanyName: "Acme Corp", Country: "US" } })
    )
    const info = await getCompanyInfo(client)
    expect(info.CompanyName).toBe("Acme Corp")
  })
})

describe("entityExistsInQbo (audit fix #1 — duplicate prevention)", () => {
  it("returns true when QBO returns 200 with the entity present", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonRes({ Bill: { Id: "147" } }))
    expect(await entityExistsInQbo(client, "bill", "147")).toBe(true)
  })

  it("returns false when entity has status='Deleted'", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes({ Bill: { Id: "147", status: "Deleted" } })
    )
    expect(await entityExistsInQbo(client, "bill", "147")).toBe(false)
  })

  it("returns false when entity has status='Voided'", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes({ Purchase: { Id: "5", status: "Voided" } })
    )
    expect(await entityExistsInQbo(client, "purchase", "5")).toBe(false)
  })

  it("returns false on 404 (entity hard-deleted)", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonRes({}, 404))
    expect(await entityExistsInQbo(client, "bill", "999")).toBe(false)
  })

  it("returns false on Intuit 'ObjectNotFound' fault even with non-404 status", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes(
        { Fault: { Error: [{ code: "ObjectNotFound", Detail: "Bill not found" }] } },
        400
      )
    )
    expect(await entityExistsInQbo(client, "bill", "999")).toBe(false)
  })

  it("FAIL-SAFE: returns true on auth/rate-limit failures (don't recreate when uncertain)", async () => {
    // 401 → unrecoverable but we don't know if entity exists.
    // We must return true so the caller skips creation (better to do nothing
    // than create a duplicate).
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonRes({}, 401))
    expect(await entityExistsInQbo(client, "bill", "147")).toBe(true)
  })

  it("hits the right entity path (/v3/company/{realm}/{type}/{id})", async () => {
    const client = await newClient()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ Invoice: { Id: "42" } }))
    await entityExistsInQbo(client, "invoice", "42")
    const url = new URL(String(fetchSpy.mock.calls[0][0]))
    expect(url.pathname).toMatch(/\/v3\/company\/REALM_42\/invoice\/42$/)
  })
})

describe("paginate (via fetchAllAccounts / fetchAllVendors)", () => {
  it("returns a single page when QBO returns fewer rows than the page size", async () => {
    const client = await newClient()
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonRes({ QueryResponse: { Account: [{ Id: "A1", Name: "Cash", AccountType: "Bank", Active: true }] } })
    )
    const accounts = await fetchAllAccounts(client)
    expect(accounts).toHaveLength(1)
    expect(accounts[0].Name).toBe("Cash")
  })

  it("walks pages until a short page signals completion", async () => {
    const client = await newClient()
    const page1 = Array.from({ length: 1000 }, (_, i) => ({
      Id: `${i}`,
      DisplayName: `Vendor ${i}`,
      Active: true,
    }))
    const page2 = [
      { Id: "1000", DisplayName: "Vendor 1000", Active: true },
      { Id: "1001", DisplayName: "Vendor 1001", Active: true },
    ]
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonRes({ QueryResponse: { Vendor: page1 } }))
      .mockResolvedValueOnce(jsonRes({ QueryResponse: { Vendor: page2 } }))

    const all = await fetchAllVendors(client)
    expect(all).toHaveLength(1002)
    expect(all[1001].DisplayName).toBe("Vendor 1001")
  })
})
