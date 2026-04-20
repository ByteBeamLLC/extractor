import { afterEach, beforeEach, describe, expect, it } from "vitest"
import crypto from "node:crypto"
import {
  decryptToken,
  decryptTokenOrLegacy,
  encryptToken,
  isEncryptedToken,
} from "./tokenCrypto"

const ORIGINAL_ENV = { ...process.env }
// 32-byte (64 hex) AES-256 key.
const TEST_KEY = "a".repeat(64)

beforeEach(() => {
  process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY = TEST_KEY
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe("encryptToken / decryptToken round-trip", () => {
  it("decrypts to the original plaintext for a typical OAuth token string", () => {
    const plaintext = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.opaque.signature"
    const ciphertext = encryptToken(plaintext)
    expect(ciphertext).not.toContain(plaintext)
    expect(decryptToken(ciphertext)).toBe(plaintext)
  })

  it("round-trips multi-byte UTF-8 content", () => {
    const plaintext = "token-with-émoji-🔐-and-日本語"
    expect(decryptToken(encryptToken(plaintext))).toBe(plaintext)
  })

  it("produces DIFFERENT ciphertexts for the same plaintext (random IV)", () => {
    // Critical invariant — ciphertexts of identical tokens must not be
    // comparable. Otherwise an attacker with DB read could correlate tokens
    // across rows, or spot a token being reused.
    const plaintext = "same-token-value"
    const c1 = encryptToken(plaintext)
    const c2 = encryptToken(plaintext)
    expect(c1).not.toBe(c2)
    expect(decryptToken(c1)).toBe(plaintext)
    expect(decryptToken(c2)).toBe(plaintext)
  })

  it("produces the qbo_enc:v1: prefix", () => {
    expect(encryptToken("x")).toMatch(/^qbo_enc:v1:[A-Za-z0-9+/=]+$/)
  })

  it("throws on empty plaintext (defensive — zero-length tokens are bugs)", () => {
    expect(() => encryptToken("")).toThrow(/non-empty string/)
  })
})

describe("decryptToken — tamper resistance", () => {
  it("throws if the ciphertext was tampered with (authTag mismatch)", () => {
    const ct = encryptToken("real-token")
    // Flip a character in the middle of the base64 payload — lands in the
    // ciphertext body, so the authTag verification must fail.
    const payload = ct.slice("qbo_enc:v1:".length)
    const tampered =
      "qbo_enc:v1:" + payload.slice(0, payload.length - 20) + "A" + payload.slice(payload.length - 19)
    expect(() => decryptToken(tampered)).toThrow()
  })

  it("throws if the authTag at the end was tampered with", () => {
    const ct = encryptToken("real-token")
    // Replace the last byte of the base64 — lands in the authTag region.
    const tampered = ct.slice(0, -2) + "AA"
    expect(() => decryptToken(tampered)).toThrow()
  })

  it("throws when decrypting with a different key", () => {
    const ct = encryptToken("cross-key-secret")
    process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY = "b".repeat(64)
    expect(() => decryptToken(ct)).toThrow()
  })

  it("throws with a clear message when the value isn't encrypted", () => {
    expect(() => decryptToken("plain-old-token")).toThrow(/not an encrypted token/)
  })

  it("throws when the base64 payload is obviously too short", () => {
    expect(() => decryptToken("qbo_enc:v1:AAAA")).toThrow(/too short/)
  })
})

describe("isEncryptedToken", () => {
  it("returns true for a freshly-encrypted value", () => {
    expect(isEncryptedToken(encryptToken("x"))).toBe(true)
  })
  it("returns false for plaintext tokens", () => {
    expect(isEncryptedToken("legacy-plaintext-token")).toBe(false)
  })
  it("returns false for null/undefined/empty", () => {
    expect(isEncryptedToken(null)).toBe(false)
    expect(isEncryptedToken(undefined)).toBe(false)
    expect(isEncryptedToken("")).toBe(false)
  })
  it("returns false for values with similar-but-wrong prefix", () => {
    // Defense against someone trying to smuggle a plaintext token by
    // prepending a lookalike prefix.
    expect(isEncryptedToken("qbo_enc:v2:anything")).toBe(false)
    expect(isEncryptedToken("QBO_ENC:v1:anything")).toBe(false)
  })
})

describe("decryptTokenOrLegacy", () => {
  it("decrypts encrypted values", () => {
    expect(decryptTokenOrLegacy(encryptToken("hello"))).toBe("hello")
  })

  it("passes through legacy plaintext unchanged", () => {
    // Critical for migration: integrations created before encryption was
    // deployed must still work on the read path. The write path always
    // encrypts, so these plaintext rows get migrated on next refresh.
    expect(decryptTokenOrLegacy("plaintext-legacy-token")).toBe("plaintext-legacy-token")
  })
})

describe("key management", () => {
  it("throws a clear, actionable error when the env var is unset", () => {
    delete process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY
    expect(() => encryptToken("x")).toThrow(
      /QUICKBOOKS_TOKEN_ENCRYPTION_KEY.*openssl rand -hex 32/
    )
  })

  it("throws when the key is not 32 bytes", () => {
    process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY = "abcd" // 2 bytes
    expect(() => encryptToken("x")).toThrow(/must be 32 bytes/)
  })

  it("throws when the key contains non-hex characters", () => {
    process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY = "z".repeat(64)
    expect(() => encryptToken("x")).toThrow(/hex string/)
  })

  it("tolerates whitespace in the key env var (copy-paste safety)", () => {
    const key = crypto.randomBytes(32).toString("hex")
    const padded = ` ${key.slice(0, 32)}\n${key.slice(32)}  `
    process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY = padded
    // Should not throw and should round-trip
    expect(decryptToken(encryptToken("x"))).toBe("x")
  })
})

describe("interoperability", () => {
  it("a ciphertext encrypted with key A decrypts with key A", () => {
    const key = crypto.randomBytes(32).toString("hex")
    process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY = key
    const ct = encryptToken("portable-token")
    // Same key — different process env manipulation in case of caching
    delete process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY
    process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY = key
    expect(decryptToken(ct)).toBe("portable-token")
  })
})
