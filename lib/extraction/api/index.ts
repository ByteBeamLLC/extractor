/**
 * Extraction API module
 *
 * This module provides utilities for document extraction, including:
 * - Document parsing (PDF, DOCX, text)
 * - OCR processing with dots.ocr
 * - Markdown generation from documents
 * - Schema building for Zod validation
 * - Prompt building for AI extraction
 * - Job synchronization with Supabase
 */

// Types
export * from "./types"

// Constants
export {
  PDF_MIME_TYPES,
  DOCX_MIME_TYPES,
  DOC_MIME_TYPES,
  TEXT_LIKE_MIME_PREFIXES,
  MARKDOWN_KEYS,
  IMAGE_KEYS,
  OCR_REQUEST_TIMEOUT_MS,
  MAX_SUPPLEMENTAL_TEXT_CHARS,
  FALLBACK_VALUE,
  resolveDotsOcrServiceUrl,
  resolveDotsOcrEndpoint,
  getDotsOcrApiKey,
} from "./constants"

// Document parsing
export {
  isTextLikeMimeType,
  extractTextFromDocument,
  isImageFile,
  isPdfFile,
  isDotsOcrSupported,
  type DocumentExtractionResult,
} from "./documentParser"

// OCR processing
export {
  extractDotsOcrArtifacts,
  processWithDotsOCR,
} from "./ocrProcessor"

// Markdown generation
export { generateMarkdownFromDocument } from "./markdownGenerator"

// Schema building
export {
  makePrimitive,
  metaSchema,
  buildObjectFromTree,
  buildObjectFromFlat,
  buildFallbackFromTree,
  buildFallbackFromFlat,
  applyFileNameFallbackToTree,
  applyFileNameFallbackToFlat,
  type SchemaField,
} from "./schemaBuilder"

// Prompt building
export {
  buildMultiDocumentPrompt,
  buildImagePrompt,
  buildPdfPrompt,
  buildTextDocumentPrompt,
  type ContentItem,
} from "./promptBuilder"

// Job synchronization
export {
  createJobSyncFn,
  initializeExtractionContext,
  type JobStatusPatch,
} from "./jobSync"

// Input document processing
export {
  parseInputDocuments,
  createSanitizedInputDocuments,
  uploadInputDocuments,
} from "./inputDocumentProcessor"
