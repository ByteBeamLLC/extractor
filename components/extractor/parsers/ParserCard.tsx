"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileText,
  MoreVertical,
  Trash2,
  Pause,
  Play,
  Copy,
  Check,
  Download,
  FolderOpen,
  Upload,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import { validateUploadFile } from "@/components/extractor/test/DocumentUploader"
import type { Parser } from "@/lib/extractor/types"
import { cn } from "@/lib/utils"
import { copyToClipboard } from "@/lib/clipboard"

interface StatusBreakdown {
  completed: number
  error: number
  processing: number
  pending: number
}

interface ParserCardProps {
  parser: Parser
  statusBreakdown?: StatusBreakdown
  onDeleted: () => void
}

// Pick a consistent color for the parser icon based on the parser name
const ICON_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-indigo-100", text: "text-indigo-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-cyan-100", text: "text-cyan-600" },
  { bg: "bg-purple-100", text: "text-purple-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
]

function getIconColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length]
}

export function ParserCard({ parser, statusBreakdown, onDeleted }: ParserCardProps) {
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()
  const { openAuthDialog } = useAuthDialog()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fieldCount = parser.fields?.length ?? 0
  const totalDocs = statusBreakdown
    ? statusBreakdown.completed + statusBreakdown.error + statusBreakdown.processing + statusBreakdown.pending
    : 0

  const iconColor = getIconColor(parser.name)

  // --- File upload to this parser ---
  const handleFile = useCallback(
    async (file: File) => {
      if (!session?.user?.id) {
        openAuthDialog("sign-in")
        return
      }

      const validationError = validateUploadFile(file)
      if (validationError) return

      setIsUploading(true)
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        const storagePath = `${session.user.id}/${parser.id}/pending/${crypto.randomUUID()}/${safeName}`

        const { error: storageError } = await supabase.storage
          .from("parser-documents")
          .upload(storagePath, file, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          })
        if (storageError) throw new Error(`Upload failed: ${storageError.message}`)

        const res = await fetch(`/api/parsers/${parser.id}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storage_path: storagePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            source_type: "upload",
          }),
        })

        if (!res.ok) {
          if (res.status === 402 && session?.user?.is_anonymous) {
            openAuthDialog("sign-up")
            setIsUploading(false)
            return
          }
        }

        router.push(`/parsers/${parser.id}/documents`)
      } catch {
        // navigate to documents page anyway
        router.push(`/parsers/${parser.id}/documents`)
      } finally {
        setIsUploading(false)
      }
    },
    [parser.id, session?.user?.id, session?.user?.is_anonymous, supabase, router, openAuthDialog]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await supabase.from("parsers").delete().eq("id", parser.id)
      onDeleted()
    } catch {
      // silently fail
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleToggleStatus = async () => {
    const newStatus = parser.status === "active" ? "paused" : "active"
    await supabase
      .from("parsers")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", parser.id)
    onDeleted() // reload
  }

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!parser.inbound_email) return
    if (!(await copyToClipboard(parser.inbound_email))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Dragging state: show drop overlay
  if (isDragging) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="border-2 border-dashed border-[#2782ff] rounded-xl p-5 bg-[#2782ff]/5 h-full flex flex-col items-center justify-center text-center min-h-[220px] transition-all"
      >
        <div className="w-12 h-12 rounded-full bg-[#2782ff]/10 flex items-center justify-center mb-3">
          <Upload className="h-6 w-6 text-[#2782ff]" />
        </div>
        <p className="text-sm font-semibold text-[#2782ff]">Drop to extract with</p>
        <p className="text-sm font-semibold text-[#2782ff]">{parser.name}</p>
      </div>
    )
  }

  // Uploading state
  if (isUploading) {
    return (
      <div className="border rounded-xl p-5 bg-card h-full flex flex-col items-center justify-center text-center min-h-[220px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2782ff] mb-3" />
        <p className="text-sm font-medium">Uploading to {parser.name}...</p>
        <p className="text-xs text-muted-foreground mt-1">Processing your document</p>
      </div>
    )
  }

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Link
          href={`/parsers/${parser.id}`}
          className="block group"
        >
          <div className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow h-full flex flex-col">
            {/* Header: icon + status badge */}
            <div className="flex items-start justify-between mb-3">
              <div className={`h-10 w-10 rounded-lg ${iconColor.bg} flex items-center justify-center shrink-0`}>
                <FileText className={`h-5 w-5 ${iconColor.text}`} />
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  variant={parser.status === "active" ? "default" : "secondary"}
                  className={
                    parser.status === "active"
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[11px] font-medium"
                      : "text-[11px] font-medium"
                  }
                >
                  {parser.status === "active" ? "Active" : parser.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleToggleStatus() }}>
                      {parser.status === "active" ? (
                        <><Pause className="h-4 w-4 mr-2" /> Pause</>
                      ) : (
                        <><Play className="h-4 w-4 mr-2" /> Resume</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.preventDefault(); setShowDeleteDialog(true) }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Parser name */}
            <h3 className="font-semibold text-[15px] mb-1 group-hover:text-[#2782ff] transition-colors">
              {parser.name}
            </h3>

            {/* Email address */}
            {parser.inbound_email && (
              <div className="flex items-center gap-1.5 mb-4">
                <span className="text-[11px] text-muted-foreground font-mono truncate">
                  {parser.inbound_email}
                </span>
                <button
                  onClick={handleCopyEmail}
                  className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-6 mb-4 mt-auto">
              <div>
                <p className="text-[11px] text-muted-foreground">Documents</p>
                <p className="text-lg font-semibold">{totalDocs}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Fields</p>
                <p className="text-lg font-semibold">{fieldCount}</p>
              </div>
            </div>

            {/* Action links */}
            <div className="flex items-center gap-3 pt-3 border-t">
              <Link
                href={`/parsers/${parser.id}/documents`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[#2782ff] text-white text-xs font-medium hover:bg-[#2782ff]/90 transition-colors"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Documents
              </Link>
              <Link
                href={`/parsers/${parser.id}/export`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#2782ff] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Downloads
              </Link>
            </div>
          </div>
        </Link>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete parser?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{parser.name}&rdquo; and all its
              integrations, API keys, and processing history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
