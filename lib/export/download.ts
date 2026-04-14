import * as XLSX from "xlsx"
import type { SchemaField } from "@/lib/schema"
import type { StructuredExportData } from "@/lib/export/structure"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SingleDocExportOptions {
  /** The extraction results (already stripped of __meta__) */
  results: Record<string, any>
  /** Parser schema fields (used in fields mode to map IDs → names) */
  fields: SchemaField[]
  /** "fields" or "full_content" */
  extractionType: "fields" | "full_content"
  /** Original file name — used for the download file name */
  fileName: string
  /** Pre-structured data from LLM (for full_content mode) */
  structuredData?: StructuredExportData
}

// ---------------------------------------------------------------------------
// Markdown table parser (for full_content → spreadsheet)
// ---------------------------------------------------------------------------

interface ParsedTable {
  headers: string[]
  rows: string[][]
}

/**
 * Parse markdown tables from a string. Returns an array of tables found.
 * Handles standard GFM tables with `|` delimiters.
 */
export function parseMarkdownTables(markdown: string): ParsedTable[] {
  const tables: ParsedTable[] = []
  const lines = markdown.split("\n")

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    // A table header row starts and ends with `|` and has content between
    if (line.startsWith("|") && line.endsWith("|")) {
      // Check if next line is a separator row (e.g. |---|---|)
      const nextLine = lines[i + 1]?.trim()
      if (nextLine && /^\|[\s\-:|]+\|$/.test(nextLine)) {
        // Parse header
        const headers = parsePipeRow(line)

        // Skip separator
        let j = i + 2
        const rows: string[][] = []

        // Parse data rows
        while (j < lines.length) {
          const rowLine = lines[j].trim()
          if (!rowLine.startsWith("|") || !rowLine.endsWith("|")) break
          rows.push(parsePipeRow(rowLine))
          j++
        }

        if (headers.length > 0 && rows.length > 0) {
          tables.push({ headers, rows })
        }
        i = j
        continue
      }
    }
    i++
  }
  return tables
}

function parsePipeRow(line: string): string[] {
  // Remove leading/trailing pipes then split by pipe
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
}

// ---------------------------------------------------------------------------
// Fields mode: build headers + single row
// ---------------------------------------------------------------------------

interface FlatRow {
  headers: string[]
  cells: string[]
}

function buildFieldsRow(
  results: Record<string, any>,
  fields: SchemaField[]
): FlatRow {
  const extractionFields = fields.filter((f) => f.type !== "input")
  const headers: string[] = []
  const cells: string[] = []

  for (const field of extractionFields) {
    const val = results[field.id]

    if (
      (field.type === "table" || field.type === "list") &&
      Array.isArray(val) &&
      val.length > 0 &&
      typeof val[0] === "object"
    ) {
      // Flatten table/list-of-objects: one column per sub-key per row
      const subKeys = new Set<string>()
      for (const row of val) {
        if (row && typeof row === "object") {
          Object.keys(row).forEach((k) => subKeys.add(k))
        }
      }
      const subKeyArr = Array.from(subKeys)
      for (let r = 0; r < val.length; r++) {
        for (const sk of subKeyArr) {
          headers.push(`${field.name} [${r + 1}] ${sk}`)
          const cell = val[r]?.[sk]
          cells.push(cell === null || cell === undefined ? "" : String(cell))
        }
      }
    } else {
      headers.push(field.name)
      if (val === null || val === undefined || val === "-") {
        cells.push("")
      } else if (Array.isArray(val)) {
        cells.push(val.join(", "))
      } else if (typeof val === "object") {
        cells.push(
          Object.entries(val)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")
        )
      } else {
        cells.push(String(val))
      }
    }
  }

  return { headers, cells }
}

// ---------------------------------------------------------------------------
// Full content: build spreadsheet data
// ---------------------------------------------------------------------------

interface SheetData {
  name: string
  headers: string[]
  rows: string[][]
}

function buildFullContentSheets(results: Record<string, any>): SheetData[] {
  const markdown =
    typeof results.markdown === "string" ? results.markdown : ""

  // Try to extract tables from the markdown
  const tables = parseMarkdownTables(markdown)

  if (tables.length > 0) {
    return tables.map((t, i) => ({
      name: tables.length === 1 ? "Data" : `Table ${i + 1}`,
      headers: t.headers,
      rows: t.rows,
    }))
  }

  // No tables found — export as a single "Content" column
  // Split markdown into lines so each row is readable in a spreadsheet
  const lines = markdown
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  return [
    {
      name: "Content",
      headers: ["Content"],
      rows: lines.map((l) => [l]),
    },
  ]
}

// ---------------------------------------------------------------------------
// Trigger browser download
// ---------------------------------------------------------------------------

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/\s+/g, "_")
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function downloadSingleDocCsv({
  results,
  fields,
  extractionType,
  fileName,
  structuredData,
}: SingleDocExportOptions) {
  const BOM = "\uFEFF"
  let headers: string[]
  let rows: string[][]

  if (extractionType === "full_content") {
    const sheets = structuredData?.sheets ?? buildFullContentSheets(results)
    const sheet = sheets[0]
    headers = sheet.headers
    rows = sheet.rows
  } else {
    const flat = buildFieldsRow(results, fields)
    headers = flat.headers
    rows = [flat.cells]
  }

  const csvContent =
    BOM +
    [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
  triggerDownload(blob, `${baseName(fileName)}.csv`)
}

export function downloadSingleDocExcel({
  results,
  fields,
  extractionType,
  fileName,
  structuredData,
}: SingleDocExportOptions) {
  const wb = XLSX.utils.book_new()

  if (extractionType === "full_content") {
    const sheets = structuredData?.sheets ?? buildFullContentSheets(results)
    for (const sheet of sheets) {
      const aoa = [sheet.headers, ...sheet.rows]
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      // Auto-size columns for readability
      ws["!cols"] = sheet.headers.map((h) => {
        const maxLen = Math.max(
          h.length,
          ...sheet.rows.map((r) => {
            const idx = sheet.headers.indexOf(h)
            return (r[idx] ?? "").length
          })
        )
        return { wch: Math.min(maxLen + 2, 60) }
      })
      XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31))
    }
  } else {
    const flat = buildFieldsRow(results, fields)
    const aoa = [flat.headers, flat.cells]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    // Auto-size columns
    ws["!cols"] = flat.headers.map((h, i) => {
      const cellLen = (flat.cells[i] ?? "").length
      return { wch: Math.min(Math.max(h.length, cellLen) + 2, 60) }
    })
    XLSX.utils.book_append_sheet(wb, ws, "Data")
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  triggerDownload(blob, `${baseName(fileName)}.xlsx`)
}

export function downloadSingleDocJson({
  results,
  fields,
  extractionType,
  fileName,
  structuredData,
}: SingleDocExportOptions) {
  let output: any

  if (extractionType === "full_content") {
    if (structuredData) {
      // Convert sheets into array-of-objects for a clean JSON download
      const allData: Record<string, any>[] = []
      for (const sheet of structuredData.sheets) {
        for (const row of sheet.rows) {
          const obj: Record<string, any> = {}
          sheet.headers.forEach((h, i) => {
            obj[h] = row[i] ?? ""
          })
          allData.push(obj)
        }
      }
      output = allData.length === 1 ? allData[0] : allData
    } else {
      output = results
    }
  } else {
    // Replace field IDs with human-readable names
    const named: Record<string, any> = {}
    const fieldNameMap = new Map<string, string>()
    for (const f of fields) {
      if (f.type !== "input") fieldNameMap.set(f.id, f.name)
    }
    for (const [key, val] of Object.entries(results)) {
      named[fieldNameMap.get(key) ?? key] = val
    }
    output = named
  }

  const blob = new Blob([JSON.stringify(output, null, 2)], {
    type: "application/json",
  })
  triggerDownload(blob, `${baseName(fileName)}.json`)
}
