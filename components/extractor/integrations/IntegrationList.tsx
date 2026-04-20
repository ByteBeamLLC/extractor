"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Plus, Loader2, Webhook } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { ParserIntegration, IntegrationType } from "@/lib/extractor/types"
import { IntegrationCard } from "./IntegrationCard"
import { WebhookForm } from "./WebhookForm"
import { GoogleSheetsSetup } from "./GoogleSheetsSetup"
import { ZapierMakeForm } from "./ZapierMakeForm"
import { GmailInboxSetup } from "./GmailInboxSetup"
import { GoogleDocsSetup } from "./GoogleDocsSetup"
import { QuickBooksSetup } from "./QuickBooksSetup"

type IntegrationOption = {
  type: IntegrationType
  label: string
  description: string
} & (
  | { iconSrc: string; icon?: never }
  | { icon: React.ComponentType<{ className?: string }>; iconSrc?: never }
)

const INTEGRATION_OPTIONS: IntegrationOption[] = [
  { type: "webhook", label: "Webhook", description: "Send results via HTTP POST to any URL", icon: Webhook },
  { type: "google_sheets", label: "Google Sheets", description: "Pull results into Google Sheets with IMPORTDATA", iconSrc: "/icons/integrations/google-sheets.svg" },
  { type: "google_docs", label: "Google Docs", description: "Save extraction results as Google Docs in your Drive", iconSrc: "/icons/integrations/google-docs.svg" },
  { type: "zapier", label: "Zapier", description: "Connect to 5000+ apps via Zapier webhook", iconSrc: "/icons/integrations/zapier.svg" },
  { type: "make", label: "Make", description: "Send results to Make (formerly Integromat) scenarios", iconSrc: "/icons/integrations/make.svg" },
  { type: "power_automate", label: "Power Automate", description: "Connect to Microsoft Power Automate flows", iconSrc: "/icons/integrations/power-automate.svg" },
  { type: "gmail_inbox", label: "Gmail Inbox", description: "Auto-extract attachments from emails matching a sender", iconSrc: "/icons/integrations/gmail.svg" },
  { type: "quickbooks", label: "QuickBooks Online", description: "Push extracted invoices, bills, and receipts directly into QuickBooks", iconSrc: "/icons/integrations/quickbooks.svg" },
]

interface IntegrationListProps {
  parserId: string
}

export function IntegrationList({ parserId }: IntegrationListProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [integrations, setIntegrations] = useState<ParserIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null)

  const loadIntegrations = useCallback(async () => {
    if (!session?.user?.id) return
    const { data } = await supabase
      .from("parser_integrations")
      .select("*")
      .eq("parser_id", parserId)
      .order("created_at", { ascending: false })

    setIntegrations(data ?? [])
    setLoading(false)
  }, [parserId, session?.user?.id, supabase])

  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  // Auto-open the QuickBooks setup dialog after the OAuth redirect lands back
  // here. Without this, the user just sees the integration card and has no
  // obvious path to field mapping — the OAuth round-trip destroyed the in-
  // progress dialog state, so we re-open it programmatically.
  useEffect(() => {
    const justConnected = searchParams.get("quickbooksConnected") === "true"
    const oauthError = searchParams.get("quickbooksError")
    if ((justConnected || oauthError) && !showAddDialog) {
      setSelectedType("quickbooks")
      setShowAddDialog(true)
    }
    // We intentionally don't depend on showAddDialog so the effect doesn't
    // re-fire when the user closes the dialog manually.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Let an existing card open the configure dialog (edit mode).
  const handleEditIntegration = useCallback((type: IntegrationType) => {
    setSelectedType(type)
    setShowAddDialog(true)
  }, [])

  const handleCreated = () => {
    setSelectedType(null)
    setShowAddDialog(false)
    loadIntegrations()
    // Clear the one-shot URL params so refreshing doesn't re-trigger the auto-open.
    if (searchParams.get("quickbooksConnected") || searchParams.get("quickbooksError")) {
      router.replace(pathname)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Send parsed data to external tools and services automatically.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {integrations.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-8 text-center">
          <Webhook className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No integrations configured. Add one to automatically send extracted data
            to your apps.
          </p>
          <Button variant="outline" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              parserId={parserId}
              onUpdated={loadIntegrations}
              onEdit={handleEditIntegration}
            />
          ))}
        </div>
      )}

      {/* Add Integration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedType ? `Configure ${INTEGRATION_OPTIONS.find((o) => o.type === selectedType)?.label}` : "Add Integration"}
            </DialogTitle>
            <DialogDescription>
              {selectedType
                ? "Configure the integration settings below."
                : "Choose an integration type to connect."}
            </DialogDescription>
          </DialogHeader>

          {!selectedType && (
            <div className="space-y-2 py-2">
              {INTEGRATION_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setSelectedType(option.type)}
                  className="w-full text-left p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/30 transition-colors flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                    {option.iconSrc ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={option.iconSrc}
                        alt=""
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <option.icon className="h-5 w-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedType === "webhook" && (
            <WebhookForm
              parserId={parserId}
              onCreated={handleCreated}
              onCancel={() => setSelectedType(null)}
            />
          )}

          {selectedType === "google_sheets" && (
            <GoogleSheetsSetup
              parserId={parserId}
              onCreated={handleCreated}
              onCancel={() => setSelectedType(null)}
            />
          )}

          {selectedType === "google_docs" && (
            <GoogleDocsSetup
              parserId={parserId}
              onCreated={handleCreated}
              onCancel={() => setSelectedType(null)}
            />
          )}

          {(selectedType === "zapier" || selectedType === "make" || selectedType === "power_automate") && (
            <ZapierMakeForm
              parserId={parserId}
              type={selectedType}
              label={INTEGRATION_OPTIONS.find((o) => o.type === selectedType)!.label}
              onCreated={handleCreated}
              onCancel={() => setSelectedType(null)}
            />
          )}

          {selectedType === "gmail_inbox" && (
            <GmailInboxSetup
              parserId={parserId}
              onCreated={handleCreated}
              onCancel={() => setSelectedType(null)}
            />
          )}

          {selectedType === "quickbooks" && (
            <QuickBooksSetup
              parserId={parserId}
              onCreated={handleCreated}
              onCancel={() => setSelectedType(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
