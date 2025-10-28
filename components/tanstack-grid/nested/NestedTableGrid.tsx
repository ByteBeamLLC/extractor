"use client";

import type { TableField, ExtractionJob } from "@/lib/schema";
import { useState, useEffect } from "react";
import { EditableValueInput } from "./EditableValueInput";

interface NestedTableGridProps {
  column: TableField;
  rows: Record<string, unknown>[];
  job: ExtractionJob;
  onUpdate: (value: Record<string, unknown>[]) => void;
  maxHeight?: string;
}

export function NestedTableGrid({ column, rows, onUpdate, maxHeight = "14rem" }: NestedTableGridProps) {
  const [draft, setDraft] = useState<Record<string, unknown>[]>(rows ?? []);

  useEffect(() => {
    setDraft(rows ?? []);
  }, [rows]);

  const headers = column.columns || [];

  const commitUpdate = (updated: Record<string, unknown>[]) => {
    setDraft(updated);
    onUpdate(updated);
  };

  const handleChange = (rowIndex: number, key: string, newValue: unknown) => {
    const currentRow = draft[rowIndex] ?? {};
    const updatedRow = { ...currentRow, [key]: newValue };
    const updated = [...draft];
    updated[rowIndex] = updatedRow;
    commitUpdate(updated);
  };

  if (draft.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
        No {column.name} rows
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700" style={{ maxHeight }}>
      <div className="overflow-y-auto" style={{ maxHeight }}>
        <table className="min-w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800 min-w-[50px]">
                #
              </th>
              {headers.map((header) => (
                <th
                  key={header.id}
                  className="border-b border-slate-200 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 dark:border-slate-700 min-w-[180px] whitespace-nowrap"
                >
                  {header.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900">
            {draft.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="border-b border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900">
                  {index + 1}
                </td>
                {headers.map((header) => (
                  <td key={header.id} className="border-b border-slate-200 px-3 py-2.5 align-top dark:border-slate-700">
                    <div className="min-w-0 w-full">
                      <EditableValueInput
                        value={row?.[header.id]}
                        fieldType={header.type}
                        onChange={(nextValue) => handleChange(index, header.id, nextValue)}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
