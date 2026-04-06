"use client"

import { useState, useCallback, useRef } from "react"
import {
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  ClipboardPaste,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileSizeBridgeBanner } from "@/components/tools/FileSizeBridgeBanner"

type Status = "idle" | "processing" | "done" | "error"
type InputMode = "upload" | "paste"

const XLSX_CDN = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadScript(src: string, globalName: string): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = (window as any)[globalName]
  if (existing) return Promise.resolve(existing)
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lib = (window as any)[globalName]
      if (lib) resolve(lib)
      else reject(new Error(`${globalName} not found after loading ${src}`))
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

async function getXLSX() {
  return loadScript(XLSX_CDN, "XLSX")
}

interface ConversionResult {
  rowCount: number
  columnCount: number
  preview: string[][]
  fileName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workbook: any
}

export function CsvToExcelTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileTooLarge, setFileTooLarge] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<InputMode>("upload")
  const [pastedCsv, setPastedCsv] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const processCsv = useCallback(async (csvString: string, sourceName: string) => {
    setFileName(sourceName)
    setStatus("processing")
    setError(null)
    setResult(null)

    try {
      if (!csvString.trim()) {
        setError("The CSV data is empty. Please provide some data.")
        setStatus("error")
        return
      }

      const xlsx = await getXLSX()
      const workbook = xlsx.read(csvString, { type: "string" })

      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) {
        setError("Failed to parse CSV data.")
        setStatus("error")
        return
      }

      const worksheet = workbook.Sheets[firstSheetName]
      const data: string[][] = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      })

      if (data.length === 0) {
        setError("No data found in the CSV. Please check the format.")
        setStatus("error")
        return
      }

      const columnCount = Math.max(...data.map((row: string[]) => row.length))
      const preview = data.slice(0, 10).map((row: string[]) =>
        row.map((cell: unknown) => String(cell ?? ""))
      )
      const baseName = sourceName.replace(/\.csv$/i, "")

      // Build the Excel workbook for download
      const excelWs = xlsx.utils.aoa_to_sheet(data)
      // Auto-size columns
      if (data.length > 0) {
        const colWidths = Array.from({ length: columnCount }, (_, colIdx) => {
          const maxLen = Math.max(
            ...data.map((row: string[]) => String(row[colIdx] ?? "").length)
          )
          return { wch: Math.min(maxLen + 2, 50) }
        })
        excelWs["!cols"] = colWidths
      }
      const excelWb = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(excelWb, excelWs, "Sheet1")

      setResult({
        rowCount: data.length,
        columnCount,
        preview,
        fileName: `${baseName}.xlsx`,
        workbook: excelWb,
      })
      setStatus("done")
    } catch (e) {
      console.error("CSV to Excel conversion error:", e)
      setError("Failed to process this CSV. Please check the format and try again.")
      setStatus("error")
    }
  }, [])

  const processFile = useCallback(async (file: File) => {
    const validExtensions = [".csv"]
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )
    if (!hasValidExt && file.type !== "text/csv") {
      setError("Please upload a CSV file (.csv).")
      setStatus("error")
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setFileTooLarge(true)
      setError("File too large. Maximum size is 50 MB.")
      setStatus("error")
      return
    }

    const text = await file.text()
    await processCsv(text, file.name)
  }, [processCsv])

  const handlePasteConvert = useCallback(async () => {
    if (!pastedCsv.trim()) {
      setError("Please paste some CSV data first.")
      setStatus("error")
      return
    }
    await processCsv(pastedCsv, "pasted-data")
  }, [pastedCsv, processCsv])

  const handleDownload = useCallback(async () => {
    if (!result) return
    try {
      const xlsx = await getXLSX()
      xlsx.writeFile(result.workbook, result.fileName)
    } catch (e) {
      console.error("Download error:", e)
    }
  }, [result])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setError(null)
    setFileTooLarge(false)
    setFileName(null)
    setPastedCsv("")
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone / Upload area */}
      {status === "idle" && (
        <div>
          {/* Mode toggle */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => setInputMode("upload")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                inputMode === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Upload File
            </button>
            <button
              onClick={() => setInputMode("paste")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                inputMode === "paste"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Paste CSV
            </button>
          </div>

          {inputMode === "upload" && (
            <label
              className={cn(
                "relative block rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer",
                "bg-card hover:bg-muted/50 hover:border-primary/40",
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border"
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center py-14 px-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <p className="text-lg font-semibold mb-1">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  .csv files up to 50 MB. Converts to Excel instantly.
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          )}

          {inputMode === "paste" && (
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardPaste className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Paste your CSV data</p>
              </div>
              <textarea
                value={pastedCsv}
                onChange={(e) => setPastedCsv(e.target.value)}
                placeholder={"Name,Email,Age\nJohn,john@example.com,30\nJane,jane@example.com,25"}
                className="w-full h-48 rounded-lg border bg-muted/30 p-4 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4"
              />
              <Button onClick={handlePasteConvert} className="w-full h-11" size="lg">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Convert to Excel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">Converting to Excel...</p>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </div>
      )}

      {/* Success state */}
      {status === "done" && result && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Conversion complete</p>
                <p className="text-xs text-muted-foreground">
                  {result.rowCount} rows &middot; {result.columnCount} columns
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Convert another file"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Table preview */}
          <div className="px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Preview (first {Math.min(result.preview.length, 10)} rows)
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <tbody>
                  {result.preview.map((row, i) => (
                    <tr
                      key={i}
                      className={cn(
                        "border-b last:border-b-0",
                        i === 0
                          ? "bg-muted/50 font-medium"
                          : "hover:bg-muted/30"
                      )}
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="px-3 py-2 whitespace-nowrap text-xs"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.rowCount > 10 && (
              <p className="text-xs text-muted-foreground mt-2">
                + {result.rowCount - 10} more rows in the Excel file
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              className="flex-1 h-11"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download {result.fileName}
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="h-11"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Convert Another
            </Button>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-start gap-3 px-6 py-5">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">Conversion failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          {fileTooLarge ? (
            <FileSizeBridgeBanner toolName="csv_to_excel" />
          ) : (
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
              <Button onClick={reset} variant="outline" className="h-10">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button asChild className="h-10">
                <a href="/solutions/document-parsing-api">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Try AI-Powered Extraction
                </a>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
