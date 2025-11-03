"use client";

import { useState } from "react";
import { 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown, 
  Filter, 
  X,
  Pin,
  PinOff,
  EyeOff,
  GripVertical,
  MoreVertical,
} from "lucide-react";
import type { Column } from "@tanstack/react-table";
import type { FlatLeaf } from "@/lib/schema";
import type { GridRow } from "../types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataColumnHeaderProps {
  column?: Column<GridRow, unknown>;
  columnMeta: FlatLeaf;
  onEditColumn: (column: FlatLeaf) => void;
  onDeleteColumn: (columnId: string) => void;
  onColumnRightClick?: (columnId: string, event: React.MouseEvent) => void;
}

export function DataColumnHeader({
  column,
  columnMeta,
  onEditColumn,
  onDeleteColumn,
  onColumnRightClick,
}: DataColumnHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState<string>(
    (column?.getFilterValue() as string) ?? ""
  );

  const isSorted = column?.getIsSorted();
  const canSort = column?.getCanSort();
  const canFilter = column?.getCanFilter();
  const canPin = column?.getCanPin();
  const isPinned = column?.getIsPinned();
  const isFiltered = column?.getIsFiltered();

  const handleSort = () => {
    if (!canSort || !column) return;
    column.toggleSorting();
  };

  const handleFilterChange = (value: string) => {
    setFilterValue(value);
    column?.setFilterValue(value || undefined);
  };

  const clearFilter = () => {
    setFilterValue("");
    column?.setFilterValue(undefined);
    setShowFilter(false);
  };

  return (
    <div
      className="bb-ag-header-clickable group flex w-full flex-col gap-1"
      onContextMenu={(e) => {
        if (onColumnRightClick) {
          e.preventDefault();
          onColumnRightClick(columnMeta.id, e);
        }
      }}
    >
      <div className="flex w-full items-center justify-between gap-1">
        {/* Drag handle for reordering */}
        <div className="shrink-0 cursor-grab text-slate-400 opacity-0 transition-opacity group-hover:opacity-60">
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        {/* Column name - click to sort */}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            if (event.shiftKey && canSort) {
              handleSort();
            } else {
              onEditColumn(columnMeta);
            }
          }}
          className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left text-sm font-semibold text-slate-700 transition-colors hover:text-primary focus:outline-none"
        >
          <span className="truncate" title={columnMeta.name}>
            {columnMeta.name}
          </span>
          
          {/* Sort indicator */}
          {canSort && (
            <span className="shrink-0 text-slate-400">
              {isSorted === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5 text-primary" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60" />
              )}
            </span>
          )}

          {/* Filter indicator */}
          {isFiltered && (
            <span className="shrink-0">
              <Filter className="h-3 w-3 text-primary" />
            </span>
          )}
        </button>

        {/* Column menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 focus:outline-none group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {canSort && (
              <>
                <DropdownMenuItem onClick={handleSort}>
                  {isSorted === "asc" ? (
                    <>
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Sort descending
                    </>
                  ) : isSorted === "desc" ? (
                    <>
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Clear sort
                    </>
                  ) : (
                    <>
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Sort ascending
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            {canFilter && (
              <>
                <DropdownMenuItem onClick={() => setShowFilter(!showFilter)}>
                  <Filter className="mr-2 h-4 w-4" />
                  {showFilter ? "Hide filter" : "Show filter"}
                </DropdownMenuItem>
                {isFiltered && (
                  <DropdownMenuItem onClick={clearFilter}>
                    <X className="mr-2 h-4 w-4" />
                    Clear filter
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            {canPin && (
              <>
                {!isPinned && (
                  <DropdownMenuItem onClick={() => column?.pin("left")}>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin to left
                  </DropdownMenuItem>
                )}
                {isPinned && (
                  <DropdownMenuItem onClick={() => column?.pin(false)}>
                    <PinOff className="mr-2 h-4 w-4" />
                    Unpin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem onClick={() => column?.toggleVisibility(false)}>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide column
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDeleteColumn(columnMeta.id);
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filter input */}
      {showFilter && canFilter && (
        <div className="flex items-center gap-1 pt-1">
          <Input
            type="text"
            value={filterValue}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder={`Filter ${columnMeta.name}...`}
            className="h-7 text-xs"
            onClick={(e) => e.stopPropagation()}
          />
          {filterValue && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={clearFilter}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

