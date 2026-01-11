"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SchemaField, DataType, VisualGroup } from "@/lib/schema"
import { TransformBuilder } from "@/components/TransformBuilder"

// Data type options
const simpleDataTypeOptions: Array<{ value: DataType; label: string }> = [
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
]

const complexDataTypeOptions: Array<{ value: DataType; label: string }> = [
  { value: "object", label: "Object" },
  { value: "list", label: "List" },
  { value: "table", label: "Table" },
]

export interface FieldEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  draftColumn: SchemaField | null
  onDraftColumnChange: (column: SchemaField | null) => void
  displayColumns: SchemaField[]
  visualGroups?: VisualGroup[]
  onSave: (column: SchemaField, mode: 'create' | 'edit') => void
  onCancel: () => void
  // Custom renderers (optional)
  renderStructuredConfig?: () => React.ReactNode
}

export function FieldEditorDialog({
  open,
  onOpenChange,
  mode,
  draftColumn,
  onDraftColumnChange,
  displayColumns,
  visualGroups,
  onSave,
  onCancel,
  renderStructuredConfig,
}: FieldEditorDialogProps) {
  const isDraftTransformation = !!draftColumn?.isTransformation

  const handleDraftFieldTypeChange = (isTransformation: boolean) => {
    if (!draftColumn) return
    
    if (isTransformation) {
      onDraftColumnChange({
        ...draftColumn,
        isTransformation: true,
        transformationType: draftColumn.transformationType || "calculation",
      })
    } else {
      const {
        transformationType,
        transformationConfig,
        transformationSource,
        transformationSourceColumnId,
        ...rest
      } = draftColumn as SchemaField & {
        transformationType?: unknown
        transformationConfig?: unknown
        transformationSource?: unknown
        transformationSourceColumnId?: unknown
      }
      onDraftColumnChange({
        ...rest,
        isTransformation: false,
      } as SchemaField)
    }
  }

  const changeDraftType = (newType: DataType) => {
    if (!draftColumn) return
    
    const next = { ...draftColumn, type: newType } as SchemaField
    
    // Normalize shape when changing type
    if (newType === 'object') {
      (next as Record<string, unknown>).children = 
        Array.isArray((next as Record<string, unknown>).children) 
          ? (next as Record<string, unknown>).children 
          : []
      delete (next as Record<string, unknown>).item
      delete (next as Record<string, unknown>).columns
    } else if (newType === 'list') {
      if (!(next as Record<string, unknown>).item) {
        (next as Record<string, unknown>).item = {
          id: `${next.id}_item`,
          name: 'item',
          type: 'string',
          description: '',
          extractionInstructions: '',
          required: false,
        }
      }
      delete (next as Record<string, unknown>).children
      delete (next as Record<string, unknown>).columns
    } else if (newType === 'table') {
      (next as Record<string, unknown>).columns = 
        Array.isArray((next as Record<string, unknown>).columns) 
          ? (next as Record<string, unknown>).columns 
          : []
      delete (next as Record<string, unknown>).children
      delete (next as Record<string, unknown>).item
    } else {
      // Leaf primitive
      delete (next as Record<string, unknown>).children
      delete (next as Record<string, unknown>).item
      delete (next as Record<string, unknown>).columns
    }
    
    onDraftColumnChange(next)
  }

  const handleSave = () => {
    if (!draftColumn) return
    onSave(draftColumn, mode)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-slate-200/70 px-6 py-5">
          <DialogTitle className="text-xl font-semibold">
            {mode === 'edit' ? 'Edit Field' : 'Add New Field'}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Configure how this data point is extracted and structured for your grid.
          </DialogDescription>
        </DialogHeader>

        {draftColumn && (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 min-h-0">
            {/* Field Source Selection */}
            <section className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Field Source
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'flex h-auto w-full min-w-[200px] flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left shadow-none transition-all',
                    !isDraftTransformation
                      ? 'border-[#2782ff]/70 bg-[#e6f0ff]/70 text-[#2782ff] hover:bg-[#d9e9ff]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  )}
                  aria-pressed={!isDraftTransformation}
                  onClick={() => handleDraftFieldTypeChange(false)}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4" />
                    Extraction
                  </span>
                  <span className="text-xs text-slate-500 whitespace-normal break-words leading-snug text-left">
                    Extract directly from the document
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'flex h-full w-full flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left shadow-none transition-all min-h-[88px]',
                    isDraftTransformation
                      ? 'border-[#2782ff]/70 bg-[#e6f0ff]/70 text-[#2782ff] hover:bg-[#d9e9ff]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  )}
                  aria-pressed={isDraftTransformation}
                  onClick={() => handleDraftFieldTypeChange(true)}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Zap className="h-4 w-4" />
                    Transformation
                  </span>
                  <span className="text-xs text-slate-500 whitespace-normal break-words leading-snug text-left">
                    Compute value from other fields
                  </span>
                </Button>
              </div>
            </section>

            {/* Field Configuration */}
            <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-5 shadow-sm">
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="column-name">Field Name</Label>
                  <Input
                    id="column-name"
                    value={draftColumn.name}
                    onChange={(e) =>
                      onDraftColumnChange({ ...draftColumn, name: e.target.value })
                    }
                    placeholder="e.g., Manufacturer"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="column-type">Data Type</Label>
                  <Select
                    value={draftColumn.type}
                    onValueChange={(value: DataType) => changeDraftType(value)}
                  >
                    <SelectTrigger id="column-type">
                      <SelectValue placeholder="Select a data type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Simple Types</SelectLabel>
                        {simpleDataTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Structured Types</SelectLabel>
                        {complexDataTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Render custom structured config if provided */}
                {renderStructuredConfig?.()}

                <div className="flex items-center gap-3 pt-1">
                  <Checkbox
                    id="column-required"
                    checked={!!draftColumn.required}
                    onCheckedChange={(checked) =>
                      onDraftColumnChange({ ...draftColumn, required: checked === true })
                    }
                  />
                  <Label
                    htmlFor="column-required"
                    className="text-sm font-medium text-slate-600"
                  >
                    Required field
                  </Label>
                </div>
              </div>
            </div>

            {/* Field Guidance */}
            <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-5 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-700">Field Guidance</h3>
                <p className="text-xs text-slate-500">
                  Describe this field and how to extract it. This text helps teammates and
                  the AI.
                </p>
              </div>
              {isDraftTransformation ? (
                <TransformBuilder
                  allColumns={displayColumns}
                  selected={draftColumn}
                  onUpdate={(updates) =>
                    onDraftColumnChange({ ...draftColumn, ...updates })
                  }
                  visualGroups={visualGroups}
                />
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="field-guidance">Field Guidance</Label>
                  <Textarea
                    id="field-guidance"
                    value={draftColumn.extractionInstructions || draftColumn.description || ''}
                    onChange={(e) =>
                      onDraftColumnChange({
                        ...draftColumn,
                        description: e.target.value,
                        extractionInstructions: e.target.value,
                      })
                    }
                    placeholder="Explain what this field is and how to extract it from the document."
                    rows={5}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200/70 bg-white/95 px-6 py-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              {mode === 'edit' ? 'Save Changes' : 'Add Field'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
