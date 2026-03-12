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
  ImageIcon,
  Trash2,
  GripVertical,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Status = "idle" | "ready" | "processing" | "done" | "error"

interface ImageItem {
  id: string
  file: File
  preview: string
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

export function ImageToPdfTool() {
  const [status, setStatus] = useState<Status>("idle")
  const [images, setImages] = useState<ImageItem[]>([])
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const items: ImageItem[] = []
    for (const file of Array.from(newFiles)) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue
      if (file.size > 50 * 1024 * 1024) continue

      items.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      })
    }

    if (items.length === 0) return

    setImages((prev) => [...prev, ...items])
    setStatus("ready")
    setError(null)
  }, [])

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      const updated = prev.filter((i) => i.id !== id)
      if (updated.length === 0) {
        setStatus("idle")
      }
      return updated
    })
  }, [])

  const handleListDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleListDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (dragIndex === null) return
      setDragOverIndex(index)
    },
    [dragIndex]
  )

  const handleListDrop = useCallback(
    (index: number) => {
      if (dragIndex === null) return
      setImages((prev) => {
        const updated = [...prev]
        const [moved] = updated.splice(dragIndex, 1)
        updated.splice(index, 0, moved)
        return updated
      })
      setDragIndex(null)
      setDragOverIndex(null)
    },
    [dragIndex]
  )

  const handleConvert = useCallback(async () => {
    if (images.length === 0) return

    setStatus("processing")
    setError(null)
    setResultBlob(null)

    try {
      const { imagesToPDF } = await import("@/lib/tools/pdf-utils")
      const blob = await imagesToPDF(images.map((i) => i.file))
      setResultBlob(blob)
      setStatus("done")
    } catch (e) {
      console.error("Image to PDF error:", e)
      setError(
        "Failed to convert images. One or more files may be in an unsupported format."
      )
      setStatus("error")
    }
  }, [images])

  const handleDownload = useCallback(() => {
    if (!resultBlob) return
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = "images.pdf"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [resultBlob])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
      if (inputRef.current) inputRef.current.value = ""
    },
    [addFiles]
  )

  const reset = useCallback(() => {
    images.forEach((i) => URL.revokeObjectURL(i.preview))
    setStatus("idle")
    setImages([])
    setResultBlob(null)
    setError(null)
    setDragIndex(null)
    setDragOverIndex(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [images])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone */}
      {(status === "idle" || status === "ready") && (
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
                Drop your images here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                JPG, PNG, or WebP images. Up to 50 MB each.
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {/* Image list */}
          {images.length > 0 && (
            <div className="mt-4 rounded-2xl border bg-card overflow-hidden">
              <div className="px-6 py-3 border-b bg-muted/30">
                <p className="text-sm font-medium">
                  {images.length} image{images.length > 1 ? "s" : ""}
                </p>
              </div>
              <ul className="divide-y">
                {images.map((item, index) => (
                  <li
                    key={item.id}
                    draggable
                    onDragStart={() => handleListDragStart(index)}
                    onDragOver={(e) => handleListDragOver(e, index)}
                    onDrop={() => handleListDrop(index)}
                    onDragEnd={() => {
                      setDragIndex(null)
                      setDragOverIndex(null)
                    }}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 transition-colors",
                      dragOverIndex === index && "bg-primary/5"
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />
                    <div className="w-10 h-10 rounded-md overflow-hidden border shrink-0">
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.file.type.split("/")[1].toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeImage(item.id)}
                      className="p-1 rounded hover:bg-destructive/10 transition-colors"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleConvert}
                  className="flex-1 h-11"
                  size="lg"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Convert to PDF
                </Button>
                <label className="cursor-pointer">
                  <Button variant="outline" className="h-11" size="lg" asChild>
                    <span>
                      <Plus className="h-4 w-4 mr-2" />
                      Add More
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          )}
        </>
      )}

      {/* Processing state */}
      {status === "processing" && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">
            Converting images to PDF...
          </p>
          <p className="text-sm text-muted-foreground">
            {images.length} image{images.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Success state */}
      {status === "done" && resultBlob && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Conversion complete</p>
                <p className="text-xs text-muted-foreground">
                  {images.length} image{images.length > 1 ? "s" : ""} converted
                  to PDF
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
              Download images.pdf
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="h-11"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Convert More
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
          <div className="px-6 py-4 border-t">
            <Button onClick={reset} variant="outline" className="h-10">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
