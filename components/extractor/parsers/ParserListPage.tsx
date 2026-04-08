"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, FileText, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import type { Parser } from "@/lib/extractor/types"
import { ParserCard } from "./ParserCard"
import { CreateParserDialog } from "./CreateParserDialog"
import { DocumentDropZone } from "./DocumentDropZone"
import { getTemplateById } from "@/lib/parser-templates"
import { generateInboundEmail } from "@/lib/extractor/inbound-email"
import { FirstDocumentUpload } from "@/components/extractor/onboarding/FirstDocumentUpload"

type SortOption = "last_updated" | "name" | "created" | "documents"

interface StatusBreakdown {
  completed: number
  error: number
  processing: number
  pending: number
}

/** Read ?template= from the browser URL directly (works regardless of prop passing) */
function getTemplateFromUrl(): string | null {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("template")
}

export function ParserListPage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const { openAuthDialog } = useAuthDialog()

  const [parsers, setParsers] = useState<Parser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)

  // Status breakdowns per parser
  const [statusBreakdowns, setStatusBreakdowns] = useState<Record<string, StatusBreakdown>>({})

  // Track whether we've already handled the template param (prevent double-create)
  const templateHandled = useRef(false)


  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }
    try {
      setError(null)
      const parsersRes = await supabase
        .from("parsers")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (parsersRes.error) throw parsersRes.error
      const loadedParsers = parsersRes.data ?? []
      setParsers(loadedParsers)

      // Subscription is owned by SubscriptionProvider (real-time synced via
      // Realtime on extractor_subscriptions). Anonymous ↔ authenticated tier
      // sync is handled by the promote_anonymous_to_free_trigger DB trigger
      // (migration 20260408140000), so no client-side fix-up is needed here.

      // Load status breakdowns for all parsers
      if (loadedParsers.length > 0) {
        const parserIds = loadedParsers.map((p) => p.id)
        const { data: docs } = await supabase
          .from("parser_processed_documents")
          .select("parser_id, status")
          .in("parser_id", parserIds)

        if (docs) {
          const breakdowns: Record<string, StatusBreakdown> = {}
          for (const doc of docs) {
            if (!breakdowns[doc.parser_id]) {
              breakdowns[doc.parser_id] = { completed: 0, error: 0, processing: 0, pending: 0 }
            }
            const status = doc.status as keyof StatusBreakdown
            if (status in breakdowns[doc.parser_id]) {
              breakdowns[doc.parser_id][status]++
            }
          }
          setStatusBreakdowns(breakdowns)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load parsers")
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-create parser from template when ?template= is in the URL
  useEffect(() => {
    const tmplId = getTemplateFromUrl()
    if (!session?.user?.id || templateHandled.current) return
    if (!tmplId) return

    templateHandled.current = true

    async function createFromTemplate() {
      setCreatingFromTemplate(true)
      try {
        const template = getTemplateById(tmplId!)
        if (!template) {
          setTemplateError(`Unknown template: ${tmplId}`)
          setCreatingFromTemplate(false)
          return
        }

        const webhookToken = crypto.randomUUID().replace(/-/g, "")
        const { data, error: insertError } = await supabase
          .from("parsers")
          .insert({
            user_id: session!.user.id,
            name: template.name,
            description: template.description,
            fields: template.buildFields(),
            extraction_mode: "ai",
            inbound_email: generateInboundEmail(template.name),
            inbound_webhook_token: webhookToken,
          })
          .select("id")
          .single()

        if (insertError) throw insertError
        router.replace(`/parsers/${data.id}?onboarding=true`)
      } catch (err) {
        setTemplateError(err instanceof Error ? err.message : "Failed to create parser from template")
        setCreatingFromTemplate(false)
      }
    }

    createFromTemplate()
  }, [session?.user?.id, router, supabase])

  const handleCreateParser = () => {
    if (!session?.user?.id) {
      openAuthDialog("sign-in")
      return
    }
    setShowCreateDialog(true)
  }

  const handleParserCreated = () => {
    setShowCreateDialog(false)
    loadData()
  }

  // Check for template param on initial mount (before session is available)
  const hasTemplateParam = useRef(typeof window !== "undefined" && !!getTemplateFromUrl())

  if (!session?.user?.id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Parsli</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Extract structured data from PDFs, images, invoices, and documents using AI.
          Send parsed data to Google Sheets, Zapier, webhooks, and more.
        </p>
        <Button size="lg" onClick={() => openAuthDialog("sign-up")}>
          Get Started Free
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          50 pages free per month. No credit card required.
        </p>
      </div>
    )
  }

  if (loading || creatingFromTemplate || (hasTemplateParam.current && !templateHandled.current)) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        {creatingFromTemplate && (
          <p className="text-sm text-muted-foreground">Setting up your parser...</p>
        )}
      </div>
    )
  }

  // Clean onboarding for new users
  if (parsers.length === 0) {
    return (
      <>
        <FirstDocumentUpload onParserCreated={loadData} />
        <CreateParserDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreated={handleParserCreated}
        />
      </>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page title */}
      <h1 className="text-2xl font-bold mb-6">Document Extraction</h1>

      {/* Chatbot-style drop zone */}
      <DocumentDropZone parsers={parsers} onParserCreated={loadData} />

      {/* Error */}
      {(error || templateError) && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {templateError || error}
        </div>
      )}

      {/* Your Parsers section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Your Parsers</h2>
        {parsers.length > 3 && (
          <button
            onClick={() => {/* could scroll or expand */}}
            className="text-sm text-muted-foreground hover:text-[#2782ff] transition-colors"
          >
            View all
          </button>
        )}
      </div>

      {/* Parser cards - responsive grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Create custom parser card */}
        <button
          onClick={handleCreateParser}
          className="border-2 border-dashed rounded-xl p-5 bg-card hover:border-[#2782ff]/50 hover:bg-[#2782ff]/[0.02] transition-all flex flex-col items-center justify-center text-center min-h-[220px] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">Create custom parser</p>
          <p className="text-xs text-muted-foreground mt-1">Define fields to extract</p>
        </button>

        {/* Parser cards */}
        {parsers.map((parser) => (
          <ParserCard
            key={parser.id}
            parser={parser}
            statusBreakdown={statusBreakdowns[parser.id]}
            onDeleted={loadData}
          />
        ))}
      </div>

      {/* Create dialog */}
      <CreateParserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleParserCreated}
      />
    </div>
  )
}
