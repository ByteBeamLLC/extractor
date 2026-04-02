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
  FileCode,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Status = "idle" | "processing" | "done" | "error"

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function PdfToXmlTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [xmlOutput, setXmlOutput] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
    setStatus("processing")
    setError(null)
    setXmlOutput("")

    try {
      const { extractTextFromPDF } = await import("@/lib/tools/pdf-utils")
      const text = await extractTextFromPDF(file)

      if (!text.trim()) {
        setError(
          "No text found in this PDF. The file might be a scanned document or contain only images. Try our AI-powered extraction for scanned PDFs."
        )
        setStatus("error")
        return
      }

      const rawPages = text.split("\f").filter((p) => p.trim())
      const pages = rawPages.length > 0 ? rawPages : [text]

      const pagesXml = pages
        .map(
          (pageText, i) =>
            `    <page number="${i + 1}">\n      <content>${escapeXml(pageText.trim())}</content>\n    </page>`
        )
        .join("\n")

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <metadata>
    <fileName>${escapeXml(file.name)}</fileName>
    <fileSize>${file.size}</fileSize>
    <extractedAt>${new Date().toISOString()}</extractedAt>
    <pageCount>${pages.length}</pageCount>
    <totalCharacters>${text.length}</totalCharacters>
  </metadata>
  <pages>
${pagesXml}
  </pages>
</document>`

      setXmlOutput(xml)
      setStatus("done")
    } catch (e) {
      console.error("PDF to XML conversion error:", e)
      setError(
        "Failed to convert this PDF. It may be encrypted, corrupted, or password-protected."
      )
      setStatus("error")
    }
  }, [])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(xmlOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [xmlOutput])

  const handleDownload = useCallback(() => {
    const blob = new Blob([xmlOutput], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
      ? fileName.replace(/\.pdf$/i, ".xml")
      : "extracted-data.xml"
    a.click()
    URL.revokeObjectURL(url)
  }, [xmlOutput, fileName])

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
    setXmlOutput("")
    setError(null)
    setFileName(null)
    setCopied(false)
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
              Drop your PDF here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              PDF files up to 50 MB. Converts to structured XML instantly.
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
          <p className="font-semibold text-lg mb-1">Converting to XML...</p>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </div>
      )}

      {status === "done" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">XML generated</p>
                <p className="text-xs text-muted-foreground">
                  {xmlOutput.length.toLocaleString()} characters
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

          <div className="px-6 py-4">
            <pre className="w-full h-64 rounded-lg border bg-muted/30 p-4 text-sm font-mono overflow-auto whitespace-pre">
              {xmlOutput}
            </pre>
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
              {copied ? "Copied!" : "Copy XML"}
            </Button>
            <Button onClick={handleDownload} className="flex-1 h-11" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Download .xml
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

      {status === "error" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-start gap-3 px-6 py-5">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">Conversion failed</p>
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
                <FileCode className="h-4 w-4 mr-2" />
                Try AI-Powered Extraction
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
