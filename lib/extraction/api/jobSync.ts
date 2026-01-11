/**
 * Job synchronization utilities for updating extraction job status in Supabase
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"
import { upsertJobStatus, type JobMetadata } from "@/lib/jobs/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ExtractionContext, SanitizedInputDocument } from "./types"

/**
 * Job status update payload
 */
export interface JobStatusPatch {
  status?: "processing" | "completed" | "error"
  results?: Record<string, unknown> | null
  completedAt?: Date | null
  errorMessage?: string | null
  ocrMarkdown?: string | null
  ocrAnnotatedImageUrl?: string | null
  originalFileUrl?: string | null
  inputDocuments?: Record<string, SanitizedInputDocument>
}

/**
 * Creates a job sync function that updates the job status in Supabase
 */
export function createJobSyncFn(
  context: ExtractionContext
): (patch: JobStatusPatch) => Promise<void> {
  return async (patch: JobStatusPatch) => {
    if (!context.jobMeta || !context.supabase || !context.userId) return
    try {
      await upsertJobStatus(context.supabase, context.userId, context.jobMeta, patch)
    } catch (syncError) {
      console.error("[extraction] Failed to sync job status:", syncError)
    }
  }
}

/**
 * Initializes the extraction context with authentication and job metadata
 */
export async function initializeExtractionContext(
  rawJobMeta: unknown
): Promise<ExtractionContext> {
  let supabase: SupabaseClient<Database> | null = null
  let userId: string | null = null
  let jobMeta: JobMetadata | null = null

  if (rawJobMeta && typeof rawJobMeta === "object") {
    const meta = rawJobMeta as Record<string, unknown>
    if (typeof meta.jobId === "string" && typeof meta.schemaId === "string") {
      jobMeta = {
        jobId: meta.jobId,
        schemaId: meta.schemaId,
        fileName: meta.fileName as string | undefined,
        agentType: meta.agentType as string | undefined,
      }
      try {
        supabase = createSupabaseServerClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        userId = user?.id ?? null
      } catch (authError) {
        console.warn("[extraction] Failed to resolve Supabase user for job sync:", authError)
      }
    }
  }

  return { supabase, userId, jobMeta }
}
