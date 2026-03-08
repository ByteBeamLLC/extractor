import crypto from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface ApiKeyAuthResult {
  authenticated: boolean
  userId?: string
  parserId?: string
  permissions?: string[]
  error?: string
}

/**
 * Generate a new API key and its hash
 */
export function generateApiKey(): { plainKey: string; keyHash: string; keyPrefix: string } {
  const randomBytes = crypto.randomBytes(32).toString("hex")
  const plainKey = `ext_${randomBytes}`
  const keyHash = crypto.createHash("sha256").update(plainKey).digest("hex")
  const keyPrefix = plainKey.slice(0, 12) + "..."
  return { plainKey, keyHash, keyPrefix }
}

/**
 * Authenticate a request using an API key from the Authorization header
 */
export async function authenticateApiKey(
  request: Request,
  supabase: SupabaseClient
): Promise<ApiKeyAuthResult> {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader?.startsWith("Bearer ext_")) {
    return { authenticated: false, error: "Missing or invalid API key. Use 'Authorization: Bearer ext_...' header." }
  }

  const apiKey = authHeader.slice(7) // Remove "Bearer "
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")

  // Look up key by hash
  const { data: keyRecord, error } = await supabase
    .from("parser_api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .single()

  if (error || !keyRecord) {
    return { authenticated: false, error: "Invalid API key" }
  }

  // Check expiration
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return { authenticated: false, error: "API key expired" }
  }

  // Update last_used_at (fire-and-forget)
  supabase
    .from("parser_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id)
    .then(() => {})

  return {
    authenticated: true,
    userId: keyRecord.user_id,
    parserId: keyRecord.parser_id,
    permissions: keyRecord.permissions,
  }
}
