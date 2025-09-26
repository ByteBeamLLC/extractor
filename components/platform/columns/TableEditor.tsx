"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LeafField } from "@/lib/schema/types"
import { Plus, Trash2 } from "lucide-react"

interface TableEditorProps {
  columns: LeafField[]
  onAddColumn: () => void
  onUpdateColumn: (columnId: string, updates: Partial<LeafField>) => void
  onRemoveColumn: (columnId: string) => void
}

export function TableEditor({ columns, onAddColumn, onUpdateColumn, onRemoveColumn }: TableEditorProps) {
  return (
    <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Table Columns</p>
          <p className="text-xs text-slate-500">Define the columns that appear in each row of this table.</p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={onAddColumn}>
          <Plus className="mr-1 h-4 w-4" />
          Add Column
        </Button>
      </div>
      <div className="space-y-3">
        {columns.length === 0 ? (
          <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            No columns yet. Add at least one column to capture data in each row.
          </div>
        ) : (
          columns.map((column, index) => (
            <div key={column.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{index + 1}</span>
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Column Name</Label>
                <Input
                  value={column.name}
                  onChange={(event) => onUpdateColumn(column.id, { name: event.target.value })}
                  placeholder="Column name"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveColumn(column.id)}
                className="text-slate-400 hover:text-slate-700"
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
