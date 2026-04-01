"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  FileText,
  Receipt,
  Landmark,
  Truck,
  ScrollText,
  Package,
  Plus,
  ListChecks,
  ScanText,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { generateInboundEmail } from "@/lib/extractor/inbound-email"
import { parserTemplates, type ParserTemplate } from "@/lib/parser-templates"
import { cn } from "@/lib/utils"
import type { ExtractionType } from "@/lib/extractor/types"

const templateIcons: Record<string, React.ElementType> = {
  "invoice-parsing": Receipt,
  "bank-statement-extraction": Landmark,
  "freight-invoice": Truck,
  "bill-of-lading": ScrollText,
  "commercial-invoice": Package,
}

interface CreateParserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateParserDialog({ open, onOpenChange, onCreated }: CreateParserDialogProps) {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()

  const [extractionType, setExtractionType] = useState<ExtractionType>("fields")
  const [selectedTemplate, setSelectedTemplate] = useState<ParserTemplate | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setExtractionType("fields")
    setSelectedTemplate(null)
    setName("")
    setDescription("")
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  const handleSelectTemplate = (template: ParserTemplate | null) => {
    setSelectedTemplate(template)
    if (template) {
      setName(template.name)
      setDescription(template.description)
    } else {
      setName("")
      setDescription("")
    }
  }

  const handleCreate = async () => {
    if (!session?.user?.id || !name.trim()) return

    setIsCreating(true)
    setError(null)

    try {
      // Generate a unique webhook token
      const webhookToken = crypto.randomUUID().replace(/-/g, "")

      const fields = extractionType === "fields" && selectedTemplate
        ? selectedTemplate.buildFields()
        : []

      const { data, error: insertError } = await supabase
        .from("parsers" as any)
        .insert({
          user_id: session.user.id,
          name: name.trim(),
          description: description.trim() || null,
          fields,
          extraction_type: extractionType,
          extraction_mode: "ai",
          inbound_email: generateInboundEmail(name),
          inbound_webhook_token: webhookToken,
        } as any)
        .select("id")
        .single()

      if (insertError) throw insertError

      const parserId = (data as any)?.id
      onCreated()
      if (extractionType === "full_content") {
        router.push(`/parsers/${parserId}/documents`)
      } else if (selectedTemplate) {
        router.push(`/parsers/${parserId}?onboarding=true`)
      } else {
        router.push(`/parsers/${parserId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create parser")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Parser</DialogTitle>
          <DialogDescription>
            Choose how you want to extract data from your documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto max-h-[60vh]">
          {/* Extraction type selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setExtractionType("fields")
                setSelectedTemplate(null)
                setName("")
                setDescription("")
              }}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50",
                extractionType === "fields"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border"
              )}
            >
              <ListChecks className="h-5 w-5 text-primary" />
              <div>
                <span className="text-sm font-semibold">Extract Fields</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Define specific fields to extract. Best when you know exactly what data you need.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setExtractionType("full_content")
                setSelectedTemplate(null)
                setName("")
                setDescription("")
              }}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50",
                extractionType === "full_content"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border"
              )}
            >
              <ScanText className="h-5 w-5 text-primary" />
              <div>
                <span className="text-sm font-semibold">Extract Everything</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Extract all data from the document. AI determines the structure automatically.
                </p>
              </div>
            </button>
          </div>

          {/* Template grid — only for "fields" mode */}
          {extractionType === "fields" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Blank parser option */}
              <button
                type="button"
                onClick={() => handleSelectTemplate(null)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-sm transition-colors hover:bg-muted/50",
                  selectedTemplate === null
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border"
                )}
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Blank Parser</span>
                <span className="text-xs text-muted-foreground leading-tight">
                  Start from scratch
                </span>
              </button>

              {parserTemplates.map((template) => {
                const Icon = templateIcons[template.id] || FileText
                const isSelected = selectedTemplate?.id === template.id
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-sm transition-colors hover:bg-muted/50",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border"
                    )}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{template.name}</span>
                    <span className="text-xs text-muted-foreground leading-tight line-clamp-2">
                      {template.description}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="parser-name">Name</Label>
            <Input
              id="parser-name"
              placeholder={
                extractionType === "full_content"
                  ? "e.g. Contract Scanner, Receipt Digitizer"
                  : "e.g. Invoice Parser, Lead Extractor"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parser-desc">Description (optional)</Label>
            <Textarea
              id="parser-desc"
              placeholder="What kind of documents will this parser handle?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Parser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
