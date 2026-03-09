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

interface ExportPageProps {
  parser: Parser
}

export function ExportPage({ parser }: ExportPageProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleDownloadJSON = () => {
    const results = documents
      .filter((d) => d.results)
      .map((d) => ({
        file_name: d.file_name,
        processed_at: d.processed_at,
        ...d.results,
      }))
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

    // Collect all unique keys
    const allKeys = new Set<string>()
    completed.forEach((d) => {
      if (d.results) {
        Object.keys(d.results).forEach((k) => {
          if (k !== "__meta__") allKeys.add(k)
        })
      }
    })
    const headers = ["file_name", ...Array.from(allKeys)]

    const rows = completed.map((d) => {
      return headers.map((h) => {
        if (h === "file_name") return d.file_name
        const val = d.results?.[h]
        if (val === null || val === undefined) return ""
        if (typeof val === "object") return JSON.stringify(val)
        return String(val)
      })
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${parser.name.replace(/\s+/g, "_")}_export.csv`
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

      {/* Integrations Section */}
      <div className="border rounded-xl p-6 bg-card">
        <IntegrationList parserId={parser.id} />
      </div>
    </div>
  )
}
