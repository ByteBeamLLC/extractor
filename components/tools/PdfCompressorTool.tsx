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
  Minimize2,
  ArrowDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Status = "idle" | "processing" | "done" | "error"

export function PdfCompressorTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const processFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.")
      setStatus("error")
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum size is 50 MB.")
      setStatus("error")
      return
    }

    setFileName(file.name)
    setOriginalSize(file.size)
    setStatus("processing")
    setError(null)
    setCompressedBlob(null)

    try {
      const { compressPDF } = await import("@/lib/tools/pdf-utils")
      const blob = await compressPDF(file)
      setCompressedBlob(blob)
      setCompressedSize(blob.size)
      setStatus("done")
    } catch (e) {
      console.error("PDF compression error:", e)
      setError(
        "Failed to compress this PDF. It may be encrypted or corrupted."
      )
      setStatus("error")
    }
  }, [])

  const handleDownload = useCallback(() => {
    if (!compressedBlob || !fileName) return
    const baseName = fileName.replace(/\.pdf$/i, "")
    const url = URL.createObjectURL(compressedBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${baseName}_compressed.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [compressedBlob, fileName])

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
    setCompressedBlob(null)
    setOriginalSize(0)
    setCompressedSize(0)
    setError(null)
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  const reduction =
    originalSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0

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
              PDF files up to 50 MB. Compress instantly in your browser.
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
          <p className="font-semibold text-lg mb-1">Compressing your PDF...</p>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </div>
      )}

      {/* Success state */}
      {status === "done" && compressedBlob && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Compression complete</p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
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

          {/* Size comparison */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Original
                </p>
                <p className="text-xl font-bold">{formatSize(originalSize)}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ArrowDown className="h-5 w-5 text-primary" />
                <span
                  className={cn(
                    "text-sm font-semibold rounded-full px-3 py-0.5",
                    reduction > 0
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {reduction > 0 ? `-${reduction}%` : "No reduction"}
                </span>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Compressed
                </p>
                <p className="text-xl font-bold">
                  {formatSize(compressedSize)}
                </p>
              </div>
            </div>
            {reduction <= 0 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                This PDF is already well-optimized. The compressed file may be
                similar in size.
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              className="flex-1 h-11"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Compressed PDF
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="h-11"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Compress Another
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
              <p className="font-semibold text-sm mb-1">Compression failed</p>
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
