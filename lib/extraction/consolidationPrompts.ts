/**
 * Prompt templates for Phase 2 consolidation.
 *
 * After per-page OCR (Phase 1), the raw markdown text from each page is
 * consolidated into structured output using a lighter model (Gemini 2.5 Flash).
 * These prompts are text-only (no images).
 */

import type { PageExtractionResult } from "./chunkedExtraction"

/**
 * Assembles all page markdown texts into a single document string.
 */
function buildPageTextSection(pageResults: PageExtractionResult[]): string {
  return pageResults
    .filter((r) => r.success && r.data?.markdown)
    .map((r) => `--- Page ${r.pageNumber} ---\n${r.data!.markdown}`)
    .join("\n\n")
}

/**
 * Builds the consolidation prompt for schema-driven (fields) extraction.
 * Takes raw markdown from all pages and extracts structured fields.
 */
export function buildFieldsConsolidationPrompt(
  pageResults: PageExtractionResult[],
  schemaSummary: string,
  extractionPromptOverride?: string
): string {
  const pageText = buildPageTextSection(pageResults)

  const baseInstructions = extractionPromptOverride
    ? `${extractionPromptOverride}\n\nSchema Fields (for reference):\n${schemaSummary}`
    : `You are extracting structured data from a multi-page document. The raw text from each page is provided below. Parse it according to the schema.

${schemaSummary}

Rules:
- For each field in the schema, find the value from the page text.
- For table/array fields (e.g., line_items), collect rows from ALL pages in page order. Tables often span multiple pages.
- For scalar fields (dates, IDs, totals), use the most complete value found.
- If a field is not present anywhere in the document, use "-" as its value.
- Include a "__meta__" object with a "confidence" array. Each entry must contain a "fieldId" and a "value" between 0 and 1.
- Every field in the schema must appear exactly once. Use 1.0 when highly certain, 0.0 when the value is "-" or uncertain.
- Return ONLY the JSON object. No explanations.`

  return `${baseInstructions}

Here is the full document text:

${pageText}

Extract the data according to the schema. Return only valid JSON.`
}

/**
 * Builds the consolidation prompt for full-content extraction.
 * Takes raw markdown from all pages and structures into one JSON.
 */
export function buildFullContentConsolidationPrompt(
  pageResults: PageExtractionResult[],
  extractionPromptOverride?: string
): string {
  const pageText = buildPageTextSection(pageResults)

  const baseInstructions = extractionPromptOverride
    ? `${extractionPromptOverride}\n\nExtract ALL data from the document text below as a structured JSON object. Use descriptive snake_case keys.`
    : `You are extracting structured data from a multi-page document. The raw text from each page is provided below. Extract ALL meaningful data and return it as a well-structured JSON object.

Rules:
- Extract every piece of meaningful data: names, dates, amounts, addresses, line items, tables, reference numbers, etc.
- Organize the data logically using descriptive snake_case keys.
- For tabular data, return arrays of objects with consistent keys across rows. Combine rows from all pages.
- For grouped data (e.g., sender info, recipient info), nest them in sub-objects.
- Use appropriate data types: numbers for amounts/quantities, strings for text, booleans for yes/no, arrays for lists.
- Format dates as YYYY-MM-DD when possible.
- Deduplicate repeated headers/footers that appear on every page.
- Do not invent data. Only include what is in the document text.
- Return ONLY the JSON object. No explanations.`

  return `${baseInstructions}

Here is the full document text:

${pageText}

Extract all data as a structured JSON object. Return only valid JSON.`
}
