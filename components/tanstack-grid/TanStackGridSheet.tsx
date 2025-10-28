"use client";

import {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { TanStackGridSheetProps, GridRow } from "./types";
import { RowIndexCell } from "./cells/RowIndexCell";
import { FileCellRenderer } from "./cells/FileCellRenderer";
import { ReviewWrapper } from "./cells/ReviewWrapper";
import { DataColumnHeader } from "./headers/DataColumnHeader";
import { AddColumnHeader } from "./headers/AddColumnHeader";
import { RowDetailPanel } from "./RowDetailPanel";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import "./styles/tanstack-grid.css";

const DEFAULT_DATA_COL_WIDTH = 220;

export function TanStackGridSheet({
  columns,
  jobs,
  selectedRowId,
  onSelectRow,
  onRowDoubleClick,
  onAddColumn,
  renderCellValue,
  getStatusIcon,
  renderStatusPill,
  onEditColumn,
  onDeleteColumn,
  onUpdateCell,
  onUpdateReviewStatus,
  onColumnRightClick,
  onOpenTableModal,
  visualGroups = [],
  expandedRowId,
  onToggleRowExpansion,
}: TanStackGridSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pinPlusRight, setPinPlusRight] = useState(false);
  const [tableMinWidth, setTableMinWidth] = useState<number>(0);

  // Transform jobs to grid rows with stable reference
  const rowData = useMemo<GridRow[]>(() => {
    return jobs.map((job) => {
      const valueMap: Record<string, unknown> = {};
      for (const col of columns) {
        valueMap[col.id] = job.results?.[col.id] ?? null;
      }
      return {
        __job: job,
        fileName: job.fileName,
        status: job.status,
        ...valueMap,
      };
    });
  }, [columns, jobs]);

  // Define column definitions
  const columnDefs = useMemo<ColumnDef<GridRow>[]>(() => {
    const defs: ColumnDef<GridRow>[] = [
      // Row index column with expand/collapse icon
      {
        id: "row-index",
        header: "#",
        size: 60,
        minSize: 56,
        maxSize: 60,
        enableResizing: false,
        cell: ({ row }) => {
          const rowIndex = rowData.findIndex(
            (r) => r.__job.id === row.original.__job.id
          );
          const isExpanded = row.original.__job.id === expandedRowId;
          const hasAdvancedFields = columns.some(
            (col) => col.type === "object" || col.type === "list" || col.type === "table"
          );
          
          return (
            <div className="flex items-center justify-center gap-1">
              {hasAdvancedFields && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRowExpansion(row.original.__job.id);
                  }}
                  className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                  title={isExpanded ? "Collapse row" : "Expand row"}
                >
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>
              )}
              <RowIndexCell rowIndex={rowIndex} />
            </div>
          );
        },
      },
      // File column
      {
        id: "file-name",
        header: "File",
        size: 220,
        minSize: 200,
        maxSize: 260,
        enableResizing: true,
        cell: ({ row }) => (
          <div className="ag-cell-wrap-text">
            <FileCellRenderer
              row={row.original}
              getStatusIcon={getStatusIcon}
              renderStatusPill={renderStatusPill}
            />
          </div>
        ),
      },
    ];

    // Add data columns with visual grouping support
    const groupedFieldIds = new Set<string>();
    const fieldIdToGroup = new Map();

    for (const group of visualGroups) {
      for (const fieldId of group.fieldIds) {
        groupedFieldIds.add(fieldId);
        fieldIdToGroup.set(fieldId, group);
      }
    }

    // Add visual group columns
    for (const group of visualGroups) {
      const groupColumns = columns.filter((col) =>
        group.fieldIds.includes(col.id)
      );
      if (groupColumns.length === 0) continue;

      const children: ColumnDef<GridRow>[] = groupColumns.map((column) => ({
        id: column.id,
        header: ({ column: col }) => (
          <DataColumnHeader
            columnMeta={column}
            onEditColumn={onEditColumn}
            onDeleteColumn={onDeleteColumn}
            onColumnRightClick={onColumnRightClick}
          />
        ),
        size: DEFAULT_DATA_COL_WIDTH,
        minSize: 140,
        enableResizing: true,
        cell: ({ row, column }) => {
          const job = row.original.__job;
          const columnMeta = columns.find((c) => c.id === column.id);
          if (!columnMeta) return null;

          return (
            <ReviewWrapper
              job={job}
              columnId={column.id}
              onUpdateReviewStatus={onUpdateReviewStatus}
              onDoubleClick={() => {
                if (
                  columnMeta.type === "object" ||
                  columnMeta.type === "table" ||
                  columnMeta.type === "list"
                )
                  return;
              }}
            >
              {renderCellValue(columnMeta, job, {
                mode: columnMeta.type === 'object' || columnMeta.type === 'list' || columnMeta.type === 'table' 
                  ? 'summary' 
                  : 'interactive',
                onUpdateCell,
                onOpenTableModal,
              })}
            </ReviewWrapper>
          );
        },
      }));

      // Add group
      defs.push({
        id: `group-${group.id}`,
        header: group.name,
        columns: children,
      });
    }

    // Add ungrouped columns
    for (const column of columns) {
      if (groupedFieldIds.has(column.id)) continue;

      defs.push({
        id: column.id,
        header: () => (
          <DataColumnHeader
            columnMeta={column}
            onEditColumn={onEditColumn}
            onDeleteColumn={onDeleteColumn}
            onColumnRightClick={onColumnRightClick}
          />
        ),
        size: DEFAULT_DATA_COL_WIDTH,
        minSize: 140,
        enableResizing: true,
        cell: ({ row, column }) => {
          const job = row.original.__job;
          const columnMeta = columns.find((c) => c.id === column.id);
          if (!columnMeta) return null;

          return (
            <ReviewWrapper
              job={job}
              columnId={column.id}
              onUpdateReviewStatus={onUpdateReviewStatus}
            >
              {renderCellValue(columnMeta, job, {
                mode: columnMeta.type === 'object' || columnMeta.type === 'list' || columnMeta.type === 'table' 
                  ? 'summary' 
                  : 'interactive',
                onUpdateCell,
                onOpenTableModal,
              })}
            </ReviewWrapper>
          );
        },
      });
    }

    // Add column button
    defs.push({
      id: "bb-add-field",
      header: () => <AddColumnHeader onAddColumn={onAddColumn} />,
      size: 56,
      minSize: 48,
      maxSize: 64,
      enableResizing: false,
      cell: () => null,
    });

    return defs;
  }, [
    columns,
    visualGroups,
    rowData,
    onEditColumn,
    onDeleteColumn,
    onAddColumn,
    onUpdateReviewStatus,
    onColumnRightClick,
    getStatusIcon,
    renderStatusPill,
    renderCellValue,
  ]);


  // Table instance
  const table = useReactTable({
    data: rowData,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.__job.id,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  // Handle row clicks
  const handleRowClick = useCallback(
    (row: GridRow) => {
      onSelectRow(row.__job.id);
    },
    [onSelectRow]
  );

  const handleRowDoubleClick = useCallback(
    (row: GridRow) => {
      onSelectRow(row.__job.id);
      onRowDoubleClick?.(row.__job);
    },
    [onSelectRow, onRowDoubleClick]
  );

  // Calculate total table width and handle column overflow
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const calculateTableWidth = () => {
      const pinnedLeftWidth = 60 + 220; // row-index + file columns
      const dataColsWidth = Math.max(columns.length, 1) * DEFAULT_DATA_COL_WIDTH;
      const plusColWidth = 56; // add column button
      const totalNeeded = pinnedLeftWidth + dataColsWidth + plusColWidth;
      
      setTableMinWidth(totalNeeded);
      setPinPlusRight(totalNeeded > el.clientWidth);
    };
    
    calculateTableWidth();
    
    const ro = new ResizeObserver(() => {
      calculateTableWidth();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [columns.length]);

  if (rowData.length === 0) {
    return (
      <div className="tanstack-grid">
        <div className="empty-state">
          No extraction results yet. Upload documents to get started.
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="tanstack-grid h-full w-full">
      <table 
        className="border-collapse"
        style={{ minWidth: `${tableMinWidth}px`, width: '100%' }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const headerStyle: CSSProperties = {
                  position: "relative",
                  ...(header.colSpan === 1 ? { width: header.getSize() } : {}),
                };
                const canResize =
                  header.colSpan === 1 && header.column.getCanResize();

                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    rowSpan={header.rowSpan}
                    style={headerStyle}
                    className={cn(
                      "tanstack-header",
                      header.id === "row-index" && "pinned-left",
                      header.id === "bb-add-field" && "pinned-right"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {canResize && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "tanstack-resizer",
                          header.column.getIsResizing() && "is-resizing"
                        )}
                        title="Drag to resize"
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isSelected = row.original.__job.id === selectedRowId;
            const isExpanded = row.original.__job.id === expandedRowId;
            return (
              <>
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row.original)}
                  onDoubleClick={() => handleRowDoubleClick(row.original)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    isSelected && "selected bg-primary/10"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={cn(
                        "tanstack-cell",
                        cell.column.id === "row-index" && "pinned-left",
                        cell.column.id === "bb-add-field" && "pinned-right"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {isExpanded && (
                  <RowDetailPanel
                    job={row.original.__job}
                    columns={columns}
                    visibleCells={row.getVisibleCells()}
                    onUpdateCell={onUpdateCell}
                  />
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
