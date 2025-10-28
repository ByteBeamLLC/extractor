"use client";

import { useState } from "react";
import type { FlatLeaf, ExtractionJob } from "@/lib/schema";
import { NestedObjectGrid } from "./NestedObjectGrid";
import { NestedListGrid } from "./NestedListGrid";
import { NestedTableGrid } from "./NestedTableGrid";
import { EmptyNestedCell } from "./EmptyNestedCell";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import { NestedGridModal } from "./NestedGridModal";

interface NestedAdvancedFieldProps {
  column: FlatLeaf;
  job: ExtractionJob;
  value: unknown;
  onUpdate: (value: unknown) => void;
}

export function NestedAdvancedField({ column, job, value, onUpdate }: NestedAdvancedFieldProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderGrid = (scrollHeight: string) => {
    if (column.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
      return (
        <NestedObjectGrid
          column={column}
          value={value as Record<string, unknown>}
          job={job}
          onUpdate={onUpdate}
          maxHeight={scrollHeight}
        />
      );
    }

    if (column.type === "list" && Array.isArray(value)) {
      return (
        <NestedListGrid
          column={column}
          values={value as unknown[]}
          job={job}
          onUpdate={onUpdate}
          maxHeight={scrollHeight}
        />
      );
    }

    if (column.type === "table" && Array.isArray(value)) {
      return (
        <NestedTableGrid
          column={column as any}
          rows={value as Record<string, unknown>[]}
          job={job}
          onUpdate={onUpdate}
          maxHeight={scrollHeight}
        />
      );
    }

    return <EmptyNestedCell column={column} />;
  };

  const hasData =
    (column.type === "object" && value && typeof value === "object" && !Array.isArray(value)) ||
    (column.type === "list" && Array.isArray(value) && value.length > 0) ||
    (column.type === "table" && Array.isArray(value) && value.length > 0);

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>{column.name}</span>
          {hasData && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-slate-500"
              onClick={() => setIsModalOpen(true)}
            >
              <Maximize2 className="mr-1 h-3.5 w-3.5" />
              Expand
            </Button>
          )}
        </div>
        <div className="max-h-56 overflow-auto px-3 py-3">
          {renderGrid("18rem")}
        </div>
      </div>

      <NestedGridModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={`${column.name} • ${job.fileName}`}
        contentType={column.type === "table" ? "table" : column.type === "list" ? "list" : "object"}
        columnCount={column.type === "table" && column.columns ? column.columns.length : 0}
      >
        <div className="px-2">
          {renderGrid("60vh")}
        </div>
      </NestedGridModal>
    </>
  );
}
