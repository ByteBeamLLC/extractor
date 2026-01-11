import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"
import type { JobMetadata } from "@/lib/jobs/server"

/**
 * Multi-document input structure for API requests
 */
export interface InputDocumentPayload {
  fieldId: string
  name: string
  data: string // base64 encoded
  type: string // mime type
  text?: string // raw text (for text inputs)
  inputType?: string | null
}

/**
 * Sanitized input document for storage
 */
export interface SanitizedInputDocument {
  fieldId: string
  fileName: string
  fileUrl: string
  textValue: string | null
  mimeType: string | null
  inputType: string | null
  uploadedAt: string
}

/**
 * DotsOCR artifacts extracted from OCR response
 */
export interface DotsOcrArtifacts {
  markdown?: string
  imageData?: string
  imageContentType?: string
}

/**
 * Options for DotsOCR processing
 */
export interface ProcessDotsOcrOptions {
  bytes: Uint8Array
  fileName?: string
  mimeType?: string
  supabase?: SupabaseClient<Database> | null
  userId?: string | null
  jobMeta?: JobMetadata | null
}

/**
 * Result from DotsOCR processing
 */
export interface ProcessDotsOcrResult {
  markdown: string | null
  annotatedImageUrl: string | null
}

/**
 * Options for markdown generation
 */
export interface GenerateMarkdownOptions {
  bytes: Uint8Array
  fileName?: string
  mimeType?: string
  supabase?: SupabaseClient<Database> | null
  userId?: string | null
  jobMeta?: JobMetadata | null
}

/**
 * Result from markdown generation
 */
export interface GenerateMarkdownResult {
  markdown: string | null
  originalFileUrl: string | null
}

/**
 * Parsed request data from the extraction API
 */
export interface ParsedExtractionRequest {
  fileData: {
    name?: string
    type?: string
    data?: string
    size?: number
  } | null
  schema: Record<string, any> | null
  schemaTree: any[] | null
  extractionPromptOverride?: string
  rawJobMeta: any
  inputDocsPayload: Record<string, any> | null
  fieldInputDocMap: Record<string, string[]> | null
}

/**
 * Extraction context containing auth and job info
 */
export interface ExtractionContext {
  supabase: SupabaseClient<Database> | null
  userId: string | null
  jobMeta: JobMetadata | null
}

/**
 * Response payload from extraction API
 */
export interface ExtractionResponsePayload {
  success: boolean
  results: Record<string, any>
  warnings: string[]
  handledWithFallback?: boolean
  error?: string
  ocrMarkdown: string | null
  ocrAnnotatedImageUrl: string | null
  originalFileUrl: string | null
}
