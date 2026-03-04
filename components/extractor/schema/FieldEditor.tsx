"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { SchemaField, DataType } from "@/lib/schema"

interface FieldEditorProps {
  field?: SchemaField
  onSave: (field: SchemaField) => void
  onCancel: () => void
}

const FIELD_TYPES: { value: DataType; label: string; group: string }[] = [
  { value: "string", label: "Text", group: "Primitive" },
  { value: "number", label: "Number", group: "Primitive" },
  { value: "decimal", label: "Decimal", group: "Primitive" },
  { value: "boolean", label: "Boolean", group: "Primitive" },
  { value: "date", label: "Date", group: "Primitive" },
  { value: "email", label: "Email", group: "Primitive" },
  { value: "url", label: "URL", group: "Primitive" },
  { value: "phone", label: "Phone", group: "Primitive" },
  { value: "address", label: "Address", group: "Primitive" },
  { value: "richtext", label: "Rich Text", group: "Primitive" },
  { value: "single_select", label: "Single Select", group: "Select" },
  { value: "multi_select", label: "Multi Select", group: "Select" },
  { value: "object", label: "Object (nested)", group: "Compound" },
  { value: "list", label: "List", group: "Compound" },
  { value: "table", label: "Table", group: "Compound" },
]

export function FieldEditor({ field, onSave, onCancel }: FieldEditorProps) {
  const isNew = !field
  const [name, setName] = useState(field?.name ?? "")
  const [type, setType] = useState<DataType>(field?.type ?? "string")
  const [description, setDescription] = useState(
    (field && "description" in field ? field.description : "") ?? ""
  )
  const [extractionInstructions, setExtractionInstructions] = useState(
    (field && "extractionInstructions" in field ? field.extractionInstructions : "") ?? ""
  )
  const [required, setRequired] = useState(
    (field && "required" in field ? field.required : false) ?? false
  )
  const [options, setOptions] = useState(
    (field && "constraints" in field && field.constraints?.options
      ? field.constraints.options.join(", ")
      : "") ?? ""
  )

  const handleSave = () => {
    if (!name.trim()) return

    const fieldId = field?.id ?? `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    const base = {
      id: fieldId,
      name: name.trim(),
      description: description.trim() || undefined,
      extractionInstructions: extractionInstructions.trim() || undefined,
      required: required || undefined,
    }

    let newField: SchemaField

    if (type === "object") {
      newField = {
        ...base,
        type: "object",
        children: field?.type === "object" ? (field as any).children ?? [] : [],
      } as any
    } else if (type === "list") {
      newField = {
        ...base,
        type: "list",
        item: field?.type === "list" ? (field as any).item ?? { id: `${fieldId}_item`, name: "value", type: "string" } : { id: `${fieldId}_item`, name: "value", type: "string" },
      } as any
    } else if (type === "table") {
      newField = {
        ...base,
        type: "table",
        columns: field?.type === "table" ? (field as any).columns ?? [] : [],
      } as any
    } else {
      const constraints: any = {}
      if ((type === "single_select" || type === "multi_select") && options.trim()) {
        constraints.options = options.split(",").map((o) => o.trim()).filter(Boolean)
      }
      newField = {
        ...base,
        type,
        ...(Object.keys(constraints).length > 0 ? { constraints } : {}),
      } as any
    }

    onSave(newField)
  }

  return (
    <div className="border rounded-lg p-4 bg-card space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Field Name</Label>
          <Input
            placeholder="e.g. invoice_number"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as DataType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((ft) => (
                <SelectItem key={ft.value} value={ft.value}>
                  {ft.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Input
          placeholder="What does this field represent?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Extraction Instructions</Label>
        <Textarea
          placeholder="Specific instructions for AI extraction. E.g., 'Look for invoice number near the top of the document'"
          value={extractionInstructions}
          onChange={(e) => setExtractionInstructions(e.target.value)}
          rows={2}
        />
      </div>

      {(type === "single_select" || type === "multi_select") && (
        <div className="space-y-1.5">
          <Label className="text-xs">Options (comma-separated)</Label>
          <Input
            placeholder="e.g. active, inactive, pending"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={required} onCheckedChange={setRequired} />
          <Label className="text-xs">Required</Label>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
            <Check className="h-4 w-4 mr-1" />
            {isNew ? "Add Field" : "Update"}
          </Button>
        </div>
      </div>
    </div>
  )
}
