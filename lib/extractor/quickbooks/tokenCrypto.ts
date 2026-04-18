/**
 * Application-level encryption for QuickBooks OAuth tokens at rest.
 *
 * Required by Intuit's security review:
 *   https://developer.intuit.com/app/developer/qbo/docs/go-live/publish-app/security-requirements
 *
 *   "Encrypt and store the refresh token and realmID in persistent memory.
 *    Encrypt the refresh token with a symmetric algorithm (3DES or AES).
 *    AES is preferred. Store your AES key in your app, in a separate
 *    configuration file."
 *
 * Supabase disk encryption (TDE) is NOT sufficient — Intuit's reviewer checks
 * whether the token column contains plaintext. We use AES-256-GCM (authenticated
 * encryption) with per-ciphertext random IV, which is the modern equivalent of
 * the "symmetric algorithm" Intuit calls for.
 *
 * ## Storage format
 *
 *   `qbo_enc:v1:<base64(iv || ciphertext || authTag)>`
 *
 * The `qbo_enc:v1:` prefix serves two purposes:
 *   1. Lets us tell encrypted values from legacy plaintext at a glance — so we
 *      can transparently migrate legacy rows on read.
 *   2. Gives us a version segment so we can introduce a `v2` format (e.g.,
 *      key rotation with a key id) without breaking old ciphertexts.
 *
 * ## Key management
 *
 *   - 32-byte (256-bit) key, hex-encoded in env var `QUICKBOOKS_TOKEN_ENCRYPTION_KEY`.
 *   - Generate with: `openssl rand -hex 32`
 *   - Must be identical across all environments that share a Supabase project.
 *     (In this project, dev + prod share one project, so the same key works
 *     for both; if you split them, use a different key per environment.)
 *   - Rotation: out of scope for v1. Procedure is (a) deploy app that reads
 *     old key + new key, (b) background-re-encrypt all rows, (c) remove old
 *     key. Not implemented yet — the format is ready for it.
 */

import crypto from "node:crypto"

const ENV_VAR = "QUICKBOOKS_TOKEN_ENCRYPTION_KEY"
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // GCM standard — 96 bits
const TAG_LENGTH = 16 // GCM standard — 128 bits
const KEY_LENGTH = 32 // AES-256
const PREFIX = "qbo_enc:v1:"

function getKey(): Buffer {
  const hex = process.env[ENV_VAR]
  if (!hex) {
    throw new Error(
      `${ENV_VAR} is not set. Generate with: openssl rand -hex 32 (produces 64 hex characters). Set as a Vercel env var for Production, Preview, and Development.`
    )
  }
  // Accept either 64-char hex (standard) or allow whitespace for copy-paste forgiveness.
  const clean = hex.replace(/\s+/g, "")
  if (!/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error(`${ENV_VAR} must be a hex string (0-9, a-f)`)
  }
  const buf = Buffer.from(clean, "hex")
  if (buf.length !== KEY_LENGTH) {
    throw new Error(
      `${ENV_VAR} must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex chars). Got ${buf.length} bytes.`
    )
  }
  return buf
}

/**
 * Encrypt a token string. Returns a self-describing ciphertext that can be
 * stored directly in the existing JSONB config field without schema changes.
 *
 * The output is deterministic in format but NOT in value: two calls with the
 * same plaintext produce different ciphertexts (due to random IV). This is
 * the correct behavior for a token — ciphertexts should not be comparable.
 */
export function encryptToken(plaintext: string): string {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("encryptToken: plaintext must be a non-empty string")
  }
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  // Layout: [iv (12)] [ciphertext (variable)] [authTag (16)]
  const combined = Buffer.concat([iv, ciphertext, authTag])
  return PREFIX + combined.toString("base64")
}

/**
 * Decrypt a token that was produced by `encryptToken`. Throws if the ciphertext
 * is malformed, was tampered with (authTag mismatch), or the key changed.
 *
 * Does NOT silently pass through plaintext — callers that want migration
 * behavior should use `decryptTokenOrLegacy` instead.
 */
export function decryptToken(ciphertext: string): string {
  if (typeof ciphertext !== "string" || !ciphertext.startsWith(PREFIX)) {
    throw new Error(
      `decryptToken: value is not an encrypted token (missing "${PREFIX}" prefix)`
    )
  }
  const payload = ciphertext.slice(PREFIX.length)
  let combined: Buffer
  try {
    combined = Buffer.from(payload, "base64")
  } catch {
    throw new Error("decryptToken: payload is not valid base64")
  }
  if (combined.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error("decryptToken: payload is too short")
  }
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(combined.length - TAG_LENGTH)
  const encData = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH)

  const key = getKey()
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  // decipher.final() throws if the authTag doesn't match (tampered ciphertext
  // or wrong key). We let that propagate so the caller treats the whole row
  // as suspect.
  return Buffer.concat([decipher.update(encData), decipher.final()]).toString("utf8")
}

/**
 * Returns true if `value` looks like an encrypted token. Used to distinguish
 * encrypted values from legacy plaintext during the transparent migration
 * window.
 */
export function isEncryptedToken(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX)
}

/**
 * Decrypt if encrypted, otherwise return the value as-is. Used on the READ
 * path for backwards compatibility with integrations created before encryption
 * was deployed. The WRITE path always encrypts, so any row will be migrated
 * to ciphertext on the next token refresh / rotation.
 */
export function decryptTokenOrLegacy(value: string): string {
  return isEncryptedToken(value) ? decryptToken(value) : value
}
