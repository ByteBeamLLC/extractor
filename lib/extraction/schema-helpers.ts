// Schema helper functions for extraction platform

import type { SchemaDefinition, SchemaField, ExtractionJob, VisualGroup, ExtractionResultsMeta } from "@/lib/schema"
import { extractResultsMeta, mergeResultsWithMeta } from "@/lib/extraction-results"
import type { SchemaRow, ExtractionJobRow } from "./types"

/**
 * Generate a UUID using crypto.randomUUID if available, otherwise fallback
 */
export function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Check if a string is a valid UUID
 */
export function isValidUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value)
}

/**
 * Create a fresh empty schema definition
 */
export function createInitialSchemaDefinition(): SchemaDefinition {
  return {
    id: generateUuid(),
    name: "Data Extraction Schema",
    fields: [],
    jobs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Convert a Supabase schema row to a SchemaDefinition
 */
export function schemaRowToDefinition(row: SchemaRow, jobRows: ExtractionJobRow[]): SchemaDefinition {
  const jobs = jobRows
    .filter((job) => job.schema_id === row.id)
    .map((job) => extractionJobRowToJob(job))

  return {
    id: row.id,
    name: row.name ?? "Data Extraction Schema",
    fields: Array.isArray(row.fields) ? (row.fields as unknown as SchemaField[]) : [],
    jobs,
    templateId: row.template_id ?? undefined,
    visualGroups: Array.isArray(row.visual_groups)
      ? (row.visual_groups as unknown as VisualGroup[])
      : undefined,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }
}

/**
 * Convert a Supabase extraction job row to an ExtractionJob
 */
export function extractionJobRowToJob(row: ExtractionJobRow): ExtractionJob {
  const raw = (row.results as Record<string, unknown> | null) ?? undefined
  const { values, meta } = extractResultsMeta(raw)

  return {
    id: row.id,
    fileName: row.file_name,
    status: row.status,
    results: values ?? undefined,
    review: meta?.review ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    agentType: row.agent_type ?? undefined,
    ocrMarkdown: row.ocr_markdown ?? null,
    ocrAnnotatedImageUrl: row.ocr_annotated_image_url ?? null,
    originalFileUrl: row.original_file_url ?? null,
  }
}

/**
 * Convert a SchemaDefinition to a Supabase row for persistence
 */
export function schemaDefinitionToRow(schema: SchemaDefinition, userId: string): SchemaRow {
  return {
    id: schema.id,
    user_id: userId,
    name: schema.name,
    fields: schema.fields as unknown as SchemaRow["fields"],
    template_id: schema.templateId ?? null,
    visual_groups: (schema.visualGroups ?? null) as unknown as SchemaRow["visual_groups"],
    created_at: schema.createdAt ? schema.createdAt.toISOString() : null,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Convert an ExtractionJob to a Supabase row for persistence
 */
export function extractionJobToRow(job: ExtractionJob, schemaId: string, userId: string): ExtractionJobRow {
  const baseResults = job.results ? { ...job.results } : {}
  let meta: ExtractionResultsMeta | undefined

  if (job.review && Object.keys(job.review).length > 0) {
    const confidenceMap = Object.entries(job.review).reduce<Record<string, number | null>>(
      (acc, [fieldId, info]) => {
        if (info && typeof info.confidence === "number") {
          acc[fieldId] = Math.max(0, Math.min(1, info.confidence))
        } else if (info && info.confidence === null) {
          acc[fieldId] = null
        }
        return acc
      },
      {},
    )

    meta = {
      review: job.review,
    }

    if (Object.keys(confidenceMap).length > 0) {
      meta.confidence = confidenceMap
    }
  }

  const merged = mergeResultsWithMeta(baseResults, meta)
  const serializedResults =
    Object.keys(merged).length === 0 ? null : (merged as ExtractionJobRow["results"])

  return {
    id: job.id,
    schema_id: schemaId,
    user_id: userId,
    file_name: job.fileName,
    status: job.status,
    results: serializedResults,
    ocr_markdown: job.ocrMarkdown ?? null,
    ocr_annotated_image_url: job.ocrAnnotatedImageUrl ?? null,
    original_file_url: job.originalFileUrl ?? null,
    agent_type: job.agentType ?? null,
    created_at: job.createdAt?.toISOString() ?? new Date().toISOString(),
    completed_at: job.completedAt ? job.completedAt.toISOString() : null,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Recursively sort object keys for stable comparison
 */
export function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject)
  }
  if (value && typeof value === "object") {
    const sortedKeys = Object.keys(value).sort()
    return sortedKeys.reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortObject((value as Record<string, unknown>)[key])
      return acc
    }, {})
  }
  return value
}

/**
 * Create a stable JSON string for comparison (sorted keys)
 */
export function stableStringify(value: unknown): string {
  if (value === undefined) return "undefined"
  return JSON.stringify(sortObject(value))
}

/**
 * Check if two ExtractionJobs are equal (shallow comparison)
 */
export function jobsShallowEqual(a: ExtractionJob, b: ExtractionJob): boolean {
  if (a === b) {
    return true
  }

  const createdAtA = a.createdAt ? a.createdAt.getTime() : null
  const createdAtB = b.createdAt ? b.createdAt.getTime() : null
  const completedAtA = a.completedAt ? a.completedAt.getTime() : null
  const completedAtB = b.completedAt ? b.completedAt.getTime() : null

  const resultsA = a.results ?? null
  const resultsB = b.results ?? null
  const resultsEqual = stableStringify(resultsA) === stableStringify(resultsB)
  const reviewA = a.review ?? null
  const reviewB = b.review ?? null
  const reviewEqual = stableStringify(reviewA) === stableStringify(reviewB)

  return (
    a.id === b.id &&
    a.fileName === b.fileName &&
    a.status === b.status &&
    (a.agentType ?? null) === (b.agentType ?? null) &&
    (a.ocrMarkdown ?? null) === (b.ocrMarkdown ?? null) &&
    (a.ocrAnnotatedImageUrl ?? null) === (b.ocrAnnotatedImageUrl ?? null) &&
    (a.originalFileUrl ?? null) === (b.originalFileUrl ?? null) &&
    createdAtA === createdAtB &&
    completedAtA === completedAtB &&
    resultsEqual &&
    reviewEqual
  )
}

/**
 * Compute the diff between two lists of jobs (for sync)
 */
export function diffJobLists(prevJobs: ExtractionJob[], nextJobs: ExtractionJob[]) {
  const prevMap = new Map(prevJobs.map((job) => [job.id, job]))
  const upsert: ExtractionJob[] = []
  const deleted: string[] = []

  for (const job of nextJobs) {
    const prev = prevMap.get(job.id)
    if (!prev) {
      upsert.push(job)
    } else {
      if (!jobsShallowEqual(prev, job)) {
        upsert.push(job)
      }
      prevMap.delete(job.id)
    }
  }

  prevMap.forEach((_, jobId) => {
    deleted.push(jobId)
  })

  return { upsert, deleted }
}

/**
 * Upsert a job into a list (add or replace)
 */
export function upsertJobInList(list: ExtractionJob[], job: ExtractionJob): ExtractionJob[] {
  const index = list.findIndex((existing) => existing.id === job.id)
  if (index === -1) {
    return [...list, job]
  }
  const next = [...list]
  next[index] = job
  return next
}

