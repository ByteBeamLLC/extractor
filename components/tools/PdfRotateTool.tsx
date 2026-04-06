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
  RotateCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileSizeBridgeBanner } from "@/components/tools/FileSizeBridgeBanner"

type Status = "idle" | "loaded" | "processing" | "done" | "error"
type RotateMode = "all" | "specific"

export function PdfRotateTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [rotation, setRotation] = useState<90 | 180 | 270>(90)
  const [rotateMode, setRotateMode] = useState<RotateMode>("all")
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
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

  const handleRotate = useCallback(async () => {
    if (!file) return

    if (rotateMode === "specific" && selectedPages.size === 0) {
      setError("Please select at least one page to rotate.")
      return
    }

    setStatus("processing")
    setError(null)
    setResultBlob(null)

    try {
      const { rotatePages } = await import("@/lib/tools/pdf-utils")
      const pageIndices =
        rotateMode === "specific" ? Array.from(selectedPages) : undefined
      const blob = await rotatePages(file, rotation, pageIndices)
      setResultBlob(blob)
      setStatus("done")
    } catch (e) {
      console.error("PDF rotation error:", e)
      setError(
        "Failed to rotate pages. The file may be encrypted or corrupted."
      )
      setStatus("error")
    }
  }, [file, rotation, rotateMode, selectedPages])

  const handleDownload = useCallback(() => {
    if (!resultBlob || !fileName) return
    const baseName = fileName.replace(/\.pdf$/i, "")
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${baseName}_rotated.pdf`
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
    setRotation(90)
    setRotateMode("all")
    setSelectedPages(new Set())
    setResultBlob(null)
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
              PDF files up to 50 MB. Rotate pages instantly.
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

      {/* Loaded — choose rotation options */}
      {status === "loaded" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <RotateCw className="h-5 w-5 text-primary" />
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

          <div className="px-6 py-5 space-y-5">
            {/* Rotation angle */}
            <div>
              <p className="text-sm font-medium mb-3">Rotation angle</p>
              <div className="flex gap-3">
                {([90, 180, 270] as const).map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setRotation(angle)}
                    className={cn(
                      "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                      rotation === angle
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/30"
                    )}
                  >
                    {angle}&deg;
                  </button>
                ))}
              </div>
            </div>

            {/* Rotate mode */}
            <div>
              <p className="text-sm font-medium mb-3">Pages to rotate</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRotateMode("all")}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-3 text-sm text-left transition-colors",
                    rotateMode === "all"
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30"
                  )}
                >
                  <p className="font-medium">All pages</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rotate every page
                  </p>
                </button>
                <button
                  onClick={() => setRotateMode("specific")}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-3 text-sm text-left transition-colors",
                    rotateMode === "specific"
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30"
                  )}
                >
                  <p className="font-medium">Specific pages</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose which pages
                  </p>
                </button>
              </div>
            </div>

            {/* Page selection */}
            {rotateMode === "specific" && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Click pages to select for rotation
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
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:border-primary/30 text-foreground"
                        )}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t">
            <Button
              onClick={handleRotate}
              className="w-full h-11"
              size="lg"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate {rotation}&deg;
            </Button>
          </div>
        </div>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">Rotating pages...</p>
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
                <p className="font-semibold text-sm">Rotation complete</p>
                <p className="text-xs text-muted-foreground">
                  {rotateMode === "all"
                    ? `All ${pageCount} pages`
                    : `${selectedPages.size} page${selectedPages.size > 1 ? "s" : ""}`}{" "}
                  rotated {rotation}&deg;
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
              Download Rotated PDF
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="h-11"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Rotate Another
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
              <p className="font-semibold text-sm mb-1">Rotation failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          {fileTooLarge ? (
            <FileSizeBridgeBanner toolName="pdf_rotate" />
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
