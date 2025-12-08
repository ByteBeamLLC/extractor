"use client"

import { useState, useCallback } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { SchemaDefinition, ExtractionJob, FieldReviewMeta } from "@/lib/schema"
import type { Database } from "@/lib/supabase/types"
import { extractionJobToRow, diffJobLists } from "@/lib/extraction/schema-helpers"
import type { CommitSchemaOptions } from "@/lib/extraction/types"

export interface UseExtractionJobsOptions {
  userId: string | undefined
  supabase: SupabaseClient<Database>
  schemas: SchemaDefinition[]
  activeSchemaId: string
  commitSchemaUpdate: (
    schemaId: string,
    updater: (schema: SchemaDefinition) => SchemaDefinition,
    options?: CommitSchemaOptions
  ) => SchemaDefinition | null
}

export interface UseExtractionJobsReturn {
  // State
  selectedJob: ExtractionJob | null
  isDetailOpen: boolean
  selectedRowId: string | null
  
  // Actions
  setSelectedJob: React.Dispatch<React.SetStateAction<ExtractionJob | null>>
  setIsDetailOpen: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedRowId: React.Dispatch<React.SetStateAction<string | null>>
  
  // Job management
  updateSchemaJobs: (
    schemaId: string,
    updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
    options?: { persistSchema?: boolean; syncJobs?: boolean }
  ) => ExtractionJob[] | null
  setJobs: (
    updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
    schemaId?: string,
    options?: { persistSchema?: boolean; syncJobs?: boolean }
  ) => ExtractionJob[] | null
  updateReviewStatus: (
    jobId: string,
    columnId: string,
    status: "verified" | "needs_review",
    payload?: { reason?: string | null }
  ) => void
  handleRowDoubleClick: (job: ExtractionJob) => void
  handleDeleteJob: (jobId: string) => void
  syncJobRecords: (
    schemaId: string,
    payload: { upsert?: ExtractionJob[]; deleted?: string[] }
  ) => Promise<void>
}

/**
 * Hook for managing extraction jobs
 */
export function useExtractionJobs(options: UseExtractionJobsOptions): UseExtractionJobsReturn {
  const {
    userId,
    supabase,
    schemas,
    activeSchemaId,
    commitSchemaUpdate,
  } = options

  // Job selection state
  const [selectedJob, setSelectedJob] = useState<ExtractionJob | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  // Sync job records to Supabase
  const syncJobRecords = useCallback(
    async (schemaId: string, payload: { upsert?: ExtractionJob[]; deleted?: string[] }) => {
      if (!userId) return
      
      const operations: Promise<unknown>[] = []

      if (payload.upsert && payload.upsert.length > 0) {
        const rows = payload.upsert.map((job) => extractionJobToRow(job, schemaId, userId))
        operations.push(supabase.from("extraction_jobs").upsert(rows))
      }

      if (payload.deleted && payload.deleted.length > 0) {
        operations.push(
          supabase
            .from("extraction_jobs")
            .delete()
            .eq("schema_id", schemaId)
            .eq("user_id", userId)
            .in("id", payload.deleted)
        )
      }

      if (operations.length === 0) return

      try {
        await Promise.all(operations)
      } catch (error) {
        console.error('Failed to sync jobs', error)
      }
    },
    [userId, supabase]
  )

  // Update jobs for a specific schema
  const updateSchemaJobs = useCallback(
    (
      schemaId: string,
      updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
      jobOptions?: { persistSchema?: boolean; syncJobs?: boolean }
    ) => {
      const previousSchema = schemas.find((schema) => schema.id === schemaId)
      const previousJobs = previousSchema?.jobs ?? []
      let nextJobs = previousJobs

      const updated = commitSchemaUpdate(
        schemaId,
        (schema) => {
          const currentJobs = schema.jobs ?? []
          nextJobs =
            typeof updater === "function"
              ? (updater as (prev: ExtractionJob[]) => ExtractionJob[])(currentJobs)
              : Array.isArray(updater)
                ? updater
                : currentJobs
          return {
            ...schema,
            jobs: nextJobs,
          }
        },
        { persistSchema: jobOptions?.persistSchema ?? false }
      )

      if (updated && userId && jobOptions?.syncJobs !== false) {
        const { upsert, deleted } = diffJobLists(previousJobs, nextJobs)
        if (upsert.length > 0 || deleted.length > 0) {
          void syncJobRecords(schemaId, { upsert, deleted })
        }
      }

      return updated?.jobs ?? null
    },
    [commitSchemaUpdate, schemas, userId, syncJobRecords]
  )

  // Convenience setter for jobs on the active schema
  const setJobs = useCallback(
    (
      updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
      schemaId: string = activeSchemaId,
      jobOptions?: { persistSchema?: boolean; syncJobs?: boolean }
    ) => updateSchemaJobs(schemaId, updater, jobOptions),
    [activeSchemaId, updateSchemaJobs]
  )

  // Update review status for a field in a job
  const updateReviewStatus = useCallback(
    (
      jobId: string,
      columnId: string,
      status: "verified" | "needs_review",
      payload?: { reason?: string | null }
    ) => {
      const nowIso = new Date().toISOString()
      updateSchemaJobs(
        activeSchemaId,
        (prev) =>
          prev.map((job) => {
            if (job.id !== jobId) return job
            const previousMeta = job.review?.[columnId]
            const originalValue =
              status === "verified"
                ? job.results?.[columnId]
                : previousMeta?.originalValue ?? job.results?.[columnId]
            const previousConfidence = previousMeta?.confidence ?? null
            let nextConfidence: number | null
            if (status === "verified") {
              nextConfidence = 1
            } else if (previousConfidence !== null) {
              nextConfidence = previousConfidence
            } else {
              nextConfidence = status === "needs_review" ? 0 : null
            }
            const nextMeta: FieldReviewMeta = {
              status,
              updatedAt: nowIso,
              reason:
                payload?.reason ??
                (status === "verified"
                  ? "Verified by user"
                  : previousMeta?.reason ?? "Requires review"),
              confidence: nextConfidence,
              verifiedAt: status === "verified" ? nowIso : null,
              verifiedBy: status === "verified" ? userId ?? null : null,
              originalValue,
            }
            return {
              ...job,
              review: {
                ...(job.review ?? {}),
                [columnId]: nextMeta,
              },
            }
          }),
        { syncJobs: true }
      )
    },
    [activeSchemaId, userId, updateSchemaJobs]
  )

  // Handle double-click on a row to open detail view
  const handleRowDoubleClick = useCallback(
    (job: ExtractionJob) => {
      if (!job) return
      setSelectedJob(job)
      setIsDetailOpen(true)
    },
    []
  )

  // Delete a job
  const handleDeleteJob = useCallback(
    (jobId: string) => {
      updateSchemaJobs(
        activeSchemaId,
        (prev) => prev.filter((job) => job.id !== jobId),
        { syncJobs: true }
      )
      
      // Clear selection if deleting selected job
      if (selectedJob?.id === jobId) {
        setSelectedJob(null)
        setIsDetailOpen(false)
      }
      if (selectedRowId === jobId) {
        setSelectedRowId(null)
      }
    },
    [activeSchemaId, updateSchemaJobs, selectedJob, selectedRowId]
  )

  return {
    // State
    selectedJob,
    isDetailOpen,
    selectedRowId,
    
    // Actions
    setSelectedJob,
    setIsDetailOpen,
    setSelectedRowId,
    
    // Job management
    updateSchemaJobs,
    setJobs,
    updateReviewStatus,
    handleRowDoubleClick,
    handleDeleteJob,
    syncJobRecords,
  }
}

