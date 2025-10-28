"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { GridRow } from "../types";
import { NestedAdvancedField } from "../nested/NestedAdvancedField";
import { NestedGridModal } from "../nested/NestedGridModal";

interface ListCellProps {
  value: any[];
  row: GridRow;
  columnId: string;
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void;
  mode?: "interactive" | "summary" | "detail";
}

export function ListCell({
  value,
  row,
  columnId,
  onUpdateCell,
  mode = "interactive",
}: ListCellProps) {
  const items = value || [];
  const meta = `${items.length} ${items.length === 1 ? "item" : "items"}`;
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const job = row.__job;

  const handleAddItem = () => {
    const newItems = [...items, ""];
    onUpdateCell(job.id, columnId, newItems);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdateCell(job.id, columnId, newItems);
  };

  const handleUpdateItem = (index: number, newValue: any) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onUpdateCell(job.id, columnId, newItems);
    setEditingIndex(null);
  };

  const handleKeyDown = (index: number, value: any, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUpdateItem(index, e.currentTarget.value);
    } else if (e.key === "Escape") {
      setEditingIndex(null);
    }
  };

  const badge = (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        "bg-[#e6f0ff] text-[#2782ff] dark:bg-[#0b2547] dark:text-[#8fbfff]"
      )}
    >
      List
    </span>
  );

  const summary =
    items[0] && typeof items[0] === "string"
      ? String(items[0])
      : `${items.length} items`;

  const expandedContent = (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="group relative rounded-lg bg-white/80 px-3 py-2 shadow-sm"
        >
          {editingIndex === idx ? (
            <input
              type="text"
              defaultValue={String(item)}
              onBlur={(e) => handleUpdateItem(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, item, e)}
              autoFocus
              className="w-full border rounded px-2 py-1 text-sm"
            />
          ) : (
            <>
              {item && typeof item === "object" ? (
                <pre className="whitespace-pre-wrap text-xs text-foreground/80">
                  {JSON.stringify(item, null, 2)}
                </pre>
              ) : (
                <span 
                  className="text-sm text-foreground cursor-pointer hover:bg-muted/30 px-1 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingIndex(idx);
                  }}
                >
                  {String(item)}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(idx);
                }}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </>
          )}
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          handleAddItem();
        }}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  );

  const headerContent = (
    <div className="flex items-center gap-3">
      {badge}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">
          {summary}
        </div>
        <div className="truncate text-xs text-muted-foreground">{meta}</div>
      </div>
    </div>
  );

  if (mode === "detail") {
    return (
      <div className="space-y-1.5">
        {headerContent}
        <div className="space-y-1" onClick={(e) => e.stopPropagation()}>{expandedContent}</div>
      </div>
    );
  }

  // Interactive and summary modes - show collapsed view with click to expand in modal
  return (
    <>
      <div
        className="cursor-pointer rounded-xl border border-[#2782ff]/10 bg-white/75 px-3 py-2 shadow-sm transition-colors hover:bg-white/90"
        onClick={() => setIsModalOpen(true)}
      >
        {headerContent}
      </div>

      <NestedGridModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={`${columnId} • ${row.fileName}`}
      >
        <NestedAdvancedField
          column={{} as any}
          job={row.__job}
          value={value}
          onUpdate={(updatedValue) => {
            onUpdateCell(row.__job.id, columnId, updatedValue);
            setIsModalOpen(false);
          }}
        />
      </NestedGridModal>
    </>
  );
}

