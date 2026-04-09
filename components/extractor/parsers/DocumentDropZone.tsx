"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Cloud,
  ChevronDown,
  ArrowUp,
  Plus,
  FileText,
  X,
  Sparkles,
  PenLine,
  ChevronLeft,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  ACCEPTED_EXTENSIONS,
  validateUploadFile,
} from "@/components/extractor/test/DocumentUploader"
import { generateInboundEmail } from "@/lib/extractor/inbound-email"
import type { Parser } from "@/lib/extractor/types"
import type { SchemaField, LeafField } from "@/lib/schema"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────
interface ManualField {
  id: string
  name: string
  type: string
  description: string
}

const FIELD_TYPES = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "decimal", label: "Decimal" },
  { value: "boolean", label: "Yes/No" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "richtext", label: "Rich Text" },
  { value: "single_select", label: "Single Select" },
  { value: "multi_select", label: "Multi Select" },
  { value: "object", label: "Object" },
  { value: "list", label: "List" },
  { value: "table", label: "Table" },
]

const FIELD_EXAMPLES = [
  { name: "Invoice Number", desc: "Unique ID on the document", type: "string" },
  { name: "Vendor Name", desc: "Company that issued it", type: "string" },
  { name: "Total Amount", desc: "Final total incl. tax", type: "decimal" },
  { name: "Date", desc: "Date issued", type: "date" },
  { name: "Line Items", desc: "Items, qty & prices", type: "table" },
  { name: "Email Address", desc: "Contact email", type: "email" },
  { name: "Account Number", desc: "Bank or client account", type: "string" },
  { name: "Due Date", desc: "Payment deadline", type: "date" },
]

const ICON_COLORS = [
  "#2782ff", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#7c3aed", "#14b8a6",
]

function getParserColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length]
}

// ── Props ──────────────────────────────────────────────
interface DocumentDropZoneProps {
  parsers: Parser[]
  onParserCreated: () => void
}

export function DocumentDropZone({ parsers, onParserCreated }: DocumentDropZoneProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const { openAuthDialog } = useAuthDialog()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // File state
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Parser selection
  const [selectedParser, setSelectedParser] = useState<Parser | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Create new parser flow
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [newParserName, setNewParserName] = useState("")

  // Manual fields dialog
  const [showFieldsDialog, setShowFieldsDialog] = useState(false)
  const [manualFields, setManualFields] = useState<ManualField[]>([
    { id: crypto.randomUUID(), name: "", type: "string", description: "" },
  ])
  const [usedExamples, setUsedExamples] = useState<Set<string>>(new Set())

  // Extraction state
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractStatus, setExtractStatus] = useState("")

  // ── New parser creation mode (stored when user picks from create menu)
  const [pendingMode, setPendingMode] = useState<"full" | "ai" | "manual" | null>(null)
  const [pendingParserName, setPendingParserName] = useState("")

  // ── Helpers ──────────────────────────────────────────
  const isReady = !!file && (!!selectedParser || !!pendingMode)

  const resetCreateMenu = () => {
    setShowCreateMenu(false)
    setNewParserName("")
  }

  const handleFileSelected = useCallback((f: File) => {
    const err = validateUploadFile(f)
    if (err) return
    setFile(f)
  }, [])

  const removeFile = () => {
    setFile(null)
    setSelectedParser(null)
    setPendingMode(null)
    setPendingParserName("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Drag & Drop ─────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFileSelected(f)
  }

  // ── Parser dropdown actions ─────────────────────────
  const selectExistingParser = (parser: Parser) => {
    setSelectedParser(parser)
    setPendingMode(null)
    setPendingParserName("")
    setShowDropdown(false)
  }

  const openCreateMenu = () => {
    setShowDropdown(false)
    setShowCreateMenu(true)
    setNewParserName("")
  }

  // ── Create menu actions ─────────────────────────────
  const selectFullExtraction = () => {
    const name = newParserName.trim()
    setPendingMode("full")
    setPendingParserName(name)
    setSelectedParser(null)
    resetCreateMenu()
  }

  const selectAIFields = () => {
    const name = newParserName.trim()
    setPendingMode("ai")
    setPendingParserName(name)
    setSelectedParser(null)
    resetCreateMenu()
  }

  const openManualFields = () => {
    setPendingParserName(newParserName.trim())
    resetCreateMenu()
    setManualFields([{ id: crypto.randomUUID(), name: "", type: "string", description: "" }])
    setUsedExamples(new Set())
    setShowFieldsDialog(true)
  }

  // ── Manual field management ─────────────────────────
  const addField = () => {
    setManualFields(prev => [...prev, { id: crypto.randomUUID(), name: "", type: "string", description: "" }])
  }
  const removeField = (id: string) => {
    setManualFields(prev => prev.filter(f => f.id !== id))
  }
  const updateField = (id: string, updates: Partial<ManualField>) => {
    setManualFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }
  const addExample = (example: typeof FIELD_EXAMPLES[0]) => {
    setManualFields(prev => [...prev, {
      id: crypto.randomUUID(),
      name: example.name,
      type: example.type,
      description: example.desc,
    }])
    setUsedExamples(prev => new Set(prev).add(example.name))
  }
  const validFieldCount = manualFields.filter(f => f.name.trim()).length

  const confirmManualFields = () => {
    if (validFieldCount === 0) return
    setPendingMode("manual")
    setSelectedParser(null)
    setShowFieldsDialog(false)
  }

  // ── Upload helper ───────────────────────────────────
  const uploadFile = async (parserId: string, f: File) => {
    const INLINE_THRESHOLD = 3 * 1024 * 1024
    if (f.size <= INLINE_THRESHOLD) {
      const arrayBuffer = await f.arrayBuffer()
      const base64 = btoa(new Uint8Array(arrayBuffer).reduce((d, byte) => d + String.fromCharCode(byte), ""))
      return { file: { name: f.name, type: f.type, data: base64, size: f.size } }
    }
    const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `${session!.user.id}/${parserId}/pending/${crypto.randomUUID()}/${safeName}`
    const { uploadToStorage } = await import("@/lib/storage/client")
    await uploadToStorage(storagePath, f, f.type || "application/octet-stream")
    return { storage_path: storagePath, file_name: f.name, file_type: f.type, file_size: f.size }
  }

  // ── Send / Extract ──────────────────────────────────
  const handleSend = async () => {
    if (!file) return
    if (!session?.user?.id) { openAuthDialog("sign-in"); return }

    setIsExtracting(true)

    try {
      let parserId: string

      if (selectedParser) {
        // Existing parser — upload and extract directly
        parserId = selectedParser.id
        setExtractStatus("Uploading and extracting...")
        const extractBody = await uploadFile(parserId, file)
        const res = await fetch(`/api/parsers/${parserId}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extractBody),
        })
        if (!res.ok) {
          if (res.status === 402 && session.user.is_anonymous) { openAuthDialog("sign-up"); return }
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? "Extraction failed")
        }
        router.push(`/parsers/${parserId}/documents`)
      } else if (pendingMode) {
        // New parser — create then extract
        const name = pendingParserName || "Untitled Parser"
        const mode = pendingMode

        const validFields = manualFields.filter(f => f.name.trim())
        const fields: SchemaField[] = mode === "manual"
          ? validFields.map(f => ({
              id: f.id,
              name: f.name.trim(),
              type: f.type,
              description: f.description.trim() || undefined,
              required: false,
            } as LeafField))
          : []

        setExtractStatus("Creating parser...")
        const webhookToken = crypto.randomUUID().replace(/-/g, "")
        const { data, error: insertError } = await supabase
          .from("parsers" as any)
          .insert({
            user_id: session.user.id,
            name: name.trim(),
            description: null,
            fields,
            extraction_type: mode === "full" ? "full_content" : "fields",
            extraction_mode: "ai",
            inbound_email: generateInboundEmail(name),
            inbound_webhook_token: webhookToken,
          } as any)
          .select("id")
          .single()

        if (insertError) throw insertError
        parserId = (data as any)?.id

        // For AI mode, detect fields first
        if (mode === "ai") {
          setExtractStatus("AI is analyzing your document...")
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
          const detectKey = `${session.user.id}/${parserId}/detect-fields/${crypto.randomUUID()}/${safeName}`
          const { uploadToStorage: uploadDetect } = await import("@/lib/storage/client")
          await uploadDetect(detectKey, file, file.type || "application/octet-stream")
          const detectRes = await fetch(`/api/parsers/${parserId}/detect-fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storage_path: detectKey, file_name: file.name, file_type: file.type }),
          })
          if (!detectRes.ok) {
            let errMsg = "Failed to detect fields"
            try { const b = await detectRes.json(); errMsg = b.error ?? errMsg } catch {}
            throw new Error(errMsg)
          }
          const { fields: detectedFields } = await detectRes.json()
          await supabase.from("parsers" as any).update({ fields: detectedFields } as any).eq("id", parserId)
        }

        setExtractStatus(mode === "ai" ? "Extracting data with detected fields..." : "Uploading and extracting...")
        const extractBody = await uploadFile(parserId, file)
        const extractRes = await fetch(`/api/parsers/${parserId}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extractBody),
        })
        if (!extractRes.ok) {
          const body = await extractRes.json().catch(() => ({}))
          throw new Error(body.error ?? "Extraction failed")
        }
        const extractData = await extractRes.json()
        onParserCreated()
        router.push(`/parsers/${parserId}/documents/${extractData.document_id}`)
      }
    } catch (err) {
      console.error("Extraction error:", err)
      setExtractStatus("")
    } finally {
      setIsExtracting(false)
    }
  }

  // ── Display name for selected parser / pending mode ──
  const displayName = selectedParser
    ? selectedParser.name
    : pendingMode === "full"
      ? pendingParserName || "Full extraction"
      : pendingMode === "ai"
        ? pendingParserName || "AI fields"
        : pendingMode === "manual"
          ? pendingParserName || "Custom fields"
          : "Choose Parser"

  const displayColor = selectedParser
    ? getParserColor(selectedParser.name)
    : pendingMode ? "#2782ff" : "#d1d5db"

  // ── Render ──────────────────────────────────────────
  return (
    <>
      <div className="mb-8">
        <div
          className={cn(
            "bg-card border rounded-2xl shadow-sm transition-all relative overflow-visible",
            isDragging && "border-[#2782ff] ring-[3px] ring-[#2782ff]/10 bg-[#2782ff]/[0.02]",
            !isDragging && "border-border"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-[#2782ff]/[0.04] rounded-2xl z-10 flex items-center justify-center gap-2 pointer-events-none">
              <Cloud className="h-5 w-5 text-[#2782ff]" />
              <span className="text-sm font-semibold text-[#2782ff]">Drop file to extract</span>
            </div>
          )}

          {/* File attachment */}
          {file && (
            <div className="mx-4 mt-3 p-2.5 bg-muted/50 border rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              {!isExtracting && (
                <button onClick={removeFile} className="text-muted-foreground hover:text-foreground shrink-0 p-1">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Inner drop zone (hidden when file is attached) */}
          {!file && (
            <div
              className="flex flex-col items-center justify-center gap-1.5 py-6 px-4 cursor-pointer min-h-[80px]"
              onClick={() => fileInputRef.current?.click()}
            >
              <Cloud className={cn("h-7 w-7 transition-colors", isDragging ? "text-[#2782ff]" : "text-muted-foreground/40")} />
              <p className="text-base font-medium text-foreground">
                Drop a file here, or{" "}
                <span className="text-[#2782ff] font-semibold hover:underline">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                then select an existing parser or create a new one
              </p>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-1 px-2.5 pb-2.5 pt-0.5">
            <div className="flex-1" />

            {/* Extracting status */}
            {isExtracting && extractStatus && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {extractStatus}
              </div>
            )}

            {/* Parser selector */}
            <div className="relative">
              <button
                onClick={() => { setShowCreateMenu(false); setShowDropdown(!showDropdown) }}
                className={cn(
                  "relative overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.94rem] font-semibold transition-colors",
                  file && !selectedParser && !pendingMode 
                    ? "bg-[#2782ff] text-white" 
                    : "bg-[#2782ff]/10 text-[#2782ff] hover:bg-[#2782ff]/15"
                )}
              >
                {/* Aggressive pulse from the middle spread across */}
                {file && !selectedParser && !pendingMode && (
                  <span 
                    className="absolute inset-0 block bg-white/30 rounded-lg pointer-events-none mix-blend-overlay"
                    style={{
                      animation: "spread-pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                    }}
                  />
                )}
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes spread-pulse {
                    0% { transform: scaleX(0); opacity: 1; }
                    100% { transform: scaleX(1); opacity: 0; }
                  }
                `}} />
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: displayColor }} />
                <span className="max-w-[180px] truncate">{displayName}</span>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5",
                  file && !selectedParser && !pendingMode ? "text-white/80" : "text-muted-foreground/60"
                )} />
              </button>

              {/* Parser dropdown */}
              {showDropdown && (
                <div className="absolute top-full mt-1.5 right-0 w-64 bg-popover border rounded-xl shadow-lg z-50 flex flex-col">
                  {/* Scrollable parser list */}
                  <div className="max-h-[220px] overflow-y-auto p-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">Your Parsers</p>
                    {parsers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectExistingParser(p)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                          selectedParser?.id === p.id ? "bg-[#2782ff]/10 text-[#2782ff] font-medium" : "hover:bg-muted/60"
                        )}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getParserColor(p.name) }} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                  {/* Fixed create button */}
                  <div className="border-t p-1">
                    <button
                      onClick={openCreateMenu}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#2782ff] hover:bg-muted/60 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Create new parser
                    </button>
                  </div>
                </div>
              )}

              {/* Create parser submenu */}
              {showCreateMenu && (
                <div className="absolute top-full mt-1.5 right-0 w-[340px] bg-popover border rounded-xl shadow-lg z-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => { setShowCreateMenu(false); setShowDropdown(true) }}
                      className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted/60 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <span className="text-sm font-semibold">Create New Parser</span>
                  </div>

                  {/* Parser name input */}
                  <Input
                    placeholder="Parser name (e.g. Invoices)"
                    value={newParserName}
                    onChange={e => setNewParserName(e.target.value)}
                    className="mb-3"
                    autoFocus
                  />

                  {/* Extraction type options */}
                  <div className={cn(
                    "flex flex-col gap-2 transition-opacity",
                    !newParserName.trim() && "opacity-40 pointer-events-none"
                  )}>
                    <button
                      onClick={selectFullExtraction}
                      className="flex items-center gap-3 p-3 border rounded-xl text-left hover:border-[#2782ff] hover:bg-[#2782ff]/[0.02] transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-[#2782ff]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Entire Document</p>
                        <p className="text-xs text-muted-foreground">AI extracts everything — no schema needed.</p>
                      </div>
                    </button>

                    <button
                      onClick={selectAIFields}
                      className="flex items-center gap-3 p-3 border rounded-xl text-left hover:border-[#2782ff] hover:bg-[#2782ff]/[0.02] transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">AI Auto-detect Fields</p>
                        <p className="text-xs text-muted-foreground">AI detects fields from your document.</p>
                      </div>
                    </button>

                    <button
                      onClick={openManualFields}
                      className="flex items-center gap-3 p-3 border rounded-xl text-left hover:border-[#2782ff] hover:bg-[#2782ff]/[0.02] transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <PenLine className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Add Fields Manually</p>
                        <p className="text-xs text-muted-foreground">Define exactly which fields to extract.</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!isReady || isExtracting}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
                isReady && !isExtracting
                  ? "bg-[#2782ff] text-white shadow-sm hover:bg-[#1d6fdf] cursor-pointer"
                  : "bg-muted text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              {isExtracting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelected(f) }}
          className="hidden"
        />
      </div>

      {/* Close dropdown on outside click */}
      {(showDropdown || showCreateMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowDropdown(false); setShowCreateMenu(false) }} />
      )}

      {/* ── Manual Fields Dialog ─────────────────────── */}
      <Dialog open={showFieldsDialog} onOpenChange={setShowFieldsDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Define Your Fields</DialogTitle>
          </DialogHeader>

          {/* Quick add examples */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick add</p>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {FIELD_EXAMPLES.map(ex => (
              <button
                key={ex.name}
                disabled={usedExamples.has(ex.name)}
                onClick={() => addExample(ex)}
                className={cn(
                  "flex flex-col px-3 py-2 border rounded-lg text-left transition-all text-xs",
                  usedExamples.has(ex.name)
                    ? "opacity-35 cursor-not-allowed"
                    : "hover:border-[#2782ff]/50 hover:bg-[#2782ff]/[0.02] cursor-pointer"
                )}
              >
                <span className="font-semibold text-foreground">{ex.name}</span>
                <span className="text-muted-foreground">{ex.desc}</span>
              </button>
            ))}
          </div>

          {/* Field cards */}
          <div className="space-y-3 mb-3">
            {manualFields.map(field => (
              <div key={field.id} className="border rounded-xl p-3.5 bg-card space-y-3 relative group">
                {manualFields.length > 1 && (
                  <button
                    onClick={() => removeField(field.id)}
                    className="absolute top-2.5 right-2.5 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <div className="flex items-start gap-2">
                  <fieldset className="flex-1 border rounded-lg px-3 pt-0.5 pb-1.5">
                    <legend className="text-xs font-semibold text-[#2782ff] px-1">Field Name</legend>
                    <input
                      placeholder="e.g. Invoice Number"
                      value={field.name}
                      onChange={e => updateField(field.id, { name: e.target.value })}
                      className="w-full text-sm font-medium bg-transparent outline-none placeholder:text-muted-foreground/40"
                    />
                  </fieldset>
                  <Select value={field.type} onValueChange={v => updateField(field.id, { type: v })}>
                    <SelectTrigger className="w-[110px] h-[38px] text-xs mt-px">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(ft => (
                        <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <fieldset className="border rounded-lg px-3 pt-0.5 pb-1.5">
                  <legend className="text-xs font-semibold text-[#2782ff] px-1">Description</legend>
                  <input
                    placeholder='e.g. "The company name that issued the invoice"'
                    value={field.description}
                    onChange={e => updateField(field.id, { description: e.target.value })}
                    className="w-full text-xs bg-transparent outline-none placeholder:text-muted-foreground/40"
                  />
                </fieldset>
              </div>
            ))}
          </div>

          {/* Add another field */}
          <button
            onClick={addField}
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 border-2 border-dashed border-[#2782ff]/40 rounded-xl text-sm font-semibold text-[#2782ff] hover:bg-[#2782ff]/5 hover:border-[#2782ff] transition-all"
          >
            <Plus className="h-4 w-4" /> Add another field
          </button>

          <div className="text-right mb-3">
            <span className="text-xs text-muted-foreground">{validFieldCount} field{validFieldCount !== 1 ? "s" : ""}</span>
          </div>

          <button
            onClick={confirmManualFields}
            disabled={validFieldCount === 0}
            className={cn(
              "w-full py-2.5 rounded-lg text-sm font-semibold transition-all",
              validFieldCount > 0
                ? "bg-[#2782ff] text-white hover:bg-[#1d6fdf] cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Save Fields & Continue →
          </button>
        </DialogContent>
      </Dialog>
    </>
  )
}
