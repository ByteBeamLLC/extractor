import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/types"

export interface JobMetadata {
  jobId: string
  schemaId: string
  fileName?: string
  agentType?: string | null
  userId?: string | null
}

type JobRow = Database["public"]["Tables"]["extraction_jobs"]["Row"]
type JobStatus = JobRow["status"]

interface JobStatusPatch {
  status?: JobStatus
  results?: JobRow["results"]
  completedAt?: Date | null
  errorMessage?: string | null
  ocrMarkdown?: string | null
  ocrAnnotatedImageUrl?: string | null
  originalFileUrl?: string | null
  inputDocuments?: JobRow["input_documents"]
}

export const OCR_ANNOTATED_IMAGES_BUCKET = "ocr-annotated-images"
export const ORIGINAL_FILES_BUCKET = "original-files"

export async function uploadOcrAnnotatedImage(
  supabase: SupabaseClient<Database>,
  options: {
    userId: string
    jobId: string
    image: Uint8Array | ArrayBuffer | Buffer
    fileName?: string
    contentType?: string
    bucket?: string
  },
): Promise<string | null> {
  const bucket = options.bucket ?? OCR_ANNOTATED_IMAGES_BUCKET
  const contentType = options.contentType ?? "image/png"
  const normalized =
    options.image instanceof Uint8Array
      ? options.image
      : options.image instanceof ArrayBuffer
        ? new Uint8Array(options.image)
        : options.image instanceof Buffer
          ? options.image
          : new Uint8Array()

  if (normalized.length === 0) {
    return null
  }

  const extension = (() => {
    if (contentType === "image/jpeg") return "jpg"
    if (contentType === "image/png") return "png"
    if (contentType === "image/webp") return "webp"
    if (contentType === "image/gif") return "gif"
    const fallbackFromName = options.fileName?.split(".").pop()
    return fallbackFromName ? fallbackFromName.toLowerCase() : "png"
  })()

  const timestamp = Date.now()
  const safeFileName = options.fileName?.replace(/[^a-zA-Z0-9-_]/g, "_") ?? "annotated"
  const objectPath = `${options.userId}/${options.jobId}/${safeFileName}-${timestamp}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, normalized, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath)
  return data?.publicUrl ?? null
}

export async function uploadOriginalFile(
  supabase: SupabaseClient<Database>,
  options: {
    userId: string
    jobId: string
    file: Uint8Array | ArrayBuffer | Buffer
    fileName?: string
    contentType?: string
    bucket?: string
  },
): Promise<string | null> {
  const bucket = options.bucket ?? ORIGINAL_FILES_BUCKET
  const contentType = options.contentType ?? "application/octet-stream"
  const normalized =
    options.file instanceof Uint8Array
      ? options.file
      : options.file instanceof ArrayBuffer
        ? new Uint8Array(options.file)
        : options.file instanceof Buffer
          ? options.file
          : new Uint8Array()

  if (normalized.length === 0) {
    return null
  }

  const extension = (() => {
    const fallbackFromName = options.fileName?.split(".").pop()
    return fallbackFromName ? fallbackFromName.toLowerCase() : "bin"
  })()

  const timestamp = Date.now()
  const safeFileName = options.fileName?.replace(/[^a-zA-Z0-9-_]/g, "_") ?? "original"
  const objectPath = `${options.userId}/${options.jobId}/original-${timestamp}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, normalized, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath)
  return data?.publicUrl ?? null
}

export async function upsertJobStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  meta: JobMetadata,
  patch: JobStatusPatch,
) {
  const nowIso = new Date().toISOString()
  const updatePayload: Partial<JobRow> = {
    updated_at: nowIso,
  }

  if (patch.status) updatePayload.status = patch.status
  if (patch.results !== undefined) updatePayload.results = patch.results
  if (patch.ocrMarkdown !== undefined) updatePayload.ocr_markdown = patch.ocrMarkdown
  if (patch.ocrAnnotatedImageUrl !== undefined)
    updatePayload.ocr_annotated_image_url = patch.ocrAnnotatedImageUrl
  if (patch.originalFileUrl !== undefined) updatePayload.original_file_url = patch.originalFileUrl
  if (patch.errorMessage && patch.results === undefined) {
    updatePayload.results = { error: patch.errorMessage }
  }
  if (patch.inputDocuments !== undefined) {
    updatePayload.input_documents = patch.inputDocuments
  }
  if (patch.completedAt !== undefined) {
    updatePayload.completed_at = patch.completedAt ? patch.completedAt.toISOString() : null
  }
  if (meta.fileName !== undefined) {
    updatePayload.file_name = meta.fileName
  }
  if (meta.agentType !== undefined) {
    updatePayload.agent_type = meta.agentType
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("extraction_jobs")
    .update(updatePayload)
    .eq("id", meta.jobId)
    .eq("user_id", userId)
    .select("id")

  if (updateError) {
    throw updateError
  }

  if (!updatedRows || updatedRows.length === 0) {
    const insertPayload: JobRow = {
      id: meta.jobId,
      schema_id: meta.schemaId,
      user_id: userId,
      file_name: meta.fileName ?? null,
      status: patch.status ?? "pending",
      results:
        patch.results !== undefined
          ? patch.results
          : patch.errorMessage
            ? { error: patch.errorMessage }
            : null,
      ocr_markdown: patch.ocrMarkdown ?? null,
      ocr_annotated_image_url: patch.ocrAnnotatedImageUrl ?? null,
      original_file_url: patch.originalFileUrl ?? null,
      agent_type: meta.agentType ?? null,
      input_documents: patch.inputDocuments ?? null,
      created_at: nowIso,
      completed_at: patch.completedAt ? patch.completedAt.toISOString() : null,
      updated_at: nowIso,
    }

    const { error: insertError } = await supabase.from("extraction_jobs").insert([insertPayload])
    if (insertError) {
      throw insertError
    }
  }
}
