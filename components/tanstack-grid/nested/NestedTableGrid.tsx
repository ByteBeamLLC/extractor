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
    <div className="overflow-auto rounded-lg" style={{ maxHeight }}>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              #
            </th>
            {headers.map((header) => (
              <th
                key={header.id}
                className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 min-w-[150px]"
              >
                {header.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {draft.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50">
              <td className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
                {index + 1}
              </td>
              {headers.map((header) => (
                <td key={header.id} className="border-b border-slate-200 px-3 py-2 align-top">
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
  );
}
