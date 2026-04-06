"use client"

import { useState, useCallback, useRef } from "react"
import {
  Upload,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileSizeBridgeBanner } from "@/components/tools/FileSizeBridgeBanner"

type Status = "idle" | "processing" | "done" | "error"

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
  csv: string
  rowCount: number
  sheetName: string
  fileName: string
}

export function ExcelToCsvTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileTooLarge, setFileTooLarge] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    const validExtensions = [".xlsx", ".xls"]
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )
    if (!hasValidExt) {
      setError("Please upload an Excel file (.xlsx or .xls).")
      setStatus("error")
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setFileTooLarge(true)
      setError("File too large. Maximum size is 50 MB.")
      setStatus("error")
      return
    }

    setFileName(file.name)
    setStatus("processing")
    setError(null)
    setResult(null)

    try {
      const xlsx = await getXLSX()
      const arrayBuffer = await file.arrayBuffer()
      const workbook = xlsx.read(arrayBuffer, { type: "array" })

      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) {
        setError("No sheets found in this Excel file.")
        setStatus("error")
        return
      }

      const worksheet = workbook.Sheets[firstSheetName]
      const csv: string = xlsx.utils.sheet_to_csv(worksheet)

      if (!csv.trim()) {
        setError("No data found in the first sheet. The sheet may be empty.")
        setStatus("error")
        return
      }

      const rowCount = csv.trim().split("\n").length
      const baseName = file.name.replace(/\.(xlsx|xls)$/i, "")

      setResult({
        csv,
        rowCount,
        sheetName: firstSheetName,
        fileName: `${baseName}.csv`,
      })
      setStatus("done")
    } catch (e) {
      console.error("Excel to CSV conversion error:", e)
      setError("Failed to process this Excel file. It may be corrupted or password-protected.")
      setStatus("error")
    }
  }, [])

  const handleCopy = useCallback(async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.csv)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = result.csv
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [result])

  const handleDownload = useCallback(() => {
    if (!result) return
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = result.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
    setCopied(false)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone / Upload area */}
      {status === "idle" && (
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
              Drop your Excel file here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              .xlsx or .xls files up to 50 MB. Converts to CSV instantly.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">Converting to CSV...</p>
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
                  {result.rowCount} rows &middot; Sheet: {result.sheetName}
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

          {/* CSV output */}
          <div className="px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              CSV Output
            </p>
            <textarea
              readOnly
              value={result.csv}
              className="w-full h-64 rounded-lg border bg-muted/30 p-4 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
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
              onClick={handleCopy}
              variant="outline"
              className="h-11"
              size="lg"
            >
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? "Copied!" : "Copy CSV"}
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
            <FileSizeBridgeBanner toolName="excel_to_csv" />
          ) : (
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
              <Button onClick={reset} variant="outline" className="h-10">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Another File
              </Button>
              <Button asChild className="h-10">
                <a href="/solutions/document-parsing-api">
                  <FileText className="h-4 w-4 mr-2" />
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
