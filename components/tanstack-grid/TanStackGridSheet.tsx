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
  type Row,
  type SortingState,
  type ColumnFiltersState,
  type ColumnOrderState,
  type VisibilityState,
  type ColumnPinningState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/lib/supabase/types";
import type { TanStackGridSheetProps, GridRow } from "./types";
import type { TableState } from "./utils/tableState";
import { loadTableState, createDebouncedSave } from "@/lib/supabase/tableState";
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

// Industry standard column widths - user resizable with auto-expand
const DEFAULT_DATA_COL_WIDTH = 180; // Starting width for data columns
const MIN_COL_WIDTH = 120; // Minimum width for readability
const MAX_COL_WIDTH = 500; // Maximum width - prevent excessive expansion
const EMPTY_SEARCH_RESULTS: string[] = [];

type VirtualizedGridRow =
  | {
    key: string;
    type: "row";
    row: Row<GridRow>;
  }
  | {
    key: string;
    type: "detail";
    row: Row<GridRow>;
  };

// Helper to calculate optimal column width based on content
function calculateColumnWidth(
  column: any,
  jobs: any[],
  minWidth: number = DEFAULT_DATA_COL_WIDTH,
  maxWidth: number = MAX_COL_WIDTH
): number {
  // Calculate width needed for header text to be fully visible
  const headerLength = column.name?.length || 0;
  // 8px per character is a safe estimate for typical UI fonts
  const textWidth = headerLength * 8;
  // Space for drag handle, sort icon, menu, padding. Increased to ensure full visibility.
  const headerUIElements = 80;
  const calculatedHeaderWidth = textWidth + headerUIElements;

  // Ensure width is at least the default/min width, but allows expansion up to max
  // The base width is determined by the header text or the minimum width, whichever is larger
  let optimalWidth = Math.max(minWidth, Math.min(calculatedHeaderWidth, maxWidth));

  // If we have data, we can check if content needs more space, but header readability is priority
  if (jobs.length > 0) {
    // Calculate content width from actual data (sample first 10 rows for performance)
    let maxContentWidth = optimalWidth;
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

    // Use the larger of header width or content width, capped at max
    optimalWidth = Math.max(optimalWidth, Math.min(Math.ceil(maxContentWidth + 40), maxWidth));
  }

  return optimalWidth;
}

export function TanStackGridSheet({
  schemaId,
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
  onTableStateChange,
}: TanStackGridSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [columnSizes, setColumnSizes] = useState<Record<string, number>>({});
  const userResizedColumnsRef = useRef<Set<string>>(new Set()); // Track which columns user manually resized
  const supabase = useSupabaseClient<Database>();

  // Table state management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: [],
  });
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedSaveRef = useRef<((state: TableState) => void) | null>(null);
  const isInitialLoadRef = useRef<boolean>(true); // Flag to prevent auto-save during initial load
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [searchStateBySchema, setSearchStateBySchema] = useState<
    Record<string, { query: string; jobIds: string[] }>
  >({});

  const hasInputColumns = useMemo(() => columns.some((c) => c.type === "input"), [columns]);

  const currentSearchState = schemaId ? searchStateBySchema[schemaId] : undefined;
  const searchMatchingIds = currentSearchState?.jobIds ?? EMPTY_SEARCH_RESULTS;
  const currentSearchQuery = currentSearchState?.query ?? "";

  const handleSearchResults = useCallback(
    ({ jobIds, query }: { jobIds: string[]; query: string }) => {
      if (!schemaId) return;
      setSearchStateBySchema((prev) => ({
        ...prev,
        [schemaId]: { jobIds, query },
      }));
      setGlobalFilter(query);
    },
    [schemaId]
  );

  // Debug logging for search state changes (disabled to reduce console noise)
  // useEffect(() => {
  //   console.log(`[TanStackGridSheet] search state for schema ${schemaId}:`, {
  //     query: currentSearchQuery,
  //     matchCount: searchMatchingIds.length,
  //   });
  //   console.log(`[TanStackGridSheet] globalFilter:`, globalFilter);
  //   console.log(`[TanStackGridSheet] Current table state:`, {
  //     sorting: table?.getState?.()?.sorting,
  //     columnFilters: table?.getState?.()?.columnFilters,
  //     globalFilter: table?.getState?.()?.globalFilter,
  //   });
  // }, [schemaId, searchMatchingIds, currentSearchQuery, globalFilter]);

  // Transform jobs to grid rows with stable reference
  const rowData = useMemo<GridRow[]>(() => {
    return jobs.map((job) => {
      const valueMap: Record<string, unknown> = {};
      for (const col of columns) {
        if (col.type === "input") {
          const doc = job.inputDocuments?.[col.id];
          valueMap[col.id] = doc?.fileName ?? doc?.textValue ?? null;
        } else {
          valueMap[col.id] = job.results?.[col.id] ?? null;
        }
      }
      return {
        __job: job,
        fileName: job.fileName,
        status: job.status,
        ...valueMap,
      };
    });
  }, [columns, jobs]);

  const hasActiveSearch = currentSearchQuery.trim().length > 0;

  const filteredRowData = useMemo<GridRow[]>(() => {
    if (!hasActiveSearch) {
      return rowData;
    }

    if (searchMatchingIds.length === 0) {
      return [];
    }

    const matchSet = new Set(searchMatchingIds);
    return rowData.filter((row) => matchSet.has(row.__job.id));
  }, [rowData, searchMatchingIds, hasActiveSearch]);

  // Load table state from Supabase when schema changes
  useEffect(() => {
    if (!schemaId) return;

    let isMounted = true;
    // Mark as initial load to prevent auto-save during load
    isInitialLoadRef.current = true;

    const load = async () => {
      try {
        const state = await loadTableState(supabase, schemaId);

        // Only update if component is still mounted
        if (!isMounted) return;
        
        // If no state exists, mark initial load as complete
        if (!state) {
          isInitialLoadRef.current = false;
          return;
        }

        // Batch all state updates together using React's automatic batching
        // This prevents multiple re-renders and potential infinite loops
        if (state.sorting) setSorting(state.sorting);
        if (state.columnFilters) setColumnFilters(state.columnFilters);
        if (state.columnOrder) setColumnOrder(state.columnOrder);
        if (state.columnVisibility) setColumnVisibility(state.columnVisibility);
        if (state.columnPinning) setColumnPinning(state.columnPinning);
        if (state.columnSizes) {
          setColumnSizes(state.columnSizes);
          // Mark all loaded column sizes as user-resized to prevent recalculation
          for (const colId of Object.keys(state.columnSizes)) {
            userResizedColumnsRef.current.add(colId);
          }
        }
        if (state.globalFilter !== undefined) setGlobalFilter(state.globalFilter);

        // Mark initial load as complete using queueMicrotask to ensure it happens
        // after all state updates are processed by React
        queueMicrotask(() => {
          if (isMounted) {
            isInitialLoadRef.current = false;
          }
        });
      } catch (error) {
        console.error("[TanStackGrid] Error loading table state:", error);
        // Silently fail - use default state instead
        isInitialLoadRef.current = false;
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [schemaId, supabase]);

  // Initialize debounced save function
  useEffect(() => {
    if (!schemaId) return;

    debouncedSaveRef.current = createDebouncedSave(supabase, schemaId, 500);

    return () => {
      // Flush any pending saves on unmount
      if (debouncedSaveRef.current && typeof (debouncedSaveRef.current as any).flush === 'function') {
        (debouncedSaveRef.current as any).flush();
      }
    };
  }, [schemaId, supabase]);

  // Auto-save table state when it changes
  // Note: We save columnSizes separately to avoid loops with auto-calculated widths
  const userColumnSizesRef = useRef<Record<string, number>>({});
  
  useEffect(() => {
    // Skip auto-save during initial load to prevent infinite loops
    if (!debouncedSaveRef.current || isInitialLoadRef.current) return;

    // Only save user-resized column widths, not auto-calculated ones
    const userResizedSizes: Record<string, number> = {};
    for (const colId of userResizedColumnsRef.current) {
      if (columnSizes[colId] !== undefined) {
        userResizedSizes[colId] = columnSizes[colId];
      }
    }
    
    // Only update ref if sizes changed
    const sizesChanged = JSON.stringify(userResizedSizes) !== JSON.stringify(userColumnSizesRef.current);
    if (sizesChanged) {
      userColumnSizesRef.current = userResizedSizes;
    }

    const state: TableState = {
      sorting,
      columnFilters,
      columnOrder,
      columnVisibility,
      columnPinning,
      columnSizes: userResizedSizes, // Only save user-resized widths
      globalFilter,
    };

    debouncedSaveRef.current(state);

    // Notify parent if callback provided
    if (onTableStateChange) {
      onTableStateChange(state);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting, columnFilters, columnOrder, columnVisibility, columnPinning, globalFilter]);
  // Note: onTableStateChange and columnSizes are intentionally excluded from deps to prevent infinite loops
  // columnSizes changes are tracked separately via userResizedColumnsRef

  // Calculate optimal column widths when data changes
  useEffect(() => {
    // We calculate widths even if jobs is empty, to ensure headers are sized correctly
    // based on their text length.

    const newSizes: Record<string, number> = {};
    for (const col of columns) {
      // Only auto-calculate if user hasn't manually resized this column
      if (!userResizedColumnsRef.current.has(col.id)) {
        const calculatedWidth = calculateColumnWidth(col, jobs);
        newSizes[col.id] = calculatedWidth;
      }
    }

    // Only update state if sizes actually changed to prevent infinite re-renders
    setColumnSizes((prevSizes) => {
      // Merge with previous sizes (keeping user-resized columns)
      const mergedSizes = { ...prevSizes };
      let hasChanges = false;
      
      for (const [colId, width] of Object.entries(newSizes)) {
        if (mergedSizes[colId] !== width) {
          mergedSizes[colId] = width;
          hasChanges = true;
        }
      }

      // Return previous state if nothing changed (prevents re-render)
      return hasChanges ? mergedSizes : prevSizes;
    });
  }, [columns, jobs]);

  const pinnedColumnsWidth = 60 + (hasInputColumns ? 0 : 200); // row index + optional file column
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
          const rowIndex = filteredRowData.findIndex(
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
    ];

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
              getStatusIcon={getStatusIcon}
              renderStatusPill={renderStatusPill}
            />
          </div>
        ),
      });
    }

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
              onEditColumn={onEditColumn}
              onDeleteColumn={onDeleteColumn}
              onColumnRightClick={onColumnRightClick}
            />
          </div>
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
              onEditColumn={onEditColumn}
              onDeleteColumn={onDeleteColumn}
              onColumnRightClick={onColumnRightClick}
            />
          </div>
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
    filteredRowData,
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

  // Track column sizing state for user resizes
  const [columnSizing, setColumnSizing] = useState({});
  
  // Handle column sizing changes to track user resizes
  const handleColumnSizingChange = useCallback((updater: any) => {
    setColumnSizing((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      
      // Collect all size changes
      const sizeUpdates: Record<string, number> = {};
      
      for (const [colId, info] of Object.entries(next) as [string, any][]) {
        if (info && typeof info === 'object' && 'size' in info) {
          userResizedColumnsRef.current.add(colId);
          sizeUpdates[colId] = info.size;
        }
      }
      
      // Update columnSizes state in a single batch
      if (Object.keys(sizeUpdates).length > 0) {
        setColumnSizes((prevSizes) => ({
          ...prevSizes,
          ...sizeUpdates,
        }));
      }
      
      return next;
    });
  }, []); // No dependencies needed - uses functional updates

  // Table instance with all features enabled
  const table = useReactTable({
    data: filteredRowData,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.__job.id,
    state: {
      sorting,
      columnFilters,
      columnOrder,
      columnVisibility,
      columnPinning,
      globalFilter,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onGlobalFilterChange: setGlobalFilter,
    onColumnSizingChange: handleColumnSizingChange,
    enableColumnResizing: true,
    enableSorting: true,
    enableFilters: true,
    enableColumnOrdering: true,
    enableColumnPinning: true,
    enableGlobalFilter: true,
    columnResizeMode: 'onChange',
    defaultColumn: {
      size: DEFAULT_DATA_COL_WIDTH,
      minSize: MIN_COL_WIDTH,
      maxSize: MAX_COL_WIDTH,
    },
  });

  const tableRows = table.getRowModel().rows;

  // Handle column drag and drop for reordering
  const handleColumnDragStart = useCallback((columnId: string, e: React.DragEvent) => {
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", columnId);
  }, []);

  const handleColumnDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleColumnDrop = useCallback((targetColumnId: string, e: React.DragEvent) => {
    e.preventDefault();
    const sourceColumnId = e.dataTransfer.getData("text/plain");

    if (!sourceColumnId || sourceColumnId === targetColumnId) {
      setDraggedColumn(null);
      return;
    }

    // Get current column order
    const currentOrder = table.getState().columnOrder;
    const allColumns = table.getAllLeafColumns().map(col => col.id);
    const activeOrder = currentOrder.length > 0 ? currentOrder : allColumns;

    // Find indices
    const sourceIndex = activeOrder.indexOf(sourceColumnId);
    const targetIndex = activeOrder.indexOf(targetColumnId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedColumn(null);
      return;
    }

    // Reorder
    const newOrder = [...activeOrder];
    newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, sourceColumnId);

    table.setColumnOrder(newOrder);
    setDraggedColumn(null);
  }, [table]);

  const handleColumnDragEnd = useCallback(() => {
    setDraggedColumn(null);
  }, []);

  const virtualizedRows = useMemo<VirtualizedGridRow[]>(() => {
    const items: VirtualizedGridRow[] = [];

    for (const row of tableRows) {
      items.push({ key: row.id, type: "row", row });

      if (row.original.__job.id === expandedRowId) {
        items.push({ key: `${row.id}-detail`, type: "detail", row });
      }
    }

    return items;
  }, [tableRows, expandedRowId]);

  const rowVirtualizer = useVirtualizer({
    count: virtualizedRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) =>
      virtualizedRows[index]?.type === "detail" ? 320 : 64,
    getItemKey: (index) => virtualizedRows[index]?.key ?? index,
    overscan: 8,
    measureElement: (element) =>
      element instanceof HTMLElement
        ? element.getBoundingClientRect().height
        : 0,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rowVirtualizer, columnSizes, containerWidth, expandedRowId]);

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalVirtualSize = rowVirtualizer.getTotalSize();
  const paddingTop =
    virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalVirtualSize - virtualItems[virtualItems.length - 1].end
      : 0;
  const hasRows = virtualizedRows.length > 0;
  const leafColumnCount = Math.max(table.getAllLeafColumns().length, 1);

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
    <div className="tanstack-grid-wrapper flex h-full w-full flex-col">
      {/* Table toolbar */}
      <TableToolbar
        table={table}
        schemaId={schemaId}
        onSearchResults={handleSearchResults}
      />

      {/* Grid container */}
      <div ref={containerRef} className="tanstack-grid h-full w-full overflow-auto">
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
                  const finalStyle: CSSProperties = isPinnedRight
                    ? { ...headerStyle, position: 'sticky' as const, right: 0, zIndex: 30 }
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
            {!hasRows ? (
              <tr>
                <td
                  colSpan={leafColumnCount}
                  className="tanstack-cell text-center py-8"
                >
                  <div className="empty-state">
                    {hasActiveSearch
                      ? "No matching results for your search."
                      : "No extraction results yet. Upload documents to get started."}
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {paddingTop > 0 && (
                  <tr className="tanstack-virtual-padding" aria-hidden="true">
                    <td
                      colSpan={leafColumnCount}
                      style={{
                        height: `${paddingTop}px`,
                        padding: 0,
                        border: "none",
                      }}
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
                        onDoubleClick={() =>
                          handleRowDoubleClick(row.original)
                        }
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
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
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
                      onUpdateCell={onUpdateCell}
                    />
                  );
                })}
                {paddingBottom > 0 && (
                  <tr className="tanstack-virtual-padding" aria-hidden="true">
                    <td
                      colSpan={leafColumnCount}
                      style={{
                        height: `${paddingBottom}px`,
                        padding: 0,
                        border: "none",
                      }}
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
