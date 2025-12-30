"use client"

import * as React from "react"
import { FileText, Loader2, CheckCircle2, XCircle, Image as ImageIcon, Trash2, MoreVertical } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export interface DocumentExtractionFile {
  id: string
  name: string
  folder_id: string | null
  file_url: string
  mime_type: string | null
  file_size: number | null
  extraction_status: "pending" | "processing" | "completed" | "error"
  extraction_method?: "dots.ocr" | "datalab"
  layout_data: any
  extracted_text: any
  error_message: string | null
  // Dual extraction fields
  gemini_full_text?: string | null
  gemini_extraction_status?: "pending" | "processing" | "completed" | "error"
  gemini_error_message?: string | null
  layout_extraction_status?: "pending" | "processing" | "completed" | "error"
  layout_error_message?: string | null
  created_at: string
  updated_at: string
}

interface DocumentExtractionFileCardProps {
  file: DocumentExtractionFile
  onOpen: () => void
  onDelete?: () => void
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Loader2,
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
    spinning: true,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
  },
  error: {
    label: "Error",
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
  },
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return FileText
  if (mimeType.startsWith("image/")) return ImageIcon
  if (mimeType === "application/pdf") return FileText
  return FileText
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getModelName(method: "dots.ocr" | "datalab" | undefined): string {
  if (method === "datalab") return "Model 2"
  return "Model 1"
}

// Check if file can be opened (at least one pipeline has results)
function canOpenFile(file: DocumentExtractionFile): boolean {
  // Can open if gemini full text is available
  if (file.gemini_extraction_status === "completed" && file.gemini_full_text) {
    return true
  }
  // Can open if layout/blocks are available
  if (file.layout_extraction_status === "completed" && file.layout_data) {
    return true
  }
  // Legacy: check old extraction_status for backward compatibility
  if (file.extraction_status === "completed") {
    return true
  }
  return false
}

// Check if any pipeline is still processing
function isAnyPipelineProcessing(file: DocumentExtractionFile): boolean {
  return (
    file.gemini_extraction_status === "processing" ||
    file.layout_extraction_status === "processing" ||
    (file.extraction_status === "processing" && !file.gemini_extraction_status && !file.layout_extraction_status)
  )
}

export function DocumentExtractionFileCard({
  file,
  onOpen,
  onDelete,
}: DocumentExtractionFileCardProps) {
  const FileIcon = getFileIcon(file.mime_type)
  const createdAt = new Date(file.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })

  // Determine overall display status
  const canOpen = canOpenFile(file)
  const hasProcessing = isAnyPipelineProcessing(file)

  // Get status for each pipeline
  const geminiStatus = file.gemini_extraction_status || "pending"
  const layoutStatus = file.layout_extraction_status || file.extraction_status || "pending"

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition hover:shadow-md">
      <CardHeader className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base font-semibold flex-1">{file.name}</CardTitle>
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Full Text Pipeline Status */}
          <Badge
            className={cn(
              "font-medium text-xs",
              statusConfig[geminiStatus as keyof typeof statusConfig]?.className
            )}
            title="Full Text extraction status"
          >
            {geminiStatus === "processing" ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : geminiStatus === "completed" ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : geminiStatus === "error" ? (
              <XCircle className="h-3 w-3 mr-1" />
            ) : (
              <Loader2 className="h-3 w-3 mr-1" />
            )}
            Text
          </Badge>
          {/* Layout/Blocks Pipeline Status */}
          <Badge
            className={cn(
              "font-medium text-xs",
              statusConfig[layoutStatus as keyof typeof statusConfig]?.className
            )}
            title="Blocks extraction status"
          >
            {layoutStatus === "processing" ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : layoutStatus === "completed" ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : layoutStatus === "error" ? (
              <XCircle className="h-3 w-3 mr-1" />
            ) : (
              <Loader2 className="h-3 w-3 mr-1" />
            )}
            Blocks
          </Badge>
        </div>
      </CardHeader>
      {file.file_url && file.mime_type?.startsWith("image/") ? (
        <div className="relative mx-4 aspect-[4/3] overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.file_url}
            alt={file.name}
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="mx-4 flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-muted">
          <FileIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <CardContent className="flex flex-1 flex-col justify-between p-4 gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(file.file_size)}</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-medium">
          {getModelName(file.extraction_method)}
        </Badge>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 border-t">
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={onOpen}
          disabled={!canOpen}
        >
          {canOpen ? (
            hasProcessing ? (
              <>
                View
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </>
            ) : (
              "View"
            )
          ) : hasProcessing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Processing...
            </>
          ) : (
            "Pending"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

