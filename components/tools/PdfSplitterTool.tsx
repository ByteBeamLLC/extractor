"use client"

import { useState, useCallback, useRef } from "react"
import {
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Scissors,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileSizeBridgeBanner } from "@/components/tools/FileSizeBridgeBanner"

type Status = "idle" | "loaded" | "processing" | "done" | "error"
type SplitMode = "all" | "range"

export function PdfSplitterTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [splitMode, setSplitMode] = useState<SplitMode>("all")
  const [rangeFrom, setRangeFrom] = useState(1)
  const [rangeTo, setRangeTo] = useState(1)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultCount, setResultCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileTooLarge, setFileTooLarge] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (f: File) => {
    if (f.type !== "application/pdf" && !f.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.")
      setStatus("error")
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      setFileTooLarge(true)
      setError("File too large. Maximum size is 50 MB.")
      setStatus("error")
      return
    }

    setFileName(f.name)
    setFile(f)
    setError(null)

    try {
      const { getPDFPageCount } = await import("@/lib/tools/pdf-utils")
      const count = await getPDFPageCount(f)
      setPageCount(count)
      setRangeFrom(1)
      setRangeTo(count)
      setStatus("loaded")
    } catch (e) {
      console.error("PDF load error:", e)
      setError("Failed to read this PDF. It may be encrypted or corrupted.")
      setStatus("error")
    }
  }, [])

  const handleSplit = useCallback(async () => {
    if (!file) return

    setStatus("processing")
    setError(null)
    setResultBlob(null)

    try {
      const { splitPDF } = await import("@/lib/tools/pdf-utils")
      const JSZip = (await import("jszip")).default

      let pages: Blob[]
      if (splitMode === "range") {
        pages = await splitPDF(file, [{ start: rangeFrom, end: rangeTo }])
      } else {
        pages = await splitPDF(file)
      }

      const zip = new JSZip()
      const baseName = file.name.replace(/\.pdf$/i, "")
      pages.forEach((pageBlob, i) => {
        const pageNum =
          splitMode === "range" ? rangeFrom + i : i + 1
        zip.file(`${baseName}_page_${pageNum}.pdf`, pageBlob)
      })

      const zipBlob = await zip.generateAsync({ type: "blob" })
      setResultBlob(zipBlob)
      setResultCount(pages.length)
      setStatus("done")
    } catch (e) {
      console.error("PDF split error:", e)
      setError(
        "Failed to split this PDF. It may be encrypted or have an unsupported format."
      )
      setStatus("error")
    }
  }, [file, splitMode, rangeFrom, rangeTo])

  const handleDownload = useCallback(() => {
    if (!resultBlob) return
    const baseName = file?.name.replace(/\.pdf$/i, "") ?? "split"
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${baseName}_split.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [resultBlob, file])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) processFile(f)
    },
    [processFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) processFile(f)
    },
    [processFile]
  )

  const reset = useCallback(() => {
    setStatus("idle")
    setFile(null)
    setPageCount(0)
    setSplitMode("all")
    setRangeFrom(1)
    setRangeTo(1)
    setResultBlob(null)
    setResultCount(0)
    setError(null)
    setFileTooLarge(false)
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone */}
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
              PDF files up to 50 MB. Split into individual pages.
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

      {/* Loaded — choose split options */}
      {status === "loaded" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <Scissors className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {pageCount} page{pageCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Start over"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-sm font-medium mb-3">Split mode</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSplitMode("all")}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-3 text-sm text-left transition-colors",
                    splitMode === "all"
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30"
                  )}
                >
                  <p className="font-medium">Split all pages</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Each page becomes a separate PDF
                  </p>
                </button>
                <button
                  onClick={() => setSplitMode("range")}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-3 text-sm text-left transition-colors",
                    splitMode === "range"
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30"
                  )}
                >
                  <p className="font-medium">Extract page range</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Extract specific pages
                  </p>
                </button>
              </div>
            </div>

            {splitMode === "range" && (
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={rangeFrom}
                    onChange={(e) =>
                      setRangeFrom(
                        Math.max(1, Math.min(pageCount, Number(e.target.value)))
                      )
                    }
                    className="mt-1 w-20 rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={rangeTo}
                    onChange={(e) =>
                      setRangeTo(
                        Math.max(1, Math.min(pageCount, Number(e.target.value)))
                      )
                    }
                    className="mt-1 w-20 rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground self-end pb-2">
                  of {pageCount} pages
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t">
            <Button
              onClick={handleSplit}
              className="w-full h-11"
              size="lg"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Split PDF
            </Button>
          </div>
        </div>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">Splitting your PDF...</p>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </div>
      )}

      {/* Success state */}
      {status === "done" && resultBlob && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Split complete</p>
                <p className="text-xs text-muted-foreground">
                  {resultCount} PDF{resultCount > 1 ? "s" : ""} created
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Start over"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              className="flex-1 h-11"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download ZIP
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="h-11"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Split Another
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
              <p className="font-semibold text-sm mb-1">Split failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          {fileTooLarge ? (
            <FileSizeBridgeBanner toolName="pdf_splitter" />
          ) : (
            <div className="px-6 py-4 border-t">
              <Button onClick={reset} variant="outline" className="h-10">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Another File
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
