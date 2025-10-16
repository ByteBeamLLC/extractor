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
  if (patch.errorMessage && patch.results === undefined) {
    updatePayload.results = { error: patch.errorMessage }
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
      agent_type: meta.agentType ?? null,
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
