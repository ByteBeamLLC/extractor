"use client";

import type { FlatLeaf, ExtractionJob } from "@/lib/schema";
import type { Cell } from "@tanstack/react-table";
import type { GridRow } from "./types";
import { NestedAdvancedField } from "./nested/NestedAdvancedField";

interface RowDetailPanelProps {
  job: ExtractionJob;
  columns: FlatLeaf[];
  visibleCells: Array<Cell<GridRow, unknown>>;
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void;
}

export function RowDetailPanel({
  job,
  columns,
  visibleCells,
  onUpdateCell,
}: RowDetailPanelProps) {
  const advancedColumns = new Map(
    columns
      .filter((col) => col.type === "object" || col.type === "list" || col.type === "table")
      .map((col) => [col.id, col])
  );

  return (
    <tr className="bg-slate-50/60 dark:bg-slate-900/40">
      {visibleCells.map((cell) => {
        const schemaColumn = advancedColumns.get(cell.column.id);
        if (!schemaColumn) {
          return <td key={`detail-${cell.id}`} className="p-3 align-top" />;
        }

        return (
          <td key={`detail-${cell.id}`} className="p-3 align-top">
            <NestedAdvancedField
              column={schemaColumn}
              job={job}
              value={job.results?.[schemaColumn.id]}
              onUpdate={(value) => onUpdateCell(job.id, schemaColumn.id, value)}
            />
          </td>
        );
      })}
    </tr>
  );
}

