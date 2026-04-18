/**
 * Intuit QuickBooks Online OAuth 2.0 utilities.
 *
 * Two non-obvious facts that drive this code:
 *   1. Refresh tokens rotate roughly every 24 hours (per Intuit's Nov 2025
 *      policy update). Every refresh response MUST be persisted immediately,
 *      including the new refresh_token, or the next call fails with
 *      `invalid_grant` and the customer is locked out.
 *   2. There is a hard 5-year cap on refresh-token lifetime regardless of use.
 *      We capture `refresh_token_issued_at` so the UI can surface a reconnect
 *      banner before the cap.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { QuickBooksConfig } from "@/lib/extractor/types"

const DISCOVERY_PROD = "https://developer.api.intuit.com/.well-known/openid_configuration"
const DISCOVERY_SANDBOX =
  "https://developer.api.intuit.com/.well-known/openid_sandbox_configuration"

// Intuit publishes endpoints via OIDC discovery. We hard-code the well-known
// values here — they have not changed in years and pulling them at runtime
// just adds a network round-trip on every OAuth call.
const QBO_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2"
const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
const QBO_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke"

// `com.intuit.quickbooks.accounting` covers all accounting entities (Bill,
// Purchase, Invoice, Attachable, etc). `openid` is required so we can hit the
// userinfo endpoint and confirm the connection. We deliberately do NOT request
// `com.intuit.quickbooks.payment` — payments scopes trigger additional
// compliance review and aren't needed for document push.
const SCOPES = ["com.intuit.quickbooks.accounting", "openid"]

function getClientId(): string {
  const id = process.env.QUICKBOOKS_CLIENT_ID
  if (!id) throw new Error("QUICKBOOKS_CLIENT_ID is not set")
  return id
}

function getClientSecret(): string {
  const secret = process.env.QUICKBOOKS_CLIENT_SECRET
  if (!secret) throw new Error("QUICKBOOKS_CLIENT_SECRET is not set")
  return secret
}

export function getQuickBooksEnvironment(): "sandbox" | "production" {
  // Default to sandbox so a misconfigured deploy never silently writes to a
  // customer's real books.
  const env = (process.env.QUICKBOOKS_ENV ?? "sandbox").toLowerCase()
  return env === "production" ? "production" : "sandbox"
}

export function getQuickBooksApiBase(env: "sandbox" | "production"): string {
  return env === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com"
}

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  return `${base}/api/auth/quickbooks/callback`
}

export function buildQuickBooksAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
  })
  return `${QBO_AUTH_URL}?${params.toString()}`
}

export interface QuickBooksTokenSet {
  access_token: string
  refresh_token: string
  expires_in: number
  x_refresh_token_expires_in: number
  token_type: string
}

function basicAuthHeader(): string {
  return `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString("base64")}`
}

export async function exchangeCodeForTokens(code: string): Promise<QuickBooksTokenSet> {
  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`QBO token exchange failed (${res.status}): ${err}`)
  }

  return (await res.json()) as QuickBooksTokenSet
}

export async function refreshTokens(refreshToken: string): Promise<QuickBooksTokenSet> {
  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    // Surface invalid_grant clearly so callers can flip the integration into
    // a "needs reconnect" state instead of treating it as a transient failure.
    throw new Error(`QBO token refresh failed (${res.status}): ${err}`)
  }

  return (await res.json()) as QuickBooksTokenSet
}

/**
 * Revoke a refresh (or access) token. Intuit accepts either; revoking the
 * refresh token invalidates the entire grant. We always revoke the refresh
 * token on disconnect.
 */
export async function revokeToken(token: string): Promise<void> {
  const res = await fetch(QBO_REVOKE_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ token }),
  })

  if (!res.ok && res.status !== 200) {
    // Intuit returns 200 with empty body on success. Anything else, log but
    // don't throw — we still want to clear the integration on our side even
    // if Intuit's revoke endpoint is misbehaving.
    const body = await res.text().catch(() => "")
    console.warn(`[qbo-oauth] Revoke returned ${res.status}: ${body}`)
  }
}

/**
 * Ensures the access token in `config` is valid for at least the next 5 minutes,
 * refreshing in-place if not. Returns the up-to-date access token.
 *
 * Persists any rotated refresh_token to the integration row immediately. This
 * is the single most important invariant in the QBO integration — losing a
 * rotated refresh_token means the next call returns `invalid_grant` and the
 * customer must reconnect.
 */
export async function ensureFreshAccessToken(
  config: QuickBooksConfig,
  integrationId: string,
  supabase: SupabaseClient
): Promise<{ accessToken: string; updatedConfig: QuickBooksConfig }> {
  const expiry = new Date(config.token_expiry).getTime()
  if (Number.isFinite(expiry) && Date.now() < expiry - 5 * 60 * 1000) {
    return { accessToken: config.access_token, updatedConfig: config }
  }

  let tokens: QuickBooksTokenSet
  try {
    tokens = await refreshTokens(config.refresh_token)
  } catch (err) {
    // Mark integration as errored so the UI can surface a "Reconnect" CTA.
    await supabase
      .from("parser_integrations")
      .update({
        last_error: err instanceof Error ? err.message : "Token refresh failed",
        is_active: false,
      })
      .eq("id", integrationId)
    throw err
  }

  const updatedConfig: QuickBooksConfig = {
    ...config,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    refresh_token_issued_at: new Date().toISOString(),
  }

  // Persist immediately. If the process dies between the refresh response and
  // this write, the next call fails with invalid_grant. There is no clean way
  // to recover — Intuit invalidates the previous refresh_token the moment they
  // mint a new one. That risk is the price of OAuth 2.0 with rotation.
  const { error } = await supabase
    .from("parser_integrations")
    .update({ config: updatedConfig })
    .eq("id", integrationId)

  if (error) {
    throw new Error(`Failed to persist rotated QBO tokens: ${error.message}`)
  }

  return { accessToken: tokens.access_token, updatedConfig }
}

export const QUICKBOOKS_DISCOVERY_URLS = {
  sandbox: DISCOVERY_SANDBOX,
  production: DISCOVERY_PROD,
} as const
