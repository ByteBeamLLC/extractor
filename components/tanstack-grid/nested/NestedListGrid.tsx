"use client";

import type { FlatLeaf, ExtractionJob, SchemaField } from "@/lib/schema";
import type { ReactNode } from "react";
import { useState, useEffect, useMemo } from "react";
import { EditableValueInput } from "./EditableValueInput";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface NestedListGridProps {
  column: FlatLeaf;
  values: unknown[];
  job: ExtractionJob;
  onUpdate: (value: unknown[]) => void;
  maxHeight?: string;
  onDeleteItem?: (index: number) => void;
  onAddItem?: () => void;
}

const isObjectItem = (item: SchemaField | undefined): item is SchemaField & { children: SchemaField[] } => {
  return Boolean(item && (item.type === "object" || item.type === "table"));
};

export function NestedListGrid({
  column,
  values,
  onUpdate,
  maxHeight = "14rem",
  onDeleteItem,
  onAddItem,
}: NestedListGridProps) {
  const [draft, setDraft] = useState<unknown[]>(values ?? []);

  useEffect(() => {
    setDraft(values ?? []);
  }, [values]);

  const listField = column as any;
  const itemDef = listField.item as SchemaField | undefined;

  const headerFields = useMemo(() => {
    if (!itemDef) return [] as SchemaField[];
    if (itemDef.type === "object") return itemDef.children || [];
    if (itemDef.type === "table") return itemDef.columns || [];
    return [] as SchemaField[];
  }, [itemDef]);

  const commitUpdate = (updated: unknown[]) => {
    setDraft(updated);
    onUpdate(updated);
  };

  const handlePrimitiveChange = (index: number, newValue: unknown) => {
    const updated = [...draft];
    updated[index] = newValue;
    commitUpdate(updated);
  };

  const handleObjectChange = (index: number, key: string, newValue: unknown) => {
    const currentRow = (draft[index] as Record<string, unknown>) ?? {};
    const updatedRow = { ...currentRow, [key]: newValue };
    const updated = [...draft];
    updated[index] = updatedRow;
    commitUpdate(updated);
  };

  const renderEmptyState = () => (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
      No {column.name} items
    </div>
  );

  const renderActionHeader = () => (
    <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-16">
      Actions
    </th>
  );

  const renderDeleteCell = (index: number) => (
    <td className="border-b border-slate-200 px-3 py-2 align-top">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => onDeleteItem?.(index)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </td>
  );

  const renderHeaderRow = (cells: ReactNode[]) => (
    <tr>
      <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        #
      </th>
      {cells}
      {onDeleteItem && renderActionHeader()}
    </tr>
  );

  const renderAddButton = () => (
    onAddItem ? (
      <div className="flex justify-end pb-2">
        <Button type="button" size="sm" variant="outline" onClick={onAddItem}>
          Add Item
        </Button>
      </div>
    ) : null
  );

  if (draft.length === 0) {
    return (
      <div style={{ maxHeight }} className="overflow-hidden">
        {renderAddButton()}
        {renderEmptyState()}
      </div>
    );
  }

  if (itemDef && isObjectItem(itemDef)) {
    return (
      <div className="overflow-auto rounded-lg" style={{ maxHeight }}>
        {renderAddButton()}
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            {renderHeaderRow(
              headerFields.map((header) => (
                <th
                  key={header.id}
                  className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 min-w-[150px]"
                >
                  {header.name}
                </th>
              ))
            )}
          </thead>
          <tbody>
            {draft.map((item, index) => {
              const row = (item as Record<string, unknown>) ?? {};
              return (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
                    {index + 1}
                  </td>
                  {headerFields.map((header) => (
                    <td key={header.id} className="border-b border-slate-200 px-3 py-2 align-top">
                      <div className="min-w-0 w-full">
                        <EditableValueInput
                          value={row?.[header.id]}
                          fieldType={header.type}
                          onChange={(nextValue) => handleObjectChange(index, header.id, nextValue)}
                        />
                      </div>
                    </td>
                  ))}
                  {onDeleteItem && renderDeleteCell(index)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg" style={{ maxHeight }}>
      {renderAddButton()}
      <table className="w-full text-sm">
        <thead className="bg-slate-100">
          {renderHeaderRow([
            <th
              key="value"
              className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Value
            </th>,
          ])}
        </thead>
        <tbody>
          {draft.map((value, index) => (
            <tr key={index} className="hover:bg-slate-50">
              <td className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
                {index + 1}
              </td>
              <td className="border-b border-slate-200 px-3 py-2 align-top">
                <div className="min-w-0 w-full">
                  <EditableValueInput
                    value={value}
                    onChange={(nextValue) => handlePrimitiveChange(index, nextValue)}
                  />
                </div>
              </td>
              {onDeleteItem && renderDeleteCell(index)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
