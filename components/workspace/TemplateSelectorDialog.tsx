"use client"

import { useMemo, useState } from "react"
import { FileText, Pill, ClipboardList, Sparkle, Plus, RefreshCcw } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import type { AgentType } from "./types"
import type { SchemaTemplateDefinition } from "@/lib/schema-templates"

type TemplateId = string

interface TemplateDescriptor {
  id: TemplateId
  name: string
  description: string
  agentType: AgentType
  icon: React.ComponentType<{ className?: string }>
}

const TEMPLATE_LIBRARY: TemplateDescriptor[] = [
  {
    id: "invoice-nested",
    name: "Invoice",
    description: "Standard invoice schema with vendor, customer, and totals.",
    agentType: "standard",
    icon: FileText,
  },
  {
    id: "po-simple",
    name: "Purchase Order (Simple)",
    description: "Quick purchase order template with supplier and line items.",
    agentType: "standard",
    icon: ClipboardList,
  },
  {
    id: "pharma-artwork",
    name: "Pharma Artwork",
    description: "Capture batch numbers, expiry dates, and packaging metadata.",
    agentType: "pharma",
    icon: Pill,
  },
  {
    id: "pharma-content",
    name: "Pharma Ecommerce Content",
    description: "Generate product page content aligned to Saudi FDA terminology.",
    agentType: "pharma",
    icon: Sparkle,
  },
  {
    id: "bcd36cc9-4a2c-4686-9c87-68de586fc4bc",
    name: "Comprehensive Invoice Schema",
    description: "Comprehensive schema for all procurement documents - Purchase Orders, Commercial Invoices, Goods Receipts, Purchase Requisitions, and PO Processing Reports",
    agentType: "standard",
    icon: FileText,
  },
]

interface TemplateSelectorDialogProps {
  open: boolean
  onOpenChange: (next: boolean) => void
  templates: SchemaTemplateDefinition[]
  isLoading: boolean
  loadError: string | null
  onRefreshTemplates: () => Promise<void>
  onChooseTemplate: (templateId: string, options: { name: string; agent: AgentType }) => void
  onCreateBlank: (options: { name: string; agent: AgentType; templateId: string }) => void
}

export function TemplateSelectorDialog({
  open,
  onOpenChange,
  templates,
  isLoading,
  loadError,
  onRefreshTemplates,
  onChooseTemplate,
  onCreateBlank,
}: TemplateSelectorDialogProps) {
  const [schemaName, setSchemaName] = useState("")
  const [agent, setAgent] = useState<AgentType>("standard")

  const displayName = schemaName.trim() || "Untitled schema"
  const descriptorMap = useMemo(() => {
    const pairs = new Map<string, TemplateDescriptor>()
    TEMPLATE_LIBRARY.forEach((descriptor) => pairs.set(descriptor.id, descriptor))
    return pairs
  }, [])
  const templatesByAgent = useMemo(() => templates.filter((tpl) => tpl.agentType === agent), [templates, agent])
  const orderedTemplates = useMemo(
    () =>
      [...templatesByAgent].sort((a, b) => {
        if (!!a.isCustom === !!b.isCustom) {
          return a.name.localeCompare(b.name)
        }
        return a.isCustom ? 1 : -1
      }),
    [templatesByAgent],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-2xl font-semibold">Create new schema</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose a template or start from scratch. You can always modify fields later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <section className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">Schema details</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={schemaName}
                onChange={(event) => setSchemaName(event.target.value)}
                placeholder="Schema name"
                className="flex-1"
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={agent}
                onChange={(event) => setAgent(event.target.value as AgentType)}
              >
                <option value="standard">Standard</option>
                <option value="pharma">Pharma</option>
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Templates</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {agent === "pharma" ? "Pharma agent" : "Standard agent"}
                </Badge>
                {isLoading ? <span className="text-xs text-muted-foreground">Loading…</span> : null}
                {loadError ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      void onRefreshTemplates()
                    }}
                  >
                    <RefreshCcw className="mr-1 h-3.5 w-3.5" />
                    Retry
                  </Button>
                ) : null}
              </div>
            </div>
            {loadError ? <p className="text-xs text-destructive">{loadError}</p> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {isLoading && orderedTemplates.length === 0 ? (
                [0, 1].map((skeletonKey) => <Skeleton key={skeletonKey} className="h-32 rounded-xl" />)
              ) : orderedTemplates.length > 0 ? (
                orderedTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    descriptor={descriptorMap.get(template.id)}
                    onUse={() => {
                      onChooseTemplate(template.id, { name: displayName, agent })
                      onOpenChange(false)
                      setSchemaName("")
                    }}
                  />
                ))
              ) : (
                <EmptyTemplateCard
                  agent={agent}
                  onRefresh={() => {
                    void onRefreshTemplates()
                  }}
                />
              )}
              <BlankCard
                onUse={() => {
                  const templateId = agent === "pharma" ? "custom-pharma" : "custom-standard"
                  onCreateBlank({ name: displayName, agent, templateId })
                  onOpenChange(false)
                  setSchemaName("")
                }}
              />
            </div>
          </section>
        </div>

        <DialogFooter className="hidden" />
      </DialogContent>
    </Dialog>
  )
}

function TemplateCard({
  template,
  descriptor,
  onUse,
}: {
  template: SchemaTemplateDefinition
  descriptor?: TemplateDescriptor
  onUse: () => void
}) {
  const Icon = descriptor?.icon ?? Sparkle
  const displayName = descriptor?.name ?? template.name
  const description = descriptor?.description ?? template.description ?? "Custom template"
  return (
    <button
      type="button"
      className={cn(
        "group flex h-full flex-col gap-3 rounded-xl border border-border bg-card/40 p-4 text-left transition hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      onClick={onUse}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/70">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-muted-foreground capitalize">{template.agentType} agent</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {template.isCustom ? (
        <Badge variant="outline" className="w-fit text-[10px] font-medium uppercase tracking-wide">
          Custom
        </Badge>
      ) : null}
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
        Use template
      </span>
    </button>
  )
}

function BlankCard({ onUse }: { onUse: () => void }) {
  return (
    <button
      type="button"
      className="group flex h-full flex-col justify-between rounded-xl border border-dashed border-border p-4 text-left transition hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onUse}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border">
          <Plus className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">Start blank</p>
          <p className="text-xs text-muted-foreground">Create an empty schema</p>
        </div>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
        Create blank schema
      </span>
    </button>
  )
}

function EmptyTemplateCard({ agent, onRefresh }: { agent: AgentType; onRefresh: () => void }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-dashed border-border p-4 text-left">
      <div className="space-y-2">
        <p className="text-sm font-semibold">No saved templates yet</p>
        <p className="text-xs text-muted-foreground">
          Save a {agent === "pharma" ? "pharma" : "standard"} schema as a template in the editor to reuse it here.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-fit px-0 text-xs"
        onClick={() => {
          onRefresh()
        }}
      >
        <RefreshCcw className="mr-1 h-3 w-3" />
        Reload templates
      </Button>
    </div>
  )
}
