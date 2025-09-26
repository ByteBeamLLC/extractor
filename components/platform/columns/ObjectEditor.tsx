"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { DataPrimitive, LeafField } from "@/lib/schema/types"
import { Plus, Trash2 } from "lucide-react"

interface ObjectEditorProps {
  fields: LeafField[]
  onAddField: () => void
  onUpdateField: (fieldId: string, updates: Partial<LeafField>) => void
  onToggleSummary: (fieldId: string) => void
  onRemoveField: (fieldId: string) => void
}

export function ObjectEditor({ fields, onAddField, onUpdateField, onToggleSummary, onRemoveField }: ObjectEditorProps) {
  return (
    <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Object Fields</p>
          <p className="text-xs text-slate-500">Define the sub-fields that make up this object.</p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={onAddField}>
          <Plus className="mr-1 h-4 w-4" />
          Add Sub-Field
        </Button>
      </div>
      <div className="space-y-3">
        {fields.length === 0 ? (
          <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            No sub-fields yet. Add at least one field to describe this object.
          </div>
        ) : (
          fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-3 rounded-xl bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-end">
              <button
                type="button"
                onClick={() => onToggleSummary(field.id)}
                className={cn(
                  "order-last self-start rounded-md px-2 py-2 text-slate-300 hover:text-yellow-500 sm:order-none",
                  field.displayInSummary ? "text-yellow-500" : "text-slate-300",
                )}
                title="Set as display field for collapsed view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Field Name</Label>
                <Input
                  value={field.name}
                  onChange={(event) => onUpdateField(field.id, { name: event.target.value })}
                  placeholder="e.g., Name"
                />
              </div>
              <div className="w-full space-y-1 sm:w-48">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</Label>
                <Select
                  value={field.type as DataPrimitive}
                  onValueChange={(value: DataPrimitive) => onUpdateField(field.id, { type: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="decimal">Decimal</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Yes / No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveField(field.id)}
                className="self-start text-slate-400 hover:text-slate-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
