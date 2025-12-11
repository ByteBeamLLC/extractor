"use client";

import { useCallback } from "react";
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

export function TableToolbar({ table }: TableToolbarProps) {
  const columns = table.getAllColumns().filter((column) => {
    return (
      column.id !== "row-index" &&
      column.id !== "file-name" &&
      column.id !== "bb-add-field" &&
      column.id !== "bb-spacer" &&
      !column.id.startsWith("group-")
    );
  });

  const activeFiltersCount = table.getState().columnFilters.length;
  const activeSortsCount = table.getState().sorting.length;
  const hiddenColumnsCount = columns.filter((col) => !col.getIsVisible()).length;

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
