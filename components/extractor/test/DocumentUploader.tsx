"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentUploaderProps {
  onFileSelected: (file: File) => void
}

export const MAX_UPLOAD_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/plain",
  "text/csv",
  "text/html",
  "text/xml",
  "application/json",
  "application/xml",
]

export const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tif,.tiff,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.csv,.json,.html,.htm,.xml"

/** Validate file type and size. Returns an error string or null if valid. */
export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1)
    return `File is too large (${sizeMB}MB). Maximum file size is 50MB.`
  }
  if (file.size === 0) {
    return "File is empty."
  }
  const ext = file.name.split(".").pop()?.toLowerCase()
  const allowedExts = ACCEPTED_EXTENSIONS.split(",").map((e) => e.replace(".", ""))
  const typeMatch = ACCEPTED_TYPES.includes(file.type)
  const extMatch = ext ? allowedExts.includes(ext) : false
  if (!typeMatch && !extMatch) {
    return `Unsupported file type "${ext ?? file.type}". Supported: PDF, images, Word, Excel, PowerPoint, HTML, XML, text files.`
  }
  return null
}

export function DocumentUploader({ onFileSelected }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      const error = validateUploadFile(file)
      if (error) {
        setValidationError(error)
        return
      }
      setValidationError(null)
      onFileSelected(file)
    },
    [onFileSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      data-arlo-id="main-upload-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleInputChange}
        className="hidden"
      />
      <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="text-sm font-medium mb-1">
        Drop a document here or click to browse
      </p>
      <p className="text-xs text-muted-foreground">
        Supports PDF, images (PNG, JPG, WebP, TIFF), Word, Excel, PowerPoint, HTML, XML, text files
      </p>
      <p className="text-xs text-muted-foreground mt-1">Max file size: 50MB</p>
      {validationError && (
        <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {validationError}
        </div>
      )}
    </div>
  )
}
