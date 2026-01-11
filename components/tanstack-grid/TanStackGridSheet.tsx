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
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type Table,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { TanStackGridSheetProps, GridRow } from "./types";
import { RowIndexCell } from "./cells/RowIndexCell";
import { FileCellRenderer } from "./cells/FileCellRenderer";
import { ReviewWrapper } from "./cells/ReviewWrapper";
import { DataColumnHeader } from "./headers/DataColumnHeader";
import { AddColumnHeader } from "./headers/AddColumnHeader";
import { RowDetailPanel } from "./RowDetailPanel";
import { TableToolbar } from "./headers/TableToolbar";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import "./styles/tanstack-grid.css";

// Hooks
import {
  useGridState,
  useTableState,
  useGridCallbacks,
  useColumnDragDrop,
  useGridRows,
  useVirtualizedRows,
} from "./hooks";

// Column width constants
const DEFAULT_DATA_COL_WIDTH = 180;
const MIN_COL_WIDTH = 120;
const MAX_COL_WIDTH = 500;

export function TanStackGridSheet({
  schemaId,
  columns = [],
  jobs = [],
  selectedRowId,
  onSelectRow,
  onRowDoubleClick,
  onAddColumn,
  renderCellValue = () => null,
  getStatusIcon = () => null,
  renderStatusPill = () => null,
  onEditColumn = () => {},
  onDeleteColumn = () => {},
  onUpdateCell = () => {},
  onUpdateReviewStatus = () => {},
  onColumnRightClick = () => {},
  onOpenTableModal = () => {},
  visualGroups = [],
  expandedRowId,
  onToggleRowExpansion = () => {},
  onTableStateChange = () => {},
  enableTableStatePersistence = true,
}: TanStackGridSheetProps = {
  schemaId: undefined as unknown as string,
  columns: [],
  jobs: [],
  visualGroups: [],
  enableTableStatePersistence: true,
}) {
  const enableSearch = false;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const tableRef = useRef<Table<GridRow> | null>(null);

  // Validate props
  if (!Array.isArray(columns) || !Array.isArray(jobs)) {
    console.error("[TanStackGridSheet] Invalid props: columns or jobs not array", {
      columnsType: typeof columns,
      jobsType: typeof jobs,
    });
    return null;
  }

  // Use extracted hooks for state management
  const gridState = useGridState({
    schemaId,
    enableTableStatePersistence,
    onTableStateChange,
  });

  const tableState = useTableState(gridState);

  // Use extracted hooks for stable callbacks
  const stableCallbacks = useGridCallbacks({
    renderCellValue,
    getStatusIcon,
    renderStatusPill,
    onEditColumn,
    onDeleteColumn,
    onUpdateCell,
    onUpdateReviewStatus,
    onColumnRightClick,
    onOpenTableModal,
    onToggleRowExpansion,
    onAddColumn,
    onSelectRow,
    onRowDoubleClick,
  });

  // Use extracted hook for column drag/drop
  const {
    draggedColumn,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDrop,
    handleColumnDragEnd,
  } = useColumnDragDrop(tableRef);

  // Use extracted hook for row data transformation
  const rowData = useGridRows(jobs, columns, schemaId);

  // Stabilize visualGroups reference
  const stableVisualGroups = useMemo(() => visualGroups, [visualGroups.length]);

  const hasInputColumns = useMemo(
    () => columns.some((c) => c.type === "input"),
    [columns]
  );

  // Width calculations
  const pinnedColumnsWidth = 60 + (hasInputColumns ? 0 : 200);
  const addColumnWidth = 56;
  const dataColumnsWidth = useMemo(
    () => columns.length * DEFAULT_DATA_COL_WIDTH,
    [columns.length]
  );

  const baseTableWidth = pinnedColumnsWidth + dataColumnsWidth + addColumnWidth;
  const effectiveContainerWidth = containerWidth > 0 ? containerWidth : baseTableWidth;

  const fillerWidthRef = useRef(0);
  const fillerWidth =
    effectiveContainerWidth > baseTableWidth
      ? effectiveContainerWidth - baseTableWidth
      : 0;
  fillerWidthRef.current = fillerWidth;

  const tableWidth = baseTableWidth + fillerWidth;

  // Column definitions
  const columnDefs = useMemo<ColumnDef<GridRow>[]>(() => {
    const defs: ColumnDef<GridRow>[] = [
      // Row index column
      {
        id: "row-index",
        header: "#",
        size: 60,
        minSize: 60,
        maxSize: 60,
        enableResizing: false,
        cell: ({ row }) => {
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
                    stableCallbacks.stableOnToggleRowExpansion(row.original.__job.id);
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
              <RowIndexCell rowIndex={row.index} />
            </div>
          );
        },
      },
    ];

    // File column (if no input columns)
    if (!hasInputColumns) {
      defs.push({
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
              getStatusIcon={stableCallbacks.stableGetStatusIcon}
              renderStatusPill={stableCallbacks.stableRenderStatusPill}
            />
          </div>
        ),
      });
    }

    // Visual group processing
    const groupedFieldIds = new Set<string>();
    for (const group of stableVisualGroups) {
      for (const fieldId of group.fieldIds) {
        groupedFieldIds.add(fieldId);
      }
    }

    // Add visual group columns
    for (const group of stableVisualGroups) {
      const groupColumns = columns.filter((col) =>
        group.fieldIds.includes(col.id)
      );
      if (groupColumns.length === 0) continue;

      const children: ColumnDef<GridRow>[] = groupColumns.map((column) => ({
        id: column.id,
        header: ({ column: col }) => (
          <div
            draggable
            onDragStart={(e) => handleColumnDragStart(column.id, e)}
            onDragOver={handleColumnDragOver}
            onDrop={(e) => handleColumnDrop(column.id, e)}
            onDragEnd={handleColumnDragEnd}
            className={cn(draggedColumn === column.id && "opacity-50")}
          >
            <DataColumnHeader
              column={col}
              columnMeta={column}
              onEditColumn={stableCallbacks.stableOnEditColumn}
              onDeleteColumn={stableCallbacks.stableOnDeleteColumn}
              onColumnRightClick={stableCallbacks.stableOnColumnRightClick}
            />
          </div>
        ),
        size: DEFAULT_DATA_COL_WIDTH,
        minSize: MIN_COL_WIDTH,
        maxSize: MAX_COL_WIDTH,
        enableResizing: false,
        cell: ({ row, column }) => {
          const job = row.original.__job;
          const columnMeta = columns.find((c) => c.id === column.id);
          if (!columnMeta) return null;

          return (
            <ReviewWrapper
              job={job}
              columnId={column.id}
              onUpdateReviewStatus={stableCallbacks.stableOnUpdateReviewStatus}
            >
              {stableCallbacks.stableRenderCellValue(columnMeta, job, {
                mode:
                  columnMeta.type === "object" ||
                  columnMeta.type === "list" ||
                  columnMeta.type === "table"
                    ? "summary"
                    : "interactive",
                onUpdateCell: stableCallbacks.stableOnUpdateCell,
                onOpenTableModal: stableCallbacks.stableOnOpenTableModal,
              })}
            </ReviewWrapper>
          );
        },
      }));

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
        header: ({ column: col }) => (
          <div
            draggable
            onDragStart={(e) => handleColumnDragStart(column.id, e)}
            onDragOver={handleColumnDragOver}
            onDrop={(e) => handleColumnDrop(column.id, e)}
            onDragEnd={handleColumnDragEnd}
            className={cn(draggedColumn === column.id && "opacity-50")}
          >
            <DataColumnHeader
              column={col}
              columnMeta={column}
              onEditColumn={stableCallbacks.stableOnEditColumn}
              onDeleteColumn={stableCallbacks.stableOnDeleteColumn}
              onColumnRightClick={stableCallbacks.stableOnColumnRightClick}
            />
          </div>
        ),
        size: DEFAULT_DATA_COL_WIDTH,
        minSize: MIN_COL_WIDTH,
        maxSize: MAX_COL_WIDTH,
        enableResizing: false,
        cell: ({ row, column }) => {
          const job = row.original.__job;
          const columnMeta = columns.find((c) => c.id === column.id);
          if (!columnMeta) return null;

          return (
            <ReviewWrapper
              job={job}
              columnId={column.id}
              onUpdateReviewStatus={stableCallbacks.stableOnUpdateReviewStatus}
            >
              {stableCallbacks.stableRenderCellValue(columnMeta, job, {
                mode:
                  columnMeta.type === "object" ||
                  columnMeta.type === "list" ||
                  columnMeta.type === "table"
                    ? "summary"
                    : "interactive",
                onUpdateCell: stableCallbacks.stableOnUpdateCell,
                onOpenTableModal: stableCallbacks.stableOnOpenTableModal,
              })}
            </ReviewWrapper>
          );
        },
      });
    }

    // Filler column
    const currentFillerWidth = fillerWidthRef.current;
    if (currentFillerWidth > 0) {
      defs.push({
        id: "bb-spacer",
        header: () => null,
        size: currentFillerWidth,
        minSize: currentFillerWidth,
        maxSize: currentFillerWidth,
        enableResizing: false,
        enableSorting: false,
        cell: () => null,
      });
    }

    // Add column button
    defs.push({
      id: "bb-add-field",
      header: () => <AddColumnHeader onAddColumn={stableCallbacks.stableOnAddColumn} />,
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
    stableVisualGroups,
    stableCallbacks,
    hasInputColumns,
    draggedColumn,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDrop,
    handleColumnDragEnd,
    expandedRowId,
  ]);

  // Row model getters
  const getRowId = useCallback((row: GridRow) => row.__job.id, []);
  const coreRowModel = useMemo(() => getCoreRowModel(), []);
  const sortedRowModel = useMemo(() => getSortedRowModel(), []);
  const filteredRowModel = useMemo(() => getFilteredRowModel(), []);

  const defaultColumnConfig = useMemo(
    () => ({
      size: DEFAULT_DATA_COL_WIDTH,
      minSize: MIN_COL_WIDTH,
      maxSize: MAX_COL_WIDTH,
    }),
    []
  );

  // Table options
  const tableOptions = useMemo(
    () => ({
      data: rowData,
      columns: columnDefs,
      getCoreRowModel: coreRowModel,
      getSortedRowModel: sortedRowModel,
      getFilteredRowModel: filteredRowModel,
      getRowId,
      state: tableState,
      onSortingChange: gridState.setSorting,
      onColumnFiltersChange: gridState.setColumnFilters,
      onColumnOrderChange: gridState.setColumnOrder,
      onColumnVisibilityChange: gridState.setColumnVisibility,
      onColumnPinningChange: gridState.setColumnPinning,
      onGlobalFilterChange: enableSearch ? gridState.setGlobalFilter : undefined,
      enableColumnResizing: false,
      enableSorting: true,
      enableFilters: true,
      enableColumnOrdering: true,
      enableColumnPinning: true,
      enableGlobalFilter: enableSearch,
      defaultColumn: defaultColumnConfig,
    }),
    [
      rowData,
      columnDefs,
      getRowId,
      tableState,
      gridState,
      defaultColumnConfig,
      coreRowModel,
      sortedRowModel,
      filteredRowModel,
      enableSearch,
    ]
  );

  // Table instance
  const table = useReactTable(tableOptions);
  tableRef.current = table;

  // Memoized table data
  const tableRows = useMemo(() => table.getRowModel().rows, [table, rowData]);
  const headerGroups = useMemo(() => table.getHeaderGroups(), [table, columnDefs]);
  const leafColumns = useMemo(() => table.getAllLeafColumns(), [table, columnDefs]);

  // Virtualized rows
  const virtualizedRows = useVirtualizedRows(tableRows, expandedRowId);

  // Virtualizer
  const virtualizerOptions = useMemo(
    () => ({
      count: virtualizedRows.length,
      getScrollElement: () => containerRef.current,
      estimateSize: (index: number) =>
        virtualizedRows[index]?.type === "detail" ? 320 : 64,
      getItemKey: (index: number) => virtualizedRows[index]?.key ?? index,
      overscan: 8,
      measureElement: (element: Element | undefined) =>
        element instanceof HTMLElement ? element.getBoundingClientRect().height : 0,
    }),
    [virtualizedRows]
  );

  const rowVirtualizer = useVirtualizer(virtualizerOptions);
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalVirtualSize = rowVirtualizer.getTotalSize();

  // Layout calculations
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalVirtualSize - virtualItems[virtualItems.length - 1].end
      : 0;
  const hasRows = virtualizedRows.length > 0;
  const leafColumnCount = Math.max(leafColumns.length, 1);

  // Row click handlers
  const handleRowClick = useCallback(
    (row: GridRow) => {
      stableCallbacks.stableOnSelectRow(row.__job.id);
    },
    [stableCallbacks]
  );

  const handleRowDoubleClick = useCallback(
    (row: GridRow) => {
      stableCallbacks.stableOnSelectRow(row.__job.id);
      stableCallbacks.stableOnRowDoubleClick(row.__job);
    },
    [stableCallbacks]
  );

  // Container width tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let resizeTimeout: NodeJS.Timeout | null = null;

    const updateWidth = () => {
      const newWidth = el.clientWidth;
      setContainerWidth((prev) => {
        const diff = Math.abs(newWidth - prev);
        return diff > 20 ? newWidth : prev;
      });
    };

    updateWidth();

    const ro = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateWidth, 250);
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, []);

  // Search handler (disabled)
  const handleSearchResults = useCallback(() => {}, []);

  return (
    <div className="tanstack-grid-wrapper flex h-full w-full flex-col">
      <TableToolbar
        table={table}
        schemaId={schemaId}
        onSearchResults={handleSearchResults}
        enableSearch={enableSearch}
      />

      <div ref={containerRef} className="tanstack-grid flex-1 w-full overflow-auto min-h-0">
        <table
          className="border-collapse"
          style={{
            width: `${tableWidth}px`,
            minWidth: `${baseTableWidth}px`,
            tableLayout: "fixed",
          }}
        >
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const headerWidth = header.getSize();
                  const headerStyle: CSSProperties = {
                    position: "relative",
                    width: `${headerWidth}px`,
                  };

                  const isPinnedRight = header.id === "bb-add-field";
                  const isFillerColumn = header.id === "bb-spacer";
                  const finalStyle: CSSProperties = isPinnedRight
                    ? { ...headerStyle, position: "sticky" as const, right: 0, zIndex: 30 }
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
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
            {!hasRows ? (
              <tr>
                <td colSpan={leafColumnCount} className="tanstack-cell text-center py-8">
                  <div className="empty-state">
                    No extraction results yet. Upload documents to get started.
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {paddingTop > 0 && (
                  <tr className="tanstack-virtual-padding" aria-hidden="true">
                    <td
                      colSpan={leafColumnCount}
                      style={{ height: `${paddingTop}px`, padding: 0, border: "none" }}
                    />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const item = virtualizedRows[virtualRow.index];
                  if (!item) return null;

                  if (item.type === "row") {
                    const { row } = item;
                    const visibleCells = row.getVisibleCells();
                    const isSelected = row.original.__job.id === selectedRowId;
                    const isExpanded = row.original.__job.id === expandedRowId;
                    const zebraClass =
                      row.index % 2 === 1 ? "tanstack-data-row--striped" : undefined;

                    return (
                      <tr
                        key={item.key}
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        aria-expanded={isExpanded}
                        onClick={() => handleRowClick(row.original)}
                        onDoubleClick={() => handleRowDoubleClick(row.original)}
                        className={cn(
                          "tanstack-data-row cursor-pointer transition-colors hover:bg-muted/50",
                          zebraClass,
                          isSelected && "selected bg-primary/10"
                        )}
                      >
                        {visibleCells.map((cell) => {
                          const isPinnedRight = cell.column.id === "bb-add-field";
                          const isFillerColumn = cell.column.id === "bb-spacer";
                          const cellWidth = cell.column.getSize();
                          const cellStyle: CSSProperties = {
                            width: `${cellWidth}px`,
                            ...(isPinnedRight && {
                              position: "sticky",
                              right: 0,
                              zIndex: 25,
                            }),
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
                    );
                  }

                  const detailRow = item.row;

                  return (
                    <RowDetailPanel
                      key={item.key}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      className="tanstack-detail-row"
                      job={detailRow.original.__job}
                      columns={columns}
                      visibleCells={detailRow.getVisibleCells()}
                      onUpdateCell={stableCallbacks.stableOnUpdateCell}
                    />
                  );
                })}
                {paddingBottom > 0 && (
                  <tr className="tanstack-virtual-padding" aria-hidden="true">
                    <td
                      colSpan={leafColumnCount}
                      style={{ height: `${paddingBottom}px`, padding: 0, border: "none" }}
                    />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
