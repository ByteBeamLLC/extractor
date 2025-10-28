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

// Industry standard column widths - user resizable with auto-expand
const DEFAULT_DATA_COL_WIDTH = 180; // Starting width for data columns
const MIN_COL_WIDTH = 120; // Minimum width for readability
const MAX_COL_WIDTH = 500; // Maximum width - prevent excessive expansion

// Helper to calculate optimal column width based on content
function calculateColumnWidth(
  column: any,
  jobs: any[],
  minWidth: number = MIN_COL_WIDTH,
  maxWidth: number = MAX_COL_WIDTH
): number {
  // Base width on column name
  const headerLength = column.name?.length || 0;
  const headerWidth = Math.max(minWidth, Math.min(headerLength * 9 + 70, maxWidth));
  
  // Calculate content width from actual data (sample first 10 rows for performance)
  let maxContentWidth = headerWidth;
  const sampleSize = Math.min(jobs.length, 10);
  
  for (let i = 0; i < sampleSize; i++) {
    const job = jobs[i];
    const value = job.results?.[column.id];
    if (value == null || value === '-') continue;
    
    let contentLength = 0;
    
    if (column.type === 'object') {
      // For objects, estimate based on field count and sample values
      const obj = value as Record<string, any>;
      const nonNullFields = Object.entries(obj).filter(([_, v]) => v != null && v !== '-');
      const fieldCount = nonNullFields.length;
      
      // Estimate width: "N data" or field preview
      if (fieldCount === 0) {
        contentLength = 80;
      } else {
        // Sample first value to estimate
        const sampleValue = nonNullFields[0]?.[1];
        const sampleStr = sampleValue ? String(sampleValue).slice(0, 30) : '';
        contentLength = Math.max(
          fieldCount * 12 + 80, // "N data" + icon space
          sampleStr.length * 7 + 100 // Sample content
        );
      }
    } else if (column.type === 'list') {
      // For lists, show item count
      const items = Array.isArray(value) ? value : [];
      contentLength = Math.max(100, items.length.toString().length * 8 + 100); // "N items"
    } else if (column.type === 'table') {
      // For tables, show row count
      const rows = Array.isArray(value) ? value : [];
      contentLength = Math.max(100, rows.length.toString().length * 8 + 100); // "N items"
    } else if (column.type === 'single_select' || column.type === 'multi_select') {
      // For select fields, base on option text length
      const stringValue = Array.isArray(value) ? value.join(', ') : String(value);
      contentLength = Math.min(stringValue.length * 8 + 60, maxWidth);
    } else {
      // For primitives (string, number, date, etc), base on string length
      const stringValue = String(value);
      const displayLength = Math.min(stringValue.length, 80); // Cap at 80 chars for calculation
      contentLength = displayLength * 8 + 50;
    }
    
    maxContentWidth = Math.max(maxContentWidth, contentLength);
  }
  
  // Return width within constraints with padding
  return Math.max(minWidth, Math.min(Math.ceil(maxContentWidth + 40), maxWidth));
}

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
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [columnSizes, setColumnSizes] = useState<Record<string, number>>({});

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

  // Calculate optimal column widths when data changes
  useEffect(() => {
    if (jobs.length === 0) return;
    
    const newSizes: Record<string, number> = {};
    for (const col of columns) {
      const calculatedWidth = calculateColumnWidth(col, jobs);
      newSizes[col.id] = calculatedWidth;
    }
    setColumnSizes(newSizes);
  }, [columns, jobs]);

  const pinnedColumnsWidth = 60 + 200; // row index + file columns
  const addColumnWidth = 56;
  
  // Calculate total width of data columns using dynamic sizes
  const dataColumnsWidth = useMemo(() => {
    return columns.reduce((sum, col) => {
      return sum + (columnSizes[col.id] || DEFAULT_DATA_COL_WIDTH);
    }, 0);
  }, [columns, columnSizes]);
  
  const baseTableWidth = pinnedColumnsWidth + dataColumnsWidth + addColumnWidth;
  const effectiveContainerWidth =
    containerWidth > 0 ? containerWidth : baseTableWidth;
  const fillerWidth =
    effectiveContainerWidth > baseTableWidth
      ? effectiveContainerWidth - baseTableWidth
      : 0;
  const tableWidth = baseTableWidth + fillerWidth;
  // Define column definitions
  const columnDefs = useMemo<ColumnDef<GridRow>[]>(() => {
    const defs: ColumnDef<GridRow>[] = [
      // Row index column with expand/collapse icon - FIXED
      {
        id: "row-index",
        header: "#",
        size: 60,
        minSize: 60,
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
      // File column - FIXED width
      {
        id: "file-name",
        header: "File",
        size: 200,
        minSize: 200,
        maxSize: 200,
        enableResizing: false,
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
        size: columnSizes[column.id] || DEFAULT_DATA_COL_WIDTH,
        minSize: MIN_COL_WIDTH,
        maxSize: MAX_COL_WIDTH,
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
        size: columnSizes[column.id] || DEFAULT_DATA_COL_WIDTH,
        minSize: MIN_COL_WIDTH,
        maxSize: MAX_COL_WIDTH,
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

    // Add filler column to keep the add button anchored to the far right when there's extra space
    if (fillerWidth > 0) {
      defs.push({
        id: "bb-spacer",
        header: () => null,
        size: fillerWidth,
        minSize: fillerWidth,
        maxSize: fillerWidth,
        enableResizing: false,
        enableSorting: false,
        cell: () => null,
      });
    }

    // Add column button - always at the end, sticky to right
    defs.push({
      id: "bb-add-field",
      header: () => <AddColumnHeader onAddColumn={onAddColumn} />,
      size: 56,
      minSize: 56,
      maxSize: 56,
      enableResizing: false,
      enableSorting: false,
      cell: () => null,
    });

    return defs;
  }, [
    columns,
    columnSizes,
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
    fillerWidth,
    expandedRowId,
    onToggleRowExpansion,
    onUpdateCell,
    onOpenTableModal,
  ]);


  // Table instance with resizable columns
  const table = useReactTable({
    data: rowData,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.__job.id,
    enableColumnResizing: true, // Enable manual column resizing
    columnResizeMode: 'onChange',
    defaultColumn: {
      size: DEFAULT_DATA_COL_WIDTH,
      minSize: MIN_COL_WIDTH,
      maxSize: MAX_COL_WIDTH,
    },
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

    const updateWidth = () => {
      setContainerWidth(el.clientWidth);
    };

    updateWidth();

    const ro = new ResizeObserver(() => {
      updateWidth();
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={containerRef} className="tanstack-grid h-full w-full">
      <table
        className="border-collapse"
        style={{
          width: `${tableWidth}px`,
          minWidth: `${baseTableWidth}px`,
          tableLayout: "fixed",
        }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const headerWidth = header.getSize();
                const headerStyle: CSSProperties = {
                  position: "relative",
                  width: `${headerWidth}px`,
                };

                const isPinnedRight = header.id === "bb-add-field";
                const isFillerColumn = header.id === "bb-spacer";
                const finalStyle = isPinnedRight 
                  ? { ...headerStyle, position: 'sticky', right: 0, zIndex: 30 }
                  : headerStyle;
                
                const canResize = header.colSpan === 1 && header.column.getCanResize();

                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    rowSpan={header.rowSpan}
                    style={finalStyle}
                    className={cn(
                      "tanstack-header",
                      header.id === "row-index" && "pinned-left",
                      isPinnedRight && "pinned-right",
                      isFillerColumn && "filler-header"
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
                        title="Drag to resize column"
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columnDefs.length} className="tanstack-cell text-center py-8">
                <div className="empty-state">
                  No extraction results yet. Upload documents to get started.
                </div>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => {
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
                  {row.getVisibleCells().map((cell) => {
                    const isPinnedRight = cell.column.id === "bb-add-field";
                    const isFillerColumn = cell.column.id === "bb-spacer";
                    const cellWidth = cell.column.getSize();
                    const cellStyle: CSSProperties = {
                      width: `${cellWidth}px`,
                      ...(isPinnedRight && { position: 'sticky', right: 0, zIndex: 25 }),
                    };
                    
                    return (
                      <td
                        key={cell.id}
                        style={cellStyle}
                        className={cn(
                          "tanstack-cell",
                          cell.column.id === "row-index" && "pinned-left",
                          isPinnedRight && "pinned-right",
                          isFillerColumn && "filler-cell"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
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
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
