"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, FileText, Loader2, AlertCircle, Search, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import type { Parser, ExtractorSubscription } from "@/lib/extractor/types"
import { ParserCard } from "./ParserCard"
import { CreateParserDialog } from "./CreateParserDialog"
import { CreditUsageBar } from "@/components/extractor/dashboard/CreditUsageBar"
import { getTemplateById } from "@/lib/parser-templates"
import { generateInboundEmail } from "@/lib/extractor/inbound-email"
import { TourStep } from "@/components/tour/TourStep"
import { useTour } from "@/components/tour/TourProvider"

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
  const [subscription, setSubscription] = useState<ExtractorSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)

  // Search and sort
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("last_updated")

  // Status breakdowns per parser
  const [statusBreakdowns, setStatusBreakdowns] = useState<Record<string, StatusBreakdown>>({})

  // Track whether we've already handled the template param (prevent double-create)
  const templateHandled = useRef(false)

  // Product tour
  const { startTour, nextStep, hasCompletedTour, isActive: tourActive } = useTour()
  const tourStartAttempted = useRef(false)

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }
    try {
      setError(null)
      const [parsersRes, subRes] = await Promise.all([
        supabase
          .from("parsers")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("extractor_subscriptions")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle(),
      ])

      if (parsersRes.error) throw parsersRes.error
      const loadedParsers = parsersRes.data ?? []
      setParsers(loadedParsers)

      // Ensure anonymous users have the correct tier
      let sub = subRes.data
      const isAnon = session.user.is_anonymous === true
      if (isAnon && (!sub || sub.tier === "free")) {
        const ONE_DAY_MS = 24 * 60 * 60 * 1000
        const anonSub = {
          tier: "anonymous" as const,
          credits_free: 5,
          credits_used: sub?.credits_used ?? 0,
          max_parsers: 1,
          credits_reset_at: sub
            ? sub.credits_reset_at
            : new Date(Date.now() + ONE_DAY_MS).toISOString(),
          updated_at: new Date().toISOString(),
        }
        if (sub) {
          await supabase
            .from("extractor_subscriptions")
            .update(anonSub)
            .eq("user_id", session.user.id)
          sub = { ...sub, ...anonSub }
        } else {
          const { data: created } = await supabase
            .from("extractor_subscriptions")
            .insert({
              user_id: session.user.id,
              ...anonSub,
            })
            .select("*")
            .single()
          sub = created
        }
      }
      setSubscription(sub)

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

  // Auto-start tour for first-time users with 0 parsers
  useEffect(() => {
    if (tourStartAttempted.current) return
    if (!session?.user?.id || loading || creatingFromTemplate) return
    tourStartAttempted.current = true

    if (tourActive || hasCompletedTour()) return
    if (parsers.length > 0) return

    const timer = setTimeout(() => startTour(), 400)
    return () => clearTimeout(timer)
  }, [session?.user?.id, loading, creatingFromTemplate, parsers.length, tourActive, hasCompletedTour, startTour])

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

  // Filter and sort parsers
  const filteredParsers = useMemo(() => {
    let result = parsers

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.inbound_email && p.inbound_email.toLowerCase().includes(q))
      )
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "last_updated":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "documents":
          return (b.document_count ?? 0) - (a.document_count ?? 0)
        default:
          return 0
      }
    })

    return result
  }, [parsers, searchQuery, sortBy])

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Parsers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create parsers to extract structured data from your documents
          </p>
        </div>
        <Button onClick={handleCreateParser}>
          <Plus className="h-4 w-4 mr-2" />
          New Parser
        </Button>
      </div>

      {/* Credit usage */}
      {subscription && (
        <div className="mb-6">
          <CreditUsageBar subscription={subscription} />
        </div>
      )}

      {/* Error */}
      {(error || templateError) && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {templateError || error}
        </div>
      )}

      {/* Search + Sort */}
      {parsers.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parsers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_updated">Last updated</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created">Date created</SelectItem>
              <SelectItem value="documents">Most documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Parser grid */}
      {parsers.length === 0 ? (
        <TourStep
          stepId="welcome"
          side="top"
          align="center"
          nextLabel="Create a Parser"
          onNext={() => {
            nextStep()
            handleCreateParser()
          }}
        >
          <div className="border-2 border-dashed rounded-xl p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No parsers yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first parser to start extracting data from documents.
              Define the fields you want to extract and let AI do the rest.
            </p>
            <Button onClick={handleCreateParser}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Parser
            </Button>
          </div>
        </TourStep>
      ) : filteredParsers.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-8 text-center">
          <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No parsers match &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredParsers.map((parser) => (
            <ParserCard
              key={parser.id}
              parser={parser}
              statusBreakdown={statusBreakdowns[parser.id]}
              onDeleted={loadData}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateParserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleParserCreated}
      />
    </div>
  )
}
