"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Save, X, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GridRow } from "../types";
import { prettifyKey } from "../utils/formatters";
import { formatNumericValue } from "../utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface EditableObjectCellProps {
  value: Record<string, any>;
  row: GridRow;
  columnId: string;
  column: { 
    children?: Array<{ 
      id: string; 
      name: string; 
      type?: string; 
      displayInSummary?: boolean;
      constraints?: { options?: string[] };
    }> 
  };
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
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      )}
    >
      OBJECT
    </span>
  );

  const summary = entries.length > 0
    ? `${entries.length} ${entries.length === 1 ? "data" : "data"}`
    : "Empty";

  const headerContent = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {badge}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {summary}
          </div>
        </div>
      </div>
      {mode === "interactive" && (
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200",
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

    if (fieldType === "single_select") {
      // Find the field definition to get options
      const fieldDef = column.children?.find(child => child.id === key || child.name === key);
      const options = fieldDef?.constraints?.options || [];
      
      return (
        <Select
          value={val || ""}
          onValueChange={(newValue) => handleFieldChange(key, newValue)}
        >
          <SelectTrigger className="h-8">
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

    if (fieldType === "multi_select") {
      // Find the field definition to get options
      const fieldDef = column.children?.find(child => child.id === key || child.name === key);
      const options = fieldDef?.constraints?.options || [];
      const selectedValues = Array.isArray(val) ? val : [];
      
      return (
        <div className="space-y-1">
          {options.map((option: string) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`${key}-${option}`}
                checked={selectedValues.includes(option)}
                onCheckedChange={(checked) => {
                  const newValues = checked
                    ? [...selectedValues, option]
                    : selectedValues.filter((v: string) => v !== option);
                  handleFieldChange(key, newValues);
                }}
              />
              <label
                htmlFor={`${key}-${option}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
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
    <div className="space-y-2.5">
      {isEditing ? (
        <>
          {getObjectEntries().map(({ label, key, value: entryValue, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
          <div className="space-y-2">
            {getObjectEntries().map(({ label, value: entryValue, type }) => (
              <div
                key={label}
                className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-white/50 px-2.5 py-2 dark:bg-slate-900/50"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {label}
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {typeof entryValue === "number"
                    ? formatNumericValue(entryValue) ?? String(entryValue)
                    : typeof entryValue === "boolean"
                      ? entryValue
                        ? "True"
                        : "False"
                      : typeof entryValue === "object"
                        ? JSON.stringify(entryValue)
                        : String(entryValue) || "-"}
                </span>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="mt-2 w-full"
          >
            <Edit className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
        </>
      )}
    </div>
  );

  if (mode === "summary") {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
        {headerContent}
      </div>
    );
  }

  if (mode === "detail") {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
        {headerContent}
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">{expandedContent}</div>
      </div>
    );
  }

  // Interactive mode
  return (
    <div
      className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 transition-all hover:border-slate-300 hover:bg-slate-100/50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600 dark:hover:bg-slate-700/50"
      onClick={onToggleExpanded}
    >
      {headerContent}
      {isExpanded && (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
          {expandedContent}
        </div>
      )}
    </div>
  );
}

