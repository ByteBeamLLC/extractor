import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  buildQuickBooksAuthUrl,
  ensureFreshAccessToken,
  exchangeCodeForTokens,
  getQuickBooksApiBase,
  getQuickBooksEnvironment,
  refreshTokens,
  revokeToken,
} from "./oauth"
import { decryptToken, encryptToken } from "./tokenCrypto"
import type { QuickBooksConfig } from "@/lib/extractor/types"

// Save real env so we can restore it; tests mutate process.env freely.
const ORIGINAL_ENV = { ...process.env }

// Test key (32-byte hex). Real deploys use a different, cryptographically
// random key set via Vercel env.
const TEST_CRYPTO_KEY = "a".repeat(64)

beforeEach(() => {
  process.env.QUICKBOOKS_CLIENT_ID = "test-client-id"
  process.env.QUICKBOOKS_CLIENT_SECRET = "test-client-secret"
  process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com"
  process.env.QUICKBOOKS_ENV = "sandbox"
  process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY = TEST_CRYPTO_KEY
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

// ─── Pure helpers ─────────────────────────────────────────────────────────────

describe("getQuickBooksEnvironment", () => {
  it("defaults to sandbox when QUICKBOOKS_ENV is unset", () => {
    delete process.env.QUICKBOOKS_ENV
    expect(getQuickBooksEnvironment()).toBe("sandbox")
  })
  it("returns production only on exact 'production' (case-insensitive)", () => {
    process.env.QUICKBOOKS_ENV = "production"
    expect(getQuickBooksEnvironment()).toBe("production")
    process.env.QUICKBOOKS_ENV = "PRODUCTION"
    expect(getQuickBooksEnvironment()).toBe("production")
  })
  it("treats unknown values as sandbox (fail-closed)", () => {
    process.env.QUICKBOOKS_ENV = "staging"
    expect(getQuickBooksEnvironment()).toBe("sandbox")
    process.env.QUICKBOOKS_ENV = "prod"
    expect(getQuickBooksEnvironment()).toBe("sandbox")
  })
})

describe("getQuickBooksApiBase", () => {
  it("returns production host for production", () => {
    expect(getQuickBooksApiBase("production")).toBe("https://quickbooks.api.intuit.com")
  })
  it("returns sandbox host for sandbox", () => {
    expect(getQuickBooksApiBase("sandbox")).toBe("https://sandbox-quickbooks.api.intuit.com")
  })
})

describe("buildQuickBooksAuthUrl", () => {
  it("includes all OAuth2 params with the configured redirect_uri", () => {
    const url = new URL(buildQuickBooksAuthUrl("STATE123"))
    expect(url.origin + url.pathname).toBe("https://appcenter.intuit.com/connect/oauth2")
    expect(url.searchParams.get("client_id")).toBe("test-client-id")
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://app.example.com/api/auth/quickbooks/callback"
    )
    expect(url.searchParams.get("response_type")).toBe("code")
    expect(url.searchParams.get("state")).toBe("STATE123")
    // Both required scopes must be present (space-separated).
    expect(url.searchParams.get("scope")).toBe("com.intuit.quickbooks.accounting openid")
  })

  it("falls back to localhost when NEXT_PUBLIC_SITE_URL is unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    const url = new URL(buildQuickBooksAuthUrl("S"))
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/quickbooks/callback"
    )
  })

  it("throws when QUICKBOOKS_CLIENT_ID is missing", () => {
    delete process.env.QUICKBOOKS_CLIENT_ID
    expect(() => buildQuickBooksAuthUrl("S")).toThrow(/QUICKBOOKS_CLIENT_ID/)
  })
})

// ─── Token exchange / refresh / revoke ────────────────────────────────────────

function mockFetchOnce(body: unknown, init: { ok?: boolean; status?: number; headers?: Record<string, string> } = {}) {
  const response = new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status: init.status ?? (init.ok === false ? 500 : 200),
    headers: init.headers,
  })
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response)
}

describe("exchangeCodeForTokens", () => {
  it("posts code with basic auth + form body to the token endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "AT",
          refresh_token: "RT",
          expires_in: 3600,
          x_refresh_token_expires_in: 8726400,
          token_type: "bearer",
        })
      )
    )

    const tokens = await exchangeCodeForTokens("AUTH_CODE")

    expect(tokens.access_token).toBe("AT")
    expect(tokens.refresh_token).toBe("RT")
    expect(tokens.expires_in).toBe(3600)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer")
    expect((init as RequestInit).method).toBe("POST")

    const headers = new Headers((init as RequestInit).headers)
    const expectedAuth = "Basic " + Buffer.from("test-client-id:test-client-secret").toString("base64")
    expect(headers.get("Authorization")).toBe(expectedAuth)
    expect(headers.get("Content-Type")).toBe("application/x-www-form-urlencoded")
    expect(headers.get("Accept")).toBe("application/json")

    const params = new URLSearchParams(init?.body as string)
    expect(params.get("grant_type")).toBe("authorization_code")
    expect(params.get("code")).toBe("AUTH_CODE")
    expect(params.get("redirect_uri")).toBe("https://app.example.com/api/auth/quickbooks/callback")
  })

  it("throws with the response body on non-OK status", async () => {
    mockFetchOnce("invalid_grant: whatever", { status: 400 })
    await expect(exchangeCodeForTokens("BAD")).rejects.toThrow(/QBO token exchange failed \(400\)/)
  })
})

describe("refreshTokens", () => {
  it("sends grant_type=refresh_token + the refresh token in the form body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "NEW_AT",
          refresh_token: "ROTATED_RT",
          expires_in: 3600,
          x_refresh_token_expires_in: 8726400,
          token_type: "bearer",
        })
      )
    )
    const tokens = await refreshTokens("OLD_RT")

    expect(tokens.access_token).toBe("NEW_AT")
    expect(tokens.refresh_token).toBe("ROTATED_RT")

    const [, init] = fetchMock.mock.calls[0]
    const params = new URLSearchParams(init?.body as string)
    expect(params.get("grant_type")).toBe("refresh_token")
    expect(params.get("refresh_token")).toBe("OLD_RT")
  })

  it("throws on non-OK with details (so caller can surface invalid_grant)", async () => {
    mockFetchOnce({ error: "invalid_grant" }, { status: 400 })
    await expect(refreshTokens("X")).rejects.toThrow(/QBO token refresh failed \(400\)/)
  })
})

describe("revokeToken", () => {
  it("posts the token JSON-encoded to the revoke endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 200 }))
    await revokeToken("RT123")
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://developer.api.intuit.com/v2/oauth2/tokens/revoke")
    expect(JSON.parse(init?.body as string)).toEqual({ token: "RT123" })
  })

  it("does not throw when revoke returns non-200 — local cleanup must still proceed", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 401 }))
    await expect(revokeToken("RT")).resolves.toBeUndefined()
  })
})

// ─── ensureFreshAccessToken — the high-stakes function ────────────────────────

function makeSupabaseSpy() {
  const update = vi.fn().mockResolvedValue({ error: null })
  const eq = vi.fn().mockReturnValue({})
  const updateChain = vi.fn().mockImplementation((patch: unknown) => ({
    eq: vi.fn().mockImplementation(() => {
      // Capture the patch via the outer update mock.
      update(patch)
      return Promise.resolve({ error: null })
    }),
  }))
  const from = vi.fn().mockReturnValue({ update: updateChain })
  return {
    supabase: { from } as any,
    update,
    from,
  }
}

/**
 * Build a config in the SHAPE WE STORE IN PRODUCTION: access_token and
 * refresh_token are always AES-256-GCM ciphertext in the DB (Intuit security
 * requirement). Tests that exercise the read path should start here.
 *
 * Legacy-plaintext behavior is covered by a separate helper.
 */
const baseConfig = (overrides: Partial<QuickBooksConfig> = {}): QuickBooksConfig => ({
  realm_id: "RID",
  access_token: encryptToken("OLD_AT"),
  refresh_token: encryptToken("OLD_RT"),
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
  attach_source_document: true,
  accounts_snapshot: [],
  vendors_snapshot: [],
  customers_snapshot: [],
  tax_codes_snapshot: [],
  snapshot_refreshed_at: null,
  ...overrides,
})

/**
 * Config with tokens stored as LEGACY PLAINTEXT — mimics a row created before
 * encryption was deployed. Used to verify the transparent migration on read.
 */
const legacyPlaintextConfig = (
  overrides: Partial<QuickBooksConfig> = {}
): QuickBooksConfig => ({
  ...baseConfig(),
  access_token: "OLD_AT",
  refresh_token: "OLD_RT",
  ...overrides,
})

describe("ensureFreshAccessToken", () => {
  it("returns the decrypted access token on the fast path when expiry is comfortably in the future (no fetch, no DB write)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const { supabase, update } = makeSupabaseSpy()
    // baseConfig stores tokens in production shape (encrypted).
    const cfg = baseConfig({ token_expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString() })

    const result = await ensureFreshAccessToken(cfg, "INTEG_1", supabase)

    // Caller receives PLAINTEXT for in-memory use; stored config stays encrypted.
    expect(result.accessToken).toBe("OLD_AT")
    expect(result.updatedConfig).toBe(cfg) // same reference — no changes
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it("refreshes when token expires within the 5-minute safety window and encrypts the new tokens at rest", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "NEW_AT",
          refresh_token: "ROTATED_RT",
          expires_in: 3600,
          x_refresh_token_expires_in: 8726400,
          token_type: "bearer",
        })
      )
    )
    const { supabase } = makeSupabaseSpy()
    // Expires in 4 minutes — inside the safety window.
    const cfg = baseConfig({ token_expiry: new Date(Date.now() + 4 * 60 * 1000).toISOString() })

    const result = await ensureFreshAccessToken(cfg, "INTEG_1", supabase)
    // Plaintext returned to caller for in-memory use.
    expect(result.accessToken).toBe("NEW_AT")
    // But the updatedConfig shape matches what went to the DB — encrypted.
    expect(result.updatedConfig.refresh_token).not.toBe("ROTATED_RT")
    expect(result.updatedConfig.refresh_token.startsWith("qbo_enc:v1:")).toBe(true)
    expect(decryptToken(result.updatedConfig.refresh_token)).toBe("ROTATED_RT")
    expect(decryptToken(result.updatedConfig.access_token)).toBe("NEW_AT")
  })

  it("PERSISTS the rotated refresh_token immediately after refresh — ENCRYPTED at rest (critical invariant)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "NEW_AT",
          refresh_token: "ROTATED_RT_DIFFERENT",
          expires_in: 3600,
          x_refresh_token_expires_in: 8726400,
          token_type: "bearer",
        })
      )
    )
    const { supabase, from } = makeSupabaseSpy()
    const cfg = baseConfig({ token_expiry: new Date(Date.now() - 1000).toISOString() }) // expired

    await ensureFreshAccessToken(cfg, "INTEG_42", supabase)

    expect(from).toHaveBeenCalledWith("parser_integrations")
    const updateChain = (from.mock.results[0].value as any).update
    expect(updateChain).toHaveBeenCalledTimes(1)
    const patch = (updateChain as any).mock.calls[0][0]
    // Intuit requirement: refresh_token must be stored encrypted, NOT plaintext.
    // A reviewer checking the DB column must see ciphertext, not the token value.
    expect(patch.config.refresh_token).not.toBe("ROTATED_RT_DIFFERENT")
    expect(patch.config.refresh_token.startsWith("qbo_enc:v1:")).toBe(true)
    expect(decryptToken(patch.config.refresh_token)).toBe("ROTATED_RT_DIFFERENT")
    expect(patch.config.access_token).not.toBe("NEW_AT")
    expect(decryptToken(patch.config.access_token)).toBe("NEW_AT")
    // refresh_token_issued_at must be bumped so the UI can show a reconnect banner before 5y.
    expect(typeof patch.config.refresh_token_issued_at).toBe("string")
    expect(new Date(patch.config.refresh_token_issued_at).getTime()).toBeGreaterThan(
      Date.now() - 5_000
    )
  })

  it("MIGRATION: re-encrypts legacy plaintext tokens on read even when access token is still fresh", async () => {
    // Backwards-compat path: integrations created before encryption was
    // deployed have plaintext tokens in the DB. On first touch after deploy,
    // we should silently re-encrypt them in place — WITHOUT hitting Intuit.
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const { supabase, from } = makeSupabaseSpy()
    const cfg = legacyPlaintextConfig({
      token_expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })

    const result = await ensureFreshAccessToken(cfg, "INTEG_MIG", supabase)

    // Caller still gets the plaintext token for in-memory use.
    expect(result.accessToken).toBe("OLD_AT")
    // No network call — migration is local only.
    expect(fetchSpy).not.toHaveBeenCalled()
    // DB was updated with encrypted versions of the same token values.
    const updateChain = (from.mock.results[0].value as any).update
    expect(updateChain).toHaveBeenCalledTimes(1)
    const patch = (updateChain as any).mock.calls[0][0]
    expect(patch.config.access_token.startsWith("qbo_enc:v1:")).toBe(true)
    expect(patch.config.refresh_token.startsWith("qbo_enc:v1:")).toBe(true)
    expect(decryptToken(patch.config.access_token)).toBe("OLD_AT")
    expect(decryptToken(patch.config.refresh_token)).toBe("OLD_RT")
  })

  it("on refresh failure marks the integration is_active=false and surfaces the error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("invalid_grant", { status: 400 }))
    // Capture the failure-path update.
    const updates: any[] = []
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((patch: any) => {
          updates.push(patch)
          return { eq: vi.fn().mockResolvedValue({ error: null }) }
        }),
      }),
    } as any
    const cfg = baseConfig({ token_expiry: new Date(Date.now() - 1000).toISOString() })

    await expect(ensureFreshAccessToken(cfg, "INTEG_1", supabase)).rejects.toThrow(
      /QBO token refresh failed/
    )
    // Exactly one update — the inactive-marker — and it must NOT have leaked tokens.
    expect(updates).toHaveLength(1)
    expect(updates[0].is_active).toBe(false)
    expect(typeof updates[0].last_error).toBe("string")
    expect(updates[0]).not.toHaveProperty("config")
  })

  it("throws if persisting the rotated token to Supabase fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "NEW_AT",
          refresh_token: "ROTATED",
          expires_in: 3600,
          x_refresh_token_expires_in: 8726400,
          token_type: "bearer",
        })
      )
    )
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "RLS denied" } }),
        }),
      }),
    } as any
    const cfg = baseConfig({ token_expiry: new Date(Date.now() - 1).toISOString() })

    await expect(ensureFreshAccessToken(cfg, "INTEG_1", supabase)).rejects.toThrow(
      /Failed to persist rotated QBO tokens.*RLS denied/
    )
  })
})
