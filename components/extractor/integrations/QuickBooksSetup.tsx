"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  Settings as SettingsIcon,
  ListPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useSupabaseClient } from "@/lib/supabase/hooks"
import { useActiveParser } from "@/components/extractor/parser-context"
import type {
  ParserIntegration,
  QuickBooksConfig,
  QuickBooksFieldKey,
  QuickBooksTargetEntity,
} from "@/lib/extractor/types"
import { flattenSchema, type FlatField } from "@/lib/extractor/quickbooks/flattenSchema"
import { checkQboParserCompatibility } from "@/lib/extractor/quickbooks/parserCompatibility"

interface QuickBooksSetupProps {
  parserId: string
  onCreated: () => void
  onCancel: () => void
}

// QBO logical fields the user can map. The mapping value is the parsli field id
// (or dotted path for nested objects).
const FIELD_OPTIONS: Array<{
  key: QuickBooksFieldKey
  label: string
  hint: string
  appliesTo: QuickBooksTargetEntity[]
  expectsList?: boolean
}> = [
  { key: "vendor_name", label: "Vendor name", hint: "Used to look up / create the vendor", appliesTo: ["bill", "purchase"] },
  { key: "customer_name", label: "Customer name", hint: "Used to look up the customer", appliesTo: ["invoice"] },
  { key: "doc_number", label: "Document number", hint: "Vendor's invoice / receipt number (max 21 chars)", appliesTo: ["bill", "purchase", "invoice"] },
  { key: "txn_date", label: "Transaction date", hint: "Date on the document", appliesTo: ["bill", "purchase", "invoice"] },
  { key: "due_date", label: "Due date", hint: "Bill / invoice due date", appliesTo: ["bill", "invoice"] },
  { key: "memo", label: "Memo / notes", hint: "Free text note saved on the entity", appliesTo: ["bill", "purchase", "invoice"] },
  { key: "currency", label: "Currency code", hint: "ISO 4217 (e.g. USD, EUR). Requires multi-currency in QBO.", appliesTo: ["bill", "purchase", "invoice"] },
  { key: "exchange_rate", label: "Exchange rate", hint: "Required when currency differs from home currency", appliesTo: ["bill", "purchase", "invoice"] },
  { key: "total_amount", label: "Total amount", hint: "Used as a single line item if no line_items mapped", appliesTo: ["bill", "purchase", "invoice"] },
  { key: "tax_amount", label: "Tax amount", hint: "Total tax (informational; QBO recomputes from TaxCodeRef)", appliesTo: ["bill", "purchase", "invoice"] },
  { key: "line_items", label: "Line items", hint: "Map to a list/table field. Each row needs amount + description.", appliesTo: ["bill", "purchase", "invoice"], expectsList: true },
]

export function QuickBooksSetup({ parserId, onCreated, onCancel }: QuickBooksSetupProps) {
  const supabase = useSupabaseClient()
  const searchParams = useSearchParams()
  const { parser } = useActiveParser()

  const [integration, setIntegration] = useState<ParserIntegration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local mutable copy of the config for the form.
  const [draft, setDraft] = useState<QuickBooksConfig | null>(null)

  const oauthError = searchParams.get("quickbooksError")

  const loadIntegration = useCallback(async () => {
    const { data } = await supabase
      .from("parser_integrations")
      .select("*")
      .eq("parser_id", parserId)
      .eq("type", "quickbooks")
      .maybeSingle()

    const row = (data as ParserIntegration | null) ?? null
    setIntegration(row)
    if (row) setDraft({ ...(row.config as QuickBooksConfig) })
    setLoading(false)
  }, [parserId, supabase])

  useEffect(() => {
    loadIntegration()
  }, [loadIntegration])

  const flatFields = useMemo<FlatField[]>(() => {
    if (!parser?.fields?.length) return []
    return flattenSchema(parser.fields)
  }, [parser?.fields])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ---------------- Incompatibility guards ----------------
  //
  // Block QuickBooks setup early when the parser can't supply structured fields
  // for QBO mappings. Two distinct cases get distinct messages:
  //
  //   1. extraction_type === "full_content" — parser captures raw document
  //      content, not structured fields. QBO needs a vendor name + amount, so
  //      this mode is fundamentally incompatible. CTA: switch to Fields mode
  //      in Settings.
  //
  //   2. extraction_type === "fields" but parser.fields is empty — parser is
  //      in the right mode but has no fields defined yet. CTA: open Schema
  //      builder.
  //
  // We block BEFORE OAuth so the user doesn't waste a round-trip to Intuit
  // only to discover their parser is unusable. We block here even if a prior
  // QBO integration row exists (rare: user connected, then changed extraction
  // mode) — the integration would be non-functional, so we still surface the
  // explanation rather than silently rendering an empty mapping form.
  const compatibility = checkQboParserCompatibility(parser)
  const isFullContent = !compatibility.ok && compatibility.reason === "full_content"
  const hasNoFields = !compatibility.ok && compatibility.reason === "no_fields"

  if (!compatibility.ok) {
    const schemaHref = `/parsers/${parserId}/schema`
    const settingsHref = `/parsers/${parserId}/settings`
    return (
      <div className="space-y-4 py-2">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <Info className="h-4 w-4" />
            QuickBooks needs a fields-based parser
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            {isFullContent
              ? "This parser is set to extract full document content rather than structured fields. QuickBooks needs specific values (vendor name, total, date, etc.) to build Bills, Invoices, and Receipts — there's no way to map raw text to those fields automatically."
              : "This parser is in fields mode but no fields are defined yet. Add at least a vendor name and a total amount to your schema before connecting QuickBooks."}
          </p>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">To use QuickBooks with this parser:</p>
          {isFullContent ? (
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open the parser&apos;s Settings and switch extraction mode to <span className="font-medium">Fields</span>.</li>
              <li>Open the Schema tab and define the fields you want extracted (vendor, total, date, etc.).</li>
              <li>Come back here and connect QuickBooks.</li>
            </ol>
          ) : (
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open the Schema tab and add fields like <span className="font-mono">vendor_name</span>, <span className="font-mono">total_amount</span>, <span className="font-mono">invoice_date</span>.</li>
              <li>Process at least one document so we can verify extraction works.</li>
              <li>Come back here and connect QuickBooks.</li>
            </ol>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onCancel}>Back</Button>
          {isFullContent ? (
            <Button asChild>
              <Link href={settingsHref}>
                <SettingsIcon className="h-4 w-4 mr-1" />
                Open Settings
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={schemaHref}>
                <ListPlus className="h-4 w-4 mr-1" />
                Open Schema
              </Link>
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ---------------- Error / not-connected states ----------------

  if (oauthError) {
    return (
      <div className="space-y-4 py-2">
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            QuickBooks connection failed
          </p>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
            {oauthError === "access_denied"
              ? "You denied access to your QuickBooks account."
              : `Error: ${oauthError}`}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Back</Button>
          <Button onClick={() => (window.location.href = `/api/auth/quickbooks/connect?parserId=${parserId}`)}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // No integration row? Always show the connect screen, regardless of the
  // `?quickbooksConnected=true` URL hint. That hint can go stale — e.g. the
  // user connected, then deleted the integration via the card's trash icon,
  // then re-opened this dialog. Without this gate, we'd render an infinite
  // spinner waiting for `draft` that never comes.
  if (!integration) {
    return (
      <div className="space-y-4 py-2">
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <ExternalLink className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Connect QuickBooks Online</p>
              <p className="text-xs text-muted-foreground">
                Push extracted data directly into Bills, Receipts, or Invoices.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            We&apos;ll request accounting access only — no payments or payroll. The original
            document is attached to each created entity.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>Back</Button>
          <Button onClick={() => (window.location.href = `/api/auth/quickbooks/connect?parserId=${parserId}`)}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Connect QuickBooks
          </Button>
        </div>
      </div>
    )
  }

  if (!draft) {
    // Just connected but row not loaded yet (rare race) — show a brief loader.
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ---------------- Connected: configuration form ----------------

  const handleRefreshRefs = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const res = await fetch(`/api/parsers/${parserId}/integrations/quickbooks/refs`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to refresh QuickBooks references")
      }
      const data = await res.json()
      setDraft((d) =>
        d
          ? {
              ...d,
              accounts_snapshot: data.accounts ?? [],
              vendors_snapshot: data.vendors ?? [],
              customers_snapshot: data.customers ?? [],
              tax_codes_snapshot: data.tax_codes ?? [],
              snapshot_refreshed_at: data.refreshed_at ?? new Date().toISOString(),
            }
          : d
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed")
    } finally {
      setRefreshing(false)
    }
  }

  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        target_entity: draft.target_entity,
        field_mapping: draft.field_mapping,
        default_vendor_id: draft.default_vendor_id,
        default_account_id: draft.default_account_id,
        default_tax_code_id: draft.default_tax_code_id,
        default_payment_account_id: draft.default_payment_account_id,
        payment_type: draft.payment_type,
        auto_create_vendor: draft.auto_create_vendor,
        attach_source_document: draft.attach_source_document,
      }
      const res = await fetch(`/api/parsers/${parserId}/integrations/quickbooks/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to save QuickBooks configuration")
      }
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const setMapping = (key: string, value: string) => {
    setDraft((d) =>
      d ? { ...d, field_mapping: { ...d.field_mapping, [key]: value === "__none__" ? null : value } } : d
    )
  }

  const expenseAccounts = draft.accounts_snapshot.filter(
    (a) => a.AccountType === "Expense" || a.AccountType === "Other Expense" || a.AccountType === "Cost of Goods Sold"
  )
  const paymentAccounts = draft.accounts_snapshot.filter(
    (a) => a.AccountType === "Bank" || a.AccountType === "Credit Card"
  )

  const visibleFields = FIELD_OPTIONS.filter((f) => f.appliesTo.includes(draft.target_entity))

  return (
    <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto pr-2">
      <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Connected to {draft.company_name}
          <span className="ml-auto text-xs font-normal text-green-700 dark:text-green-300">
            {draft.environment === "sandbox" ? "Sandbox" : "Production"}
          </span>
        </p>
      </div>

      {/* Target entity */}
      <section className="space-y-2">
        <Label className="text-xs font-medium">Create as</Label>
        <Select
          value={draft.target_entity}
          onValueChange={(v) =>
            setDraft((d) => (d ? { ...d, target_entity: v as QuickBooksTargetEntity } : d))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bill">Bill — vendor invoice you owe</SelectItem>
            <SelectItem value="purchase">Receipt / Expense — already paid (cash/card)</SelectItem>
            <SelectItem value="invoice">Invoice — billable to a customer</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Defaults */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Defaults</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefreshRefs}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
            )}
            Refresh from QuickBooks
          </Button>
        </div>

        {draft.target_entity !== "invoice" && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              Default expense account <span className="text-destructive">*</span>
            </Label>
            <Select
              value={draft.default_account_id ?? "__none__"}
              onValueChange={(v) =>
                setDraft((d) => (d ? { ...d, default_account_id: v === "__none__" ? null : v } : d))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Not set —</SelectItem>
                {expenseAccounts.map((a) => (
                  <SelectItem key={a.Id} value={a.Id}>
                    {a.Name} <span className="text-muted-foreground">({a.AccountType})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Used when a line item has no account hint. Required.
            </p>
          </div>
        )}

        {draft.target_entity === "purchase" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Paid from <span className="text-destructive">*</span>
              </Label>
              <Select
                value={draft.default_payment_account_id ?? "__none__"}
                onValueChange={(v) =>
                  setDraft((d) => (d ? { ...d, default_payment_account_id: v === "__none__" ? null : v } : d))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick an account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Not set —</SelectItem>
                  {paymentAccounts.map((a) => (
                    <SelectItem key={a.Id} value={a.Id}>
                      {a.Name} <span className="text-muted-foreground">({a.AccountType})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Payment type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={draft.payment_type ?? "__none__"}
                onValueChange={(v) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          payment_type:
                            v === "__none__"
                              ? null
                              : (v as "Cash" | "Check" | "CreditCard"),
                        }
                      : d
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Not set —</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="CreditCard">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">
            Default {draft.target_entity === "invoice" ? "customer" : "vendor"}
          </Label>
          <Select
            value={draft.default_vendor_id ?? "__none__"}
            onValueChange={(v) =>
              setDraft((d) => (d ? { ...d, default_vendor_id: v === "__none__" ? null : v } : d))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={draft.target_entity === "invoice" ? "Pick a customer" : "Pick a vendor"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Not set —</SelectItem>
              {(draft.target_entity === "invoice" ? draft.customers_snapshot : draft.vendors_snapshot).map((v) => (
                <SelectItem key={v.Id} value={v.Id}>
                  {v.Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Used when {draft.target_entity === "invoice" ? "no customer name" : "vendor name"} is mapped or matched.
          </p>
        </div>

        {draft.target_entity !== "invoice" && (
          <div className="flex items-start gap-3 pt-1">
            <Switch
              checked={draft.auto_create_vendor}
              onCheckedChange={(checked) =>
                setDraft((d) => (d ? { ...d, auto_create_vendor: checked } : d))
              }
            />
            <div className="text-xs">
              <p className="font-medium">Auto-create missing vendors</p>
              <p className="text-muted-foreground">
                If the extracted vendor name doesn&apos;t match an existing vendor, create one.
                Off by default to avoid duplicates.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Switch
            checked={draft.attach_source_document}
            onCheckedChange={(checked) =>
              setDraft((d) => (d ? { ...d, attach_source_document: checked } : d))
            }
          />
          <div className="text-xs">
            <p className="font-medium">Attach source document</p>
            <p className="text-muted-foreground">
              Upload the original PDF/image to the created entity. Files over 25 MB are skipped.
            </p>
          </div>
        </div>
      </section>

      {/* Field mapping */}
      <section className="space-y-3">
        <div>
          <Label className="text-xs font-medium">Field mapping</Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Match each QuickBooks field to a parser field. Unmapped fields are left blank or use
            the defaults above.
          </p>
        </div>

        {flatFields.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            This parser has no extractable fields yet. Add fields in the Schema tab first.
          </p>
        ) : (
          <div className="space-y-2.5">
            {visibleFields.map((opt) => {
              const value = draft.field_mapping[opt.key] ?? "__none__"
              const candidates = opt.expectsList
                ? flatFields.filter((f) => f.isList)
                : flatFields.filter((f) => !f.isList)
              return (
                <div key={opt.key} className="grid grid-cols-[1fr_1fr] gap-2 items-start">
                  <div className="text-xs">
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-muted-foreground text-[11px]">{opt.hint}</p>
                  </div>
                  <Select
                    value={value}
                    onValueChange={(v) => setMapping(opt.key, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="— Not mapped —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Not mapped —</SelectItem>
                      {candidates.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
