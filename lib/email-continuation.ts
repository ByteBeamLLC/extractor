import crypto from "crypto"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

const TOKEN_PREFIX = "ect_"
const TOKEN_BYTES = 32

/**
 * Generate a cryptographically random email continuation token.
 * Format: ect_ + 32 bytes base64url (43 chars) = 47 chars total.
 */
export function generateEmailToken(): string {
  return TOKEN_PREFIX + crypto.randomBytes(TOKEN_BYTES).toString("base64url")
}

/**
 * SHA-256 hash of the token body (after prefix). Stored in DB — never the raw token.
 */
export function hashEmailToken(rawToken: string): string {
  const body = rawToken.startsWith(TOKEN_PREFIX)
    ? rawToken.slice(TOKEN_PREFIX.length)
    : rawToken
  return crypto.createHash("sha256").update(body).digest("hex")
}

export interface CreateEmailTokenInput {
  userId: string
  targetUrl: string
  nid?: string
  purpose?: string
}

export interface EmailContinuationTokenRow {
  token_hash: string
  user_id: string
  purpose: string
  target_url: string
  nid: string | null
  created_at: string
  expires_at: string
  consumed_at: string | null
  consumed_by: string | null
}

/**
 * Create a new email continuation token. Returns the raw token to embed
 * in the email CTA URL. The DB stores only the SHA-256 hash.
 */
export async function createEmailContinuationToken(
  input: CreateEmailTokenInput
) {
  const rawToken = generateEmailToken()
  const hash = hashEmailToken(rawToken)
  const supabase = createSupabaseServiceRoleClient()

  const { error } = await supabase.from("email_continuation_tokens").insert({
    token_hash: hash,
    user_id: input.userId,
    purpose: input.purpose ?? "extraction_ready",
    target_url: input.targetUrl,
    nid: input.nid ?? null,
  })

  if (error) {
    throw new Error(
      `Failed to create email continuation token: ${error.message}`
    )
  }

  return { rawToken }
}

/**
 * Atomically consume an email continuation token. Returns the token row if
 * valid and unconsumed, or null if expired/already used/not found.
 */
export async function consumeEmailContinuationToken(
  rawToken: string,
  ip?: string,
  ua?: string
): Promise<EmailContinuationTokenRow | null> {
  const hash = hashEmailToken(rawToken)
  const supabase = createSupabaseServiceRoleClient()

  const { data, error } = await supabase
    .from("email_continuation_tokens")
    .update({
      consumed_at: new Date().toISOString(),
      consumed_by: null, // set after session creation in the route handler
      consumer_ip: ip ?? null,
      consumer_ua: ua ?? null,
    })
    .eq("token_hash", hash)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("*")
    .single()

  if (error || !data) return null
  return data as EmailContinuationTokenRow
}
