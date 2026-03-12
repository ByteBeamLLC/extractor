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
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Status = "idle" | "loaded" | "processing" | "done" | "error"

export function PdfPageRemoverTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
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
      setError("File too large. Maximum size is 50 MB.")
      setStatus("error")
      return
    }

    setFileName(f.name)
    setFile(f)
    setError(null)
    setSelectedPages(new Set())

    try {
      const { getPDFPageCount } = await import("@/lib/tools/pdf-utils")
      const count = await getPDFPageCount(f)
      setPageCount(count)
      setStatus("loaded")
    } catch (e) {
      console.error("PDF load error:", e)
      setError("Failed to read this PDF. It may be encrypted or corrupted.")
      setStatus("error")
    }
  }, [])

  const togglePage = useCallback((page: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      if (next.has(page)) {
        next.delete(page)
      } else {
        next.add(page)
      }
      return next
    })
  }, [])

  const handleRemove = useCallback(async () => {
    if (!file || selectedPages.size === 0) return

    if (selectedPages.size >= pageCount) {
      setError("You cannot remove all pages. At least one page must remain.")
      return
    }

    setStatus("processing")
    setError(null)
    setResultBlob(null)

    try {
      const { removePages } = await import("@/lib/tools/pdf-utils")
      const blob = await removePages(file, Array.from(selectedPages))
      setResultBlob(blob)
      setStatus("done")
    } catch (e) {
      console.error("PDF page removal error:", e)
      setError(
        "Failed to remove pages. The file may be encrypted or corrupted."
      )
      setStatus("error")
    }
  }, [file, selectedPages, pageCount])

  const handleDownload = useCallback(() => {
    if (!resultBlob || !fileName) return
    const baseName = fileName.replace(/\.pdf$/i, "")
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${baseName}_edited.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [resultBlob, fileName])

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
    setSelectedPages(new Set())
    setResultBlob(null)
    setError(null)
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
              PDF files up to 50 MB. Select pages to remove.
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

      {/* Loaded — select pages */}
      {status === "loaded" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {pageCount} page{pageCount > 1 ? "s" : ""} &middot; Select
                  pages to remove
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

          <div className="px-6 py-5">
            <p className="text-sm font-medium mb-3">
              Click pages to mark for removal
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => togglePage(page)}
                    className={cn(
                      "w-11 h-11 rounded-lg border text-sm font-medium transition-all",
                      selectedPages.has(page)
                        ? "border-destructive bg-destructive/10 text-destructive line-through"
                        : "hover:border-primary/30 text-foreground"
                    )}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            {selectedPages.size > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                {selectedPages.size} page{selectedPages.size > 1 ? "s" : ""}{" "}
                selected for removal &middot;{" "}
                {pageCount - selectedPages.size} will remain
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t">
            <Button
              onClick={handleRemove}
              disabled={selectedPages.size === 0}
              className="w-full h-11"
              size="lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove {selectedPages.size} Page
              {selectedPages.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">Removing pages...</p>
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
                <p className="font-semibold text-sm">Pages removed</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPages.size} page
                  {selectedPages.size > 1 ? "s" : ""} removed &middot;{" "}
                  {pageCount - selectedPages.size} remaining
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
              Download Edited PDF
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="h-11"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Edit Another
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
              <p className="font-semibold text-sm mb-1">Operation failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          <div className="px-6 py-4 border-t">
            <Button onClick={reset} variant="outline" className="h-10">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
