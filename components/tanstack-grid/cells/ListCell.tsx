"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { GridRow } from "../types";
import { NestedGridModal } from "../nested/NestedGridModal";
import { NestedListGrid } from "../nested/NestedListGrid";
import type { SchemaField } from "@/lib/schema";

interface ListCellProps {
  value: any[];
  row: GridRow;
  columnId: string;
  column: SchemaField;
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void;
  mode?: "interactive" | "summary" | "detail";
  onOpenNestedGrid?: (payload: { column: SchemaField; job: GridRow["__job"]; value: any[] }) => void;
}

export function ListCell({
  value,
  row,
  columnId,
  column,
  onUpdateCell,
  mode = "interactive",
  onOpenNestedGrid,
}: ListCellProps) {
  const items = Array.isArray(value) ? value : [];
  const meta = `${items.length} ${items.length === 1 ? "item" : "items"}`;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const job = row.__job;
  const listColumn = column as Extract<SchemaField, { type: "list" }>;

  const handleAddItem = () => {
    const newItems = [...items, ""];
    onUpdateCell(job.id, columnId, newItems);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdateCell(job.id, columnId, newItems);
  };

  const badge = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      )}
    >
      LIST
    </span>
  );

  const headerContent = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {badge}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {meta}
          </div>
          {items[0] && typeof items[0] === "string" && items[0].trim() && (
            <div className="truncate text-xs text-muted-foreground">
              {items[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  if (mode === "detail") {
    return (
      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
        {headerContent}
        <div className="border-t border-slate-200 pt-2 dark:border-slate-700">
          <NestedListGrid
            column={listColumn as any}
            values={items}
            job={job}
            onUpdate={(updatedValue) => {
              onUpdateCell(job.id, columnId, updatedValue);
            }}
            onDeleteItem={(index) => handleDeleteItem(index)}
            maxHeight="18rem"
          />
        </div>
      </div>
    );
  }

  // Interactive and summary modes - show collapsed view with click to expand in modal
  return (
    <>
      <div
        className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 transition-all hover:border-slate-300 hover:bg-slate-100/50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600 dark:hover:bg-slate-700/50"
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenNestedGrid) {
            onOpenNestedGrid({ column, job, value: items });
          } else {
            setIsModalOpen(true);
          }
        }}
      >
        {headerContent}
      </div>

      {!onOpenNestedGrid && (
        <NestedGridModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title={`${column.name || columnId} • ${row.fileName}`}
          contentType="list"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {meta}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => handleAddItem()}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>
            <NestedListGrid
              column={listColumn as any}
              values={items}
              job={job}
              onUpdate={(updatedValue) => {
                onUpdateCell(job.id, columnId, updatedValue);
              }}
              onDeleteItem={(index) => handleDeleteItem(index)}
              onAddItem={handleAddItem}
              maxHeight="60vh"
            />
          </div>
        </NestedGridModal>
      )}
    </>
  );
}
