"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Save, X, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GridRow } from "../types";
import { prettifyKey } from "../utils/formatters";
import { formatNumericValue } from "../utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditableObjectCellProps {
  value: Record<string, any>;
  row: GridRow;
  columnId: string;
  column: { children?: Array<{ id: string; name: string; type?: string; displayInSummary?: boolean }> };
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void;
  mode?: "interactive" | "summary" | "detail";
}

export function EditableObjectCell({
  value,
  row,
  columnId,
  column,
  isExpanded,
  onToggleExpanded,
  onUpdateCell,
  mode = "interactive",
}: EditableObjectCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>(value);

  const job = row.__job;

  // Update draft when value changes
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const findChildField = (key: string) => {
    return column.children?.find(
      (childField) => childField.id === key || childField.name === key
    );
  };

  const handleSave = () => {
    setIsEditing(false);
    onUpdateCell(job.id, columnId, draft);
  };

  const handleCancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleFieldChange = (key: string, newValue: any) => {
    setDraft((prev) => ({ ...prev, [key]: newValue }));
  };

  const entries = Object.entries(value).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  const getObjectEntries = () => {
    return entries.map(([key, v]) => {
      const field = findChildField(key);
      return {
        label: field?.name || prettifyKey(key),
        key,
        value: v,
        type: field?.type || "string",
      };
    });
  };

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

  const summary = entries.length > 0
    ? `${entries.length} ${entries.length === 1 ? "field" : "fields"}`
    : "No fields";

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
      {mode === "interactive" && (
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isExpanded ? "rotate-180" : "rotate-0"
          )}
        />
      )}
    </div>
  );

  const renderFieldInput = (key: string, val: any, fieldType: string = "string") => {
    if (fieldType === "boolean") {
      return (
        <input
          type="checkbox"
          checked={Boolean(val)}
          onChange={(e) => handleFieldChange(key, e.target.checked)}
          className="cursor-pointer"
        />
      );
    }

    if (fieldType === "number" || fieldType === "decimal") {
      return (
        <Input
          type="number"
          value={val ?? ""}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          className="h-8 text-right"
        />
      );
    }

    if (fieldType === "date") {
      return (
        <Input
          type="text"
          value={val ?? ""}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          placeholder="YYYY-MM-DD"
          className="h-8 font-mono text-xs"
        />
      );
    }

    // Default text input
    return (
      <Input
        value={val ?? ""}
        onChange={(e) => handleFieldChange(key, e.target.value)}
        className="h-8"
      />
    );
  };

  const expandedContent = (
    <div className="space-y-3">
      {isEditing ? (
        <>
          {getObjectEntries().map(({ label, key, value: entryValue, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </label>
              {renderFieldInput(key, draft[key], type)}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleSave}
              className="h-8 flex-1"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-8 flex-1"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          {getObjectEntries().map(({ label, value: entryValue, type }) => (
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="w-full"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Fields
          </Button>
        </>
      )}
    </div>
  );

  if (mode === "summary") {
    return (
      <div className="rounded-xl border border-[#2782ff]/10 bg-white/75 px-3 py-2 shadow-sm">
        {headerContent}
      </div>
    );
  }

  if (mode === "detail") {
    return (
      <div className="rounded-xl border border-[#2782ff]/10 bg-white/75 px-3 py-2 shadow-sm">
        {headerContent}
        <div className="mt-2">{expandedContent}</div>
      </div>
    );
  }

  // Interactive mode
  return (
    <div
      className="cursor-pointer rounded-xl border border-[#2782ff]/10 bg-white/75 px-3 py-2 shadow-sm transition-colors hover:bg-white/90"
      onClick={onToggleExpanded}
    >
      {headerContent}
      {isExpanded && <div className="mt-2" onClick={(e) => e.stopPropagation()}>{expandedContent}</div>}
    </div>
  );
}

