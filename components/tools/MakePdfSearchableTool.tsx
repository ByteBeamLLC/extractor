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
  Check,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Status = "idle" | "processing" | "done" | "error"

export function MakePdfSearchableTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [extractedText, setExtractedText] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.")
      setStatus("error")
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File too large. Maximum size is 20 MB for OCR processing.")
      setStatus("error")
      return
    }

    setFileName(file.name)
    setStatus("processing")
    setError(null)
    setExtractedText("")
    setProgress("Loading PDF...")

    try {
      // First try extracting embedded text
      const { extractTextFromPDF } = await import("@/lib/tools/pdf-utils")
      const embeddedText = await extractTextFromPDF(file)

      if (embeddedText.trim().length > 50) {
        // PDF already has searchable text
        setExtractedText(embeddedText)
        setStatus("done")
        return
      }

      // No embedded text — run OCR on each page
      setProgress("PDF appears to be scanned. Running OCR...")

      // Load pdf.js to render pages as images
      const PDFJS_CDN =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pdfjs = (window as any).pdfjsLib
      if (!pdfjs) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = `${PDFJS_CDN}/pdf.min.js`
          script.async = true
          script.onload = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pdfjs = (window as any).pdfjsLib
            pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`
            resolve()
          }
          script.onerror = () => reject(new Error("Failed to load PDF.js"))
          document.head.appendChild(script)
        })
      }

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      const numPages = pdf.numPages

      const { performOCR } = await import("@/lib/tools/ocr-utils")
      const allText: string[] = []

      for (let i = 1; i <= numPages; i++) {
        setProgress(`Processing page ${i} of ${numPages}...`)

        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2 }) // 2x for better OCR
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")!
        await page.render({ canvasContext: ctx, viewport }).promise

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png")
        )
        const imageFile = new File([blob], `page-${i}.png`, {
          type: "image/png",
        })

        const result = await performOCR(imageFile, "eng")
        allText.push(result.text)
      }

      const fullText = allText.join("\n\n--- Page Break ---\n\n")

      if (!fullText.trim()) {
        setError(
          "Could not extract text from this PDF. The scan quality may be too low. Try Parsli AI for better results on difficult scans."
        )
        setStatus("error")
        return
      }

      setExtractedText(fullText)
      setStatus("done")
    } catch (e) {
      console.error("PDF OCR error:", e)
      setError(
        "Failed to process this PDF. It may be encrypted, corrupted, or too complex for browser-based OCR."
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
    a.download = fileName
      ? fileName.replace(/\.pdf$/i, "-searchable.txt")
      : "searchable-text.txt"
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
    setCopied(false)
    setProgress("")
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto">
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
              Drop your scanned PDF here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              PDF files up to 20 MB. OCR extracts searchable text from scanned
              pages.
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

      {status === "processing" && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">Running OCR...</p>
          <p className="text-sm text-muted-foreground">{progress}</p>
        </div>
      )}

      {status === "done" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">
                  Text extracted — now searchable
                </p>
                <p className="text-xs text-muted-foreground">
                  {extractedText.split(/\s+/).length} words &middot;{" "}
                  {extractedText.length} characters
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

          <div className="px-6 py-4">
            <textarea
              readOnly
              value={extractedText}
              className="w-full h-64 rounded-lg border bg-muted/30 p-4 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="h-11 flex-1"
            >
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? "Copied!" : "Copy Text"}
            </Button>
            <Button onClick={handleDownload} className="flex-1 h-11" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Download .txt
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="h-11"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Process Another
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-start gap-3 px-6 py-5">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">OCR failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
            <Button onClick={reset} variant="outline" className="h-10">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Another File
            </Button>
            <Button asChild className="h-10">
              <a href="/solutions/document-parsing-api">
                <Search className="h-4 w-4 mr-2" />
                Try AI-Powered OCR
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
