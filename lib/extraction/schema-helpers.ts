// Schema helper functions for extraction platform

import type {
  SchemaDefinition,
  SchemaField,
  ExtractionJob,
  VisualGroup,
  ExtractionResultsMeta,
  InputDocument,
} from "@/lib/schema"
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

function serializeInputDocuments(
  inputDocs?: Record<string, InputDocument>,
): ExtractionJobRow["input_documents"] {
  if (!inputDocs || Object.keys(inputDocs).length === 0) return null

  const serialized: Record<string, unknown> = {}

  Object.entries(inputDocs).forEach(([fieldId, doc]) => {
    if (!doc) return
    const uploadedAt =
      doc.uploadedAt instanceof Date
        ? doc.uploadedAt.toISOString()
        : typeof (doc as any).uploadedAt === "string"
          ? (doc as any).uploadedAt
          : null

    serialized[fieldId] = {
      fieldId,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      previewUrl: doc.previewUrl ?? null,
      textValue: doc.textValue ?? null,
      mimeType: doc.mimeType ?? null,
      inputType: (doc as any).inputType ?? null,
      uploadedAt,
    }
  })

  return serialized
}

function parseInputDocuments(
  raw: ExtractionJobRow["input_documents"],
): Record<string, InputDocument> | null {
  if (!raw || typeof raw !== "object") return null

  const parsed: Record<string, InputDocument> = {}
  Object.entries(raw as Record<string, any>).forEach(([fieldId, doc]) => {
    if (!doc || typeof doc !== "object") return
    const uploadedAtValue = doc.uploadedAt ?? doc.uploaded_at ?? null
    const uploadedAt =
      typeof uploadedAtValue === "string" || uploadedAtValue instanceof Date
        ? new Date(uploadedAtValue)
        : new Date()

    parsed[fieldId] = {
      fieldId: typeof doc.fieldId === "string" ? doc.fieldId : fieldId,
      fileName: typeof doc.fileName === "string" ? doc.fileName : "",
      fileUrl: typeof doc.fileUrl === "string" ? doc.fileUrl : "",
      previewUrl: typeof doc.previewUrl === "string" ? doc.previewUrl : null,
      textValue: typeof doc.textValue === "string" ? doc.textValue : undefined,
      mimeType: typeof doc.mimeType === "string" ? doc.mimeType : null,
      inputType: typeof doc.inputType === "string" ? doc.inputType : null,
      uploadedAt,
    }
  })

  return Object.keys(parsed).length > 0 ? parsed : null
}

/**
 * Convert a Supabase extraction job row to an ExtractionJob
 */
export function extractionJobRowToJob(row: ExtractionJobRow): ExtractionJob {
  const raw = (row.results as Record<string, unknown> | null) ?? undefined
  const { values, meta } = extractResultsMeta(raw)
  const parsedInputDocs = parseInputDocuments(row.input_documents)

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
    inputDocuments: parsedInputDocs ?? undefined,
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
  const serializedInputDocs = serializeInputDocuments(job.inputDocuments)

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
    input_documents: serializedInputDocs,
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

function normalizeInputDocuments(inputDocs?: Record<string, InputDocument> | null) {
  if (!inputDocs) return null
  const entries = Object.entries(inputDocs)
  if (entries.length === 0) return null
  const normalized: Record<string, unknown> = {}
  entries
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([fieldId, doc]) => {
      if (!doc) return
      normalized[fieldId] = {
        ...doc,
        uploadedAt:
          doc.uploadedAt instanceof Date
            ? doc.uploadedAt.toISOString()
            : (doc as any).uploadedAt ?? null,
      }
    })
  return normalized
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
  const inputDocsA = normalizeInputDocuments(a.inputDocuments)
  const inputDocsB = normalizeInputDocuments(b.inputDocuments)
  const inputDocsEqual = stableStringify(inputDocsA) === stableStringify(inputDocsB)

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
    reviewEqual &&
    inputDocsEqual
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
 * Count the number of non-empty result values in a job
 */
function countNonEmptyResults(results: Record<string, unknown> | undefined): number {
  if (!results) return 0
  return Object.values(results).filter((v) => {
    if (v === undefined || v === null) return false
    if (typeof v === "string" && (v.trim() === "" || v === "-")) return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  }).length
}

/**
 * Merge two result objects, preferring non-empty values
 */
function mergeResults(
  existing: Record<string, unknown> | undefined,
  incoming: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!existing && !incoming) return undefined
  if (!existing) return incoming
  if (!incoming) return existing

  const merged: Record<string, unknown> = { ...incoming }

  // For each key in existing, keep the existing value if incoming is empty
  for (const key of Object.keys(existing)) {
    const existingVal = existing[key]
    const incomingVal = merged[key]

    // Check if incoming value is empty
    const incomingEmpty =
      incomingVal === undefined ||
      incomingVal === null ||
      (typeof incomingVal === "string" && (incomingVal.trim() === "" || incomingVal === "-")) ||
      (Array.isArray(incomingVal) && incomingVal.length === 0)

    // Check if existing value is non-empty
    const existingNonEmpty =
      existingVal !== undefined &&
      existingVal !== null &&
      !(typeof existingVal === "string" && (existingVal.trim() === "" || existingVal === "-")) &&
      !(Array.isArray(existingVal) && existingVal.length === 0)

    // Prefer existing non-empty value over incoming empty value
    if (incomingEmpty && existingNonEmpty) {
      merged[key] = existingVal
    }
  }

  return merged
}

/**
 * Merge two InputDocument records
 */
function mergeInputDocuments(
  existing: Record<string, InputDocument> | undefined,
  incoming: Record<string, InputDocument> | undefined
): Record<string, InputDocument> | undefined {
  if (!existing && !incoming) return undefined
  if (!existing) return incoming
  if (!incoming) return existing

  // Merge both, preferring incoming but keeping existing entries not in incoming
  return { ...existing, ...incoming }
}

/**
 * Upsert a job into a list (add or replace)
 * When replacing, intelligently merges data to preserve:
 * - Transformation results from local state
 * - inputDocuments from database updates
 * - Other metadata from whichever source has it
 */
export function upsertJobInList(list: ExtractionJob[], job: ExtractionJob): ExtractionJob[] {
  const index = list.findIndex((existing) => existing.id === job.id)
  if (index === -1) {
    return [...list, job]
  }

  const existing = list[index]

  // If incoming job is not completed but existing is, keep existing (don't regress status)
  if (job.status !== "completed" && existing.status === "completed") {
    return list
  }

  // Merge the jobs intelligently
  const mergedJob: ExtractionJob = {
    ...job,
    // Merge results - prefer the version with more non-empty values
    results: countNonEmptyResults(existing.results) > countNonEmptyResults(job.results)
      ? mergeResults(job.results, existing.results)
      : mergeResults(existing.results, job.results),
    // Merge inputDocuments from both sources
    inputDocuments: mergeInputDocuments(existing.inputDocuments, job.inputDocuments),
    // Merge review metadata
    review: existing.review || job.review
      ? { ...(existing.review ?? {}), ...(job.review ?? {}) }
      : undefined,
    // Prefer non-null values for other fields
    ocrMarkdown: job.ocrMarkdown ?? existing.ocrMarkdown,
    ocrAnnotatedImageUrl: job.ocrAnnotatedImageUrl ?? existing.ocrAnnotatedImageUrl,
    originalFileUrl: job.originalFileUrl ?? existing.originalFileUrl,
    // Use the later completedAt
    completedAt: (job.completedAt?.getTime() ?? 0) > (existing.completedAt?.getTime() ?? 0)
      ? job.completedAt
      : existing.completedAt,
  }

  const next = [...list]
  next[index] = mergedJob
  return next
}
