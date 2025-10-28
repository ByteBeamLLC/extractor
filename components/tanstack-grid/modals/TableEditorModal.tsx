"use client";

import { useState } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FlatLeaf } from "@/lib/schema";
import type { ExtractionJob } from "@/lib/schema";

interface TableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: Record<string, any>[];
  columnHeaders: Array<{ key: string; label: string }>;
  onSave: (updatedRows: Record<string, any>[]) => void;
}

export function TableEditorModal({
  isOpen,
  onClose,
  rows: initialRows,
  columnHeaders,
  onSave,
}: TableEditorModalProps) {
  const [rows, setRows] = useState<Record<string, any>[]>(initialRows);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; key: string } | null>(null);

  const handleAddRow = () => {
    const newRow: Record<string, any> = {};
    columnHeaders.forEach((header) => {
      newRow[header.key] = "";
    });
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleCellChange = (rowIndex: number, key: string, value: any) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [key]: value };
    setRows(newRows);
  };

  const handleSave = () => {
    onSave(rows);
    onClose();
  };

  const handleCancel = () => {
    setRows(initialRows);
    onClose();
  };

  const renderCellInput = (row: Record<string, any>, rowIndex: number, key: string) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.key === key;
    const value = row[key] ?? "";

    if (isEditing) {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleCellChange(rowIndex, key, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditingCell(null);
            if (e.key === "Escape") {
              setEditingCell(null);
              handleCellChange(rowIndex, key, initialRows[rowIndex]?.[key] ?? "");
            }
          }}
          autoFocus
          className="w-full border rounded px-2 py-1 text-sm"
        />
      );
    }

    return (
      <div
        className="px-2 py-1 text-sm cursor-pointer hover:bg-muted/30 rounded"
        onClick={() => setEditingCell({ rowIndex, key })}
      >
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto border rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                {columnHeaders.map((header) => (
                  <th
                    key={header.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b"
                  >
                    {header.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b hover:bg-muted/30">
                  {columnHeaders.map((header) => (
                    <td key={header.key} className="p-0">
                      {renderCellInput(row, rowIndex, header.key)}
                    </td>
                  ))}
                  <td className="p-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddRow}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

