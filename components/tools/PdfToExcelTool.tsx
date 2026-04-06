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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ConversionResult } from "@/lib/tools/pdf-to-excel"
import { FileSizeBridgeBanner } from "@/components/tools/FileSizeBridgeBanner"

type Status = "idle" | "processing" | "done" | "error"

export function PdfToExcelTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileTooLarge, setFileTooLarge] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.")
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
      // Dynamic import to keep initial bundle small
      const { convertPdfToExcel } = await import("@/lib/tools/pdf-to-excel")
      const conversionResult = await convertPdfToExcel(file)

      if (conversionResult.totalRows === 0) {
        setError(
          "No tabular data found in this PDF. The file might contain scanned images or complex layouts that require AI extraction."
        )
        setStatus("error")
        return
      }

      setResult(conversionResult)
      setStatus("done")
    } catch (e) {
      console.error("PDF conversion error:", e)
      setError(
        "Failed to process this PDF. It may be encrypted, scanned, or have a complex layout."
      )
      setStatus("error")
    }
  }, [])

  const handleDownload = useCallback(async () => {
    if (!result) return
    const { downloadExcel } = await import("@/lib/tools/pdf-to-excel")
    await downloadExcel(result)
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
              Drop your PDF here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              PDF files up to 50 MB. Converts tables to Excel instantly.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">Converting your PDF...</p>
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
                  {result.totalRows} rows &middot; {result.totalPages} page
                  {result.totalPages > 1 ? "s" : ""} &middot;{" "}
                  {result.sheets.length} sheet
                  {result.sheets.length > 1 ? "s" : ""}
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
              Preview (first 10 rows)
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <tbody>
                  {result.sheets[0].data.slice(0, 10).map((row, i) => (
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
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.totalRows > 10 && (
              <p className="text-xs text-muted-foreground mt-2">
                + {result.totalRows - 10} more rows in the Excel file
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
            <FileSizeBridgeBanner toolName="pdf_to_excel" />
          ) : (
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
              <Button onClick={reset} variant="outline" className="h-10">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Another File
              </Button>
              <Button asChild className="h-10">
                <a href="/solutions/pdf-to-excel">
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
