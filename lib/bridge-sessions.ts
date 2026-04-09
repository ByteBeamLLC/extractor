import crypto from "crypto"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

const TOKEN_PREFIX = "bsn_"
const TOKEN_BYTES = 32

/**
 * Generate a cryptographically random bridge session token.
 * Format: bsn_ + 32 bytes base64url (43 chars) = 47 chars total.
 */
export function generateRawToken(): string {
  return TOKEN_PREFIX + crypto.randomBytes(TOKEN_BYTES).toString("base64url")
}

/**
 * SHA-256 hash of the token body (after prefix). Stored in DB — never the raw token.
 * Returns hex string for Supabase text column compatibility.
 */
export function hashToken(rawToken: string): string {
  const body = rawToken.startsWith(TOKEN_PREFIX)
    ? rawToken.slice(TOKEN_PREFIX.length)
    : rawToken
  return crypto.createHash("sha256").update(body).digest("hex")
}

export interface CreateBridgeSessionInput {
  source?: string
  anonUserId: string
  parserId: string
  documentId: string
  payload?: Record<string, unknown>
}

export interface BridgeSessionRow {
  token_hash: string
  source: string
  anon_user_id: string
  parser_id: string | null
  document_id: string | null
  payload: Record<string, unknown>
  created_at: string
  expires_at: string
  consumed_at: string | null
  consumed_by_user: string | null
}

/**
 * Create a new bridge session. Returns the raw token (show to user once)
 * and the expiry time. The DB stores only the SHA-256 hash.
 */
export async function createBridgeSession(input: CreateBridgeSessionInput) {
  const rawToken = generateRawToken()
  const hash = hashToken(rawToken)
  const supabase = createSupabaseServiceRoleClient()

  const { error } = await supabase.from("bridge_sessions").insert({
    token_hash: hash,
    source: input.source ?? "hwt_bridge",
    anon_user_id: input.anonUserId,
    parser_id: input.parserId,
    document_id: input.documentId,
    payload: input.payload ?? {},
  })

  if (error) {
    throw new Error(`Failed to create bridge session: ${error.message}`)
  }

  return { rawToken }
}

/**
 * Atomically consume a bridge session. Returns the session row if valid and
 * unconsumed, or null if expired/already used/not found.
 *
 * The UPDATE ... WHERE consumed_at IS NULL pattern guarantees single-use
 * even under concurrent requests (only one UPDATE will match).
 */
export async function consumeBridgeSession(
  rawToken: string,
  authedUserId: string,
  ip?: string,
  ua?: string
): Promise<BridgeSessionRow | null> {
  const hash = hashToken(rawToken)
  const supabase = createSupabaseServiceRoleClient()

  const { data, error } = await supabase
    .from("bridge_sessions")
    .update({
      consumed_at: new Date().toISOString(),
      consumed_by_user: authedUserId,
      consumer_ip: ip ?? null,
      consumer_ua: ua ?? null,
    })
    .eq("token_hash", hash)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("*")
    .single()

  if (error || !data) return null
  return data as BridgeSessionRow
}
