"use client";

import { useState } from "react";
import type { GridRow, ColumnMeta } from "../types";
import { formatNumericValue, formatDateValue } from "../utils/formatters";
import { cn } from "@/lib/utils";

interface PrimitiveCellProps {
  value: unknown;
  row: GridRow;
  columnId: string;
  columnType: string;
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void;
}

export function PrimitiveCell({
  value,
  row,
  columnId,
  columnType,
  onUpdateCell,
}: PrimitiveCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<any>(value ?? "");

  const job = row.__job;

  const startEdit = () => {
    if (
      columnType === "object" ||
      columnType === "table" ||
      columnType === "list"
    )
      return;
    setDraft(value);
    setIsEditing(true);
  };

  const commitEdit = () => {
    setIsEditing(false);
    onUpdateCell(job.id, columnId, draft);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(value);
  };

  // Edit mode UI
  if (isEditing) {
    if (columnType === "number" || columnType === "decimal") {
      return (
        <input
          className="w-full border rounded-md px-2 py-1 text-right"
          autoFocus
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
        />
      );
    }
    if (columnType === "boolean") {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(draft)}
            onChange={(e) => {
              onUpdateCell(job.id, columnId, e.target.checked);
              setIsEditing(false);
            }}
          />
        </div>
      );
    }
    if (columnType === "date") {
      return (
        <input
          className="w-full border rounded-md px-2 py-1 font-mono text-xs"
          autoFocus
          type="text"
          placeholder="YYYY-MM-DD"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
        />
      );
    }
    // Default text/textarea
    return (
      <textarea
        className="w-full border rounded-md px-2 py-1 text-sm"
        rows={2}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commitEdit();
          }
          if (e.key === "Escape") cancelEdit();
        }}
      />
    );
  }

  // Display mode UI
  const isEmpty =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim().length === 0);

  if (isEmpty) {
    return (
      <span 
        className="text-muted-foreground cursor-pointer hover:text-foreground" 
        onClick={startEdit}
      >
        —
      </span>
    );
  }

  if (columnType === "boolean") {
    const truthy = Boolean(value);
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide cursor-pointer transition-colors hover:opacity-80",
          truthy
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "bg-muted text-muted-foreground"
        )}
        onClick={(e) => {
          e.stopPropagation();
          startEdit();
        }}
      >
        {truthy ? "True" : "False"}
      </span>
    );
  }

  if (columnType === "number" || columnType === "decimal") {
    const formatted = formatNumericValue(value);
    return (
      <span 
        className="text-sm font-medium text-foreground tabular-nums cursor-pointer hover:bg-muted/30 px-1 rounded transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          startEdit();
        }}
      >
        {formatted ?? String(value)}
      </span>
    );
  }

  if (columnType === "date") {
    const formatted = formatDateValue(value);
    return (
      <span 
        className="font-mono text-xs cursor-pointer hover:bg-muted/30 px-1 rounded transition-colors" 
        title={String(value)}
        onClick={(e) => {
          e.stopPropagation();
          startEdit();
        }}
      >
        {formatted ?? String(value)}
      </span>
    );
  }

  // Default string/text
  return (
    <span 
      className="truncate text-sm cursor-pointer hover:bg-muted/30 px-1 rounded transition-colors" 
      title={String(value)}
      onClick={(e) => {
        e.stopPropagation();
        startEdit();
      }}
    >
      {String(value)}
    </span>
  );
}

