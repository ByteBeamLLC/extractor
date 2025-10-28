"use client";

import { Trash2 } from "lucide-react";
import type { FlatLeaf } from "@/lib/schema";
import { cn } from "@/lib/utils";

interface DataColumnHeaderProps {
  columnMeta: FlatLeaf;
  onEditColumn: (column: FlatLeaf) => void;
  onDeleteColumn: (columnId: string) => void;
  onColumnRightClick?: (columnId: string, event: React.MouseEvent) => void;
}

export function DataColumnHeader({
  columnMeta,
  onEditColumn,
  onDeleteColumn,
  onColumnRightClick,
}: DataColumnHeaderProps) {
  return (
    <div
      className="bb-ag-header-clickable group flex w-full items-center justify-between gap-2"
      onContextMenu={(e) => {
        if (onColumnRightClick) {
          e.preventDefault();
          onColumnRightClick(columnMeta.id, e);
        }
      }}
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onEditColumn(columnMeta);
        }}
        className="flex min-w-0 flex-1 items-center gap-2 truncate text-left text-sm font-semibold text-slate-700 transition-colors hover:text-primary focus:outline-none"
      >
        <span className="truncate" title={columnMeta.name}>
          {columnMeta.name}
        </span>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDeleteColumn(columnMeta.id);
        }}
        className="shrink-0 rounded-full p-1.5 text-slate-400 opacity-0 pointer-events-none transition-all hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-300 group-hover:opacity-100 group-hover:pointer-events-auto"
        aria-label={`Delete column ${columnMeta.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

