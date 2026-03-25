"use client"

import { useState } from "react"
import {
  FileText,
  Upload,
  Mail,
  Settings,
  Code,
  ArrowRight,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Layers,
  FolderOpen,
  Send,
  Webhook,
  Key,
  Copy,
  ExternalLink,
  Table2,
  Hash,
  Calendar,
  Type,
} from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { label: "Dashboard", url: "app.parsli.co/dashboard", tip: "Create your first document parser" },
  { label: "Create", url: "app.parsli.co/dashboard", tip: "Name your parser and click Create" },
  { label: "Schema", url: "app.parsli.co/parsers/inv-1/schema", tip: "Let AI analyze your document type and suggest fields" },
  { label: "Fields", url: "app.parsli.co/parsers/inv-1/schema", tip: "AI detected 6 fields. Add, edit, or remove any field." },
  { label: "Import", url: "app.parsli.co/parsers/inv-1/import", tip: "Upload manually, forward emails, or send via webhook" },
  { label: "Export", url: "app.parsli.co/parsers/inv-1/export", tip: "One-click integrations \u2014 data flows automatically" },
  { label: "API", url: "app.parsli.co/parsers/inv-1/api", tip: "Full REST API on every plan, including free" },
] as const

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", key: "overview" },
  { icon: Layers, label: "Fields", key: "fields" },
  { icon: FolderOpen, label: "Documents", key: "documents" },
  { icon: Send, label: "Import", key: "import" },
  { icon: ExternalLink, label: "Export", key: "export" },
  { icon: Code, label: "API", key: "api" },
  { icon: Settings, label: "Settings", key: "settings" },
] as const

const FIELDS = [
  { name: "vendor_name", desc: "Name of the vendor or supplier", type: "string", icon: Type },
  { name: "invoice_number", desc: "Unique invoice identifier", type: "string", icon: Hash },
  { name: "invoice_date", desc: "Date the invoice was issued", type: "date", icon: Calendar },
  { name: "total_amount", desc: "Total amount due", type: "decimal", icon: Hash },
  { name: "line_items", desc: "Individual line items with description and amount", type: "table", icon: Table2 },
  { name: "currency", desc: "Currency code (e.g. USD, EUR)", type: "string", icon: Type },
] as const

function Hotspot({ children, active, onClick, className }: {
  children: React.ReactNode
  active: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <span
      className={cn("relative inline-flex", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
      {active && (
        <span className="absolute -inset-1 rounded-lg ring-2 ring-primary animate-pulse pointer-events-none" />
      )}
    </span>
  )
}

function Sidebar({ step, onAdvance }: { step: number; onAdvance: () => void }) {
  const activeKey =
    step === 2 || step === 3 ? "fields" :
    step === 4 ? "import" :
    step === 5 ? "export" :
    step === 6 ? "api" : "overview"

  // step=3 (Schema populated) -> hotspot on Documents
  // step=4 (Import) -> hotspot on Export
  // step=5 (Export) -> hotspot on API
  const hotspot =
    step === 3 ? "documents" :
    step === 4 ? "export" :
    step === 5 ? "api" : null

  return (
    <div className="hidden md:flex flex-col w-[180px] shrink-0 bg-white border-r border-border">
      {/* Logo area */}
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm">Parsli</span>
        </div>
      </div>

      {/* Parser name when in parser context (steps 2-6) */}
      {step >= 2 && (
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-medium text-foreground truncate">Invoice Parser</p>
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
            active
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {step < 2 ? (
          /* Dashboard sidebar */
          <>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md bg-accent text-accent-foreground">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Parsers
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md text-muted-foreground">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </div>
          </>
        ) : (
          /* Parser sub-nav */
          SIDEBAR_ITEMS.map((item) => {
            const isActive = item.key === activeKey
            const isHotspot = item.key === hotspot
            const Icon = item.icon
            const el = (
              <div
                key={item.key}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md cursor-default",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </div>
            )
            return isHotspot ? (
              <Hotspot key={item.key} active onClick={onAdvance} className="block w-full cursor-pointer">
                {el}
              </Hotspot>
            ) : (
              <div key={item.key}>{el}</div>
            )
          })
        )}
      </nav>
    </div>
  )
}

/* ── Step Content Components ─────────────────────────────────── */

function StepDashboard({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Parsers</h2>
          <p className="text-[11px] text-muted-foreground">Manage your document parsers</p>
        </div>
        <Hotspot active onClick={onAdvance} className="cursor-pointer">
          <button className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md">
            <Plus className="w-3.5 h-3.5" /> New Parser
          </button>
        </Hotspot>
      </div>
      {/* Usage bar */}
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground">Monthly Usage</span>
          <span className="text-[11px] font-medium">0 / 30 pages</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-0 rounded-full bg-primary" />
        </div>
      </div>
      {/* Empty state */}
      <div className="rounded-xl border border-dashed bg-card p-8 text-center">
        <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No parsers yet. Create one to get started.</p>
      </div>
    </div>
  )
}

function StepCreateDialog({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="relative h-full">
      {/* Dimmed dashboard behind */}
      <div className="p-4 space-y-4 opacity-30 pointer-events-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Parsers</h2>
            <p className="text-[11px] text-muted-foreground">Manage your document parsers</p>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md">
            <Plus className="w-3.5 h-3.5" /> New Parser
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="h-1.5 rounded-full bg-muted" />
        </div>
      </div>
      {/* Modal overlay */}
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <div className="bg-card rounded-xl border shadow-xl w-[320px] p-5 space-y-4">
          <h3 className="text-sm font-semibold">Create New Parser</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Name</label>
              <div className="border rounded-md px-2.5 py-1.5 text-xs bg-background">Invoice Parser</div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Description</label>
              <div className="border rounded-md px-2.5 py-1.5 text-xs bg-background leading-relaxed">
                Extract vendor, amounts, and line items from invoices
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="text-xs px-3 py-1.5 rounded-md border text-muted-foreground">Cancel</button>
            <Hotspot active onClick={onAdvance} className="cursor-pointer">
              <button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium">
                Create
              </button>
            </Hotspot>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepSchemaEmpty({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Schema</h2>
        <p className="text-[11px] text-muted-foreground">Define the fields you want to extract from documents.</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 border text-xs font-medium px-3 py-1.5 rounded-md">
          <Plus className="w-3.5 h-3.5" /> Add Field
        </button>
        <Hotspot active onClick={onAdvance} className="cursor-pointer">
          <button className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md">
            <Sparkles className="w-3.5 h-3.5" /> Auto-Detect Fields
          </button>
        </Hotspot>
      </div>
      <div className="rounded-xl border border-dashed bg-card p-8 text-center">
        <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No fields defined yet.</p>
      </div>
    </div>
  )
}

function StepSchemaPopulated() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Schema</h2>
        <p className="text-[11px] text-muted-foreground">6 fields detected by AI. Add, edit, or remove any field.</p>
      </div>
      <div className="space-y-1.5">
        {FIELDS.map((f) => {
          const Icon = f.icon
          return (
            <div key={f.name} className="flex items-center gap-3 border rounded-lg bg-card px-3 py-2">
              <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium font-mono truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{f.desc}</p>
              </div>
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium shrink-0">
                {f.type}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepImport() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Import Documents</h2>
        <p className="text-[11px] text-muted-foreground">Choose how to send documents for extraction.</p>
      </div>
      <div className="grid gap-2">
        {/* Email */}
        <div className="border rounded-lg bg-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">By Email</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Forward emails with attachments</p>
          <div className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1">
            <code className="text-[10px] flex-1 truncate">invoices.a1b2@in.parsli.co</code>
            <Copy className="w-3 h-3 text-muted-foreground shrink-0" />
          </div>
        </div>
        {/* Upload */}
        <div className="border rounded-lg bg-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Direct Upload</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Drag and drop files or click to browse</p>
          <button className="inline-flex items-center gap-1 text-[10px] text-primary font-medium">
            Go to Documents <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {/* Webhook */}
        <div className="border rounded-lg bg-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Inbound Webhook</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1">
            <code className="text-[10px] flex-1 truncate">POST https://app.parsli.co/api/inbound/webhook/...</code>
            <Copy className="w-3 h-3 text-muted-foreground shrink-0" />
          </div>
        </div>
      </div>
      {/* Recent */}
      <div>
        <h3 className="text-[11px] font-medium mb-1.5">Recent Documents</h3>
        <div className="border rounded-lg bg-card px-3 py-2 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs flex-1">invoice-march.pdf</span>
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">completed</span>
        </div>
      </div>
    </div>
  )
}

function StepExport() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Export</h2>
        <p className="text-[11px] text-muted-foreground">Download extracted data or connect integrations.</p>
      </div>
      {/* Download */}
      <div className="border rounded-lg bg-card p-3 space-y-2">
        <h3 className="text-xs font-medium">Download Data</h3>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 border text-xs px-3 py-1.5 rounded-md font-medium">
            <Table2 className="w-3.5 h-3.5" /> CSV
          </button>
          <button className="inline-flex items-center gap-1.5 border text-xs px-3 py-1.5 rounded-md font-medium">
            <Code className="w-3.5 h-3.5" /> JSON
          </button>
        </div>
      </div>
      {/* Integrations */}
      <div className="border rounded-lg bg-card p-3 space-y-2">
        <h3 className="text-xs font-medium">Integrations</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="flex-1 font-medium">Google Sheets</span>
            <span className="text-[10px] text-muted-foreground">Sending to &apos;Invoice Data&apos;</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span className="flex-1 font-medium">Zapier</span>
            <button className="text-[10px] text-primary font-medium inline-flex items-center gap-0.5">
              Connect <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span className="flex-1 font-medium">Make</span>
            <button className="text-[10px] text-primary font-medium inline-flex items-center gap-0.5">
              Connect <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepAPI() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">API &amp; Webhooks</h2>
        <p className="text-[11px] text-muted-foreground">Integrate Parsli into your stack with our REST API.</p>
      </div>
      {/* API Keys */}
      <div className="border rounded-lg bg-card p-3 space-y-2">
        <h3 className="text-xs font-medium">API Keys</h3>
        <div className="flex items-center gap-2 bg-muted rounded-md px-2.5 py-1.5">
          <Key className="w-3.5 h-3.5 text-muted-foreground" />
          <code className="text-[10px] flex-1 font-mono">ext_pk_•••••••••a1b2</code>
          <Copy className="w-3 h-3 text-muted-foreground cursor-pointer" />
        </div>
      </div>
      {/* Quick Start */}
      <div className="border rounded-lg bg-card p-3 space-y-2">
        <h3 className="text-xs font-medium">Quick Start</h3>
        <div className="bg-[#1e293b] text-green-400 rounded-md p-3 overflow-x-auto">
          <pre className="text-[10px] leading-relaxed whitespace-pre-wrap break-all font-mono">{`curl -X POST https://app.parsli.co/api/v1/extract \\
  -H "Authorization: Bearer ext_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"file":{"name":"invoice.pdf","type":"application/pdf","data":"BASE64_DATA"}}'`}</pre>
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────── */

export function InteractiveDemo() {
  const [step, setStep] = useState(0)

  const advance = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const isLast = step === STEPS.length - 1

  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      {/* Browser chrome */}
      <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-[#f1f3f5] px-4 py-2.5 border-b">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border rounded-md px-3 py-1 text-[11px] text-muted-foreground min-w-[220px] text-center font-mono transition-all duration-300">
              {STEPS[step].url}
            </div>
          </div>
          <div className="w-[54px]" /> {/* Spacer to center URL */}
        </div>

        {/* App content */}
        <div className="flex h-[420px] bg-background overflow-hidden">
          {/* Sidebar */}
          <Sidebar step={step} onAdvance={advance} />

          {/* Main content area */}
          <div className="flex-1 overflow-y-auto transition-all duration-300">
            {step === 0 && <StepDashboard onAdvance={advance} />}
            {step === 1 && <StepCreateDialog onAdvance={advance} />}
            {step === 2 && <StepSchemaEmpty onAdvance={advance} />}
            {step === 3 && <StepSchemaPopulated />}
            {step === 4 && <StepImport />}
            {step === 5 && <StepExport />}
            {step === 6 && <StepAPI />}
          </div>
        </div>

        {/* Bottom bar: tooltip + step indicator + navigation */}
        <div className="border-t bg-card px-4 py-3 space-y-3">
          {/* Tooltip */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
            <p className="text-xs text-foreground leading-relaxed transition-all duration-300">
              {STEPS[step].tip}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            {/* Step indicators */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                    i === step ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                  )}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Back / Next / CTA */}
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                disabled={step === 0}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded-md transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              {isLast ? (
                <a
                  href="https://app.parsli.co/login"
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-4 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                >
                  Try Parsli Free <ArrowRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={advance}
                  className="inline-flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InteractiveDemo
