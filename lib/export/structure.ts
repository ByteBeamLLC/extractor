/**
 * LLM-powered structuring for full_content extraction results.
 *
 * Takes raw markdown from "extract everything" parsers and restructures it
 * into rows/columns suitable for CSV, Excel, and JSON downloads.
 *
 * Model selection is token-count-based:
 *   < 4 000 tokens → openai/gpt-5.4-nano  (cheapest)
 *   ≥ 4 000 tokens → anthropic/claude-haiku-4.5  (best quality/cost)
 */

import { generateFreeformJson } from "@/lib/openrouter"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StructuredSheet {
  name: string
  headers: string[]
  rows: string[][]
}

export interface StructuredExportData {
  sheets: StructuredSheet[]
}

// ---------------------------------------------------------------------------
// Model selection
// ---------------------------------------------------------------------------

const TOKEN_THRESHOLD = 4_000

interface ModelConfig {
  model: string
  provider: { order: string[]; allow_fallbacks: boolean }
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

export function selectModel(tokenCount: number): ModelConfig {
  if (tokenCount < TOKEN_THRESHOLD) {
    return {
      model: "openai/gpt-5.4-nano",
      provider: { order: ["openai"], allow_fallbacks: true },
    }
  }
  return {
    model: "anthropic/claude-haiku-4.5",
    provider: { order: ["anthropic"], allow_fallbacks: true },
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const STRUCTURE_PROMPT = `You are a data formatting assistant. Your ONLY job is to reorganize document text into structured rows and columns for a spreadsheet.

RULES:
1. Do NOT add, invent, or modify any text content. Only reorganize what exists.
2. Do NOT summarize, paraphrase, or omit any data.
3. Use consistent column names across all rows.
4. If the document contains tabular data (invoices, line items, ledgers), preserve the table structure as rows.
5. If the document contains key-value pairs (name: John, date: 2024-01-01), create a two-column table with "Field" and "Value" columns.
6. If the document has multiple distinct sections or tables, return multiple sheets.
7. Keep column headers short and descriptive.

Return a JSON object with this exact structure:
{
  "sheets": [
    {
      "name": "Sheet name",
      "headers": ["Column A", "Column B"],
      "rows": [["value1", "value2"], ["value3", "value4"]]
    }
  ]
}

Every cell value must be a string.`

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calls an LLM to restructure raw markdown into spreadsheet-ready data.
 * Returns an array of sheets, each with headers and rows.
 */
export async function structureMarkdownForExport(
  markdown: string,
): Promise<StructuredExportData> {
  if (!markdown || !markdown.trim()) {
    return { sheets: [{ name: "Data", headers: ["Content"], rows: [] }] }
  }

  const tokenCount = estimateTokenCount(markdown)
  const { model, provider } = selectModel(tokenCount)

  const { object } = await generateFreeformJson({
    model,
    provider,
    temperature: 0.1,
    messages: [
      { role: "system", content: STRUCTURE_PROMPT },
      {
        role: "user",
        content: `Here is the document content to structure:\n\n${markdown}`,
      },
    ],
  })

  return validateAndNormalize(object)
}

// ---------------------------------------------------------------------------
// Validation — ensure the LLM output matches expected shape
// ---------------------------------------------------------------------------

function validateAndNormalize(raw: Record<string, any>): StructuredExportData {
  const sheets: StructuredSheet[] = []

  const rawSheets = Array.isArray(raw.sheets) ? raw.sheets : [raw]

  for (const s of rawSheets) {
    if (!s || typeof s !== "object") continue

    const headers = Array.isArray(s.headers)
      ? s.headers.map(String)
      : []
    const rows = Array.isArray(s.rows)
      ? s.rows.map((row: any) =>
          Array.isArray(row)
            ? row.map((cell: any) =>
                cell === null || cell === undefined ? "" : String(cell)
              )
            : []
        )
      : []

    if (headers.length === 0 && rows.length === 0) continue

    // Ensure every row has the same number of cells as headers
    const normalizedRows = rows.map((row) => {
      if (row.length < headers.length) {
        return [...row, ...Array(headers.length - row.length).fill("")]
      }
      return row.slice(0, headers.length)
    })

    sheets.push({
      name: typeof s.name === "string" ? s.name : `Sheet ${sheets.length + 1}`,
      headers,
      rows: normalizedRows,
    })
  }

  if (sheets.length === 0) {
    return { sheets: [{ name: "Data", headers: ["Content"], rows: [] }] }
  }

  return { sheets }
}
