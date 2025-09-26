"use client"

import { useEffect, useMemo, useState } from "react"
import type { ChangeEvent } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TransformBuilder } from "@/components/transform-builder"
import { cn } from "@/lib/utils"
import type { DataPrimitive, DataType, LeafField, ListField, ObjectField, SchemaField, TableField } from "@/lib/schema/types"
import type { FlatLeaf } from "@/lib/schema/types"
import { FileText, Zap } from "lucide-react"

import { ListEditor } from "./ListEditor"
import { ObjectEditor } from "./ObjectEditor"
import { TableEditor } from "./TableEditor"

interface ColumnDialogProps {
  open: boolean
  mode: "create" | "edit"
  column: SchemaField | null
  displayColumns: FlatLeaf[]
  onClose: () => void
  onSave: (column: SchemaField) => void
}

const SIMPLE_DATA_TYPE_OPTIONS: Array<{ value: DataType; label: string }> = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "decimal", label: "Decimal" },
  { value: "boolean", label: "Yes / No" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "Link" },
  { value: "address", label: "Address" },
  { value: "richtext", label: "Rich Text" },
]

const COMPLEX_DATA_TYPE_OPTIONS: Array<{ value: DataType; label: string }> = [
  { value: "object", label: "Object (Group of fields)" },
  { value: "table", label: "Table (Rows and columns)" },
  { value: "list", label: "List (Array of items)" },
]

const createLeafField = (name = "field", type: DataPrimitive = "string"): LeafField => ({
  id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name,
  type,
  description: "",
  extractionInstructions: "",
  required: false,
})

const cloneField = <T extends SchemaField>(field: T): T => JSON.parse(JSON.stringify(field)) as T

const normaliseDraftForType = (prev: SchemaField, nextType: DataType): SchemaField => {
  if (nextType === "object") {
    const existing = (prev as any).children as SchemaField[] | undefined
    const children = existing?.length ? existing.map((child) => cloneField(child)) : [createLeafField("name"), createLeafField("value")]
    return {
      ...prev,
      type: "object",
      children,
    } as ObjectField
  }
  if (nextType === "table") {
    const existing = (prev as any).columns as SchemaField[] | undefined
    const columns = existing?.length ? existing.map((col) => cloneField(col)) : [createLeafField("Column 1"), createLeafField("Column 2")]
    return {
      ...prev,
      type: "table",
      columns,
    } as TableField
  }
  if (nextType === "list") {
    const existing = (prev as any).item as SchemaField | undefined
    const item = existing ? cloneField(existing) : createLeafField("item")
    return {
      ...prev,
      type: "list",
      item,
    } as ListField
  }
  const leaf: LeafField = {
    ...(prev as any),
    type: nextType as DataPrimitive,
  }
  delete (leaf as any).children
  delete (leaf as any).columns
  delete (leaf as any).item
  return leaf
}

export function ColumnDialog({ open, mode, column, displayColumns, onClose, onSave }: ColumnDialogProps) {
  const [draft, setDraft] = useState<SchemaField | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(column ? cloneField(column) : null)
    } else {
      setDraft(null)
    }
  }, [open, column])

  const isTransformation = !!draft?.isTransformation

  const handleSourceToggle = (transform: boolean) => {
    setDraft((prev) => {
      if (!prev) return prev
      if (transform) {
        return {
          ...prev,
          isTransformation: true,
          transformationType: prev.transformationType || "gemini_api",
          transformationSource: prev.transformationSource || "document",
        }
      }
      const {
        transformationType,
        transformationConfig,
        transformationSource,
        transformationSourceColumnId,
        ...rest
      } = prev
      return {
        ...rest,
        isTransformation: false,
      } as SchemaField
    })
  }

  const handleTypeChange = (value: DataType) => {
    setDraft((prev) => {
      if (!prev) return prev
      return normaliseDraftForType(prev, value)
    })
  }

  const handleRequiredChange = (checked: boolean | "indeterminate") => {
    setDraft((prev) => (prev ? { ...prev, required: checked === true } : prev))
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setDraft((prev) => (prev ? { ...prev, name: value } : prev))
  }

  const handleGuidanceChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setDraft((prev) => (prev ? { ...prev, description: value, extractionInstructions: value } : prev))
  }

  const handleUpdateTransformation = (updates: Partial<SchemaField>) => {
    setDraft((prev) => (prev ? ({ ...prev, ...updates } as SchemaField) : prev))
  }

  const handleAddObjectField = () => {
    setDraft((prev) => {
      if (!prev || prev.type !== "object") return prev
      const objectDraft = prev as ObjectField
      const children = [...(objectDraft.children || []).map((child) => cloneField(child)), createLeafField(`Field ${objectDraft.children.length + 1}`)]
      return { ...objectDraft, children }
    })
  }

  const handleToggleSummary = (fieldId: string) => {
    setDraft((prev) => {
      if (!prev || prev.type !== "object") return prev
      const objectDraft = prev as ObjectField
      const children = (objectDraft.children || []).map((child) =>
        child.id === fieldId ? { ...child, displayInSummary: !child.displayInSummary } : child,
      )
      return { ...objectDraft, children }
    })
  }

  const handleUpdateObjectField = (fieldId: string, updates: Partial<LeafField>) => {
    setDraft((prev) => {
      if (!prev || prev.type !== "object") return prev
      const objectDraft = prev as ObjectField
      const children = (objectDraft.children || []).map((child) => (child.id === fieldId ? { ...child, ...updates } : child))
      return { ...objectDraft, children }
    })
  }

  const handleRemoveObjectField = (fieldId: string) => {
    setDraft((prev) => {
      if (!prev || prev.type !== "object") return prev
      const objectDraft = prev as ObjectField
      const children = (objectDraft.children || []).filter((child) => child.id !== fieldId)
      return { ...objectDraft, children }
    })
  }

  const handleAddTableColumn = () => {
    setDraft((prev) => {
      if (!prev || prev.type !== "table") return prev
      const tableDraft = prev as TableField
      const columns = [...(tableDraft.columns || []).map((col) => cloneField(col)), createLeafField(`Column ${tableDraft.columns.length + 1}`)]
      return { ...tableDraft, columns }
    })
  }

  const handleUpdateTableColumn = (columnId: string, updates: Partial<LeafField>) => {
    setDraft((prev) => {
      if (!prev || prev.type !== "table") return prev
      const tableDraft = prev as TableField
      const columns = (tableDraft.columns || []).map((col) => (col.id === columnId ? { ...col, ...updates } : col))
      return { ...tableDraft, columns }
    })
  }

  const handleRemoveTableColumn = (columnId: string) => {
    setDraft((prev) => {
      if (!prev || prev.type !== "table") return prev
      const tableDraft = prev as TableField
      const columns = (tableDraft.columns || []).filter((col) => col.id !== columnId)
      return { ...tableDraft, columns }
    })
  }

  const handleUpdateListType = (type: DataPrimitive) => {
    setDraft((prev) => {
      if (!prev || prev.type !== "list") return prev
      const listDraft = prev as ListField
      return {
        ...listDraft,
        item: {
          ...(listDraft.item ? cloneField(listDraft.item) : createLeafField("item")),
          type,
        },
      }
    })
  }

  const handleSave = () => {
    if (!draft) return
    const next = cloneField(draft)
    onSave(next)
    onClose()
  }

  const structuredConfig = useMemo(() => {
    if (!draft) return null
    if (draft.type === "object") {
      const objectDraft = draft as ObjectField
      return (
        <ObjectEditor
          fields={objectDraft.children || []}
          onAddField={handleAddObjectField}
          onUpdateField={handleUpdateObjectField}
          onToggleSummary={handleToggleSummary}
          onRemoveField={handleRemoveObjectField}
        />
      )
    }
    if (draft.type === "table") {
      const tableDraft = draft as TableField
      return (
        <TableEditor
          columns={tableDraft.columns || []}
          onAddColumn={handleAddTableColumn}
          onUpdateColumn={handleUpdateTableColumn}
          onRemoveColumn={handleRemoveTableColumn}
        />
      )
    }
    if (draft.type === "list") {
      const listDraft = draft as ListField
      return <ListEditor itemType={(listDraft.item?.type as DataPrimitive) || "string"} onTypeChange={handleUpdateListType} />
    }
    return null
  }, [draft])

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-slate-200/70 px-6 py-5">
          <DialogTitle className="text-xl font-semibold">
            {mode === "edit" ? "Edit Field" : "Add New Field"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Configure how this data point is extracted and structured for your grid.
          </DialogDescription>
        </DialogHeader>

        {draft && (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 min-h-0">
            <section className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Field Source</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "flex h-auto flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left shadow-none transition-all",
                    !isTransformation
                      ? "border-[#2782ff]/70 bg-[#e6f0ff]/70 text-[#2782ff] hover:bg-[#d9e9ff]"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                  )}
                  aria-pressed={!isTransformation}
                  onClick={() => handleSourceToggle(false)}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4" />
                    Extraction
                  </span>
                  <span className="text-xs text-slate-500">Extract directly from the document</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "flex h-auto flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left shadow-none transition-all",
                    isTransformation
                      ? "border-[#2782ff]/70 bg-[#e6f0ff]/70 text-[#2782ff] hover:bg-[#d9e9ff]"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                  )}
                  aria-pressed={isTransformation}
                  onClick={() => handleSourceToggle(true)}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Zap className="h-4 w-4" />
                    Transformation
                  </span>
                  <span className="text-xs text-slate-500">Compute value from other fields</span>
                </Button>
              </div>
            </section>

            <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-5 shadow-sm">
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="column-name">Field Name</Label>
                  <Input id="column-name" value={draft.name} onChange={handleNameChange} placeholder="e.g., Manufacturer" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="column-type">Data Type</Label>
                  <Select value={draft.type} onValueChange={(value: DataType) => handleTypeChange(value)}>
                    <SelectTrigger id="column-type">
                      <SelectValue placeholder="Select a data type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Simple Types</SelectLabel>
                        {SIMPLE_DATA_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Structured Types</SelectLabel>
                        {COMPLEX_DATA_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {structuredConfig}

                <div className="flex items-center gap-3 pt-1">
                  <Checkbox id="column-required" checked={!!draft.required} onCheckedChange={handleRequiredChange} />
                  <Label htmlFor="column-required" className="text-sm font-medium text-slate-600">
                    Required field
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-5 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-700">Field Guidance</h3>
                <p className="text-xs text-slate-500">Describe this field and how to extract it. This text helps teammates and the AI.</p>
              </div>
              {isTransformation ? (
                <TransformBuilder
                  allColumns={displayColumns}
                  selected={draft}
                  onUpdate={(updates) => handleUpdateTransformation(updates as Partial<SchemaField>)}
                />
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="field-guidance">Field Guidance</Label>
                  <Textarea
                    id="field-guidance"
                    value={draft.extractionInstructions || draft.description || ""}
                    onChange={handleGuidanceChange}
                    placeholder="Explain what this field is and how to extract it from the document."
                    rows={5}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-slate-200/70 bg-white/95 px-6 py-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!draft}>
              Save Field
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
