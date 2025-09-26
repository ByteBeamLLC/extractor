"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { DataPrimitive } from "@/lib/schema/types"

interface ListEditorProps {
  itemType: DataPrimitive
  onTypeChange: (type: DataPrimitive) => void
}

export function ListEditor({ itemType, onTypeChange }: ListEditorProps) {
  return (
    <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">List Item Type</p>
        <p className="text-xs text-slate-500">Choose the type of value each item in this list should store.</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item Type</Label>
        <Select value={itemType} onValueChange={(value: DataPrimitive) => onTypeChange(value)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select an item type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="decimal">Decimal</SelectItem>
            <SelectItem value="date">Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
