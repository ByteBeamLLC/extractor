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
  Plus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const [showUploader, setShowUploader] = useState(false)

  // Upload state (simplified — no more "extracting" or "completed" blocking states)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Track the most recently completed doc to show inline results
  const [completedDocId, setCompletedDocId] = useState<string | null>(null)
  const completedDoc = documents.find((d) => d.id === completedDocId)

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
          // Auto-show inline results when a just-uploaded doc completes
          if (updated.status === "completed" || updated.status === "error") {
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

      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        const storagePath = `${session?.user?.id}/${parser.id}/pending/${crypto.randomUUID()}/${safeName}`

        // For small files (≤3MB): send inline base64 to extract API AND upload to storage in parallel
        // For large files: upload to storage first (bypasses Vercel 4.5MB body limit), then call extract
        const INLINE_THRESHOLD = 3 * 1024 * 1024 // 3MB

        let response: Response

        if (file.size <= INLINE_THRESHOLD) {
          // Convert to base64 for inline extraction
          const arrayBuffer = await file.arrayBuffer()
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
          )

          // Run storage upload and extract API call in parallel
          const [storageResult, extractResult] = await Promise.all([
            // Background storage upload (for backup/preview — don't block on it)
            supabase.storage
              .from("parser-documents")
              .upload(storagePath, file, {
                contentType: file.type || "application/octet-stream",
                upsert: true,
              }),
            // Extract with inline base64 (no need to wait for storage)
            fetch(`/api/parsers/${parser.id}/extract`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file: { name: file.name, type: file.type, data: base64, size: file.size },
                storage_path: storagePath,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                source_type: "upload",
              }),
            }),
          ])

          if (storageResult.error) {
            console.warn("[upload] Storage backup failed:", storageResult.error.message)
          }
          response = extractResult
        } else {
          // Large file: upload to storage first, then call extract with storage_path
          const { error: storageError } = await supabase.storage
            .from("parser-documents")
            .upload(storagePath, file, {
              contentType: file.type || "application/octet-stream",
              upsert: true,
            })

          if (storageError) {
            throw new Error(`Upload failed: ${storageError.message}`)
          }

          response = await fetch(`/api/parsers/${parser.id}/extract`, {
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
        }

        const data = await response.json()

        if (!response.ok) {
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
        setShowUploader(false)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Extraction failed")
        setUploadState("error")
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
          <Button onClick={() => setShowUploader(!showUploader)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </TourStep>

      {/* Upload Area */}
      {(showUploader || uploadState !== "idle") && (
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
      )}

      {/* Inline results banner for most recently completed doc */}
      {completedDoc && completedDoc.status === "completed" && completedDoc.results && (
        <div className="border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Extraction complete
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
      {documents.length === 0 && !showUploader ? (
        <div className="border-2 border-dashed rounded-xl p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">No documents yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a document to start extracting data.
          </p>
          <Button variant="outline" onClick={() => setShowUploader(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First Document
          </Button>
        </div>
      ) : documents.length > 0 ? (
        <div className="border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_100px] sm:grid-cols-[1fr_100px_100px_80px_120px] gap-2 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
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

              return (
                <Link
                  key={doc.id}
                  href={`/parsers/${parser.id}/documents/${doc.id}`}
                  className={`grid grid-cols-[1fr_100px] sm:grid-cols-[1fr_100px_100px_80px_120px] gap-2 px-4 py-3 hover:bg-accent/30 transition-colors items-center ${
                    doc.id === completedDocId ? "bg-green-50 dark:bg-green-950/20" : ""
                  }`}
                >
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
    </div>
  )
}
