/**
 * Storage-agnostic signed URL generation.
 *
 * Currently backed by Supabase Storage. When migrating to S3, GCS,
 * or another provider, only this file needs to change.
 */

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

/** Default signed URL expiry: 15 minutes (enough for OpenRouter to fetch). */
const DEFAULT_EXPIRY_SECONDS = 900

/**
 * Generate a temporary signed URL for a file in storage.
 *
 * @param bucket  Storage bucket name (e.g., "parser-documents")
 * @param path    File path within the bucket
 * @param expiresIn  URL validity in seconds (default 15 min)
 * @returns Public signed URL, or null if the file doesn't exist
 */
export async function getSignedFileUrl(
  bucket: string,
  path: string,
  expiresIn = DEFAULT_EXPIRY_SECONDS
): Promise<string | null> {
  const supabase = createSupabaseServiceRoleClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error || !data?.signedUrl) {
    console.warn(`[storage] Failed to create signed URL for ${bucket}/${path}:`, error?.message)
    return null
  }

  return data.signedUrl
}
