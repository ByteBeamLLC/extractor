"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

type UploadState = "idle" | "uploading" | "extracting" | "completed" | "error"

export function DocumentsPage({ parser }: DocumentsPageProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadResults, setUploadResults] = useState<Record<string, any> | null>(null)
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)

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

  const isFullContent = parser.extraction_type === "full_content"

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!isFullContent && parser.fields.length === 0) {
        setUploadError("Please add fields to your parser schema before uploading.")
        setUploadState("error")
        return
      }

      setUploadFileName(file.name)
      setUploadState("uploading")
      setUploadError(null)
      setUploadResults(null)
      setUploadWarnings([])

      try {
        // Upload file directly to Supabase Storage (bypasses Vercel 4.5MB body limit)
        const storagePath = `${session?.user?.id}/${parser.id}/pending/${crypto.randomUUID()}/${file.name}`
        const { error: storageError } = await supabase.storage
          .from("parser-documents")
          .upload(storagePath, file, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          })

        if (storageError) {
          throw new Error(`Upload failed: ${storageError.message}`)
        }

        setUploadState("extracting")

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
          throw new Error(data.error ?? "Extraction failed")
        }

        setUploadResults(data.results)
        setUploadWarnings(data.warnings ?? [])
        setUploadState("completed")
        trackEvent("first_value", {
          user_id: session?.user?.id ?? "",
          parser_id: parser.id,
          document_id: data.document_id ?? "",
          source_type: "upload",
          is_first_extraction: documents.length === 0,
        })
        // Refresh document list
        loadDocuments()
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Extraction failed")
        setUploadState("error")
      }
    },
    [parser.id, parser.fields.length, isFullContent, loadDocuments]
  )

  const resetUpload = () => {
    setUploadState("idle")
    setUploadResults(null)
    setUploadWarnings([])
    setUploadError(null)
    setUploadFileName(null)
    setShowUploader(false)
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

          {(uploadState === "uploading" || uploadState === "extracting") && (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm font-medium">
                {uploadState === "uploading"
                  ? "Uploading document..."
                  : "Extracting data with AI..."}
              </p>
              {uploadFileName && (
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadFileName}
                </p>
              )}
            </div>
          )}

          {uploadState === "completed" && uploadResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Extraction complete
                  {uploadFileName && (
                    <span className="text-muted-foreground">
                      ({uploadFileName})
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={resetUpload}>
                  Upload Another
                </Button>
              </div>

              {uploadWarnings.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Warnings
                  </p>
                  {uploadWarnings.map((w, i) => (
                    <p
                      key={i}
                      className="text-xs text-amber-700 dark:text-amber-300"
                    >
                      {w}
                    </p>
                  ))}
                </div>
              )}

              <ExtractionResultsView
                results={uploadResults}
                fields={parser.fields}
                parserId={parser.id}
                extractionType={parser.extraction_type}
              />
            </div>
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
          <div className="grid grid-cols-[1fr_100px_100px_80px_120px] gap-2 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
            <span>Document</span>
            <span>Source</span>
            <span>Status</span>
            <span>Credits</span>
            <span>Processed</span>
          </div>

          <div className="divide-y">
            {documents.map((doc) => {
              const SourceIcon = SOURCE_ICONS[doc.source_type] ?? FileText
              const statusConf = STATUS_CONFIG[doc.status]
              const StatusIcon = statusConf.icon

              return (
                <Link
                  key={doc.id}
                  href={`/parsers/${parser.id}/documents/${doc.id}`}
                  className="grid grid-cols-[1fr_100px_100px_80px_120px] gap-2 px-4 py-3 hover:bg-accent/30 transition-colors items-center"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{doc.file_name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs capitalize">
                      {doc.source_type}
                    </span>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-xs ${statusConf.color}`}
                  >
                    <StatusIcon
                      className={`h-3 w-3 mr-1 ${doc.status === "processing" ? "animate-spin" : ""}`}
                    />
                    {doc.status}
                  </Badge>

                  <span className="text-xs text-muted-foreground">
                    {doc.credits_used} pg
                    {doc.credits_used !== 1 ? "s" : ""}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {doc.processed_at
                      ? formatDistanceToNow(new Date(doc.processed_at), {
                          addSuffix: true,
                        })
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
