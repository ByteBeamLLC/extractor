/**
 * Prompt templates for Phase 2 consolidation.
 *
 * After per-page extraction (Phase 1), the per-page JSON results are
 * consolidated into a single coherent output using a lighter model
 * (Gemini 2.5 Flash). These prompts are text-only (no images).
 */

import type { PageExtractionResult } from "./chunkedExtraction"

/**
 * Builds the consolidation prompt for schema-driven (fields) extraction.
 * The model merges per-page field values into one result matching the schema.
 */
export function buildFieldsConsolidationPrompt(
  pageResults: PageExtractionResult[],
  schemaSummary: string,
  extractionPromptOverride?: string
): string {
  const pageDataSection = pageResults
    .filter((r) => r.success && r.data)
    .map(
      (r) =>
        `--- Page ${r.pageNumber} ---\n${JSON.stringify(r.data, null, 2)}`
    )
    .join("\n\n")

  const baseInstructions = extractionPromptOverride
    ? `${extractionPromptOverride}\n\nSchema Fields (for reference):\n${schemaSummary}`
    : `You are merging per-page extraction results from a multi-page document into a single JSON object that matches the schema below.

${schemaSummary}

Rules:
- For each field in the schema, choose the best value from across all pages.
- Prefer non-"-" values over "-". If multiple pages provide a value for the same field, use the one that appears most complete or specific.
- For table/array fields (e.g., line_items), CONCATENATE rows from all pages in page order. Tables often span multiple pages.
- For scalar fields (dates, IDs, totals), prefer the first page where the value appears.
- Include a "__meta__" object with a "confidence" array. For each field, set confidence to the highest confidence found across pages. If you are merging array items, set confidence to the average.
- Every field in the schema must appear in the output. Use "-" only if no page had a value.
- Return ONLY the merged JSON object. No explanations.`

  return `${baseInstructions}

Here are the per-page extraction results:

${pageDataSection}

Merge these into a single JSON object matching the schema. Return only valid JSON.`
}

/**
 * Builds the consolidation prompt for full-content extraction.
 * The model merges per-page JSON objects into one coherent document.
 */
export function buildFullContentConsolidationPrompt(
  pageResults: PageExtractionResult[],
  extractionPromptOverride?: string
): string {
  const pageDataSection = pageResults
    .filter((r) => r.success && r.data)
    .map(
      (r) =>
        `--- Page ${r.pageNumber} ---\n${JSON.stringify(r.data, null, 2)}`
    )
    .join("\n\n")

  const baseInstructions = extractionPromptOverride
    ? `${extractionPromptOverride}\n\nMerge the per-page data below into a single structured JSON object.`
    : `You are merging per-page extraction results from a multi-page document into a single coherent JSON object.

Rules:
- Combine all data into one well-structured JSON object with descriptive snake_case keys.
- For arrays (e.g., line items, call records, transactions), CONCATENATE entries from all pages in page order.
- For repeated scalar values that appear on multiple pages (e.g., document title, header info), use the first occurrence.
- Deduplicate repeated headers/footers that appear on every page.
- Use appropriate data types: numbers for amounts, strings for text, booleans for yes/no, arrays for lists.
- Format dates as YYYY-MM-DD when possible.
- Do not invent data. Only include what was extracted from the pages.
- Return ONLY the merged JSON object. No explanations.`

  return `${baseInstructions}

Here are the per-page extraction results:

${pageDataSection}

Merge these into a single JSON object. Return only valid JSON.`
}
