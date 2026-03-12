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
  Copy,
  Sparkles,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/marketing/shared/AuthButton"
import { cn } from "@/lib/utils"

type Status = "idle" | "processing" | "done" | "error"

export function InvoiceParserTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [extractedText, setExtractedText] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    const isPDF =
      file.type === "application/pdf" || file.name.endsWith(".pdf")
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(file.name) ||
      file.type.startsWith("image/")

    if (!isPDF && !isImage) {
      setError("Please upload a PDF or image file (JPG, PNG, WebP).")
      setStatus("error")
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum size is 50 MB.")
      setStatus("error")
      return
    }

    setFileName(file.name)
    setStatus("processing")
    setError(null)
    setExtractedText("")
    setProgress("Loading...")

    try {
      let text = ""

      if (isPDF) {
        setProgress("Extracting text from PDF...")
        const { extractTextFromPDF } = await import("@/lib/tools/pdf-utils")
        text = await extractTextFromPDF(file)
      } else {
        setProgress("Initializing OCR engine...")
        const { performOCR } = await import("@/lib/tools/ocr-utils")
        const result = await performOCR(file, "eng", (p) => {
          setProgress(
            p.status === "recognizing text"
              ? `Recognizing text... ${Math.round(p.progress)}%`
              : p.status
          )
        })
        text = result.text
      }

      if (!text.trim()) {
        setError(
          "No text could be extracted from this file. The document may be a scanned image that requires AI-powered extraction."
        )
        setStatus("error")
        return
      }

      setExtractedText(text)
      setStatus("done")
    } catch (e) {
      console.error("Extraction error:", e)
      setError(
        "Failed to process this file. It may be encrypted or in an unsupported format."
      )
      setStatus("error")
    }
  }, [])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(extractedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [extractedText])

  const handleDownload = useCallback(() => {
    const blob = new Blob([extractedText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName?.replace(/\.[^.]+$/, "") || "invoice"}-extracted.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [extractedText, fileName])

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
    setExtractedText("")
    setError(null)
    setFileName(null)
    setProgress("")
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
              Drop your invoice here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              PDF or image files (JPG, PNG, WebP) up to 50 MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">Extracting text from your invoice...</p>
          <p className="text-sm text-muted-foreground">{progress || fileName}</p>
        </div>
      )}

      {/* Success state */}
      {status === "done" && extractedText && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Text extracted</p>
                <p className="text-xs text-muted-foreground">
                  {extractedText.length.toLocaleString()} characters &middot;{" "}
                  {fileName}
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Process another file"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Extracted text */}
          <div className="px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Extracted raw text
            </p>
            <div className="max-h-80 overflow-y-auto rounded-lg border bg-muted/30 p-4">
              <pre className="text-sm whitespace-pre-wrap break-words font-mono text-foreground">
                {extractedText}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
            <Button onClick={handleCopy} variant="outline" className="h-11 flex-1">
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "Copied!" : "Copy Text"}
            </Button>
            <Button onClick={handleDownload} className="h-11 flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download .txt
            </Button>
            <Button onClick={reset} variant="outline" className="h-11">
              <RotateCcw className="h-4 w-4 mr-2" />
              New File
            </Button>
          </div>

          {/* Upsell */}
          <div className="px-6 py-4 border-t">
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center">
              <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="font-semibold mb-1">
                Want structured invoice data instead of raw text?
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Parsli AI extracts line items, totals, vendor info, dates, and
                more as structured JSON with custom schemas.
              </p>
              <AuthButton className="h-10 px-6" showArrow>
                Try Parsli AI Free
              </AuthButton>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-start gap-3 px-6 py-5">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">Extraction failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
            <Button onClick={reset} variant="outline" className="h-10">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Another File
            </Button>
            <Button asChild className="h-10">
              <a href="/solutions/invoice-parsing">
                <FileText className="h-4 w-4 mr-2" />
                Try AI-Powered Extraction
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
