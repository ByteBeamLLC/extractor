"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { formatDistanceToNow, format } from "date-fns"
import {
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Upload,
  Mail,
  Code,
  Webhook,
  Zap,
  RotateCcw,
  Pencil,
  Download,
  Copy,
  Check,
  FileWarning,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentChat } from "@/components/extractor/chat/DocumentChat"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { copyToClipboard } from "@/lib/clipboard"
import type { Parser, ProcessedDocument } from "@/lib/extractor/types"
import type { SchemaField } from "@/lib/schema"

const SOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  upload: Upload,
  email: Mail,
  api: Code,
  webhook: Webhook,
  zapier: Zap,
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-amber-600", label: "Pending" },
  processing: { icon: Loader2, color: "text-blue-600", label: "Processing" },
  completed: { icon: CheckCircle2, color: "text-green-600", label: "Processed" },
  error: { icon: XCircle, color: "text-red-600", label: "Error" },
}

interface DocumentDetailViewProps {
  parser: Parser
  documentId: string
  onUpdate: (updates: Partial<Parser>) => Promise<void>
}

export function DocumentDetailView({ parser, documentId, onUpdate }: DocumentDetailViewProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [doc, setDoc] = useState<ProcessedDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileLoading, setFileLoading] = useState(true)
  const [reprocessing, setReprocessing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedText, setCopiedText] = useState(false)
  const isFullContent = parser.extraction_type === "full_content"
  // Initial tab honors `?tab=` (used by the handwriting → chat bridge handoff so
  // post-auth users land directly on the chat). After mount we strip the param
  // so a refresh doesn't keep forcing the tab.
  const initialTab = (() => {
    const requested = searchParams?.get("tab")
    if (requested === "chat" || requested === "fields" || requested === "data") {
      return requested
    }
    return "data" as const
  })()
  const [tab, setTab] = useState<"data" | "fields" | "chat">(initialTab)

  // Bridge handoff token from ?handoff= — consumed once by useDocumentChat,
  // then stripped from the URL so a refresh doesn't replay.
  const [handoffToken] = useState(() => searchParams?.get("handoff") ?? undefined)

  useEffect(() => {
    const hasTab = !!searchParams?.get("tab")
    const hasHandoff = !!searchParams?.get("handoff")
    if (!hasTab && !hasHandoff) return
    // Clean the URL after we've consumed the params so the user can switch tabs
    // freely and the handoff doesn't replay on refresh.
    const params = new URLSearchParams(Array.from(searchParams!.entries()))
    params.delete("tab")
    params.delete("handoff")
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
    // Run only on mount — searchParams is captured at render time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load document
  const loadDocument = useCallback(async () => {
    if (!session?.user?.id) return
    const { data, error } = await supabase
      .from("parser_processed_documents")
      .select("*")
      .eq("id", documentId)
      .eq("parser_id", parser.id)
      .eq("user_id", session.user.id)
      .single()

    if (error || !data) {
      setLoading(false)
      return
    }
    setDoc(data as ProcessedDocument)
    setLoading(false)
  }, [documentId, parser.id, session?.user?.id, supabase])

  // Load file preview URL
  useEffect(() => {
    async function loadFileUrl() {
      setFileLoading(true)
      try {
        const res = await fetch(
          `/api/parsers/${parser.id}/documents/${documentId}/file`
        )
        if (res.ok) {
          const data = await res.json()
          setFileUrl(data.url)
        }
      } catch {
        // File not available
      } finally {
        setFileLoading(false)
      }
    }
    loadFileUrl()
  }, [parser.id, documentId])

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  // Realtime subscription for enrichment updates
  useEffect(() => {
    const channel = supabase
      .channel(`doc-detail-${documentId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "parser_processed_documents",
          filter: `id=eq.${documentId}`,
        },
        (payload: any) => {
          const updated = payload.new as ProcessedDocument
          setDoc((prev) => (prev ? { ...prev, ...updated } : updated))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [documentId, supabase])

  const handleReprocess = async () => {
    setReprocessing(true)
    try {
      const res = await fetch(`/api/parsers/${parser.id}/reprocess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId }),
      })
      if (res.ok) {
        await loadDocument()
      }
    } catch {
      // ignore
    } finally {
      setReprocessing(false)
    }
  }

  const handleCopyJson = async () => {
    if (!doc?.results) return
    const { __meta__, ...display } = doc.results
    if (!(await copyToClipboard(JSON.stringify(display, null, 2)))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /** Format results as readable plain text. For full_content, returns the markdown. */
  const resultsAsText = () => {
    if (!doc?.results) return ""
    const { __meta__, ...display } = doc.results
    if (isFullContent) {
      return typeof display.markdown === "string" ? display.markdown : JSON.stringify(display, null, 2)
    }
    // Fields mode — render as "Field Name: value" lines
    const fieldNameMap = new Map<string, string>()
    for (const f of parser.fields ?? []) {
      if (f.type !== "input") fieldNameMap.set(f.id, f.name)
    }
    const resolveName = (id: string) => fieldNameMap.get(id) ?? id
    return Object.entries(display)
      .map(([key, val]) => {
        const name = resolveName(key)
        if (val === null || val === undefined || val === "-") return `${name}: —`
        if (Array.isArray(val)) {
          if (val.length > 0 && typeof val[0] === "object") {
            const rows = val.map((row, i) => {
              const lines = Object.entries(row).map(([k, v]) => `  ${k}: ${v}`).join("\n")
              return `  [${i + 1}]\n${lines}`
            })
            return `${name}:\n${rows.join("\n")}`
          }
          return `${name}: ${val.join(", ")}`
        }
        if (typeof val === "object") return `${name}: ${JSON.stringify(val)}`
        return `${name}: ${val}`
      })
      .join("\n")
  }

  const handleCopyText = async () => {
    const text = resultsAsText()
    if (!text) return
    if (!(await copyToClipboard(text))) return
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">Document not found</p>
        <Button variant="outline" asChild>
          <Link href={`/parsers/${parser.id}/documents`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Link>
        </Button>
      </div>
    )
  }

  const statusConf = STATUS_CONFIG[doc.status]
  const StatusIcon = statusConf.icon
  const SourceIcon = SOURCE_ICONS[doc.source_type] ?? FileText
  const displayResults = doc.results
    ? (() => { const { __meta__, ...rest } = doc.results; return rest })()
    : null

  const mimeType = doc.mime_type ?? ""
  const isImage = mimeType.startsWith("image/")
  const isPdf = mimeType === "application/pdf" || doc.file_name?.endsWith(".pdf")

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="border-b px-4 sm:px-6 py-3 flex items-center gap-3 bg-card shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href={`/parsers/${parser.id}/documents`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <h1 className="text-sm font-semibold truncate">{doc.file_name}</h1>
          </div>
          <div className="flex items-center gap-4 mt-0.5 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <SourceIcon className="h-3 w-3" />
              {doc.source_type}
            </span>
            {doc.processed_at && (
              <span>
                {format(new Date(doc.processed_at), "MMM d, yyyy HH:mm")}
              </span>
            )}
            <span>{doc.credits_used} credit{doc.credits_used !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <Badge variant="outline" className={`text-xs ${statusConf.color} shrink-0`}>
          <StatusIcon className={`h-3 w-3 mr-1 ${doc.status === "processing" ? "animate-spin" : ""}`} />
          {statusConf.label}
        </Badge>
      </div>

      {/* Side-by-side content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left: Document preview */}
        <div className="mp-block w-full md:w-1/2 border-b md:border-b-0 md:border-r flex flex-col bg-muted/30 min-h-0 h-[40vh] md:h-auto">
          <div className="px-4 py-2 border-b bg-card flex items-center justify-between shrink-0">
            <span className="text-xs font-medium text-muted-foreground">Document Preview</span>
            {fileUrl && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </a>
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {fileLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : fileUrl ? (
              isPdf ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0"
                  title="Document preview"
                />
              ) : isImage ? (
                <div className="p-4 flex items-start justify-center h-full overflow-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl}
                    alt={doc.file_name}
                    className="max-w-full rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Preview not available for this file type
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download File
                    </a>
                  </Button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <FileWarning className="h-12 w-12 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    File not available
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Documents uploaded before file storage was enabled cannot be previewed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Extraction results */}
        <div className="w-full md:w-1/2 flex flex-col min-h-0">
          {/* Actions bar */}
          <div className="px-4 py-2 border-b bg-card flex items-center justify-between shrink-0 gap-2 flex-wrap">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "data" | "fields" | "chat")}>
              <TabsList className="h-8">
                <TabsTrigger value="data" className="text-xs h-7">Data</TabsTrigger>
                {!isFullContent && (
                  <TabsTrigger value="fields" className="text-xs h-7">Fields</TabsTrigger>
                )}
                <TabsTrigger value="chat" className="text-xs h-7 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Chat
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {tab !== "chat" && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleReprocess}
                  disabled={reprocessing || !fileUrl}
                >
                  <RotateCcw className={`h-3 w-3 mr-1 ${reprocessing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{reprocessing ? "Reprocessing..." : "Reprocess"}</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopyText} disabled={!displayResults}>
                  {copiedText ? (
                    <Check className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  <span className="hidden sm:inline">{copiedText ? "Copied" : "Copy Text"}</span>
                </Button>
                {!isFullContent && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopyJson} disabled={!displayResults}>
                    {copied ? (
                      <Check className="h-3 w-3 mr-1 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    <span className="hidden sm:inline">{copied ? "Copied" : "Copy JSON"}</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Results content */}
          {tab === "chat" ? (
            <div className="flex-1 min-h-0">
              <DocumentChat parser={parser} doc={doc} handoffToken={handoffToken} />
            </div>
          ) : (
            <div className="flex-1 overflow-auto min-h-0">
              {doc.status === "error" && (
                <div className="m-4 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {doc.error_message || "Extraction failed"}
                </div>
              )}

              {displayResults && tab === "data" && (
                <DataView results={displayResults} isFullContent={isFullContent} />
              )}

              {tab === "fields" && (
                <FieldsView
                  fields={parser.fields}
                  results={displayResults}
                  enrichingFields={doc.enriching_fields ?? undefined}
                />
              )}

              {!displayResults && doc.status !== "error" && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No extraction results yet</p>
                </div>
              )}
            </div>
          )}

          {/* Bottom feedback bar — hidden in chat mode (chat has its own composer) */}
          {tab !== "chat" && (
            <div className="border-t px-4 py-3 bg-card shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">
                  {isFullContent
                    ? "Not the data you were looking for? Add custom extraction instructions."
                    : "Not the data you were looking for? Update your fields and instructions."}
                </p>
                <Button size="sm" variant="default" className="h-7 text-xs shrink-0" asChild>
                  <Link href={`/parsers/${parser.id}/schema`}>
                    <Pencil className="h-3 w-3 mr-1" />
                    {isFullContent ? "Instructions" : "Update fields"}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const JSON_TREE_MAX_DEPTH = 20
const JSON_TREE_MAX_ARRAY_DISPLAY = 50

/** Tree-style data view — renders Markdown for full_content, JSON tree for fields mode */
function DataView({ results, isFullContent }: { results: Record<string, any>; isFullContent?: boolean }) {
  if (isFullContent && results.markdown) {
    return (
      <div className="mp-mask p-4 prose prose-sm max-w-none dark:prose-invert">
        <Markdown remarkPlugins={[remarkGfm]}>{results.markdown}</Markdown>
      </div>
    )
  }

  return (
    <div className="mp-mask p-4">
      <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap break-words">
        <JsonTree data={results} indent={0} />
      </pre>
    </div>
  )
}

function JsonTree({ data, indent }: { data: any; indent: number }) {
  const pad = "  ".repeat(indent)

  if (data === null || data === undefined) {
    return <span className="text-muted-foreground">null</span>
  }

  if (typeof data === "string") {
    return <span className="text-green-600 dark:text-green-400">&quot;{data}&quot;</span>
  }

  if (typeof data === "number") {
    return <span className="text-blue-600 dark:text-blue-400">{data}</span>
  }

  if (typeof data === "boolean") {
    return <span className="text-amber-600 dark:text-amber-400">{String(data)}</span>
  }

  // Safety: depth limit prevents stack overflow on deeply nested data
  if (indent >= JSON_TREE_MAX_DEPTH) {
    return <span className="text-amber-500 italic">[...nested data truncated]</span>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span>{"[]"}</span>
    const displayItems = data.length > JSON_TREE_MAX_ARRAY_DISPLAY
      ? data.slice(0, JSON_TREE_MAX_ARRAY_DISPLAY)
      : data
    const remaining = data.length - displayItems.length
    return (
      <>
        {"[\n"}
        {displayItems.map((item, i) => (
          <span key={i}>
            {pad}{"  "}<JsonTree data={item} indent={indent + 1} />
            {i < displayItems.length - 1 || remaining > 0 ? ",\n" : "\n"}
          </span>
        ))}
        {remaining > 0 && (
          <span>
            {pad}{"  "}<span className="text-muted-foreground italic">...and {remaining} more items</span>{"\n"}
          </span>
        )}
        {pad}{"]"}
      </>
    )
  }

  if (typeof data === "object") {
    const entries = Object.entries(data)
    if (entries.length === 0) return <span>{"{}"}</span>
    return (
      <>
        {"{\n"}
        {entries.map(([key, val], i) => (
          <span key={key}>
            {pad}{"  "}<span className="text-foreground/80">{key}</span>
            {": "}
            <JsonTree data={val} indent={indent + 1} />
            {i < entries.length - 1 ? ",\n" : "\n"}
          </span>
        ))}
        {pad}{"}"}
      </>
    )
  }

  return <span>{String(data)}</span>
}

/** Fields tab: shows each field with its extracted value */
function FieldsView({
  fields,
  results,
  enrichingFields,
}: {
  fields: SchemaField[]
  results: Record<string, any> | null
  enrichingFields?: string[]
}) {
  const extractionFields = fields.filter((f) => f.type !== "input")
  const enrichingSet = new Set(enrichingFields ?? [])

  return (
    <div className="mp-mask divide-y">
      {extractionFields.map((field) => {
        const value = results?.[field.id]
        const isEmpty =
          value === null || value === undefined || value === "-" || value === ""
        const isEnriching = enrichingSet.has(field.id)

        return (
          <div key={field.id} className={`px-4 py-3 flex items-start gap-4 ${isEnriching ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
            <div className="w-2/5 shrink-0">
              <p className="text-sm font-medium">{field.name}</p>
              {field.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {field.description}
                </p>
              )}
              <Badge variant="outline" className="text-[10px] mt-1">
                {field.type}
              </Badge>
            </div>
            <div className="flex-1 min-w-0 text-sm">
              {isEnriching ? (
                <span className="inline-flex items-center gap-1.5 text-blue-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">enriching...</span>
                </span>
              ) : isEmpty ? (
                <span className="text-muted-foreground italic">--</span>
              ) : typeof value === "object" ? (
                <pre className="text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <span className="break-words">{String(value)}</span>
              )}
            </div>
          </div>
        )
      })}
      {extractionFields.length === 0 && (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No fields defined
        </div>
      )}
    </div>
  )
}
