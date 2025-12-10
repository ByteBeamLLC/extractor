"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prettifyKey, formatNumericValue } from "../utils/formatters";
import type { GridRow } from "../types";
import type { SchemaField } from "@/lib/schema";
import { NestedGridModal } from "../nested/NestedGridModal";
import { NestedTableGrid } from "../nested/NestedTableGrid";

interface TableCellProps {
  value: Record<string, any>[];
  row: GridRow;
  columnId: string;
  column: SchemaField;
  onOpenTableModal?: (
    column: SchemaField,
    job: GridRow["__job"],
    rows: Record<string, any>[],
    columnHeaders: { key: string; label: string }[]
  ) => void;
  onUpdateCell?: (jobId: string, columnId: string, value: unknown) => void;
  mode?: "interactive" | "summary" | "detail";
  onOpenNestedGrid?: (payload: {
    column: SchemaField;
    job: GridRow["__job"];
    value: Record<string, any>[];
    columnHeaders: { key: string; label: string }[];
  }) => void;
}

export function TableCell({
  value,
  row,
  columnId,
  column,
  onOpenTableModal,
  onUpdateCell,
  mode = "interactive",
  onOpenNestedGrid,
}: TableCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const rows = value || [];
  const tableColumn = column as Extract<SchemaField, { type: "table" }>;
  const columnsForTable = tableColumn.columns || [];

  // Generate column headers for nested table
  const columnHeaders = useMemo(() => {
    if (columnsForTable.length > 0) {
      return columnsForTable.map((col) => ({
        key: col.id ?? col.name,
        label: col.name,
      }));
    }
    // Infer headers from data
    const keys = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => keys.add(key));
    });
    return Array.from(keys).map((key) => ({
      key,
      label: prettifyKey(key),
    }));
  }, [columnsForTable, rows]);

  // Define TanStack Table columns for nested table
  const nestedTableColumns = useMemo<ColumnDef<Record<string, any>>[]>(
    () =>
      columnHeaders.map((header) => ({
        accessorKey: header.key,
        header: header.label,
        cell: ({ getValue }) => {
          const cell = getValue();
          const formatted =
            typeof cell === "number"
              ? formatNumericValue(cell) ?? String(cell)
              : typeof cell === "boolean"
                ? cell
                  ? "True"
                  : "False"
                : typeof cell === "object"
                  ? JSON.stringify(cell)
                  : cell ?? "—";
          return String(formatted);
        },
      })),
    [columnHeaders]
  );

  // Create nested TanStack Table instance
  // Memoize to avoid re-instantiating on every render (prevents render loops/React 301)
  const nestedTable = useMemo(
    () =>
      useReactTable({
        data: rows,
        columns: nestedTableColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
          pagination: {
            pageSize: 10,
          },
        },
      }),
    [rows, nestedTableColumns]
  );

  const badge = (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
      )}
    >
      Table
    </span>
  );

  const headerContent = (
    <div className="flex items-center gap-3">
      {badge}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {columnsForTable.length ? `${columnsForTable.length} columns` : null}
        </div>
      </div>
    </div>
  );

  // Simplified preview for summary/interactive modes
  const previewContent = rows.length === 0 ? (
    <span className="text-sm text-muted-foreground">No entries</span>
  ) : (
    <div className="space-y-2">
      {(onOpenTableModal || onOpenNestedGrid) && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenNestedGrid) {
              onOpenNestedGrid({ column: tableColumn, job: row.__job, value: rows, columnHeaders });
            } else if (onOpenTableModal) {
              onOpenTableModal(tableColumn, row.__job, rows, columnHeaders);
            }
          }}
          className="h-7 px-2 text-xs w-full"
        >
          <Maximize2 className="mr-1 h-3 w-3" />
          View Full Table
          <span className="ml-1 px-1 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
            {rows.length}
          </span>
        </Button>
      )}
    </div>
  );

  // Expanded view: full nested TanStack Table
  const expandedContent = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Nested Table
        </span>
        {(onOpenTableModal || onOpenNestedGrid) && rows.length > 20 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenNestedGrid) {
                onOpenNestedGrid({ column: tableColumn, job: row.__job, value: rows, columnHeaders });
              } else if (onOpenTableModal) {
                onOpenTableModal(tableColumn, row.__job, rows, columnHeaders);
              }
            }}
            className="h-7 px-2 text-xs"
          >
            <Maximize2 className="mr-1 h-3 w-3" />
            View Full Table
          </Button>
        )}
      </div>

      {/* Nested TanStack Table */}
      <div className="border border-slate-300 rounded-md overflow-hidden">
        <div className="overflow-x-auto max-h-[400px]">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-slate-100 sticky top-0">
              {nestedTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-2 py-1.5 text-left font-medium text-muted-foreground border-b"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {nestedTable.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-2 py-1.5 border-b text-sm text-foreground"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {nestedTable.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-2 py-2 bg-slate-50 border-t">
            <div className="text-xs text-muted-foreground">
              Page {nestedTable.getState().pagination.pageIndex + 1} of{" "}
              {nestedTable.getPageCount()}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => nestedTable.previousPage()}
                disabled={!nestedTable.getCanPreviousPage()}
                className="h-7 px-2 text-xs"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => nestedTable.nextPage()}
                disabled={!nestedTable.getCanNextPage()}
                className="h-7 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
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

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenNestedGrid) {
      onOpenNestedGrid({ column: tableColumn, job: row.__job, value: rows, columnHeaders });
      return;
    }
    setIsModalOpen(true);
  };

  // Interactive and summary modes - show collapsed view with click to expand
  return (
    <>
      <div
        className="cursor-pointer rounded-xl border border-emerald-300/20 bg-emerald-50/30 px-3 py-2 shadow-sm transition-colors hover:bg-emerald-50/40"
        onClick={openModal}
      >
        {headerContent}
        <div className="mt-2">{previewContent}</div>
      </div>

      {!onOpenNestedGrid && (
        <NestedGridModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title={`${column.name || columnId} • ${row.fileName}`}
          contentType="table"
          columnCount={column.columns?.length || 0}
        >
          <NestedTableGrid
            column={column as any}
            rows={rows}
            job={row.__job}
            onUpdate={(updatedValue) => {
              if (onUpdateCell) {
                onUpdateCell(row.__job.id, columnId, updatedValue);
              }
              setIsModalOpen(false);
            }}
          />
        </NestedGridModal>
      )}
    </>
  );
}
