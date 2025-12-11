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
const GRID_DEBUG_ENABLED = process.env.NEXT_PUBLIC_GRID_DEBUG !== "false";

type ValueShape =
  | "promise"
  | "function"
  | "symbol"
  | "bigint"
  | "object"
  | "array"
  | "primitive";

type ScanLog = {
  schemaId?: string;
  jobId: string;
  columnId: string;
  columnType: string;
  valueShape: ValueShape;
  sample: any;
};

// Replace any Promises (or Promises nested in objects/arrays) with a safe placeholder
// to avoid React error 301 in production builds.
function sanitizeValue(
  value: unknown,
  ctx?: { jobId?: string; columnId?: string; schemaId?: string }
): unknown {
  if (value instanceof Promise) {
    console.error("[TanStackGridSheet] Promise value detected", {
      ...ctx,
      value,
    });
    return "[promise]";
  }

  if (typeof value === "function") {
    console.error("[TanStackGridSheet] Function value detected", {
      ...ctx,
    });
    return "[function]";
  }

  if (typeof value === "symbol") {
    console.error("[TanStackGridSheet] Symbol value detected", {
      ...ctx,
    });
    return value.toString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  // Preserve primitives and Dates as-is
  if (value === null || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, ctx));
  }

  // Plain object case
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    result[k] = sanitizeValue(v, ctx);
  }
  return result;
}

// Shallow equality helpers to avoid redundant state updates
const shallowArrayEqual = <T,>(a: T[], b: T[]) =>
  a === b || (a.length === b.length && a.every((v, i) => Object.is(v, b[i])));

const shallowObjectEqual = (a: Record<string, any>, b: Record<string, any>) => {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => Object.is(a[k], b[k]));
};

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
  enableTableStatePersistence = true, // Default to true for backward compatibility
}: TanStackGridSheetProps = {
  schemaId: undefined as any,
  columns: [],
  jobs: [],
  visualGroups: [],
  enableTableStatePersistence: true,
}) {
  // Search is disabled per request; keep table simple and avoid global filter churn.
  const enableSearch = false;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [columnSizes, setColumnSizes] = useState<Record<string, number>>({});
  const supabase = useSupabaseClient<Database>();
  const renderCountRef = useRef(0);
  const renderWindowStartRef = useRef<number>(Date.now());
  const mountIdRef = useRef(Math.random().toString(36).substr(2, 9));

  // Track component mount/unmount
  useEffect(() => {
    // #region agent log
    console.error('[DEBUG-MOUNT] Component MOUNTED', {mountId: mountIdRef.current, schemaId});
    // #endregion
    return () => {
      // #region agent log
      console.error('[DEBUG-MOUNT] Component UNMOUNTED', {mountId: mountIdRef.current, schemaId});
      // #endregion
    };
  }, [schemaId]);

  const logDebug = useCallback(
    (message: string, payload?: Record<string, unknown>) => {
      if (!GRID_DEBUG_ENABLED) return;
      const ts = new Date().toISOString();
      if (payload) {
        console.debug(`[TanStackGridSheet:${schemaId ?? "unknown"}] ${ts} ${message}`, payload);
      } else {
        console.debug(`[TanStackGridSheet:${schemaId ?? "unknown"}] ${ts} ${message}`);
      }
    },
    [schemaId]
  );

  // FIX: Stabilize visualGroups reference to prevent unnecessary re-renders
  // The parent component may pass a new [] on every render if not memoized
  const stableVisualGroups = useMemo(() => {
    // Return stable reference if content is the same
    return visualGroups;
  }, [visualGroups.length, visualGroups.map((g) => `${g.id}:${g.fieldIds.join(',')}`).join('|')]);

  if (GRID_DEBUG_ENABLED) {
    const elapsed = Date.now() - renderWindowStartRef.current;
    if (elapsed > 3000) {
      renderWindowStartRef.current = Date.now();
      renderCountRef.current = 1;
    } else if (renderCountRef.current % 10 === 0) {
      logDebug("render burst", {
        renders: renderCountRef.current,
        elapsedMs: elapsed,
        columns: columns.length,
        jobs: jobs.length,
      });
    }
  }

  if (!Array.isArray(columns) || !Array.isArray(jobs)) {
    console.error("[TanStackGridSheet] Invalid props: columns or jobs not array", {
      columnsType: typeof columns,
      jobsType: typeof jobs,
    });
    return null;
  }
  const microtask = useCallback((fn: () => void, label?: string) => {
    // Always push table state updates out of the render phase to avoid React 301
    // when TanStack internally fires onChange during render.
    const stack = GRID_DEBUG_ENABLED ? new Error().stack : undefined;
    const runner = () => {
      if (label && GRID_DEBUG_ENABLED) logDebug(`microtask:${label}`, { stack });
      fn();
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(runner);
    } else {
      Promise.resolve().then(runner);
    }
  }, [logDebug]);

  // Table state management (guarded setters to avoid redundant updates)
  const [sorting, setSortingState] = useState<SortingState>([]);
  const setSorting = useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      // #region agent log
      console.error('[DEBUG-A] setSorting CALLED', {updaterType:typeof updater, renderCount:renderCountRef.current});
      // #endregion
      setSortingState((prev) => {
        const next = typeof updater === "function" ? (updater as any)(prev) : updater;
        if (GRID_DEBUG_ENABLED) logDebug("setSorting", { prev, next });
        return shallowArrayEqual(prev, next) ? prev : next;
      });
    },
    [logDebug]
  );

  const [columnFilters, setColumnFiltersState] = useState<ColumnFiltersState>([]);
  const setColumnFilters = useCallback(
    (updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
      // #region agent log
      console.error('[DEBUG-A] setColumnFilters CALLED', {updaterType:typeof updater, renderCount:renderCountRef.current});
      // #endregion
      setColumnFiltersState((prev) => {
        const next = typeof updater === "function" ? (updater as any)(prev) : updater;
        if (GRID_DEBUG_ENABLED) logDebug("setColumnFilters", { prev, next });
        return shallowArrayEqual(prev, next) ? prev : next;
      });
    },
    [logDebug]
  );

  const [columnOrder, setColumnOrderState] = useState<ColumnOrderState>([]);
  const setColumnOrder = useCallback(
    (updater: ColumnOrderState | ((prev: ColumnOrderState) => ColumnOrderState)) => {
      // #region agent log
      console.error('[DEBUG-A] setColumnOrder CALLED', {updaterType:typeof updater, renderCount:renderCountRef.current});
      // #endregion
      setColumnOrderState((prev) => {
        const next = typeof updater === "function" ? (updater as any)(prev) : updater;
        if (GRID_DEBUG_ENABLED) logDebug("setColumnOrder", { prev, next });
        return shallowArrayEqual(prev, next) ? prev : next;
      });
    },
    [logDebug]
  );

  const [columnVisibility, setColumnVisibilityState] = useState<VisibilityState>({});
  const setColumnVisibility = useCallback(
    (updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => {
      // #region agent log
      console.error('[DEBUG-A] setColumnVisibility CALLED', {updaterType:typeof updater, renderCount:renderCountRef.current});
      // #endregion
      setColumnVisibilityState((prev) => {
        const next = typeof updater === "function" ? (updater as any)(prev) : updater;
        if (GRID_DEBUG_ENABLED) logDebug("setColumnVisibility", { prev, next });
        return shallowObjectEqual(prev, next) ? prev : next;
      });
    },
    [logDebug]
  );

  const [columnPinning, setColumnPinningState] = useState<ColumnPinningState>({
    left: [],
    right: [],
  });
  const setColumnPinning = useCallback(
    (updater: ColumnPinningState | ((prev: ColumnPinningState) => ColumnPinningState)) => {
      // #region agent log
      console.error('[DEBUG-A] setColumnPinning CALLED', {updaterType:typeof updater, renderCount:renderCountRef.current});
      // #endregion
      setColumnPinningState((prev) => {
        const next = typeof updater === "function" ? (updater as any)(prev) : updater;
        if (GRID_DEBUG_ENABLED) logDebug("setColumnPinning", { prev, next });
        return shallowObjectEqual(prev, next) ? prev : next;
      });
    },
    [logDebug]
  );

  const [globalFilter, setGlobalFilterState] = useState<string>("");
  const setGlobalFilter = useCallback(
    (updater: string | ((prev: string) => string)) => {
      // #region agent log
      console.error('[DEBUG-A] setGlobalFilter CALLED', {updaterType:typeof updater, renderCount:renderCountRef.current});
      // #endregion
      setGlobalFilterState((prev) => {
        const next = typeof updater === "function" ? (updater as any)(prev) : updater;
        if (GRID_DEBUG_ENABLED) logDebug("setGlobalFilter", { prev, next });
        return Object.is(prev, next) ? prev : next;
      });
    },
    [logDebug]
  );
  const debouncedSaveRef = useRef<((state: TableState) => void) | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const hasInputColumns = useMemo(() => columns.some((c) => c.type === "input"), [columns]);

  // Create stable wrapper callbacks for props to prevent columnDefs from changing
  // Use refs to always call the latest version while maintaining stable references
  const renderCellValueRef = useRef(renderCellValue);
  const getStatusIconRef = useRef(getStatusIcon);
  const renderStatusPillRef = useRef(renderStatusPill);
  const onEditColumnRef = useRef(onEditColumn);
  const onDeleteColumnRef = useRef(onDeleteColumn);
  const onUpdateCellRef = useRef(onUpdateCell);
  const onUpdateReviewStatusRef = useRef(onUpdateReviewStatus);
  const onColumnRightClickRef = useRef(onColumnRightClick);
  const onOpenTableModalRef = useRef(onOpenTableModal);
  const onToggleRowExpansionRef = useRef(onToggleRowExpansion);
  const onAddColumnRef = useRef(onAddColumn);
  const onSelectRowRef = useRef(onSelectRow);
  const onRowDoubleClickRef = useRef(onRowDoubleClick);
  const onTableStateChangeRef = useRef(onTableStateChange);

  // Update refs when props change
  useEffect(() => {
    if (GRID_DEBUG_ENABLED) {
      logDebug("mount", {
        columns: columns.length,
        jobs: jobs.length,
      });
    }
    renderCellValueRef.current = renderCellValue;
    getStatusIconRef.current = getStatusIcon;
    renderStatusPillRef.current = renderStatusPill;
    onEditColumnRef.current = onEditColumn;
    onDeleteColumnRef.current = onDeleteColumn;
    onUpdateCellRef.current = onUpdateCell;
    onUpdateReviewStatusRef.current = onUpdateReviewStatus;
    onColumnRightClickRef.current = onColumnRightClick;
    onOpenTableModalRef.current = onOpenTableModal;
    onToggleRowExpansionRef.current = onToggleRowExpansion;
    onAddColumnRef.current = onAddColumn;
    onSelectRowRef.current = onSelectRow;
    onRowDoubleClickRef.current = onRowDoubleClick;
    onTableStateChangeRef.current = onTableStateChange;
  }, [
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
    onTableStateChange,
  ]);

  // Create stable callbacks that use refs
  const stableRenderCellValue = useCallback(
    (column: any, job: any, opts?: any) => renderCellValueRef.current(column, job, opts),
    []
  );

  const stableGetStatusIcon = useCallback(
    (status: any) => getStatusIconRef.current(status),
    []
  );

  const stableRenderStatusPill = useCallback(
    (status: any, opts?: any) => renderStatusPillRef.current(status, opts),
    []
  );

  const stableOnEditColumn = useCallback(
    (column: any) => onEditColumnRef.current(column),
    []
  );

  const stableOnDeleteColumn = useCallback(
    (columnId: string) => onDeleteColumnRef.current(columnId),
    []
  );

  const stableOnUpdateCell = useCallback(
    (jobId: string, columnId: string, value: unknown) => onUpdateCellRef.current(jobId, columnId, value),
    []
  );

  const stableOnUpdateReviewStatus = useCallback(
    (jobId: string, columnId: string, status: 'verified' | 'needs_review', payload?: { reason?: string | null }) =>
      onUpdateReviewStatusRef.current(jobId, columnId, status, payload),
    []
  );

  const stableOnColumnRightClick = useCallback(
    (columnId: string, event: React.MouseEvent) => onColumnRightClickRef.current(columnId, event),
    []
  );

  const stableOnOpenTableModal = useCallback(
    (column: any, job: any, rows: Record<string, unknown>[], columnHeaders: Array<{ key: string; label: string }>) =>
      onOpenTableModalRef.current(column, job, rows, columnHeaders),
    []
  );

  const stableOnToggleRowExpansion = useCallback(
    (rowId: string | null) => onToggleRowExpansionRef.current(rowId),
    []
  );

  const stableOnAddColumn = useCallback(
    () => onAddColumnRef.current(),
    []
  );

  const stableOnSelectRow = useCallback(
    (id: string) => onSelectRowRef.current(id),
    []
  );

  const stableOnRowDoubleClick = useCallback(
    (job: any) => onRowDoubleClickRef.current?.(job),
    []
  );

  // Search results are now handled entirely via table global filter.
  const handleSearchResults = useCallback(() => {}, []);

  // Transform jobs to grid rows with stable reference
  const rowData = useMemo<GridRow[]>(() => {
    return jobs.map((job) => {
      const valueMap: Record<string, unknown> = {};
      for (const col of columns) {
        if (col.type === "input") {
          const doc = job.inputDocuments?.[col.id];
          valueMap[col.id] = doc?.fileName ?? doc?.textValue ?? null;
        } else {
          const rawValue = job.results?.[col.id] ?? null;
          // If a non-structured column receives an object, coerce to string to avoid React 301
          if (
            rawValue &&
            typeof rawValue === "object" &&
            !(rawValue instanceof Date) &&
            !Array.isArray(rawValue) &&
            col.type !== "object" &&
            col.type !== "list" &&
            col.type !== "table"
          ) {
            console.error("[TanStackGridSheet] Object value in primitive column", {
              schemaId,
              jobId: job.id,
              columnId: col.id,
              value: rawValue,
            });
            valueMap[col.id] = "[object]";
            continue;
          }

          valueMap[col.id] = sanitizeValue(rawValue, {
            jobId: job.id,
            columnId: col.id,
            schemaId,
          });
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

  const filteredRowData = useMemo<GridRow[]>(() => rowData, [rowData]);

  // Deep scan of grid values to help diagnose React 301 in prod
  useEffect(() => {
    const scans: ScanLog[] = [];
    for (const row of filteredRowData) {
      const jobId = row.__job.id;
      for (const col of columns) {
        const val = (row as any)[col.id];
        let valueShape: ValueShape = "primitive";
        if (val instanceof Promise) valueShape = "promise";
        else if (typeof val === "function") valueShape = "function";
        else if (typeof val === "symbol") valueShape = "symbol";
        else if (typeof val === "bigint") valueShape = "bigint";
        else if (Array.isArray(val)) valueShape = "array";
        else if (val && typeof val === "object") valueShape = "object";

        // Log suspicious values for primitive columns
        const isPrimitiveColumn =
          col.type !== "object" && col.type !== "list" && col.type !== "table";
        if (
          isPrimitiveColumn &&
          (valueShape === "object" ||
            valueShape === "function" ||
            valueShape === "symbol" ||
            valueShape === "promise")
        ) {
          console.error("[TanStackGridSheet] Invalid shape in primitive column", {
            schemaId,
            jobId,
            columnId: col.id,
            columnType: col.type,
            valueShape,
            sample: val,
          });
          scans.push({
            schemaId,
            jobId,
            columnId: col.id,
            columnType: col.type,
            valueShape,
            sample: val,
          });
        }
      }
    }

    if (GRID_DEBUG_ENABLED) {
      console.info("[TanStackGridSheet] grid scan", {
        schemaId,
        rows: filteredRowData.length,
        columns: columns.length,
        issues: scans.length,
      });
    }

    if (typeof window !== "undefined") {
      (window as any).__GRID_SCAN__ = {
        schemaId,
        scannedAt: new Date().toISOString(),
        rows: filteredRowData.length,
        columns: columns.length,
        issues: scans,
      };
    }
  }, [filteredRowData, columns, schemaId]);

  // Expose a small snapshot for post-mortem debugging in prod
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__GRID_LAST_ROWS__ = {
        schemaId,
        columns: columns.map((c) => ({ id: c.id, type: c.type })),
        sampleRows: filteredRowData.slice(0, 3).map((r) => ({
          jobId: r.__job.id,
          fileName: r.fileName,
          status: r.status,
          values: Object.fromEntries(
            columns.map((c) => [c.id, (r as any)[c.id]])
          ),
        })),
      };
      (window as any).__GRID_TYPES__ = {
        schemaId,
        columns: columns.map((c) => ({
          id: c.id,
          type: c.type,
          size: columnSizes[c.id] ?? DEFAULT_DATA_COL_WIDTH,
        })),
        rows: filteredRowData.slice(0, 3).map((r) => ({
          jobId: r.__job.id,
          valueTypes: Object.fromEntries(
            columns.map((c) => {
              const v = (r as any)[c.id];
              const type =
                v instanceof Promise
                  ? "promise"
                  : Array.isArray(v)
                  ? "array"
                  : v === null
                  ? "null"
                  : typeof v;
              return [c.id, type];
            })
          ),
        })),
      };
    }
  }, [filteredRowData, columns, schemaId, columnSizes]);

  // Load table state from Supabase when schema changes
  useEffect(() => {
    if (!schemaId) return;
    
    if (!enableTableStatePersistence) {
      if (process.env.NODE_ENV === 'development') {
        console.info("[TanStackGridSheet] Table state persistence is disabled for schema:", schemaId);
      }
      return;
    }

    const load = async () => {
      try {
        // Check if user is authenticated before attempting to load table state
        // This prevents 406 errors from appearing in console on initial page load
        const { data: { session } } = await supabase.auth.getSession();
        
        // Only attempt to load if user is authenticated
        // Unauthenticated users will use default table state
        if (!session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.debug("[TanStackGridSheet] Skipping table state load - user not authenticated");
          }
          return;
        }

        const state = await loadTableState(supabase, schemaId);
        if (GRID_DEBUG_ENABLED) logDebug("loaded table state", { state });
        if (state) {
          if (state.sorting) setSorting(state.sorting);
          if (state.columnFilters) setColumnFilters(state.columnFilters);
          if (state.columnOrder) setColumnOrder(state.columnOrder);
          if (state.columnVisibility) setColumnVisibility(state.columnVisibility);
          if (state.columnPinning) setColumnPinning(state.columnPinning);
          if (state.columnSizes) setColumnSizes(state.columnSizes);
          setGlobalFilter(state.globalFilter ?? "");
        }
      } catch (err) {
        // Silently handle errors - already logged in loadTableState if needed
        if (process.env.NODE_ENV === 'development' || GRID_DEBUG_ENABLED) {
          console.debug("[TanStackGridSheet] Error during table state load:", err);
        }
      }
    };

    void load();
  }, [schemaId, supabase, enableTableStatePersistence]);

  // Initialize debounced save function
  useEffect(() => {
    if (!schemaId || !enableTableStatePersistence) {
      debouncedSaveRef.current = null;
      return;
    }

    debouncedSaveRef.current = createDebouncedSave(supabase, schemaId, 500);

    return () => {
      // Flush any pending saves on unmount
      if (debouncedSaveRef.current && typeof (debouncedSaveRef.current as any).flush === 'function') {
        (debouncedSaveRef.current as any).flush();
      }
    };
  }, [schemaId, supabase, enableTableStatePersistence]);

  // Auto-save table state when it changes
  useEffect(() => {
    if (!debouncedSaveRef.current || !enableTableStatePersistence) return;

    const state: TableState = {
      sorting,
      columnFilters,
      columnOrder,
      columnVisibility,
      columnPinning,
      columnSizes,
      globalFilter,
    };

    if (GRID_DEBUG_ENABLED) logDebug("autosave state", state);
    debouncedSaveRef.current(state);

    // Notify parent if callback provided (always notify, even if persistence is disabled)
    if (onTableStateChangeRef.current) {
      onTableStateChangeRef.current(state);
    }
  }, [sorting, columnFilters, columnOrder, columnVisibility, columnPinning, columnSizes, globalFilter, enableTableStatePersistence]);

  // Calculate optimal column widths when data changes
  useEffect(() => {
    // #region agent log
    console.error('[H6] Column size calculation effect firing', {
      renderCount: renderCountRef.current,
      columnsLength: columns.length,
      jobsLength: jobs.length
    });
    // #endregion

    // We calculate widths even if jobs is empty, to ensure headers are sized correctly
    // based on their text length.
    const newSizes: Record<string, number> = {};
    for (const col of columns) {
      const calculatedWidth = calculateColumnWidth(col, jobs);
      newSizes[col.id] = calculatedWidth;
    }

    if (GRID_DEBUG_ENABLED) logDebug("calculated column sizes", { newSizes });

    // Avoid pointless state updates that can trigger extra renders
    setColumnSizes((prev) => {
      const sameKeys =
        Object.keys(newSizes).length === Object.keys(prev).length &&
        Object.keys(newSizes).every((key) => prev[key] === newSizes[key]);

      // #region agent log
      if (!sameKeys) {
        console.error('[H6] setColumnSizes called - will trigger re-render', {
          renderCount: renderCountRef.current,
          prevKeys: Object.keys(prev).length,
          newKeys: Object.keys(newSizes).length
        });
      }
      // #endregion

      return sameKeys ? prev : newSizes;
    });
  }, [columns, jobs, logDebug]);

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
  
  // Use a ref to track fillerWidth to avoid re-rendering columnDefs
  // This prevents infinite loop when ResizeObserver updates containerWidth
  const fillerWidthRef = useRef(0);
  const fillerWidth =
    effectiveContainerWidth > baseTableWidth
      ? effectiveContainerWidth - baseTableWidth
      : 0;
  fillerWidthRef.current = fillerWidth;
  
  const tableWidth = baseTableWidth + fillerWidth;
  // #region agent log
  const prevColumnSizesRef = useRef(columnSizes);
  const columnSizesChanged = prevColumnSizesRef.current !== columnSizes;
  if (columnSizesChanged) {
    console.error('[H5] columnSizes changed during render', {
      renderCount: renderCountRef.current,
      newSizes: Object.keys(columnSizes).length
    });
  }
  prevColumnSizesRef.current = columnSizes;
  // #endregion

  // Define column definitions
  const columnDefs = useMemo<ColumnDef<GridRow>[]>(() => {
    // #region agent log
    console.error('[H5] columnDefs recomputing', { renderCount: renderCountRef.current });
    // #endregion
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
                    stableOnToggleRowExpansion(row.original.__job.id);
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
              getStatusIcon={stableGetStatusIcon}
              renderStatusPill={stableRenderStatusPill}
            />
          </div>
        ),
      });
    }

    // Add data columns with visual grouping support
    const groupedFieldIds = new Set<string>();
    const fieldIdToGroup = new Map();

    for (const group of stableVisualGroups) {
      for (const fieldId of group.fieldIds) {
        groupedFieldIds.add(fieldId);
        fieldIdToGroup.set(fieldId, group);
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
              onEditColumn={stableOnEditColumn}
              onDeleteColumn={stableOnDeleteColumn}
              onColumnRightClick={stableOnColumnRightClick}
            />
          </div>
        ),
        size: columnSizes[column.id] || DEFAULT_DATA_COL_WIDTH,
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
              onUpdateReviewStatus={stableOnUpdateReviewStatus}
              onDoubleClick={() => {
                if (
                  columnMeta.type === "object" ||
                  columnMeta.type === "table" ||
                  columnMeta.type === "list"
                )
                  return;
              }}
            >
              {stableRenderCellValue(columnMeta, job, {
                mode: columnMeta.type === 'object' || columnMeta.type === 'list' || columnMeta.type === 'table'
                  ? 'summary'
                  : 'interactive',
                onUpdateCell: stableOnUpdateCell,
                onOpenTableModal: stableOnOpenTableModal,
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
              onEditColumn={stableOnEditColumn}
              onDeleteColumn={stableOnDeleteColumn}
              onColumnRightClick={stableOnColumnRightClick}
            />
          </div>
        ),
        size: columnSizes[column.id] || DEFAULT_DATA_COL_WIDTH,
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
              onUpdateReviewStatus={stableOnUpdateReviewStatus}
            >
              {stableRenderCellValue(columnMeta, job, {
                mode: columnMeta.type === 'object' || columnMeta.type === 'list' || columnMeta.type === 'table'
                  ? 'summary'
                  : 'interactive',
                onUpdateCell: stableOnUpdateCell,
                onOpenTableModal: stableOnOpenTableModal,
              })}
            </ReviewWrapper>
          );
        },
      });
    }

    // Add filler column to keep the add button anchored to the far right when there's extra space
    // Use ref to get current fillerWidth without triggering memo recomputation
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

    // Add column button - always at the end, sticky to right
    defs.push({
      id: "bb-add-field",
      header: () => <AddColumnHeader onAddColumn={stableOnAddColumn} />,
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
    stableVisualGroups,
    // Avoid tying column definition identity to data to keep table stable
    stableOnEditColumn,
    stableOnDeleteColumn,
    stableOnAddColumn,
    stableOnUpdateReviewStatus,
    stableOnColumnRightClick,
    stableGetStatusIcon,
    stableRenderStatusPill,
    stableRenderCellValue,
    // REMOVED fillerWidth - using ref to prevent infinite loop from ResizeObserver
    expandedRowId,
    stableOnToggleRowExpansion,
    stableOnUpdateCell,
    stableOnOpenTableModal,
    hasInputColumns,
    draggedColumn,
  ]);

  // Memoize table options to ensure stable table instance
  const getRowId = useCallback((row: GridRow) => row.__job.id, []);
  
  const tableState = useMemo(() => {
    // #region agent log
    console.error('[DEBUG-C] tableState recomputing', {renderCount:renderCountRef.current});
    // #endregion
    return {
      sorting,
      columnFilters,
      columnOrder,
      columnVisibility,
      columnPinning,
      globalFilter,
    };
  }, [sorting, columnFilters, columnOrder, columnVisibility, columnPinning, globalFilter]);

  const defaultColumnConfig = useMemo(() => ({
    size: DEFAULT_DATA_COL_WIDTH,
    minSize: MIN_COL_WIDTH,
    maxSize: MAX_COL_WIDTH,
  }), []);

  // Memoize row model getters so tableOptions identity stays stable
  const coreRowModel = useMemo(() => getCoreRowModel(), []);
  const sortedRowModel = useMemo(() => getSortedRowModel(), []);
  const filteredRowModel = useMemo(() => getFilteredRowModel(), []);

  // Memoize table options object to ensure all inputs are stable
  // This ensures the table instance remains stable when inputs haven't changed
  const tableOptions = useMemo(() => {
    // #region agent log
    console.error('[H5] tableOptions recomputing', { renderCount: renderCountRef.current });
    // #endregion
    return {
    data: filteredRowData,
    columns: columnDefs,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    getFilteredRowModel: filteredRowModel,
    getRowId,
    state: enableSearch ? tableState : { ...tableState, globalFilter: "" },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onGlobalFilterChange: enableSearch ? setGlobalFilter : undefined,
    enableColumnResizing: false, // Disable resizing to avoid runtime issues in prod
    enableSorting: true,
    enableFilters: true,
    enableColumnOrdering: true,
    enableColumnPinning: true,
    enableGlobalFilter: enableSearch,
    defaultColumn: defaultColumnConfig,
  };}, [
    filteredRowData,
    columnDefs,
    getRowId,
    tableState,
    setSorting,
    setColumnFilters,
    setColumnOrder,
    setColumnVisibility,
    setColumnPinning,
    setGlobalFilter,
    defaultColumnConfig,
    coreRowModel,
    sortedRowModel,
    filteredRowModel,
    enableSearch,
  ]);

  // Surface lightweight meta for debugging
  useEffect(() => {
    if (GRID_DEBUG_ENABLED) {
      console.info("[TanStackGridSheet] table meta", {
        schemaId,
        columns: columns.map((c) => c.id),
        jobs: filteredRowData.map((r) => r.__job.id),
      });
    }
    if (typeof window !== "undefined") {
      (window as any).__GRID_META__ = {
        schemaId,
        columnCount: columns.length,
        jobCount: filteredRowData.length,
        columnIds: columns.map((c) => c.id),
        jobIds: filteredRowData.map((r) => r.__job.id),
      };
    }
  }, [columns, filteredRowData, schemaId]);

  // #region agent log
  renderCountRef.current += 1;
  console.error('[H5] TanStackGridSheet render', {
    renderCount: renderCountRef.current,
    columnsLength: columns.length,
    jobsLength: jobs.length
  });
  
  if (renderCountRef.current >= 25) {
    console.error('[H5] RENDER LOOP DETECTED IN GRID!', {
      renderCount: renderCountRef.current,
      schemaId
    });
  }
  
  // Track callback identities across renders
  const prevCallbacksRef = useRef<any>({});
  const callbacksChanged = {
    setSorting: prevCallbacksRef.current.setSorting !== setSorting,
    setColumnFilters: prevCallbacksRef.current.setColumnFilters !== setColumnFilters,
    setColumnOrder: prevCallbacksRef.current.setColumnOrder !== setColumnOrder,
    setColumnVisibility: prevCallbacksRef.current.setColumnVisibility !== setColumnVisibility,
    setColumnPinning: prevCallbacksRef.current.setColumnPinning !== setColumnPinning,
    setGlobalFilter: prevCallbacksRef.current.setGlobalFilter !== setGlobalFilter,
    logDebug: prevCallbacksRef.current.logDebug !== logDebug,
  };
  prevCallbacksRef.current = {setSorting, setColumnFilters, setColumnOrder, setColumnVisibility, setColumnPinning, setGlobalFilter, logDebug};
  
  // Track tableOptions and table instance identity
  const prevTableOptionsRef = useRef<any>(null);
  const prevTableRef = useRef<any>(null);
  const tableOptionsChanged = prevTableOptionsRef.current !== tableOptions;
  
  // Log each callback change explicitly
  console.error('[DEBUG-B] Before useReactTable', {
    renderCount:renderCountRef.current,
    setSorting_changed:callbacksChanged.setSorting,
    setColumnFilters_changed:callbacksChanged.setColumnFilters,
    setColumnOrder_changed:callbacksChanged.setColumnOrder,
    setColumnVisibility_changed:callbacksChanged.setColumnVisibility,
    setColumnPinning_changed:callbacksChanged.setColumnPinning,
    setGlobalFilter_changed:callbacksChanged.setGlobalFilter,
    logDebug_changed:callbacksChanged.logDebug,
    tableOptions_changed:tableOptionsChanged
  });
  prevTableOptionsRef.current = tableOptions;
  // #endregion

  // Table instance with all features enabled.
  // useReactTable must be called at the top level (not inside other hooks) to satisfy hook rules.
  const table = useReactTable(tableOptions);
  // #region agent log
  const tableInstanceChanged = prevTableRef.current !== table;
  prevTableRef.current = table;
  console.error('[DEBUG-D] After useReactTable', {
    renderCount:renderCountRef.current,
    table_instance_changed:tableInstanceChanged
  });
  // #endregion
  if (GRID_DEBUG_ENABLED) {
    logDebug("tableOptions", {
      dataRows: filteredRowData.length,
      columns: columnDefs.length,
      state: tableState,
    });
  }

  // #region agent log
  console.error('[DEBUG-D] Before getRowModel', {renderCount:renderCountRef.current});
  // #endregion
  const tableRows = table.getRowModel().rows;
  // #region agent log
  console.error('[DEBUG-D] After getRowModel', {renderCount:renderCountRef.current, rowsLength:tableRows.length});
  // #endregion

  // Detect any Promise values in row data early to avoid React 301
  useEffect(() => {
    for (const row of filteredRowData) {
      const jobId = row.__job.id;
      for (const col of columns) {
        const cellValue = (row as any)[col.id];
        if (cellValue instanceof Promise) {
          console.error("Promise value detected in grid data", {
            schemaId,
            jobId,
            columnId: col.id,
            value: cellValue,
          });
          return;
        }
      }
    }
  }, [filteredRowData, columns, schemaId]);

  useEffect(() => {
    if (!GRID_DEBUG_ENABLED) return;
    const handleError = (event: ErrorEvent) => {
      console.error(`[TanStackGridSheet:${schemaId}] window error`, event.message, event.error?.stack);
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, [schemaId]);

  // Handle column drag and drop for reordering
  const handleColumnDragStart = useCallback((columnId: string, e: React.DragEvent) => {
    if (!e.dataTransfer) return;
    if (GRID_DEBUG_ENABLED) logDebug("dragStart", { columnId });
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
    if (GRID_DEBUG_ENABLED) logDebug("drop", { sourceColumnId, targetColumnId });

    if (!sourceColumnId || sourceColumnId === targetColumnId) {
      setDraggedColumn(null);
      return;
    }

    // Get current column order
    const currentOrder = table.getState().columnOrder;
    const allColumns = table.getAllLeafColumns().map(col => col.id);
    const activeOrder = Array.isArray(currentOrder) && currentOrder.length > 0 ? currentOrder : allColumns;

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
  if (GRID_DEBUG_ENABLED) {
    logDebug("virtualized rows", { count: virtualizedRows.length, expandedRowId });
  }

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

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalVirtualSize = rowVirtualizer.getTotalSize();
  const hasActiveSearch = false;
  const paddingTop =
    virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalVirtualSize - virtualItems[virtualItems.length - 1].end
      : 0;
  const hasRows = virtualizedRows.length > 0;
  const leafColumnCount = Math.max(table.getAllLeafColumns().length, 1);

  // Handle row clicks - using stable callbacks to prevent re-renders
  const handleRowClick = useCallback(
    (row: GridRow) => {
      stableOnSelectRow(row.__job.id);
    },
    [stableOnSelectRow]
  );

  const handleRowDoubleClick = useCallback(
    (row: GridRow) => {
      stableOnSelectRow(row.__job.id);
      stableOnRowDoubleClick(row.__job);
    },
    [stableOnSelectRow, stableOnRowDoubleClick]
  );

  // Calculate total table width and handle column overflow
  useEffect(() => {
    // #region agent log
    console.error('[H7] Container width effect firing', {
      renderCount: renderCountRef.current
    });
    // #endregion

    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      // #region agent log
      console.error('[H7] setContainerWidth called - will trigger re-render', {
        renderCount: renderCountRef.current,
        width: el.clientWidth
      });
      // #endregion
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
        enableSearch={enableSearch}
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
                      onUpdateCell={stableOnUpdateCell}
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
