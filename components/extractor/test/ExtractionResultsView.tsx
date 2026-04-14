"use client"

import { useState } from "react"
import Link from "next/link"
import Markdown from "react-markdown"
import { Copy, Check, Code, Table2, Pencil, RotateCcw, Loader2, FileText, Download, ChevronDown, FileSpreadsheet, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { copyToClipboard } from "@/lib/clipboard"
import {
  downloadSingleDocCsv,
  downloadSingleDocExcel,
  downloadSingleDocJson,
} from "@/lib/export/download"
import type { StructuredExportData } from "@/lib/export/structure"
import type { SchemaField } from "@/lib/schema"
import type { ExtractionType } from "@/lib/extractor/types"

/** Build a flat map from field ID → display name, including nested fields */
function buildFieldNameMap(fields: SchemaField[]): Map<string, string> {
  const map = new Map<string, string>()
  const walk = (fs: SchemaField[]) => {
    for (const f of fs) {
      if (f.type === "input") continue
      map.set(f.id, f.name)
      if (f.type === "object" && "children" in f) walk((f as any).children ?? [])
      else if (f.type === "table" && "columns" in f) walk((f as any).columns ?? [])
      else if (f.type === "list" && "item" in f) walk([(f as any).item])
    }
  }
  walk(fields)
  return map
}

/** Replace field-ID keys with human-readable field names in a results object */
function mapResultKeysToNames(results: Record<string, any>, fields: SchemaField[]): Record<string, any> {
  const nameMap = buildFieldNameMap(fields)
  const mapped: Record<string, any> = {}
  for (const [key, value] of Object.entries(results)) {
    const displayKey = nameMap.get(key) ?? key
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
      mapped[displayKey] = value.map((row) => {
        if (row && typeof row === "object" && !Array.isArray(row)) {
          const mr: Record<string, any> = {}
          for (const [k, v] of Object.entries(row)) mr[nameMap.get(k) ?? k] = v
          return mr
        }
        return row
      })
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      const mo: Record<string, any> = {}
      for (const [k, v] of Object.entries(value)) mo[nameMap.get(k) ?? k] = v
      mapped[displayKey] = mo
    } else {
      mapped[displayKey] = value
    }
  }
  return mapped
}

interface ExtractionResultsViewProps {
  results: Record<string, any>
  fields: SchemaField[]
  /** Parser ID for linking to schema page */
  parserId?: string
  /** Document ID for reprocessing */
  documentId?: string
  /** Original file name — used for download file naming */
  fileName?: string
  /** Callback to reprocess this document */
  onReprocess?: () => void
  /** Whether reprocessing is in progress */
  isReprocessing?: boolean
  /** Extraction type — controls display mode */
  extractionType?: ExtractionType
  /** Field IDs currently being enriched (waterfall transformations in progress) */
  enrichingFields?: string[]
}

export function ExtractionResultsView({
  results,
  fields,
  parserId,
  documentId,
  fileName: fileNameProp,
  onReprocess,
  isReprocessing,
  extractionType,
  enrichingFields,
}: ExtractionResultsViewProps) {
  const isFullContent = extractionType === "full_content"
  const [copied, setCopied] = useState(false)
  const [structuring, setStructuring] = useState(false)
  const [view, setView] = useState<"table" | "json" | "markdown">(isFullContent ? "markdown" : "table")
  const enrichingSet = new Set(enrichingFields ?? [])

  // Strip __meta__ from results for display
  const { __meta__, ...displayResults } = results

  // For full_content, extract the markdown string
  const markdownContent = isFullContent ? (displayResults.markdown ?? "") : ""

  /** Format results as readable plain text (key: value pairs) */
  const toPlainText = () => {
    if (isFullContent) return markdownContent
    return fields
      .filter((f) => f.type !== "input")
      .map((f) => {
        const val = displayResults[f.id]
        if (val === null || val === undefined || val === "-") return `${f.name}: —`
        if (Array.isArray(val)) {
          if (val.length > 0 && typeof val[0] === "object") {
            const rows = val.map((row, i) =>
              Object.entries(row).map(([k, v]) => `  ${k}: ${v}`).join("\n")
            )
            return `${f.name}:\n${rows.map((r, i) => `  [${i + 1}]\n${r}`).join("\n")}`
          }
          return `${f.name}: ${val.join(", ")}`
        }
        if (typeof val === "object") return `${f.name}: ${JSON.stringify(val)}`
        return `${f.name}: ${val}`
      })
      .join("\n")
  }

  const handleCopy = async () => {
    const namedResults = isFullContent ? displayResults : mapResultKeysToNames(displayResults, fields)
    const text = isFullContent ? markdownContent : JSON.stringify(namedResults, null, 2)
    if (!(await copyToClipboard(text))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [copiedText, setCopiedText] = useState(false)
  const handleCopyText = async () => {
    if (!(await copyToClipboard(toPlainText()))) return
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  const handleDownloadTxt = () => {
    const blob = new Blob([toPlainText()], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "extraction.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const fetchStructuredData = async (): Promise<StructuredExportData | undefined> => {
    if (!isFullContent || !parserId || !documentId) return undefined
    setStructuring(true)
    try {
      const res = await fetch(
        `/api/parsers/${parserId}/documents/${documentId}/structure`,
        { method: "POST" },
      )
      if (!res.ok) return undefined
      return await res.json()
    } catch {
      return undefined
    } finally {
      setStructuring(false)
    }
  }

  const exportOpts = (structuredData?: StructuredExportData) => ({
    results: displayResults,
    fields,
    extractionType: (extractionType ?? "fields") as "fields" | "full_content",
    fileName: fileNameProp ?? "extraction",
    structuredData,
  })

  const handleDownloadCsv = async () => {
    const structured = await fetchStructuredData()
    downloadSingleDocCsv(exportOpts(structured))
  }
  const handleDownloadExcel = async () => {
    const structured = await fetchStructuredData()
    downloadSingleDocExcel(exportOpts(structured))
  }
  const handleDownloadJson = async () => {
    const structured = await fetchStructuredData()
    downloadSingleDocJson(exportOpts(structured))
  }

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === "-") {
      return <span className="text-muted-foreground italic">—</span>
    }
    if (typeof value === "boolean") {
      return <Badge variant="outline">{value ? "true" : "false"}</Badge>
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground italic">empty</span>
      // Check if array of objects (table)
      if (typeof value[0] === "object" && value[0] !== null) {
        return (
          <div className="overflow-x-auto mt-1">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr>
                  {Object.keys(value[0]).map((key) => (
                    <th key={key} className="border px-2 py-1 bg-muted text-left font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((cell, j) => (
                      <td key={j} className="border px-2 py-1">
                        {String(cell ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      return <span>{value.join(", ")}</span>
    }
    if (typeof value === "object") {
      return (
        <pre className="text-xs bg-muted rounded p-2 mt-1 overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }
    return <span>{String(value)}</span>
  }

  /** Infer a display type label from a value */
  const inferType = (value: any): string => {
    if (value === null || value === undefined || value === "-") return "—"
    if (typeof value === "boolean") return "boolean"
    if (typeof value === "number") return "number"
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "object") return "table"
      return "list"
    }
    if (typeof value === "object") return "object"
    return "string"
  }

  // Build display entries — schema-driven or dynamic
  const fieldEntries = isFullContent
    ? Object.entries(displayResults).map(([key, value]) => ({
        id: key,
        name: key.replace(/_/g, " "),
        type: inferType(value),
        value,
      }))
    : fields
        .filter((f) => f.type !== "input")
        .map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          value: displayResults[f.id],
        }))

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        {isFullContent ? (
          <Tabs value={view} onValueChange={(v) => setView(v as "table" | "json" | "markdown")}>
            <TabsList className="h-8">
              <TabsTrigger value="markdown" className="text-xs h-7">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="json" className="text-xs h-7">
                <Code className="h-3.5 w-3.5 mr-1" />
                Source
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <Tabs value={view} onValueChange={(v) => setView(v as "table" | "json" | "markdown")}>
            <TabsList className="h-8">
              <TabsTrigger value="table" className="text-xs h-7">
                <Table2 className="h-3.5 w-3.5 mr-1" />
                Table
              </TabsTrigger>
              <TabsTrigger value="json" className="text-xs h-7">
                <Code className="h-3.5 w-3.5 mr-1" />
                JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="flex items-center gap-1">
          {onReprocess && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReprocess}
              disabled={isReprocessing}
            >
              <RotateCcw className={`h-3.5 w-3.5 mr-1 ${isReprocessing ? "animate-spin" : ""}`} />
              {isReprocessing ? "Reprocessing..." : "Reprocess"}
            </Button>
          )}
          {parserId && !isFullContent && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/parsers/${parserId}/schema`}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit Fields
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleCopyText}>
            {copiedText ? (
              <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            {copiedText ? "Copied" : "Copy Text"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            {copied ? "Copied" : isFullContent ? "Copy Markdown" : "Copy JSON"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={structuring}>
                {structuring ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1" />
                )}
                {structuring ? "Preparing..." : "Download"}
                <ChevronDown className="h-3 w-3 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadExcel} disabled={structuring}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadCsv} disabled={structuring}>
                <FileText className="h-3.5 w-3.5 mr-2" />
                CSV (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadJson} disabled={structuring}>
                <FileJson className="h-3.5 w-3.5 mr-2" />
                JSON (.json)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadTxt}>
                <FileText className="h-3.5 w-3.5 mr-2" />
                Text (.txt)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isFullContent ? (
        view === "markdown" ? (
          <div className="mp-mask p-4 prose prose-sm max-w-none dark:prose-invert overflow-auto max-h-[600px]">
            <Markdown>{markdownContent}</Markdown>
          </div>
        ) : (
          <pre className="mp-mask p-4 text-xs overflow-auto max-h-[600px] bg-muted/20 whitespace-pre-wrap">
            {markdownContent}
          </pre>
        )
      ) : view === "table" ? (
        <div className="mp-mask divide-y">
          {fieldEntries.map((entry) => {
            const isEnriching = enrichingSet.has(entry.id)
            return (
              <div key={entry.id} className={`flex items-start gap-4 p-3 ${isEnriching ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
                <div className="w-1/3 shrink-0">
                  <span className="text-sm font-medium capitalize">{entry.name}</span>
                  <Badge variant="outline" className="text-[10px] ml-2">
                    {entry.type}
                  </Badge>
                </div>
                <div className="flex-1 text-sm break-words min-w-0">
                  {isEnriching ? (
                    <span className="inline-flex items-center gap-1.5 text-blue-600">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-xs">enriching...</span>
                    </span>
                  ) : (
                    renderValue(entry.value)
                  )}
                </div>
              </div>
            )
          })}
          {fieldEntries.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No data to display
            </div>
          )}
        </div>
      ) : (
        <pre className="mp-mask p-4 text-xs overflow-auto max-h-[600px] bg-muted/20">
          {JSON.stringify(mapResultKeysToNames(displayResults, fields), null, 2)}
        </pre>
      )}
    </div>
  )
}
