"use client"

import { useState, useRef } from "react"
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  List,
  Table2,
  Braces,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Mail,
  Link2,
  Phone,
  MapPin,
  FileText,
  ListChecks,
  CheckSquare,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Parser } from "@/lib/extractor/types"
import type {
  SchemaField,
  LeafField,
  ObjectField,
  TableField,
} from "@/lib/schema"
import { FieldEditor } from "./FieldEditor"
import { useActiveParser } from "@/components/extractor/parser-context"
import { TourStep } from "@/components/tour/TourStep"

interface ParserSchemaBuilderProps {
  parser: Parser
  onUpdate: (updates: Partial<Parser>) => Promise<void>
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  string: Type,
  number: Hash,
  decimal: Hash,
  boolean: ToggleLeft,
  date: Calendar,
  email: Mail,
  url: Link2,
  phone: Phone,
  address: MapPin,
  richtext: FileText,
  single_select: ListChecks,
  multi_select: CheckSquare,
  object: Braces,
  list: List,
  table: Table2,
}

export function ParserSchemaBuilder({ parser, onUpdate }: ParserSchemaBuilderProps) {
  const isFullContent = parser.extraction_type === "full_content"
  const { fieldDetection, detectFields, clearFieldDetection } = useActiveParser()
  const [fields, setFields] = useState<SchemaField[]>(parser.fields ?? [])
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [isAddingField, setIsAddingField] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())
  const [promptOverride, setPromptOverride] = useState(parser.extraction_prompt_override ?? "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDetecting = fieldDetection.status === "detecting"
  const suggestedFields = fieldDetection.suggestedFields
  const detectError = fieldDetection.status === "error" ? fieldDetection.error : null

  const markChanged = () => setHasChanges(true)

  const handleAcceptSuggestions = (mode: "replace" | "merge") => {
    if (!suggestedFields) return
    if (mode === "replace") {
      setFields(suggestedFields)
    } else {
      const existingIds = new Set(fields.map((f) => f.id))
      const newFields = suggestedFields.filter((f) => !existingIds.has(f.id))
      setFields((prev) => [...prev, ...newFields])
    }
    clearFieldDetection()
    markChanged()
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate({
        fields,
        extraction_prompt_override: promptOverride.trim() || null,
      })
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddField = (field: SchemaField) => {
    setFields((prev) => [...prev, field])
    setIsAddingField(false)
    markChanged()
  }

  const handleUpdateField = (updatedField: SchemaField) => {
    setFields((prev) =>
      prev.map((f) => (f.id === updatedField.id ? updatedField : f))
    )
    setEditingFieldId(null)
    markChanged()
  }

  const handleRemoveField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId))
    markChanged()
  }

  const toggleExpand = (fieldId: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev)
      if (next.has(fieldId)) next.delete(fieldId)
      else next.add(fieldId)
      return next
    })
  }

  const renderFieldChildren = (children: SchemaField[], depth: number) => {
    return children.map((child) => renderField(child, depth))
  }

  const renderField = (field: SchemaField, depth: number = 0) => {
    if (field.type === "input") return null

    const Icon = TYPE_ICONS[field.type] ?? Type
    const isEditing = editingFieldId === field.id
    const isExpanded = expandedFields.has(field.id)
    const hasChildren =
      (field.type === "object" && (field as ObjectField).children?.length > 0) ||
      (field.type === "table" && (field as TableField).columns?.length > 0)

    if (isEditing) {
      return (
        <FieldEditor
          key={field.id}
          field={field}
          onSave={handleUpdateField}
          onCancel={() => setEditingFieldId(null)}
        />
      )
    }

    return (
      <div key={field.id}>
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors group",
            depth > 0 && "ml-6"
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />

          {hasChildren && (
            <button onClick={() => toggleExpand(field.id)} className="shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}

          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />

          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium">{field.name}</span>
            {field.description && (
              <span className="text-xs text-muted-foreground ml-2">
                {field.description}
              </span>
            )}
          </div>

          <Badge variant="outline" className="text-xs shrink-0">
            {field.type}
          </Badge>

          {(field as LeafField).required && (
            <Badge variant="secondary" className="text-xs shrink-0">
              required
            </Badge>
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditingFieldId(field.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => handleRemoveField(field.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Render children for compound types */}
        {isExpanded && field.type === "object" && (
          <div className="mt-1 space-y-1">
            {renderFieldChildren((field as ObjectField).children, depth + 1)}
          </div>
        )}
        {isExpanded && field.type === "table" && (
          <div className="mt-1 space-y-1">
            {renderFieldChildren((field as TableField).columns, depth + 1)}
          </div>
        )}
      </div>
    )
  }

  // Full-content mode: simplified view with just the prompt override
  if (isFullContent) {
    return (
      <div className="space-y-6">
        <div className="border rounded-xl p-6 bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Full Content Extraction</h3>
              <p className="text-sm text-muted-foreground">
                This parser extracts all data from your documents automatically. The AI determines the structure based on the document content.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Custom Extraction Instructions (optional)
          </label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[100px] resize-y"
            placeholder="Guide the AI on what to focus on or how to structure the output. E.g., 'Focus on financial data and line items' or 'Organize by sections: header, body, footer'..."
            value={promptOverride}
            onChange={(e) => {
              setPromptOverride(e.target.value)
              markChanged()
            }}
          />
          <p className="text-xs text-muted-foreground">
            Use this to guide the AI on what to prioritize or how to organize the extracted data.
          </p>
        </div>

        {hasChanges && (
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Changes
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <TourStep stepId="schema" side="bottom" align="start">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsAddingField(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDetecting}
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            {isDetecting ? "Detecting..." : "Auto-Detect Fields"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff,.docx,.xlsx,.csv,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) detectFields(file)
              e.target.value = ""
            }}
          />
          {hasChanges && (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </TourStep>

      {/* Auto-detect error */}
      {detectError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {detectError}
          <button onClick={clearFieldDetection} className="ml-auto text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Suggested fields from auto-detect */}
      {suggestedFields && (
        <div className="border border-primary/30 rounded-xl p-4 bg-primary/[0.03] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                AI detected {suggestedFields.length} field{suggestedFields.length !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={clearFieldDetection}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
          <div className="space-y-1">
            {suggestedFields.map((sf) => (
              <div key={sf.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border text-sm">
                <span className="font-medium">{sf.name}</span>
                <Badge variant="outline" className="text-[10px]">{sf.type}</Badge>
                {sf.description && (
                  <span className="text-xs text-muted-foreground truncate">{sf.description}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {fields.length > 0 ? (
              <>
                <Button size="sm" onClick={() => handleAcceptSuggestions("merge")}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add New Fields
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAcceptSuggestions("replace")}>
                  Replace All Fields
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => handleAcceptSuggestions("replace")}>
                Use These Fields
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Custom extraction instructions */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Custom Extraction Instructions (optional)
        </label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px] resize-y"
          placeholder="Add custom instructions for the AI extraction engine. E.g., 'Always normalize dates to YYYY-MM-DD format' or 'Extract amounts in USD'..."
          value={promptOverride}
          onChange={(e) => {
            setPromptOverride(e.target.value)
            markChanged()
          }}
        />
      </div>

      {/* Field list */}
      <div className="space-y-1.5">
        {fields.length === 0 && !isAddingField ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No fields defined yet. Add fields to tell the AI what data to extract.
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsAddingField(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          </div>
        ) : (
          fields.map((field) => renderField(field))
        )}

        {/* Add field form */}
        {isAddingField && (
          <FieldEditor
            onSave={handleAddField}
            onCancel={() => setIsAddingField(false)}
          />
        )}
      </div>
    </div>
  )
}
