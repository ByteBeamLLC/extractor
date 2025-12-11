"use client";

import { useCallback, useMemo, memo } from "react";
import { Eye, RotateCcw } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { GridRow } from "../types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TableToolbarProps {
  table: Table<GridRow>;
  schemaId: string;
}

function TableToolbarInner({ table }: TableToolbarProps) {
  // #region agent log
  console.error('[TOOLBAR] Rendering', {timestamp: Date.now()});
  // #endregion
  
  // Get table state once to avoid multiple getState() calls
  // #region agent log
  console.error('[TOOLBAR] Before getState()');
  // #endregion
  const tableState = table.getState();
  // #region agent log
  console.error('[TOOLBAR] After getState()');
  // #endregion
  
  // Memoize column filtering to prevent repeated getAllColumns() calls
  const columns = useMemo(() => {
    // #region agent log
    console.error('[TOOLBAR] useMemo: Before getAllColumns()');
    // #endregion
    const allColumns = table.getAllColumns();
    // #region agent log
    console.error('[TOOLBAR] useMemo: After getAllColumns(), count:', allColumns.length);
    // #endregion
    return allColumns.filter((column) => {
      return (
        column.id !== "row-index" &&
        column.id !== "file-name" &&
        column.id !== "bb-add-field" &&
        column.id !== "bb-spacer" &&
        !column.id.startsWith("group-")
      );
    });
  }, [table]);

  const activeFiltersCount = tableState.columnFilters.length;
  const activeSortsCount = tableState.sorting.length;
  
  const hiddenColumnsCount = useMemo(() => {
    return columns.filter((col) => !col.getIsVisible()).length;
  }, [columns]);

  const resetAll = useCallback(() => {
    table.resetColumnFilters();
    table.resetSorting();
    table.resetColumnVisibility();
    table.resetColumnOrder();
    table.resetColumnPinning();
    // Do not touch global filter; search is disabled.
  }, [table]);

  return (
    <div className="flex items-center justify-end gap-2 border-b bg-slate-50 px-4 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Eye className="mr-2 h-4 w-4" />
            View
            {hiddenColumnsCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                {hiddenColumnsCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {columns.map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {typeof column.columnDef.header === "string"
                  ? column.columnDef.header
                  : column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={resetAll}
        className="h-8"
        disabled={
          activeFiltersCount === 0 &&
          activeSortsCount === 0 &&
          hiddenColumnsCount === 0
        }
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders and table method calls
export const TableToolbar = memo(TableToolbarInner);
