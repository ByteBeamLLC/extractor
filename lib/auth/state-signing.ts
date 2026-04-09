import crypto from "crypto"

/**
 * HMAC-sign and verify the OAuth state parameter to prevent forgery.
 *
 * The state contains {next, anon_uid, bridge_token, ts} and is passed through
 * Google OAuth as a query parameter. Without signing, an attacker who knows
 * a victim's anon_uid could forge a state and steal their data during
 * migration. The HMAC ensures only our server can create valid states.
 *
 * Format: base64url(JSON) . HMAC-SHA256(base64url(JSON)) . timestamp
 * The timestamp is inside the payload AND in the suffix for quick expiry check.
 */

const STATE_TTL_MS = 15 * 60 * 1000 // 15 minutes

function getSecret(): string {
  const secret = process.env.STATE_SIGNING_SECRET
  if (!secret) {
    throw new Error("STATE_SIGNING_SECRET is not set")
  }
  return secret
}

export interface OAuthStatePayload {
  next: string
  anon_uid?: string
  bridge_token?: string
  ts: number
}

/**
 * Create a signed OAuth state parameter.
 * Returns: base64url(JSON).hmac
 */
export function signState(payload: Omit<OAuthStatePayload, "ts">): string {
  const full: OAuthStatePayload = { ...payload, ts: Date.now() }
  const body = Buffer.from(JSON.stringify(full)).toString("base64url")
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url")
  return `${body}.${hmac}`
}

/**
 * Verify and decode a signed OAuth state parameter.
 * Returns the payload if valid and not expired, or null if invalid.
 */
export function verifyState(state: string): OAuthStatePayload | null {
  const dotIndex = state.lastIndexOf(".")
  if (dotIndex === -1) return null

  const body = state.slice(0, dotIndex)
  const receivedHmac = state.slice(dotIndex + 1)

  // Constant-time comparison to prevent timing attacks
  const expectedHmac = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url")

  if (receivedHmac.length !== expectedHmac.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac))) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as OAuthStatePayload

    // Reject states older than TTL
    if (Date.now() - payload.ts > STATE_TTL_MS) return null

    return payload
  } catch {
    return null
  }
}
