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
  PenLine,
  Languages,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { OCRLanguage, OCRProgress } from "@/lib/tools/ocr-utils"

const SUPPORTED_LANGUAGES: Record<OCRLanguage, string> = {
  eng: "English",
  ara: "Arabic",
  fra: "French",
  deu: "German",
  spa: "Spanish",
  ita: "Italian",
  por: "Portuguese",
  rus: "Russian",
  chi_sim: "Chinese (Simplified)",
  chi_tra: "Chinese (Traditional)",
  jpn: "Japanese",
  kor: "Korean",
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
]

type Status = "idle" | "processing" | "done" | "error"

export function HandwritingToTextTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [extractedText, setExtractedText] = useState<string>("")
  const [confidence, setConfidence] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [language, setLanguage] = useState<OCRLanguage>("eng")
  const [progress, setProgress] = useState<OCRProgress | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please upload an image file (JPG, PNG, GIF, BMP, or WebP).")
        setStatus("error")
        return
      }

      if (file.size > 20 * 1024 * 1024) {
        setError("File too large. Maximum size is 20 MB.")
        setStatus("error")
        return
      }

      setFileName(file.name)
      setStatus("processing")
      setError(null)
      setExtractedText("")
      setProgress(null)

      try {
        const { performOCR } = await import("@/lib/tools/ocr-utils")
        const result = await performOCR(file, language, (p) => setProgress(p))

        if (!result.text.trim()) {
          setError(
            "No text found in this image. The handwriting might be too unclear or the image quality too low. Try a clearer photo with good lighting."
          )
          setStatus("error")
          return
        }

        setExtractedText(result.text)
        setConfidence(result.confidence)
        setStatus("done")
      } catch (e) {
        console.error("OCR error:", e)
        setError(
          "Failed to extract text from this image. Please try again with a clearer photo."
        )
        setStatus("error")
      }
    },
    [language]
  )

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
    a.download = fileName ? fileName.replace(/\.[^.]+$/, ".txt") : "handwriting-text.txt"
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
    setConfidence(0)
    setError(null)
    setFileName(null)
    setProgress(null)
    setCopied(false)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone / Upload area */}
      {status === "idle" && (
        <>
          {/* Language selector */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <Select
              value={language}
              onValueChange={(v) => setLanguage(v as OCRLanguage)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                Drop your handwritten note here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Photo of handwritten text &mdash; JPG, PNG, GIF, BMP, or WebP up to 20 MB
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,image/jpeg,image/png,image/gif,image/bmp,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        </>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">Recognizing handwriting...</p>
          <p className="text-sm text-muted-foreground">{fileName}</p>
          {progress && (
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(progress.progress)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {progress.status} &mdash; {Math.round(progress.progress)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success state */}
      {status === "done" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Handwriting recognized</p>
                <p className="text-xs text-muted-foreground">
                  {extractedText.split(/\s+/).length} words &middot;{" "}
                  {Math.round(confidence)}% confidence
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Extract from another file"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Extracted text */}
          <div className="px-6 py-4">
            <textarea
              readOnly
              value={extractedText}
              className="w-full h-64 rounded-lg border bg-muted/30 p-4 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
            <Button onClick={handleCopy} variant="outline" className="h-11 flex-1">
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
              Extract Another
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
              <p className="font-semibold text-sm mb-1">Recognition failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
            <Button onClick={reset} variant="outline" className="h-10">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Another File
            </Button>
            <Button asChild className="h-10">
              <a href="/solutions/ai-ocr">
                <PenLine className="h-4 w-4 mr-2" />
                Try AI-Powered Extraction
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
