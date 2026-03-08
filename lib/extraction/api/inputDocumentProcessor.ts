/**
 * Input document processing for multi-document extraction mode
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"
import { uploadOriginalFile, type JobMetadata } from "@/lib/jobs/server"
import type { InputDocumentPayload, SanitizedInputDocument } from "./types"
import { isTextLikeMimeType } from "./documentParser"

/**
 * Parses input documents from the request payload
 */
export function parseInputDocuments(
  inputDocsPayload: Record<string, unknown> | null
): Map<string, InputDocumentPayload> {
  const inputDocuments: Map<string, InputDocumentPayload> = new Map()

  if (inputDocsPayload && typeof inputDocsPayload === "object") {
    Object.entries(inputDocsPayload).forEach(([fieldId, doc]) => {
      const docObj = doc as Record<string, unknown> | null
      if (docObj && docObj.data) {
        inputDocuments.set(fieldId, {
          fieldId,
          name: (docObj.name as string) || fieldId,
          data: docObj.data as string,
          type: (docObj.type as string) || "application/octet-stream",
          text: typeof docObj.text === "string" ? docObj.text : undefined,
          inputType: (docObj.inputType as string | null) ?? null,
        })
      }
    })
  }

  return inputDocuments
}

/**
 * Creates sanitized input documents for storage
 */
export function createSanitizedInputDocuments(
  inputDocuments: Map<string, InputDocumentPayload>
): Record<string, SanitizedInputDocument> | null {
  if (inputDocuments.size === 0) return null

  return Object.fromEntries(
    Array.from(inputDocuments.entries()).map(([fieldId, doc]) => [
      fieldId,
      {
        fieldId,
        fileName: doc.name,
        fileUrl: "",
        textValue:
          typeof doc.text === "string"
            ? doc.text
            : isTextLikeMimeType(doc.type)
              ? Buffer.from(String(doc.data ?? ""), "base64").toString("utf-8")
              : null,
        mimeType: doc.type || null,
        inputType: doc.inputType ?? null,
        uploadedAt: new Date().toISOString(),
      },
    ])
  )
}

/**
 * Uploads input documents to storage and updates their URLs
 */
export async function uploadInputDocuments(
  inputDocuments: Map<string, InputDocumentPayload>,
  sanitizedInputDocuments: Record<string, SanitizedInputDocument>,
  supabase: SupabaseClient<Database>,
  userId: string,
  jobMeta: JobMetadata
): Promise<void> {
  console.log("[extraction] Uploading input documents to storage...")

  const uploadPromises = Array.from(inputDocuments.entries()).map(async ([fieldId, doc]) => {
    // Skip if no binary data (text-only documents don't need upload)
    if (!doc.data) return null

    try {
      const docBytes = Buffer.from(String(doc.data), "base64")
      const uploadedUrl = await uploadOriginalFile(supabase, {
        userId,
        jobId: jobMeta.jobId,
        file: docBytes,
        fileName: `input-${fieldId}-${doc.name}`,
        contentType: doc.type || "application/octet-stream",
      })

      if (uploadedUrl && sanitizedInputDocuments[fieldId]) {
        sanitizedInputDocuments[fieldId].fileUrl = uploadedUrl
        console.log(`[extraction] Uploaded input document ${fieldId}: ${uploadedUrl}`)
      }
      return uploadedUrl
    } catch (uploadError) {
      console.error(`[extraction] Failed to upload input document ${fieldId}:`, uploadError)
      return null
    }
  })

  await Promise.all(uploadPromises)
  console.log("[extraction] Input document uploads complete")
}
