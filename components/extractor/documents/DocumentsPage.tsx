"use client"

import { useCallback, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import {
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Mail,
  Webhook,
  Zap,
  Code,
  AlertCircle,
  ChevronRight,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { Parser, ProcessedDocument } from "@/lib/extractor/types"
import { DocumentUploader } from "@/components/extractor/test/DocumentUploader"
import { ExtractionResultsView } from "@/components/extractor/test/ExtractionResultsView"
import { TourStep } from "@/components/tour/TourStep"
import { trackEvent } from "@/lib/analytics"

const SOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  upload: Upload,
  email: Mail,
  api: Code,
  webhook: Webhook,
  zapier: Zap,
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  processing: { icon: Loader2, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
  error: { icon: XCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
}

interface DocumentsPageProps {
  parser: Parser
}

type UploadState = "idle" | "uploading" | "error"

export function DocumentsPage({ parser }: DocumentsPageProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [loading, setLoading] = useState(true)

  // Upload state (simplified — no more "extracting" or "completed" blocking states)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Track the most recently completed doc to show inline results
  const [completedDocId, setCompletedDocId] = useState<string | null>(null)
  const completedDoc = documents.find((d) => d.id === completedDocId)

  // Selection state for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(documents.map((d) => d.id)))
    }
  }

  const handleDelete = async () => {
    if (selectedIds.size === 0) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/parsers/${parser.id}/documents/batch-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: Array.from(selectedIds) }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Delete failed")
      }
      // Remove deleted docs from state
      setDocuments((prev) => prev.filter((d) => !selectedIds.has(d.id)))
      // Clear completed doc if it was deleted
      if (completedDocId && selectedIds.has(completedDocId)) {
        setCompletedDocId(null)
      }
      setSelectedIds(new Set())
    } catch (err) {
      // Let the user know via a simple alert for now
      console.error("Delete failed:", err)
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const loadDocuments = useCallback(async () => {
    if (!session?.user?.id) return
    const { data } = await supabase
      .from("parser_processed_documents")
      .select("*")
      .eq("parser_id", parser.id)
      .order("created_at", { ascending: false })
      .limit(50)

    setDocuments(data ?? [])
    setLoading(false)
  }, [parser.id, session?.user?.id, supabase])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // --- Supabase Realtime: listen for document status changes ---
  useEffect(() => {
    const channel = supabase
      .channel(`doc-updates-${parser.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "parser_processed_documents",
          filter: `parser_id=eq.${parser.id}`,
        },
        (payload: any) => {
          const updated = payload.new as ProcessedDocument
          setDocuments((prev) =>
            prev.map((doc) => (doc.id === updated.id ? { ...doc, ...updated } : doc))
          )
          // Auto-show inline results when enriching starts or doc completes
          if (updated.status === "completed" || updated.status === "error") {
            setCompletedDocId(updated.id)
          } else if (updated.results && updated.enriching_fields) {
            // Show partial results during waterfall enrichment
            setCompletedDocId(updated.id)
          }
        }
      )
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "parser_processed_documents",
          filter: `parser_id=eq.${parser.id}`,
        },
        (payload: any) => {
          const inserted = payload.new as ProcessedDocument
          setDocuments((prev) => {
            // Avoid duplicates (we optimistically add it already)
            if (prev.some((d) => d.id === inserted.id)) return prev
            return [inserted, ...prev]
          })
        }
      )
      .on(
        "postgres_changes" as any,
        {
          event: "DELETE",
          schema: "public",
          table: "parser_processed_documents",
          filter: `parser_id=eq.${parser.id}`,
        },
        (payload: any) => {
          const deletedId = payload.old?.id
          if (deletedId) {
            setDocuments((prev) => prev.filter((d) => d.id !== deletedId))
            setSelectedIds((prev) => {
              const next = new Set(prev)
              next.delete(deletedId)
              return next
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [parser.id, supabase])

  // --- Fallback polling: catch updates if Realtime misses them ---
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing")
    if (!hasProcessing) return

    const interval = setInterval(async () => {
      const processingDocs = documents.filter((d) => d.status === "processing")
      for (const doc of processingDocs) {
        try {
          const res = await fetch(`/api/parsers/${parser.id}/documents/${doc.id}`)
          if (!res.ok) continue
          const updated = await res.json()
          if (updated.status !== "processing") {
            setDocuments((prev) =>
              prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
            )
            if (updated.status === "completed" || updated.status === "error") {
              setCompletedDocId(updated.id)
            }
          }
        } catch {
          // Ignore polling errors
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [documents, parser.id])

  const isFullContent = parser.extraction_type === "full_content"

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!isFullContent && parser.fields.length === 0) {
        setUploadError("Please add fields to your parser schema before uploading.")
        setUploadState("error")
        return
      }

      setUploadState("uploading")
      setUploadError(null)
      setCompletedDocId(null)

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const storagePath = `${session?.user?.id}/${parser.id}/pending/${crypto.randomUUID()}/${safeName}`

      try {
        // Always upload to Supabase Storage first (bypasses Vercel 4.5MB body limit).
        // This supports files up to 50MB and avoids base64 inflation issues.
        const { error: storageError } = await supabase.storage
          .from("parser-documents")
          .upload(storagePath, file, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          })

        if (storageError) {
          throw new Error(`File upload failed: ${storageError.message}`)
        }

        // Call extract API with storage path only — no file bytes in the request body
        const response = await fetch(`/api/parsers/${parser.id}/extract`, {
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

        const data = await response.json()

        if (!response.ok) {
          // Clean up orphaned storage file since the API rejected the request
          supabase.storage.from("parser-documents").remove([storagePath]).catch(() => {})
          throw new Error(data.error ?? "Extraction failed")
        }

        // Optimistically add processing document to the list
        if (data.document_id) {
          setDocuments((prev) => {
            if (prev.some((d) => d.id === data.document_id)) return prev
            return [
              {
                id: data.document_id,
                parser_id: parser.id,
                user_id: session?.user?.id ?? "",
                source_type: "upload",
                file_name: file.name,
                mime_type: file.type,
                file_size: file.size,
                page_count: 0,
                status: "processing",
                error_message: null,
                results: null,
                confidence: null,
                integration_status: {},
                credits_used: 0,
                processed_at: null,
                created_at: new Date().toISOString(),
                expires_at: "",
                enriching_fields: null,
              } satisfies ProcessedDocument,
              ...prev,
            ]
          })

          trackEvent("first_value", {
            user_id: session?.user?.id ?? "",
            parser_id: parser.id,
            document_id: data.document_id,
            source_type: "upload",
            is_first_extraction: documents.length === 0,
          })
        }

        // Reset uploader — user can upload another file immediately
        setUploadState("idle")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed"
        setUploadError(message)
        setUploadState("error")
        // Best-effort cleanup of any orphaned storage file
        supabase.storage.from("parser-documents").remove([storagePath]).catch(() => {})
      }
    },
    [parser.id, parser.fields.length, isFullContent, session?.user?.id, supabase, documents.length]
  )

  const dismissResults = () => {
    setCompletedDocId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <TourStep stepId="documents" side="bottom" align="center">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Documents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload documents and view extraction results.
            </p>
          </div>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete ({selectedIds.size})
            </Button>
          )}
        </div>
      </TourStep>

      {/* Upload Area — always visible */}
      <div className="border rounded-xl p-5 bg-card space-y-4">
        {(uploadState === "idle" || uploadState === "error") && (
          <>
            <DocumentUploader onFileSelected={handleFileSelected} />
            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {uploadError}
              </div>
            )}
          </>
        )}

        {uploadState === "uploading" && (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm font-medium">Uploading document...</p>
          </div>
        )}
      </div>

      {/* Inline results banner — show during enrichment (partial) and after completion */}
      {completedDoc && completedDoc.results && (completedDoc.status === "completed" || (completedDoc.status === "processing" && completedDoc.enriching_fields)) && (
        <div className="border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {completedDoc.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
              <span className={completedDoc.status === "completed" ? "text-green-600" : "text-blue-600"}>
                {completedDoc.status === "completed"
                  ? "Extraction complete"
                  : "Enriching fields..."}
              </span>
              <span className="text-muted-foreground">
                ({completedDoc.file_name})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/parsers/${parser.id}/documents/${completedDoc.id}`}>
                  View Details
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={dismissResults}>
                Dismiss
              </Button>
            </div>
          </div>

          <ExtractionResultsView
            results={completedDoc.results}
            fields={parser.fields}
            parserId={parser.id}
            extractionType={parser.extraction_type}
            enrichingFields={completedDoc.enriching_fields ?? undefined}
          />
        </div>
      )}

      {/* Inline error banner for most recently failed doc */}
      {completedDoc && completedDoc.status === "error" && (
        <div className="border rounded-xl p-5 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              Extraction failed
              <span className="text-muted-foreground">
                ({completedDoc.file_name})
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={dismissResults}>
              Dismiss
            </Button>
          </div>
          {completedDoc.error_message && (
            <p className="text-sm text-muted-foreground">{completedDoc.error_message}</p>
          )}
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 ? (
        <div className="border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[28px_1fr_100px] sm:grid-cols-[28px_1fr_100px_100px_80px_120px] gap-2 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
            <input
              type="checkbox"
              checked={documents.length > 0 && selectedIds.size === documents.length}
              ref={(el) => {
                if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < documents.length
              }}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 rounded border-muted-foreground/50 accent-primary cursor-pointer"
            />
            <span>Document</span>
            <span className="hidden sm:block">Source</span>
            <span>Status</span>
            <span className="hidden sm:block">Credits</span>
            <span className="hidden sm:block">Processed</span>
          </div>

          <div className="divide-y">
            {documents.map((doc) => {
              const SourceIcon = SOURCE_ICONS[doc.source_type] ?? FileText
              const statusConf = STATUS_CONFIG[doc.status]
              const StatusIcon = statusConf.icon
              const isStale =
                doc.status === "processing" &&
                doc.created_at &&
                Date.now() - new Date(doc.created_at).getTime() > 90_000
              const isSelected = selectedIds.has(doc.id)

              return (
                <Link
                  key={doc.id}
                  href={`/parsers/${parser.id}/documents/${doc.id}`}
                  className={`grid grid-cols-[28px_1fr_100px] sm:grid-cols-[28px_1fr_100px_100px_80px_120px] gap-2 px-4 py-3 hover:bg-accent/30 transition-colors items-center ${
                    isSelected
                      ? "bg-primary/5"
                      : doc.id === completedDocId
                        ? "bg-green-50 dark:bg-green-950/20"
                        : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    onClick={(e) => toggleSelect(doc.id, e)}
                    className="h-3.5 w-3.5 rounded border-muted-foreground/50 accent-primary cursor-pointer"
                  />

                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">
                      {doc.file_name}
                      {isStale && (
                        <span className="ml-2 text-xs text-amber-600">
                          Taking longer than usual...
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5">
                    <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs capitalize">
                      {doc.source_type}
                    </span>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-xs ${isStale ? "text-amber-600" : statusConf.color}`}
                  >
                    <StatusIcon
                      className={`h-3 w-3 mr-1 ${doc.status === "processing" ? "animate-spin" : ""}`}
                    />
                    {isStale ? "slow" : doc.status}
                  </Badge>

                  <span className="hidden sm:block text-xs text-muted-foreground">
                    {doc.credits_used} pg
                    {doc.credits_used !== 1 ? "s" : ""}
                  </span>

                  <span className="hidden sm:block text-xs text-muted-foreground">
                    {doc.processed_at
                      ? formatDistanceToNow(new Date(doc.processed_at), {
                          addSuffix: true,
                        })
                      : doc.status === "processing"
                        ? "Processing..."
                        : "—"}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size === 1 ? "document" : `${selectedIds.size} documents`}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected {selectedIds.size === 1 ? "document" : "documents"} and {selectedIds.size === 1 ? "its" : "their"} extraction results. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
