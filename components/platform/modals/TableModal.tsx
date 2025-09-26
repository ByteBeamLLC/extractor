"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye } from "lucide-react"

import type { TableModalPayload } from "../hooks/useTableModal"

interface TableModalProps {
  open: boolean
  payload: TableModalPayload | null
  onClose: () => void
  formatNumericValue: (value: unknown) => string | null
}

export function TableModal({ open, payload, onClose, formatNumericValue }: TableModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Table: {payload?.column.name ?? ""}
          </DialogTitle>
          <DialogDescription>
            Inspect the parsed rows for this table field. Scroll to review every value.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-auto max-h-[60vh]">
          {payload && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {payload.rows.length} {payload.rows.length === 1 ? "row" : "rows"}
                </span>
                <span>
                  {payload.columnHeaders.length} columns
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      {payload.columnHeaders.map((header) => (
                        <th key={header.key} className="bg-slate-50 px-3 py-2 text-left font-medium first:rounded-l-md last:rounded-r-md border">
                          {header.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payload.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        {payload.columnHeaders.map((header) => {
                          const cell = row?.[header.key as keyof typeof row]
                          const formatted =
                            typeof cell === "number"
                              ? formatNumericValue(cell) ?? String(cell)
                              : typeof cell === "boolean"
                                ? cell ? "True" : "False"
                                : typeof cell === "object"
                                  ? JSON.stringify(cell)
                                  : cell ?? "—"
                          return (
                            <td key={header.key} className="px-3 py-2 text-left text-sm first:rounded-l-md last:rounded-r-md border">
                              <span className="block" title={String(formatted)}>
                                {String(formatted)}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
