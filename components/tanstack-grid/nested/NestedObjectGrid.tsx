"use client";

import type { FlatLeaf, ExtractionJob } from "@/lib/schema";
import { prettifyKey } from "../utils/formatters";
import { useState, useEffect, useMemo } from "react";
import { EditableValueInput } from "./EditableValueInput";

interface NestedObjectGridProps {
  column: FlatLeaf;
  value: Record<string, unknown>;
  job: ExtractionJob;
  onUpdate: (value: Record<string, unknown>) => void;
  maxHeight?: string;
}

export function NestedObjectGrid({ column, value, onUpdate, maxHeight = "14rem" }: NestedObjectGridProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>(value ?? {});

  useEffect(() => {
    setDraft(value ?? {});
  }, [value]);

  const fieldTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    if (column.children) {
      for (const child of column.children) {
        map.set(child.id ?? child.name, child.type);
      }
    }
    return map;
  }, [column.children]);

  const handleChange = (key: string, newValue: unknown) => {
    setDraft((prev) => {
      const updated = { ...prev, [key]: newValue };
      onUpdate(updated);
      return updated;
    });
  };

  const entries = Object.entries(draft ?? {});

  const tableWidth = useMemo(() => {
    let maxLabelLength = 0;
    entries.forEach(([key]) => {
      maxLabelLength = Math.max(maxLabelLength, prettifyKey(key).length);
    });
    const labelColumnWidth = Math.min(Math.max(maxLabelLength * 9, 140), 240);
    return { labelColumnWidth };
  }, [entries]);

  return (
    <div className="w-full" style={{ maxHeight }}>
      <div className="overflow-auto rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th
                className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                style={{ width: tableWidth.labelColumnWidth }}
              >
                Field
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 min-w-[200px]">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, val]) => (
              <tr key={key} className="hover:bg-slate-50">
                <td className="border-b border-slate-200 px-3 py-2 text-xs font-medium text-slate-500">
                  {prettifyKey(key)}
                </td>
                <td className="border-b border-slate-200 px-3 py-2 align-top w-full">
                  <div className="min-w-0 w-full">
                    <EditableValueInput
                      value={val}
                      fieldType={fieldTypeMap.get(key) as any}
                      onChange={(nextValue) => handleChange(key, nextValue)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
