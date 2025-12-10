"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { GridRow, ColumnMeta } from "../types";
import { formatNumericValue, formatDateValue } from "../utils/formatters";
import { cn } from "@/lib/utils";

interface PrimitiveCellProps {
  value: unknown;
  row: GridRow;
  columnId: string;
  columnType: string;
  columnMeta?: any; // For accessing field constraints like options
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void;
}

export function PrimitiveCell({
  value,
  row,
  columnId,
  columnType,
  columnMeta,
  onUpdateCell,
}: PrimitiveCellProps) {
  if (value instanceof Promise) {
    console.error("Promise value passed to PrimitiveCell", {
      columnId,
      jobId: row.__job.id,
      value,
    });
    return <span className="text-red-600">[promise]</span>;
  }

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
    if (columnType === "single_select") {
      const options = columnMeta?.constraints?.options || [];
      return (
        <Select
          value={draft || ""}
          onValueChange={(newValue) => {
            onUpdateCell(job.id, columnId, newValue);
            setIsEditing(false);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (columnType === "multi_select") {
      const options = columnMeta?.constraints?.options || [];
      const selectedValues = Array.isArray(draft) ? draft : [];
      
      return (
        <div className="space-y-2">
          {options.map((option: string) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`${columnId}-${option}`}
                checked={selectedValues.includes(option)}
                onCheckedChange={(checked) => {
                  const newValues = checked
                    ? [...selectedValues, option]
                    : selectedValues.filter((v: string) => v !== option);
                  setDraft(newValues);
                }}
              />
              <label
                htmlFor={`${columnId}-${option}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option}
              </label>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button
              onClick={commitEdit}
              className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

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
