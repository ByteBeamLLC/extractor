"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Sparkles,
  PenLine,
  Upload,
  FileText,
  X,
  Plus,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { generateInboundEmail } from "@/lib/extractor/inbound-email"
import {
  ACCEPTED_EXTENSIONS,
  validateUploadFile,
} from "@/components/extractor/test/DocumentUploader"
import { cn } from "@/lib/utils"
import type { SchemaField, LeafField } from "@/lib/schema"

type View = "main" | "fields"

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
  { name: "Invoice Number", desc: "Unique ID on the document (e.g. INV-2024-001)" },
  { name: "Vendor Name", desc: "Company or person who issued the document" },
  { name: "Total Amount", desc: "Final total including tax and fees" },
  { name: "Date", desc: "The date the document was issued" },
  { name: "Email Address", desc: "Contact email found on the document" },
  { name: "Line Items", desc: "Table of individual items with quantities and prices" },
  { name: "Account Number", desc: "Bank or client account number" },
  { name: "Due Date", desc: "Payment or action deadline" },
]

interface CreateParserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateParserDialog({ open, onOpenChange, onCreated }: CreateParserDialogProps) {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()

  const [view, setView] = useState<View>("main")
  const [name, setName] = useState("")
  const [sampleFile, setSampleFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [creatingStatus, setCreatingStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual fields
  const [manualFields, setManualFields] = useState<ManualField[]>([
    { id: crypto.randomUUID(), name: "", type: "string", description: "" },
  ])

  // Close confirmation
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const hasName = name.trim().length > 0
  const hasFile = !!sampleFile
  const isReady = hasName && hasFile
  const hasUnsavedWork = hasName || hasFile || manualFields.some(f => f.name.trim())

  const resetForm = () => {
    setView("main")
    setName("")
    setSampleFile(null)
    setFileError(null)
    setError(null)
    setCreatingStatus("")
    setManualFields([
      { id: crypto.randomUUID(), name: "", type: "string", description: "" },
    ])
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (isCreating) return
    if (!newOpen && hasUnsavedWork) {
      setShowCloseConfirm(true)
      return
    }
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  const confirmClose = () => {
    setShowCloseConfirm(false)
    resetForm()
    onOpenChange(false)
  }

  const handleFileSelected = useCallback((file: File) => {
    const validationError = validateUploadFile(file)
    if (validationError) {
      setFileError(validationError)
      return
    }
    setFileError(null)
    setSampleFile(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (!hasName) return
      const file = e.dataTransfer.files?.[0]
      if (file) handleFileSelected(file)
    },
    [handleFileSelected, hasName]
  )

  // Field management
  const addField = () => {
    setManualFields(prev => [...prev, { id: crypto.randomUUID(), name: "", type: "string", description: "" }])
  }

  const removeField = (id: string) => {
    setManualFields(prev => prev.filter(f => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<ManualField>) => {
    setManualFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  // Upload helper
  const uploadFile = async (parserId: string, file: File) => {
    const INLINE_THRESHOLD = 3 * 1024 * 1024

    if (file.size <= INLINE_THRESHOLD) {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((d, byte) => d + String.fromCharCode(byte), "")
      )
      return { file: { name: file.name, type: file.type, data: base64, size: file.size } }
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `${session!.user.id}/${parserId}/pending/${crypto.randomUUID()}/${safeName}`

    const { error: storageError } = await supabase.storage
      .from("parser-documents")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      })
    if (storageError) throw new Error(`Upload failed: ${storageError.message}`)

    return { storage_path: storagePath, file_name: file.name, file_type: file.type, file_size: file.size }
  }

  const handleCreate = async (mode: "ai" | "manual" | "full") => {
    if (!session?.user?.id || !hasName || !hasFile) return

    const validFields = manualFields.filter(f => f.name.trim())
    if (mode === "manual" && validFields.length === 0) return

    setIsCreating(true)
    setError(null)

    try {
      const fields: SchemaField[] = mode === "manual"
        ? validFields.map(f => ({
            id: f.id,
            name: f.name.trim(),
            type: f.type,
            description: f.description.trim() || undefined,
            required: false,
          } as LeafField))
        : []

      setCreatingStatus("Creating parser...")
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
      const parserId = (data as any)?.id

      // For AI mode, detect fields from the sample file before extracting
      if (mode === "ai") {
        setCreatingStatus("AI is analyzing your document...")
        const buffer = await sampleFile!.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(buffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        )

        const detectRes = await fetch(`/api/parsers/${parserId}/detect-fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: { name: sampleFile!.name, type: sampleFile!.type, data: base64 },
          }),
        })

        if (!detectRes.ok) {
          const body = await detectRes.json().catch(() => ({}))
          throw new Error(body.error ?? "Failed to detect fields")
        }

        const { fields: detectedFields } = await detectRes.json()

        // Save detected fields to the parser
        const { error: updateError } = await supabase
          .from("parsers" as any)
          .update({ fields: detectedFields } as any)
          .eq("id", parserId)

        if (updateError) throw updateError
      }

      setCreatingStatus(
        mode === "ai"
          ? "Extracting data with detected fields..."
          : "Uploading and extracting..."
      )
      const extractBody = await uploadFile(parserId, sampleFile!)

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
      onCreated()
      router.push(`/parsers/${parserId}/documents/${extractData.document_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create parser")
      setCreatingStatus("")
    } finally {
      setIsCreating(false)
    }
  }

  const validFieldCount = manualFields.filter(f => f.name.trim()).length

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a New Parser</DialogTitle>
          </DialogHeader>

          <div className="space-y-0 py-1">
            {/* Step 1: Name */}
            <div className="flex gap-3.5 mb-5">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors",
                hasName ? "bg-emerald-500 text-white" : "bg-[#2782ff] text-white"
              )}>
                {hasName ? "✓" : "1"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-2">Name your parser</p>
                <Input
                  placeholder="e.g. Invoice Parser, Resume Scanner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isCreating}
                  autoFocus
                />
              </div>
            </div>

            <div className="w-0.5 h-3 bg-border ml-[13px] -my-1" />

            {/* Step 2: Upload */}
            <div className="flex gap-3.5 mb-5">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors",
                hasFile ? "bg-emerald-500 text-white" : hasName ? "bg-[#2782ff] text-white" : "bg-gray-200 text-gray-400"
              )}>
                {hasFile ? "✓" : "2"}
              </div>
              <div className="flex-1">
                <p className={cn("text-sm font-semibold mb-2 transition-colors", !hasName && "text-gray-300")}>
                  Upload your document
                </p>

                {sampleFile ? (
                  <div className="flex items-center gap-2.5 p-3 border-2 border-[#2782ff] bg-[#2782ff]/[0.03] rounded-lg">
                    <FileText className="h-4 w-4 text-[#2782ff] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sampleFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(sampleFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    {!isCreating && (
                      <button onClick={() => setSampleFile(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); if (hasName) setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => hasName && !isCreating && fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-5 text-center transition-all",
                      !hasName
                        ? "opacity-40 cursor-not-allowed border-gray-200"
                        : isDragging
                          ? "border-[#2782ff] bg-[#2782ff]/5 cursor-pointer"
                          : "border-gray-300 hover:border-[#2782ff]/50 cursor-pointer"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_EXTENSIONS}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f) }}
                      className="hidden"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-sm text-muted-foreground">
                      Drop your document here or <span className="text-[#2782ff] font-medium">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">PDF, image, Word, or Excel</p>
                  </div>
                )}
                {fileError && <p className="text-xs text-destructive mt-2">{fileError}</p>}
              </div>
            </div>

            <div className="w-0.5 h-3 bg-border ml-[13px] -my-1" />

            {/* Step 3: Choose action or field builder */}
            <div className="flex gap-3.5">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors",
                isReady ? "bg-[#2782ff] text-white" : "bg-gray-200 text-gray-400"
              )}>
                3
              </div>
              <div className="flex-1">
                {/* Main action view */}
                {view === "main" && (
                  <>
                    <p className={cn("text-sm font-semibold mb-2 transition-colors", !isReady && "text-gray-300")}>
                      Choose how to start
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        disabled={!isReady || isCreating}
                        onClick={() => handleCreate("ai")}
                        className={cn(
                          "flex items-center gap-3 p-3.5 border-2 rounded-xl text-left transition-all w-full",
                          isReady ? "border-border hover:border-[#2782ff] hover:bg-[#2782ff]/[0.02]" : "border-gray-100 opacity-20 pointer-events-none"
                        )}
                      >
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Let AI find the fields for me</p>
                          <p className="text-xs text-muted-foreground">AI detects fields and extracts your data</p>
                        </div>
                        <span className="text-muted-foreground/40 text-lg">→</span>
                      </button>

                      <button
                        disabled={!isReady || isCreating}
                        onClick={() => setView("fields")}
                        className={cn(
                          "flex items-center gap-3 p-3.5 border-2 rounded-xl text-left transition-all w-full",
                          isReady ? "border-border hover:border-[#2782ff] hover:bg-[#2782ff]/[0.02]" : "border-gray-100 opacity-20 pointer-events-none"
                        )}
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <PenLine className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">I'll add my own fields</p>
                          <p className="text-xs text-muted-foreground">Define fields, then extract</p>
                        </div>
                        <span className="text-muted-foreground/40 text-lg">→</span>
                      </button>

                      <button
                        disabled={!isReady || isCreating}
                        onClick={() => handleCreate("full")}
                        className={cn(
                          "flex items-center gap-3 p-3.5 border-2 rounded-xl text-left transition-all w-full",
                          isReady ? "border-border hover:border-[#2782ff] hover:bg-[#2782ff]/[0.02]" : "border-gray-100 opacity-20 pointer-events-none"
                        )}
                      >
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Just extract everything</p>
                          <p className="text-xs text-muted-foreground">AI captures all data automatically</p>
                        </div>
                        <span className="text-muted-foreground/40 text-lg">→</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Field builder view (slide-in replacement) */}
                {view === "fields" && (
                  <>
                    <p className="text-sm font-semibold mb-1">Define your fields</p>
                    <button
                      onClick={() => setView("main")}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
                    >
                      ← Back to options
                    </button>

                    <div className="space-y-4 mb-3">
                      {manualFields.map((field) => (
                        <div key={field.id} className="border rounded-xl p-3.5 bg-card space-y-3 relative group">
                          {manualFields.length > 1 && (
                            <button
                              onClick={() => removeField(field.id)}
                              className="absolute top-2.5 right-2.5 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}

                          {/* Name — outlined label input */}
                          <div className="flex items-start gap-2">
                            <fieldset className="flex-1 border rounded-lg px-3 pt-0.5 pb-1.5">
                              <legend className="text-xs font-semibold text-[#2782ff] px-1">Field Name</legend>
                              <input
                                placeholder="e.g. Invoice Number"
                                value={field.name}
                                onChange={(e) => updateField(field.id, { name: e.target.value })}
                                className="w-full text-sm font-medium bg-transparent outline-none placeholder:text-muted-foreground/40"
                              />
                            </fieldset>
                            <Select value={field.type} onValueChange={(v) => updateField(field.id, { type: v })}>
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

                          {/* Description — outlined label input */}
                          <fieldset className="border rounded-lg px-3 pt-0.5 pb-1.5">
                            <legend className="text-xs font-semibold text-[#2782ff] px-1">Field Description</legend>
                            <input
                              placeholder='e.g. "The company name that issued the invoice"'
                              value={field.description}
                              onChange={(e) => updateField(field.id, { description: e.target.value })}
                              className="w-full text-xs bg-transparent outline-none placeholder:text-muted-foreground/40"
                            />
                          </fieldset>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addField}
                      className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 border-2 border-dashed border-[#2782ff]/40 rounded-xl text-sm font-semibold text-[#2782ff] hover:bg-[#2782ff]/5 hover:border-[#2782ff] transition-all"
                    >
                      <Plus className="h-4 w-4" /> Add another field
                    </button>
                    <div className="text-right mb-3">
                      <span className="text-xs text-muted-foreground">{validFieldCount} field{validFieldCount !== 1 ? "s" : ""}</span>
                    </div>

                    <Button
                      onClick={() => handleCreate("manual")}
                      disabled={validFieldCount === 0 || isCreating}
                      className="w-full bg-[#2782ff] hover:bg-[#2782ff]/90 text-white"
                    >
                      {isCreating ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                      ) : (
                        "Create Parser & Extract →"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Status / errors */}
            {error && <p className="text-sm text-destructive mt-4">{error}</p>}
            {isCreating && creatingStatus && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                {creatingStatus}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Close confirmation */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved work in the parser creation form. Are you sure you want to close it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
