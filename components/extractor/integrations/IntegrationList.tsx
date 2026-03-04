"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Plus,
  Loader2,
  Webhook,
  FileSpreadsheet,
  Zap,
  Blocks,
  Workflow,
  Mail,
} from "lucide-react"
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

const INTEGRATION_OPTIONS: {
  type: IntegrationType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { type: "webhook", label: "Webhook", description: "Send results via HTTP POST to any URL", icon: Webhook },
  { type: "google_sheets", label: "Google Sheets", description: "Pull results into Google Sheets with IMPORTDATA", icon: FileSpreadsheet },
  { type: "zapier", label: "Zapier", description: "Connect to 5000+ apps via Zapier webhook", icon: Zap },
  { type: "make", label: "Make", description: "Send results to Make (formerly Integromat) scenarios", icon: Blocks },
  { type: "power_automate", label: "Power Automate", description: "Connect to Microsoft Power Automate flows", icon: Workflow },
  { type: "gmail_inbox", label: "Gmail Inbox", description: "Auto-extract attachments from emails matching a sender", icon: Mail },
]

interface IntegrationListProps {
  parserId: string
}

export function IntegrationList({ parserId }: IntegrationListProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
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

  const handleCreated = () => {
    setSelectedType(null)
    setShowAddDialog(false)
    loadIntegrations()
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
              {INTEGRATION_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.type}
                    onClick={() => setSelectedType(option.type)}
                    className="w-full text-left p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/30 transition-colors flex items-center gap-3"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </button>
                )
              })}
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
