"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, FileText, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import type { Parser, ExtractorSubscription } from "@/lib/extractor/types"
import { ParserCard } from "./ParserCard"
import { CreateParserDialog } from "./CreateParserDialog"
import { CreditUsageBar } from "@/components/extractor/dashboard/CreditUsageBar"

export function ParserListPage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const { openAuthDialog } = useAuthDialog()

  const [parsers, setParsers] = useState<Parser[]>([])
  const [subscription, setSubscription] = useState<ExtractorSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

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
      setParsers(parsersRes.data ?? [])
      setSubscription(subRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load parsers")
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  if (!session?.user?.id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Bytebeam Extractor</h1>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Parser grid */}
      {parsers.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parsers.map((parser) => (
            <ParserCard
              key={parser.id}
              parser={parser}
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
