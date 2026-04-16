"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Parser, ProcessedDocument } from "@/lib/extractor/types"
import type { StructuredExportData } from "@/lib/export/structure"
import { IntegrationList } from "@/components/extractor/integrations/IntegrationList"
import { TourStep } from "@/components/tour/TourStep"
import { SignUpGate } from "@/components/auth/SignUpGate"

interface ExportPageProps {
  parser: Parser
}

export function ExportPage({ parser }: ExportPageProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [loading, setLoading] = useState(true)

  const [structuring, setStructuring] = useState(false)
  const isFullContent = parser.extraction_type === "full_content"

  /**
   * For full_content parsers, fetch LLM-structured data for each document.
   * Returns a map from documentId → StructuredExportData.
   *
   * Concurrency is capped so opening the export tab on a parser with many
   * documents doesn't spawn N parallel LLM calls. Each /structure call can
   * take tens of seconds when the cache is cold; letting them all run at
   * once spikes provider load, multiplies timeout risk, and burns the
   * user's quota in a single burst. A small fixed ceiling (3) preserves
   * enough parallelism to feel responsive while bounding the worst case.
   */
  const fetchAllStructuredData = async (
    docs: ProcessedDocument[],
  ): Promise<Map<string, StructuredExportData>> => {
    const map = new Map<string, StructuredExportData>()
    if (!isFullContent) return map

    const STRUCTURE_FETCH_CONCURRENCY = 3

    setStructuring(true)
    try {
      const fetchOne = async (
        doc: ProcessedDocument,
      ): Promise<{ id: string; data: StructuredExportData | null }> => {
        try {
          const res = await fetch(
            `/api/parsers/${parser.id}/documents/${doc.id}/structure`,
            { method: "POST" },
          )
          if (!res.ok) return { id: doc.id, data: null }
          const data = await res.json()
          return { id: doc.id, data: data as StructuredExportData }
        } catch {
          return { id: doc.id, data: null }
        }
      }

      // Hand-rolled concurrency pool: N workers pull from a shared cursor.
      // Simpler and zero-dependency vs pulling in p-limit; equivalent
      // behavior for this single caller.
      let cursor = 0
      const results: Array<{ id: string; data: StructuredExportData | null }> =
        new Array(docs.length)
      const worker = async (): Promise<void> => {
        while (true) {
          const i = cursor++
          if (i >= docs.length) return
          results[i] = await fetchOne(docs[i])
        }
      }
      const workerCount = Math.min(STRUCTURE_FETCH_CONCURRENCY, docs.length)
      await Promise.all(
        Array.from({ length: workerCount }, () => worker()),
      )

      for (const { id, data } of results) {
        if (data) map.set(id, data)
      }
    } finally {
      setStructuring(false)
    }
    return map
  }

  useEffect(() => {
    async function load() {
      if (!session?.user?.id) return
      const { data } = await supabase
        .from("parser_processed_documents")
        .select("*")
        .eq("parser_id", parser.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
      setDocuments(data ?? [])
      setLoading(false)
    }
    load()
  }, [parser.id, session?.user?.id, supabase])

  // Build a field ID → name map from the parser schema (used in fields mode)
  const fieldNameMap = new Map<string, string>()
  const fieldTypeMap = new Map<string, string>()
  if (!isFullContent) {
    for (const f of parser.fields ?? []) {
      if (f.type !== "input") {
        fieldNameMap.set(f.id, f.name)
        fieldTypeMap.set(f.id, f.type)
      }
    }
  }

  const resolveFieldName = (id: string) => fieldNameMap.get(id) ?? id

  /** Collect all unique top-level keys across all full_content documents */
  const collectDynamicKeys = (docs: ProcessedDocument[]): string[] => {
    const keySet = new Set<string>()
    for (const d of docs) {
      if (!d.results) continue
      for (const key of Object.keys(d.results)) {
        if (key === "__meta__") continue
        keySet.add(key)
      }
    }
    return Array.from(keySet)
  }

  const handleDownloadJSON = async () => {
    const completed = documents.filter((d) => d.results)
    const structuredMap = await fetchAllStructuredData(completed)

    const results = completed.map((d) => {
      const { __meta__, structured_export, ...data } = d.results!
      if (isFullContent) {
        const structured = structuredMap.get(d.id)
        if (structured) {
          // Convert sheets into array-of-objects
          const rows: Record<string, any>[] = []
          for (const sheet of structured.sheets) {
            for (const row of sheet.rows) {
              const obj: Record<string, any> = {}
              sheet.headers.forEach((h, i) => { obj[h] = row[i] ?? "" })
              rows.push(obj)
            }
          }
          return { file_name: d.file_name, processed_at: d.processed_at, data: rows }
        }
        return { file_name: d.file_name, processed_at: d.processed_at, ...data }
      }
      const named: Record<string, any> = { file_name: d.file_name, processed_at: d.processed_at }
      for (const [key, val] of Object.entries(data)) {
        named[resolveFieldName(key)] = val
      }
      return named
    })
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${parser.name.replace(/\s+/g, "_")}_export.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadCSV = async () => {
    const completed = documents.filter((d) => d.results)
    if (completed.length === 0) return

    if (isFullContent) {
      return handleDownloadCSVFullContent(completed)
    }

    // --- Fields mode (original logic) ---
    const fieldIds = (parser.fields ?? [])
      .filter((f) => f.type !== "input")
      .map((f) => f.id)

    const arraySubKeys: Record<string, string[]> = {}
    const arrayMaxRows: Record<string, number> = {}

    for (const fid of fieldIds) {
      const ftype = fieldTypeMap.get(fid)
      if (ftype === "table" || ftype === "list") {
        const allSubKeys = new Set<string>()
        let maxRows = 0
        for (const doc of completed) {
          const val = doc.results?.[fid]
          if (Array.isArray(val)) {
            maxRows = Math.max(maxRows, val.length)
            for (const row of val) {
              if (row && typeof row === "object") {
                Object.keys(row).forEach((k) => allSubKeys.add(k))
              }
            }
          }
        }
        if (maxRows > 0 && allSubKeys.size > 0) {
          arraySubKeys[fid] = Array.from(allSubKeys)
          arrayMaxRows[fid] = maxRows
        }
      }
    }

    const headers: string[] = ["file_name"]
    const headerFieldMapping: Array<{ fieldId: string; subKey?: string; rowIndex?: number }> = []

    for (const fid of fieldIds) {
      const fname = resolveFieldName(fid)
      if (arraySubKeys[fid]) {
        const subKeys = arraySubKeys[fid]
        const maxR = arrayMaxRows[fid]
        for (let r = 0; r < maxR; r++) {
          for (const sk of subKeys) {
            headers.push(`${fname} [${r + 1}] ${sk}`)
            headerFieldMapping.push({ fieldId: fid, subKey: sk, rowIndex: r })
          }
        }
      } else {
        headers.push(fname)
        headerFieldMapping.push({ fieldId: fid })
      }
    }

    const rows = completed.map((doc) => {
      const cells: string[] = [doc.file_name]
      for (const mapping of headerFieldMapping) {
        const val = doc.results?.[mapping.fieldId]
        if (mapping.subKey !== undefined && mapping.rowIndex !== undefined) {
          const arr = Array.isArray(val) ? val : []
          const row = arr[mapping.rowIndex]
          const cell = row?.[mapping.subKey]
          cells.push(cell === null || cell === undefined ? "" : String(cell))
        } else {
          if (val === null || val === undefined || val === "-") {
            cells.push("")
          } else if (Array.isArray(val)) {
            cells.push(val.join(", "))
          } else if (typeof val === "object") {
            const pairs = Object.entries(val)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
            cells.push(pairs)
          } else {
            cells.push(String(val))
          }
        }
      }
      return cells
    })

    downloadCsv(headers, rows, parser.name)
  }

  /** CSV export for full_content mode — uses LLM-structured data */
  const handleDownloadCSVFullContent = async (completed: ProcessedDocument[]) => {
    const structuredMap = await fetchAllStructuredData(completed)

    // Collect union of all headers from structured data
    const allHeaders = new Set<string>()
    allHeaders.add("file_name")
    for (const structured of structuredMap.values()) {
      for (const sheet of structured.sheets) {
        sheet.headers.forEach((h) => allHeaders.add(h))
      }
    }
    const headers = Array.from(allHeaders)

    const rows = completed.map((doc) => {
      const structured = structuredMap.get(doc.id)
      const cells: string[] = [doc.file_name]

      if (structured && structured.sheets.length > 0) {
        // Use the first row of the first sheet for this document
        const sheet = structured.sheets[0]
        const firstRow = sheet.rows[0] ?? []
        for (let i = 1; i < headers.length; i++) {
          const colIdx = sheet.headers.indexOf(headers[i])
          cells.push(colIdx >= 0 ? (firstRow[colIdx] ?? "") : "")
        }
      } else {
        // Fallback: fill empty
        for (let i = 1; i < headers.length; i++) cells.push("")
      }
      return cells
    })

    downloadCsv(headers, rows, parser.name)
  }

  const handleDownloadTXT = () => {
    const completed = documents.filter((d) => d.results)
    if (completed.length === 0) return

    const lines = completed.map((doc) => {
      const { __meta__, ...data } = doc.results!
      const header = `=== ${doc.file_name} ===`
      if (isFullContent) {
        return `${header}\n${data.markdown ?? JSON.stringify(data, null, 2)}`
      }
      const fields = Object.entries(data)
        .map(([key, val]) => {
          const name = resolveFieldName(key)
          if (val === null || val === undefined || val === "-") return `${name}: —`
          if (Array.isArray(val)) return `${name}: ${val.map((v) => typeof v === "object" ? JSON.stringify(v) : v).join(", ")}`
          if (typeof val === "object") return `${name}: ${JSON.stringify(val)}`
          return `${name}: ${val}`
        })
        .join("\n")
      return `${header}\n${fields}`
    })

    const blob = new Blob([lines.join("\n\n")], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${parser.name.replace(/\s+/g, "_")}_export.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const completedCount = documents.filter((d) => d.results).length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold">Export</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Download extracted data or send it to external tools automatically.
        </p>
      </div>

      {/* Download Section */}
      <TourStep stepId="export" side="bottom" align="center">
        <div className="border rounded-xl p-6 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Download Data</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {loading
                  ? "Loading..."
                  : completedCount > 0
                    ? `${completedCount} processed document${completedCount !== 1 ? "s" : ""} available`
                    : "No processed documents yet"}
              </p>
            </div>
          </div>

          {completedCount > 0 && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDownloadCSV} disabled={structuring}>
                {structuring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                {structuring ? "Preparing..." : "CSV"}
              </Button>
              <Button variant="outline" onClick={handleDownloadJSON} disabled={structuring}>
                {structuring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileJson className="h-4 w-4 mr-2" />}
                {structuring ? "Preparing..." : "JSON"}
              </Button>
              <Button variant="outline" onClick={handleDownloadTXT} disabled={structuring}>
                <FileText className="h-4 w-4 mr-2" />
                TXT
              </Button>
            </div>
          )}

          {!loading && completedCount === 0 && (
            <p className="text-xs text-muted-foreground">
              Process some documents first, then come back to download the
              extracted data.
            </p>
          )}
        </div>
      </TourStep>

      {/* Integrations Section */}
      <SignUpGate feature="Exports">
        <div className="border rounded-xl p-6 bg-card">
          <IntegrationList parserId={parser.id} />
        </div>
      </SignUpGate>
    </div>
  )
}

/** Shared CSV download helper */
function downloadCsv(headers: string[], rows: string[][], parserName: string) {
  const BOM = "\uFEFF"
  const csvContent = BOM + [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${parserName.replace(/\s+/g, "_")}_export.csv`
  a.click()
  URL.revokeObjectURL(url)
}
