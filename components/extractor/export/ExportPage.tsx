"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Parser, ProcessedDocument } from "@/lib/extractor/types"
import { IntegrationList } from "@/components/extractor/integrations/IntegrationList"
import { TourStep } from "@/components/tour/TourStep"

interface ExportPageProps {
  parser: Parser
}

export function ExportPage({ parser }: ExportPageProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [loading, setLoading] = useState(true)

  const isFullContent = parser.extraction_type === "full_content"

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

  const handleDownloadJSON = () => {
    const results = documents
      .filter((d) => d.results)
      .map((d) => {
        const { __meta__, ...data } = d.results!
        if (isFullContent) {
          return { file_name: d.file_name, processed_at: d.processed_at, ...data }
        }
        // Replace field IDs with names in the output
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

  const handleDownloadCSV = () => {
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

  /** CSV export for full_content mode — union all keys across documents */
  const handleDownloadCSVFullContent = (completed: ProcessedDocument[]) => {
    const dynamicKeys = collectDynamicKeys(completed)
    const headers = ["file_name", ...dynamicKeys.map((k) => k.replace(/_/g, " "))]

    const rows = completed.map((doc) => {
      const { __meta__, ...data } = doc.results!
      const cells: string[] = [doc.file_name]
      for (const key of dynamicKeys) {
        const val = data[key]
        if (val === null || val === undefined) {
          cells.push("")
        } else if (typeof val === "object") {
          cells.push(JSON.stringify(val))
        } else {
          cells.push(String(val))
        }
      }
      return cells
    })

    downloadCsv(headers, rows, parser.name)
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
              <Button variant="outline" onClick={handleDownloadCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={handleDownloadJSON}>
                <FileJson className="h-4 w-4 mr-2" />
                JSON
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
      <div className="border rounded-xl p-6 bg-card">
        <IntegrationList parserId={parser.id} />
      </div>
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
