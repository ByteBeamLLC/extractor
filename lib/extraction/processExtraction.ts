/**
 * Extraction processing logic
 * 
 * This module contains pure functions for processing extractions,
 * making API calls, and handling results.
 */

import type { SchemaField, ExtractionJob } from "@/lib/schema"
import { extractResultsMeta } from "@/lib/extraction-results"
import { 
  buildDependencyGraph, 
  topologicalSort, 
  validateDependencies, 
  getFieldDependents,
} from "@/lib/dependency-resolver"

// Types
export interface FileData {
  name: string
  type: string
  size: number
  data: string // base64
}

export interface JobMeta {
  jobId: string
  schemaId: string
  fileName: string
  agentType?: string | null
  userId?: string
}

export interface CompressionOptions {
  targetBytes?: number
  maxDim?: number
  quality?: number
}

export interface ExtractionResult {
  success: boolean
  results?: Record<string, unknown>
  review?: Record<string, unknown>
  ocrMarkdown?: string | null
  ocrAnnotatedImageUrl?: string | null
  originalFileUrl?: string | null
  error?: string
}

export interface PharmaExtractionResult {
  success: boolean
  pharma_data?: unknown
  error?: string
}

export interface FnBExtractionResult {
  success: boolean
  fnb_extraction?: unknown
  fnb_translation?: unknown
  error?: string
}

/**
 * Default compression options for images
 */
export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  targetBytes: 3_000_000,
  maxDim: 1800,
  quality: 0.75,
}

/**
 * Filter out transformation fields from schema tree
 * (only send extraction fields to the API)
 */
export function filterTransformationFields(fields: SchemaField[]): SchemaField[] {
  return fields
    .filter((f) => !f.isTransformation)
    .map((f) => {
      if (f.type === "object" && 'children' in f) {
        return { ...f, children: filterTransformationFields(f.children) }
      }
      if (f.type === "list") return { ...f }
      if (f.type === "table" && 'columns' in f) {
        return { ...f, columns: filterTransformationFields(f.columns) }
      }
      return f
    })
}

/**
 * Convert a File/Blob to base64 data
 */
export async function fileToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const commaIndex = result.indexOf(",")
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Call the Pharma extraction API
 */
export async function callPharmaExtraction(
  base64Data: string,
  fileType: string,
  fileName: string,
  jobMeta: JobMeta,
): Promise<PharmaExtractionResult> {
  const pharmaPayload: Record<string, unknown> = {
    imageBase64: fileType.startsWith('image/') ? base64Data : undefined,
    fileName,
    job: jobMeta,
  }

  if (!fileType.startsWith('image/')) {
    if (fileType.includes('text') || fileType.includes('csv')) {
      const textBytes = atob(base64Data)
      pharmaPayload.extractedText = textBytes
    } else {
      pharmaPayload.fileData = {
        name: fileName,
        type: fileType,
        data: base64Data,
      }
    }
  }

  const response = await fetch('/api/pharma/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pharmaPayload),
  })

  if (response.status === 413) {
    return {
      success: false,
      error: 'The uploaded file exceeds the 3 MB limit. Please compress or resize the file and retry.',
    }
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => `${response.status} ${response.statusText}`)
    return {
      success: false,
      error: `Pharma extraction failed: ${response.status} ${response.statusText} - ${errText}`,
    }
  }

  const result = await response.json()

  if (!result?.success) {
    return {
      success: false,
      error: result?.error || 'Pharma extraction failed',
    }
  }

  return {
    success: true,
    pharma_data: result,
  }
}

/**
 * Call the F&B extraction and translation APIs
 */
export async function callFnBExtraction(
  fileData: FileData,
  jobMeta: JobMeta,
): Promise<FnBExtractionResult> {
  // Step 1: Extract
  const extractResponse = await fetch('/api/fnb/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: fileData, job: jobMeta }),
  })

  if (extractResponse.status === 413) {
    return {
      success: false,
      error: 'The uploaded file exceeds the 3 MB limit for F&B extraction. Please compress or resize the image and retry.',
    }
  }

  if (!extractResponse.ok) {
    const errText = await extractResponse.text().catch(() => `${extractResponse.status} ${extractResponse.statusText}`)
    return {
      success: false,
      error: `Extraction request failed: ${extractResponse.status} ${extractResponse.statusText} - ${errText}`,
    }
  }

  const extractResult = await extractResponse.json()
  if (!extractResult?.success) {
    return {
      success: false,
      error: extractResult?.error || 'Extraction failed',
    }
  }

  const extraction = extractResult.data

  // Step 2: Translate
  const source = extraction?.product_initial_language ?? extraction
  const translateResponse = await fetch('/api/fnb/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, extraction, job: jobMeta }),
  })

  if (!translateResponse.ok) {
    const errText = await translateResponse.text().catch(() => `${translateResponse.status} ${translateResponse.statusText}`)
    return {
      success: false,
      error: `Translation request failed: ${translateResponse.status} ${translateResponse.statusText} - ${errText}`,
    }
  }

  const translateResult = await translateResponse.json()
  if (!translateResult?.success) {
    return {
      success: false,
      error: translateResult?.error || 'Translation failed',
    }
  }

  return {
    success: true,
    fnb_extraction: extraction,
    fnb_translation: translateResult.data,
  }
}

/**
 * Call the standard extraction API
 */
export async function callStandardExtraction(
  fileData: FileData,
  schemaTree: SchemaField[],
  jobMeta: JobMeta,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const response = await fetch("/api/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: fileData,
      schemaTree,
      extractionPromptOverride: undefined,
      job: jobMeta,
    }),
  })

  const responseBody = await response.text()
  
  if (!response.ok) {
    return {
      success: false,
      error: `Extraction failed (${response.status} ${response.statusText}): ${responseBody.slice(0, 500)}`,
    }
  }

  try {
    const result = responseBody ? JSON.parse(responseBody) : {}
    return {
      success: result.success,
      data: result,
      error: result.error,
    }
  } catch (parseError) {
    return {
      success: false,
      error: `Failed to parse extraction response: ${(parseError as Error).message}`,
    }
  }
}

/**
 * Call the transformation API for a single field
 */
export async function callTransformation(
  field: SchemaField,
  columnValues: Record<string, unknown>,
): Promise<{ success: boolean; value?: unknown; error?: string; skipped?: boolean }> {
  // Check if all dependency values are "-" (dash)
  const allDependenciesAreDash = Object.keys(columnValues).length > 0 &&
    Object.values(columnValues).every((value) => 
      value === "-" || value === "hyphen" || value === "شرطة"
    )

  if (allDependenciesAreDash) {
    return { success: true, value: "-", skipped: true }
  }

  const source = field.transformationSource || "column"

  const fieldSchema: Record<string, unknown> = {
    type: field.type,
    name: field.name,
    description: field.description,
    constraints: field.constraints,
  }

  if (field.type === 'object' && 'children' in field) {
    fieldSchema.children = field.children
  } else if (field.type === 'list' && 'item' in field) {
    fieldSchema.item = (field as { item?: unknown }).item
  } else if (field.type === 'table' && 'columns' in field) {
    fieldSchema.columns = field.columns
  }

  // Extract prompt and selectedTools from transformationConfig
  let promptString = ""
  let selectedTools: string[] = []

  if (typeof field.transformationConfig === 'object' && field.transformationConfig !== null) {
    const config = field.transformationConfig as { prompt?: string; selectedTools?: string[] }
    promptString = config.prompt || ""
    selectedTools = config.selectedTools || []
  } else if (typeof field.transformationConfig === 'string') {
    promptString = field.transformationConfig
  }

  const promptPayload = {
    prompt: promptString,
    inputSource: source,
    columnValues,
    fieldType: field.type,
    fieldSchema,
    selectedTools,
  }

  const response = await fetch("/api/transform", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(promptPayload),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => `${response.status} ${response.statusText}`)
    return {
      success: false,
      error: `Gemini transformation failed: ${response.status} ${response.statusText} - ${errText}`,
    }
  }

  const data = await response.json()
  if (!data?.success) {
    return {
      success: false,
      error: data?.error || 'Gemini transformation failed',
    }
  }

  return {
    success: true,
    value: data.result?.value ?? data.result,
  }
}

/**
 * Build summary values from results
 */
export function buildSummaryValues(
  displayColumns: SchemaField[],
  finalResults: Record<string, unknown>,
): Map<string, Record<string, unknown>> {
  const resolvedSummaryValues = new Map<string, Record<string, unknown>>()

  const summaryFields = displayColumns.filter((col) => col.displayInSummary)
  const summaryPrimitives = summaryFields.filter((col) => col.type !== 'object')
  const summaryComposite = summaryFields.filter((col) => col.type === 'object')

  if (summaryPrimitives.length > 0) {
    const summaryObject = Object.fromEntries(
      summaryPrimitives.map((col) => [col.id, finalResults[col.id]]),
    )
    resolvedSummaryValues.set('leaf_summary', summaryObject)
  }

  summaryComposite.forEach((col) => {
    const objectValue = finalResults[col.id]
    if (!objectValue || typeof objectValue !== 'object') return
    resolvedSummaryValues.set(col.id, objectValue as Record<string, unknown>)
  })

  return resolvedSummaryValues
}

/**
 * Find circular dependencies in summary fields
 */
export function findSummaryDependencyWarnings(
  displayColumns: SchemaField[],
  graph: ReturnType<typeof buildDependencyGraph>,
): string[] {
  const dependencyWarnings: string[] = []

  displayColumns.forEach((col) => {
    if (!col.displayInSummary) return
    const dependents = getFieldDependents(graph, col.id)
    dependents.forEach((depId) => {
      const depField = displayColumns.find((f) => f.id === depId)
      if (depField?.displayInSummary) {
        dependencyWarnings.push(
          `Field "${depField.name}" depends on "${col.name}" while both are part of the summary. This may cause circular references.`,
        )
      }
    })
  })

  return dependencyWarnings
}

/**
 * Ensure a nested path exists in an object
 */
export function ensurePath(obj: Record<string, unknown>, path: string[]): Record<string, unknown> {
  let current = obj as Record<string, unknown>
  for (const key of path) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  return current
}

/**
 * Execute transformations for a wave of fields
 */
export async function executeTransformationWave(
  wave: { fields: SchemaField[] },
  displayColumns: SchemaField[],
  graph: ReturnType<typeof buildDependencyGraph>,
  finalResults: Record<string, unknown>,
  fieldStatus: Map<string, { status: 'pending' | 'success' | 'error' | 'blocked'; error?: string }>,
): Promise<void> {
  const geminiFields = wave.fields.filter((col) =>
    col.isTransformation && col.transformationType === 'gemini_api'
  )

  const executeTransformationField = async (tcol: SchemaField) => {
    const dependencies = graph.edges.get(tcol.id) || new Set<string>()
    const blockedBy: string[] = []

    dependencies.forEach((depId) => {
      const depStatus = fieldStatus.get(depId)
      if (depStatus && (depStatus.status === 'error' || depStatus.status === 'blocked')) {
        const depField = displayColumns.find((c) => c.id === depId)
        blockedBy.push(depField?.name || depId)
      }
    })

    if (blockedBy.length > 0) {
      throw new Error(`Blocked by failed dependencies: ${blockedBy.join(', ')}`)
    }

    // Build columnValues from dependencies
    const columnValues: Record<string, unknown> = {}
    dependencies.forEach((depId) => {
      const depField = displayColumns.find((c) => c.id === depId)
      if (depField) {
        columnValues[depField.name] = finalResults[depId]
        columnValues[depId] = finalResults[depId]
      }
    })

    const result = await callTransformation(tcol, columnValues)
    if (!result.success) {
      throw new Error(result.error)
    }

    return { fieldId: tcol.id, value: result.value, skipped: result.skipped }
  }

  const transformationPromises = geminiFields.map((tcol) =>
    executeTransformationField(tcol)
  )

  const results = await Promise.allSettled(transformationPromises)

  results.forEach((result, index) => {
    const tcol = geminiFields[index]

    if (result.status === 'fulfilled') {
      finalResults[tcol.id] = result.value.value
      fieldStatus.set(tcol.id, { status: 'success' })
    } else {
      const errorMsg = result.reason?.message || String(result.reason)
      console.error(`Transformation failed for ${tcol.name}:`, result.reason)

      if (errorMsg.includes('Blocked by failed dependencies')) {
        fieldStatus.set(tcol.id, { status: 'blocked', error: errorMsg })
        finalResults[tcol.id] = `${errorMsg}`
      } else {
        fieldStatus.set(tcol.id, { status: 'error', error: errorMsg })
        finalResults[tcol.id] = `Error: ${errorMsg}`
      }
    }
  })
}

