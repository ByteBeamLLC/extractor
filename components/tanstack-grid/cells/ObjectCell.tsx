"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { GridRow } from "../types";
import { prettifyKey } from "../utils/formatters";
import { formatNumericValue } from "../utils/formatters";
import { NestedAdvancedField } from "../nested/NestedAdvancedField";
import { NestedGridModal } from "../nested/NestedGridModal";

interface ObjectCellProps {
  value: Record<string, any>;
  row: GridRow;
  columnId: string;
  column: { children?: Array<{ id: string; name: string; displayInSummary?: boolean }> };
  mode?: "interactive" | "summary" | "detail";
  onUpdateCell?: (jobId: string, columnId: string, value: unknown) => void;
}

export function ObjectCell({
  value,
  row,
  columnId,
  column,
  mode = "interactive",
  onUpdateCell,
}: ObjectCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const entries = Object.entries(value).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  // Find labels for object fields
  const findChildLabel = (key: string): string | undefined => {
    const child = column.children?.find(
      (childField) => childField.id === key || childField.name === key
    );
    return child?.name;
  };

  const getObjectEntries = () => {
    return entries.map(([key, v]) => ({
      label: findChildLabel(key) ?? prettifyKey(key),
      value: v,
    }));
  };

  const firstNonEmptyText = () => {
    for (const v of Object.values(value)) {
      if (v && typeof v === "string") {
        const trimmed = v.trim();
        if (trimmed) return trimmed;
      }
    }
    return null;
  };

  const getDisplayChildren = () => {
    return (column.children || []).filter(
      (c: any) => c.displayInSummary
    );
  };

  const labelsForSummary: string[] = [];
  const record = value;

  if (column.children) {
    for (const child of getDisplayChildren()) {
      const valueForChild = record[child.id] ?? record[child.name];
      if (
        valueForChild !== undefined &&
        valueForChild !== null &&
        String(valueForChild).trim() !== ""
      ) {
        labelsForSummary.push(String(valueForChild));
      }
    }
  }

  const summary =
    labelsForSummary.length > 0
      ? labelsForSummary.join(" / ")
      : `${entries.length} ${entries.length === 1 ? "field" : "fields"}`;

  const badge = (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        "bg-[#e6f0ff] text-[#2782ff] dark:bg-[#0b2547] dark:text-[#8fbfff]"
      )}
    >
      Object
    </span>
  );

  const headerContent = (
    <div className="flex items-center gap-3">
      {badge}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">
          {summary}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {entries.length} {entries.length === 1 ? "detail" : "details"}
        </div>
      </div>
    </div>
  );

  const expandedContent = (
    <div className="space-y-2">
      {getObjectEntries().map(({ label, value: entryValue }) => (
        <div
          key={label}
          className="flex items-start justify-between gap-4"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="max-w-[16rem] text-sm font-medium text-foreground">
            {typeof entryValue === "number"
              ? formatNumericValue(entryValue) ?? String(entryValue)
              : typeof entryValue === "boolean"
                ? entryValue
                  ? "True"
                  : "False"
                : typeof entryValue === "object"
                  ? JSON.stringify(entryValue)
                  : String(entryValue)}
          </span>
        </div>
      ))}
    </div>
  );

  if (mode === "detail") {
    return (
      <div className="space-y-1.5">
        {headerContent}
        <div className="space-y-1">{expandedContent}</div>
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
        title={`${column.name || columnId} • ${row.fileName}`}
      >
        <NestedAdvancedField
          column={column as any}
          job={row.__job}
          value={value}
          onUpdate={(updatedValue) => {
            if (onUpdateCell) {
              onUpdateCell(row.__job.id, columnId, updatedValue);
            }
            setIsModalOpen(false);
          }}
        />
      </NestedGridModal>
    </>
  );
}

