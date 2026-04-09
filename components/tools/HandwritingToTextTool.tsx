"use client"

import { useState, useCallback, useRef } from "react"
import Image from "next/image"
import { trackEvent } from "@/lib/analytics"
import { incrementToolUses } from "@/lib/analytics/identity"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { copyToClipboard } from "@/lib/clipboard"
import { BridgeChat } from "./BridgeChat"
import { FileSizeBridgeBanner } from "@/components/tools/FileSizeBridgeBanner"

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
  "image/tiff",
  "image/heic",
  "image/heif",
  "application/pdf",
]

type Status = "idle" | "processing" | "done" | "error"

const SAMPLES = [
  {
    label: "Cursive Letter",
    src: "/samples/handwriting-cursive.jpg",
    mimeType: "image/jpeg",
  },
  {
    label: "Student Notes",
    src: "/samples/handwriting-notes.jpg",
    mimeType: "image/jpeg",
  },
  {
    label: "Sticky Note",
    src: "/samples/handwriting-sticky.jpg",
    mimeType: "image/jpeg",
  },
]

const MAX_DIMENSION = 2000
const JPEG_QUALITY = 0.8
const INLINE_THRESHOLD = 3 * 1024 * 1024

/**
 * Compress an image file to JPEG at 80% quality, resized to max 2000px on the
 * longest edge. Returns {base64, mimeType}. Falls back to raw base64 for
 * non-image files (PDF) or if canvas fails (e.g. HEIC on older browsers).
 *
 * This keeps the payload well under Vercel's 4.5MB body limit — iOS camera
 * photos are typically 3-8MB raw and would exceed the limit without compression.
 */
async function compressImage(
  file: File
): Promise<{ base64: string; mimeType: string }> {
  // Non-image files or small files: return raw base64
  if (!file.type.startsWith("image/") || file.size <= INLINE_THRESHOLD) {
    const base64 = await fileToBase64Raw(file)
    return { base64, mimeType: file.type }
  }

  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap

    let targetW = width
    let targetH = height
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height)
      targetW = Math.round(width * scale)
      targetH = Math.round(height * scale)
    }

    const canvas = new OffscreenCanvas(targetW, targetH)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("no 2d context")
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    bitmap.close()

    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: JPEG_QUALITY,
    })
    const base64 = await fileToBase64Raw(blob)
    return { base64, mimeType: "image/jpeg" }
  } catch {
    // Fallback: raw base64 (HEIC on older Safari, or OffscreenCanvas unsupported)
    const base64 = await fileToBase64Raw(file)
    return { base64, mimeType: file.type }
  }
}

function fileToBase64Raw(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data:...;base64, prefix
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function fetchImageAsBase64(
  src: string
): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(src)
  const blob = await res.blob()
  const mimeType = blob.type || "image/jpeg"
  const base64 = await fileToBase64Raw(blob)
  return { base64, mimeType }
}

interface BridgeStarter {
  label: string
  prompt: string
}

interface BridgePayload {
  base64: string
  mimeType: string
  fileName: string
  fileSize?: number
  language: string
  docType: string
  starterQuestions: BridgeStarter[]
}

export function HandwritingToTextTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [extractedText, setExtractedText] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [fileTooLarge, setFileTooLarge] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [extractionSource, setExtractionSource] = useState<"upload" | "sample">("upload")
  const [extractionFileType, setExtractionFileType] = useState<string>("image/jpeg")
  // Carries everything BridgeChat needs to provision a parser+document and chat.
  // Set when extraction succeeds; cleared on reset.
  const [bridgePayload, setBridgePayload] = useState<BridgePayload | null>(null)
  const extractionStartRef = useRef<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const callApi = useCallback(
    async (base64: string, mimeType: string, name: string, source: "upload" | "sample", fileSize?: number) => {
      setFileName(name)
      setStatus("processing")
      setError(null)
      setExtractedText("")
      setExtractionSource(source)
      setExtractionFileType(mimeType)
      extractionStartRef.current = Date.now()

      trackEvent("hwt_extraction_start", { source, file_type: mimeType })

      try {
        const res = await fetch("/api/tools/handwriting-to-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType, source, fileName: name, fileSize }),
        })

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`)
        }

        const data = await res.json()

        if (data.error === "no_text" || !data.text?.trim()) {
          trackEvent("hwt_extraction_error", {
            source,
            error_type: "no_text",
            file_type: mimeType,
          })
          setError(
            "No handwritten text found in this image. Try a clearer photo with good lighting and dark ink on white paper."
          )
          setStatus("error")
          return
        }

        const wordCount = data.text.split(/\s+/).filter(Boolean).length
        const lifetimeUses = incrementToolUses()
        trackEvent("hwt_extraction_success", {
          source,
          word_count: wordCount,
          duration_ms: Date.now() - extractionStartRef.current,
          file_type: mimeType,
          lifetime_tool_uses: lifetimeUses,
        })

        setExtractedText(data.text)
        setStatus("done")

        // Stash everything BridgeChat needs to provision a parser+document.
        // For sample images we still capture the base64 so the bridge endpoint
        // can save the file to parser-documents bucket — gives the user a real
        // image preview when they land in the app.
        const starterQuestions: BridgeStarter[] = Array.isArray(data.starter_questions)
          ? data.starter_questions
              .filter((q: unknown): q is BridgeStarter =>
                !!q && typeof q === "object" &&
                typeof (q as BridgeStarter).label === "string" &&
                typeof (q as BridgeStarter).prompt === "string"
              )
          : []
        setBridgePayload({
          base64,
          mimeType,
          fileName: name,
          fileSize,
          language: typeof data.language === "string" ? data.language : "en",
          docType: typeof data.doc_type === "string" ? data.doc_type : "generic",
          starterQuestions,
        })
      } catch (e) {
        console.error("Handwriting extraction error:", e)
        trackEvent("hwt_extraction_error", {
          source,
          error_type: "server_error",
          file_type: mimeType,
        })
        setError(
          "Failed to extract text from this image. Please try again with a clearer photo."
        )
        setStatus("error")
      }
    },
    []
  )

  const processFile = useCallback(
    async (file: File, inputSource: "upload" | "drag_drop" = "upload") => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        trackEvent("hwt_extraction_error", {
          source: "upload",
          error_type: "invalid_file",
          file_type: file.type || "unknown",
        })
        setError(
          "Please upload an image or PDF file (JPG, PNG, PDF, HEIC, TIFF, GIF, BMP, or WebP)."
        )
        setStatus("error")
        return
      }

      if (file.size > 20 * 1024 * 1024) {
        trackEvent("hwt_extraction_error", {
          source: "upload",
          error_type: "file_too_large",
          file_type: file.type,
        })
        setFileTooLarge(true)
        setError("File too large. Maximum size is 20 MB.")
        setStatus("error")
        return
      }

      trackEvent("hwt_upload", {
        file_type: file.type,
        file_size_kb: Math.round(file.size / 1024),
        source: inputSource,
      })

      // Show preview
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      const { base64, mimeType } = await compressImage(file)
      await callApi(base64, mimeType, file.name, "upload", file.size)
    },
    [callApi]
  )

  const handleSample = useCallback(
    async (sample: (typeof SAMPLES)[0]) => {
      trackEvent("hwt_sample_click", { sample_label: sample.label })
      setPreviewUrl(sample.src)
      try {
        const { base64, mimeType } = await fetchImageAsBase64(sample.src)
        await callApi(base64, mimeType, sample.label, "sample")
      } catch {
        setError("Failed to load sample image. Please try uploading your own.")
        setStatus("error")
      }
    },
    [callApi]
  )

  const handleCopy = useCallback(async () => {
    if (!(await copyToClipboard(extractedText))) return
    setCopied(true)
    trackEvent("hwt_copy", {
      word_count: extractedText.split(/\s+/).filter(Boolean).length,
    })
    setTimeout(() => setCopied(false), 2000)
  }, [extractedText])

  const handleDownload = useCallback(() => {
    trackEvent("hwt_download", {
      word_count: extractedText.split(/\s+/).filter(Boolean).length,
    })
    const blob = new Blob([extractedText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
      ? fileName.replace(/\.[^.]+$/, ".txt")
      : "handwriting-text.txt"
    a.click()
    URL.revokeObjectURL(url)
  }, [extractedText, fileName])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file, "drag_drop")
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
    trackEvent("hwt_reset", { had_result: status === "done" })
    setStatus("idle")
    setExtractedText("")
    setError(null)
    setFileTooLarge(false)
    setFileName(null)
    setCopied(false)
    setPreviewUrl(null)
    setBridgePayload(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [status])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone / Upload area */}
      {status === "idle" && (
        <>
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
                Photo or scan of handwritten text &mdash; JPG, PNG, PDF, HEIC,
                TIFF, GIF, BMP, or WebP up to 20 MB
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif,.heic,.heif,.pdf,image/jpeg,image/png,image/gif,image/bmp,image/webp,image/tiff,image/heic,image/heif,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {/* Try a Sample */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground text-center mb-3">
              No image handy? Try a sample:
            </p>
            <div className="flex items-center justify-center gap-3">
              {SAMPLES.map((sample) => (
                <button
                  key={sample.label}
                  onClick={() => handleSample(sample)}
                  className="group flex flex-col items-center gap-1.5 rounded-lg border bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-muted/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted/50 border">
                    <Image
                      src={sample.src}
                      alt={sample.label}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                    {sample.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          {previewUrl && (
            <div className="px-6 pt-6 flex justify-center">
              <div className="relative w-full max-w-xs h-40 rounded-lg overflow-hidden border bg-muted/30">
                <Image
                  src={previewUrl}
                  alt="Processing handwriting"
                  fill
                  className="object-contain"
                  unoptimized={previewUrl.startsWith("blob:")}
                />
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              </div>
            </div>
          )}
          <div className="p-6 text-center">
            {!previewUrl && (
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            )}
            <p className="font-semibold text-lg mb-1">
              Recognizing handwriting with AI...
            </p>
            <p className="text-sm text-muted-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground mt-3">
              Powered by Gemini &mdash; typically takes a few seconds
            </p>
          </div>
        </div>
      )}

      {/* Success state — before/after layout */}
      {status === "done" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Handwriting recognized</p>
                <p className="text-xs text-muted-foreground">
                  {extractedText.split(/\s+/).length} words extracted
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

          {/* Before / After */}
          {previewUrl && (
            <div className="grid sm:grid-cols-2 gap-px bg-border">
              <div className="bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Original
                </p>
                <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted/30">
                  <Image
                    src={previewUrl}
                    alt="Original handwriting"
                    fill
                    className="object-contain"
                    unoptimized={previewUrl.startsWith("blob:")}
                  />
                </div>
              </div>
              <div className="bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Extracted Text
                </p>
                <textarea
                  readOnly
                  value={extractedText}
                  className="w-full h-48 rounded-lg border bg-muted/30 p-3 text-sm font-mono resize-none focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Fallback: text only (no preview) */}
          {!previewUrl && (
            <div className="px-6 py-4">
              <textarea
                readOnly
                value={extractedText}
                className="w-full h-64 rounded-lg border bg-muted/30 p-4 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {/* Actions */}
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
              Extract Another
            </Button>
          </div>

          {/* Bridge to Parsli app — contextual chat that provisions a parser
              behind the scenes and hands off to the in-app chat after auth.
              Gated behind NEXT_PUBLIC_FEATURE_HWT_BRIDGE for staged rollout. */}
          {process.env.NEXT_PUBLIC_FEATURE_HWT_BRIDGE !== "false" &&
           bridgePayload && bridgePayload.starterQuestions.length > 0 && (
            <BridgeChat
              text={extractedText}
              language={bridgePayload.language}
              docType={bridgePayload.docType}
              starterQuestions={bridgePayload.starterQuestions}
              image={{
                base64: bridgePayload.base64,
                mimeType: bridgePayload.mimeType,
                fileName: bridgePayload.fileName,
                fileSize: bridgePayload.fileSize,
              }}
            />
          )}
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
          {fileTooLarge ? (
            <FileSizeBridgeBanner toolName="handwriting_to_text" />
          ) : (
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
              <Button onClick={reset} variant="outline" className="h-10">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Another File
              </Button>
              <Button asChild className="h-10">
                <a href="https://app.parsli.co">
                  <PenLine className="h-4 w-4 mr-2" />
                  Try Parsli Free
                </a>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
