// Table state types and utilities for TanStack Table
import type {
  SortingState,
  ColumnFiltersState,
  ColumnOrderState,
  VisibilityState,
  ColumnPinningState,
} from "@tanstack/react-table";

// Complete table state that gets persisted
export interface TableState {
  sorting?: SortingState;
  columnFilters?: ColumnFiltersState;
  columnOrder?: ColumnOrderState;
  columnVisibility?: VisibilityState;
  columnPinning?: ColumnPinningState;
  columnSizes?: Record<string, number>;
  globalFilter?: string;
}

// Serialize table state to JSON-compatible format
export function serializeTableState(state: TableState): Record<string, any> {
  return {
    sorting: state.sorting || [],
    columnFilters: state.columnFilters || [],
    columnOrder: state.columnOrder || [],
    columnVisibility: state.columnVisibility || {},
    columnPinning: state.columnPinning || { left: [], right: [] },
    columnSizes: state.columnSizes || {},
    globalFilter: state.globalFilter || "",
  };
}

// Deserialize table state from JSON
export function deserializeTableState(json: any): TableState {
  if (!json || typeof json !== "object") {
    return {};
  }

  return {
    sorting: Array.isArray(json.sorting) ? json.sorting : [],
    columnFilters: Array.isArray(json.columnFilters) ? json.columnFilters : [],
    columnOrder: Array.isArray(json.columnOrder) ? json.columnOrder : [],
    columnVisibility:
      json.columnVisibility && typeof json.columnVisibility === "object"
        ? json.columnVisibility
        : {},
    columnPinning:
      json.columnPinning && typeof json.columnPinning === "object"
        ? {
            left: Array.isArray(json.columnPinning.left)
              ? json.columnPinning.left
              : [],
            right: Array.isArray(json.columnPinning.right)
              ? json.columnPinning.right
              : [],
          }
        : { left: [], right: [] },
    columnSizes:
      json.columnSizes && typeof json.columnSizes === "object"
        ? json.columnSizes
        : {},
    globalFilter:
      typeof json.globalFilter === "string" ? json.globalFilter : "",
  };
}

// Merge two table states (for handling concurrent updates)
// Strategy: last-write-wins for most fields, merge column visibility and sizes
export function mergeTableStates(
  current: TableState,
  incoming: TableState
): TableState {
  return {
    sorting: incoming.sorting ?? current.sorting,
    columnFilters: incoming.columnFilters ?? current.columnFilters,
    columnOrder: incoming.columnOrder ?? current.columnOrder,
    columnVisibility: {
      ...current.columnVisibility,
      ...incoming.columnVisibility,
    },
    columnPinning: incoming.columnPinning ?? current.columnPinning,
    columnSizes: {
      ...current.columnSizes,
      ...incoming.columnSizes,
    },
    globalFilter: incoming.globalFilter ?? current.globalFilter,
  };
}

// Check if table state is empty/default
export function isEmptyTableState(state: TableState): boolean {
  return (
    (!state.sorting || state.sorting.length === 0) &&
    (!state.columnFilters || state.columnFilters.length === 0) &&
    (!state.columnOrder || state.columnOrder.length === 0) &&
    (!state.columnVisibility ||
      Object.keys(state.columnVisibility).length === 0) &&
    (!state.columnPinning ||
      (state.columnPinning.left?.length === 0 &&
        state.columnPinning.right?.length === 0)) &&
    (!state.columnSizes || Object.keys(state.columnSizes).length === 0) &&
    (!state.globalFilter || state.globalFilter === "")
  );
}

// Reset table state to defaults
export function resetTableState(): TableState {
  return {
    sorting: [],
    columnFilters: [],
    columnOrder: [],
    columnVisibility: {},
    columnPinning: { left: [], right: [] },
    columnSizes: {},
    globalFilter: "",
  };
}









