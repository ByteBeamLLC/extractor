"use client"

import { useCallback, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
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
  Download,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { ProcessedDocument } from "@/lib/extractor/types"

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

interface ActivityFeedProps {
  parserId: string
}

export function ActivityFeed({ parserId }: ActivityFeedProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<ProcessedDocument | null>(null)

  const loadDocuments = useCallback(async () => {
    if (!session?.user?.id) return
    const { data } = await supabase
      .from("parser_processed_documents")
      .select("*")
      .eq("parser_id", parserId)
      .order("created_at", { ascending: false })
      .limit(50)

    setDocuments(data ?? [])
    setLoading(false)
  }, [parserId, session?.user?.id, supabase])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="border-2 border-dashed rounded-xl p-8 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No documents processed yet. Upload a document in the Test tab to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Activity</h3>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_80px_120px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
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
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                className="w-full grid grid-cols-[1fr_100px_100px_80px_120px] gap-2 px-4 py-3 text-left hover:bg-accent/30 transition-colors items-center"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{doc.file_name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs capitalize">{doc.source_type}</span>
                </div>

                <Badge variant="outline" className={`text-xs ${statusConf.color}`}>
                  <StatusIcon className={`h-3 w-3 mr-1 ${doc.status === "processing" ? "animate-spin" : ""}`} />
                  {doc.status}
                </Badge>

                <span className="text-xs text-muted-foreground">
                  {doc.credits_used} pg{doc.credits_used !== 1 ? "s" : ""}
                </span>

                <span className="text-xs text-muted-foreground">
                  {doc.processed_at
                    ? formatDistanceToNow(new Date(doc.processed_at), { addSuffix: true })
                    : "—"}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Expanded result view */}
      {selectedDoc?.results && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">
              Results for {selectedDoc.file_name}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  JSON.stringify(selectedDoc.results, null, 2)
                )
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Copy JSON
            </Button>
          </div>
          <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-[300px]">
            {JSON.stringify(selectedDoc.results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
