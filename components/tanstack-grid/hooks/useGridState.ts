"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type {
  SortingState,
  ColumnFiltersState,
  ColumnOrderState,
  VisibilityState,
  ColumnPinningState,
} from "@tanstack/react-table";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/lib/supabase/types";
import type { TableState } from "../utils/tableState";
import { loadTableState, createDebouncedSave } from "@/lib/supabase/tableState";

// Shallow equality helpers to avoid redundant state updates
const shallowArrayEqual = <T,>(a: T[], b: T[]) =>
  a === b || (a.length === b.length && a.every((v, i) => Object.is(v, b[i])));

const shallowObjectEqual = (
  a: Record<string, unknown>,
  b: Record<string, unknown>
) => {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => Object.is(a[k], b[k]));
};

export interface UseGridStateOptions {
  schemaId?: string;
  enableTableStatePersistence?: boolean;
  onTableStateChange?: (state: TableState) => void;
}

export interface GridState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnOrder: ColumnOrderState;
  columnVisibility: VisibilityState;
  columnPinning: ColumnPinningState;
  globalFilter: string;
}

export interface GridStateActions {
  setSorting: (
    updater: SortingState | ((prev: SortingState) => SortingState)
  ) => void;
  setColumnFilters: (
    updater:
      | ColumnFiltersState
      | ((prev: ColumnFiltersState) => ColumnFiltersState)
  ) => void;
  setColumnOrder: (
    updater: ColumnOrderState | ((prev: ColumnOrderState) => ColumnOrderState)
  ) => void;
  setColumnVisibility: (
    updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)
  ) => void;
  setColumnPinning: (
    updater:
      | ColumnPinningState
      | ((prev: ColumnPinningState) => ColumnPinningState)
  ) => void;
  setGlobalFilter: (updater: string | ((prev: string) => string)) => void;
}

export function useGridState(
  options: UseGridStateOptions
): GridState & GridStateActions {
  const { schemaId, enableTableStatePersistence = true, onTableStateChange } = options;
  const supabase = useSupabaseClient<Database>();

  // State
  const [sorting, setSortingState] = useState<SortingState>([]);
  const [columnFilters, setColumnFiltersState] = useState<ColumnFiltersState>(
    []
  );
  const [columnOrder, setColumnOrderState] = useState<ColumnOrderState>([]);
  const [columnVisibility, setColumnVisibilityState] = useState<VisibilityState>(
    {}
  );
  const [columnPinning, setColumnPinningState] = useState<ColumnPinningState>({
    left: [],
    right: [],
  });
  const [globalFilter, setGlobalFilterState] = useState<string>("");

  const debouncedSaveRef = useRef<((state: TableState) => void) | null>(null);
  const onTableStateChangeRef = useRef(onTableStateChange);
  onTableStateChangeRef.current = onTableStateChange;

  // Guarded setters to avoid redundant updates
  const setSorting = useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      setSortingState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: SortingState) => SortingState)(prev)
            : updater;
        return shallowArrayEqual(prev, next) ? prev : next;
      });
    },
    []
  );

  const setColumnFilters = useCallback(
    (
      updater:
        | ColumnFiltersState
        | ((prev: ColumnFiltersState) => ColumnFiltersState)
    ) => {
      setColumnFiltersState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: ColumnFiltersState) => ColumnFiltersState)(
                prev
              )
            : updater;
        return shallowArrayEqual(prev, next) ? prev : next;
      });
    },
    []
  );

  const setColumnOrder = useCallback(
    (
      updater: ColumnOrderState | ((prev: ColumnOrderState) => ColumnOrderState)
    ) => {
      setColumnOrderState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: ColumnOrderState) => ColumnOrderState)(prev)
            : updater;
        return shallowArrayEqual(prev, next) ? prev : next;
      });
    },
    []
  );

  const setColumnVisibility = useCallback(
    (
      updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)
    ) => {
      setColumnVisibilityState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: VisibilityState) => VisibilityState)(prev)
            : updater;
        return shallowObjectEqual(prev, next) ? prev : next;
      });
    },
    []
  );

  const setColumnPinning = useCallback(
    (
      updater:
        | ColumnPinningState
        | ((prev: ColumnPinningState) => ColumnPinningState)
    ) => {
      setColumnPinningState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: ColumnPinningState) => ColumnPinningState)(
                prev
              )
            : updater;
        return shallowObjectEqual(prev, next) ? prev : next;
      });
    },
    []
  );

  const setGlobalFilter = useCallback(
    (updater: string | ((prev: string) => string)) => {
      setGlobalFilterState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: string) => string)(prev)
            : updater;
        return Object.is(prev, next) ? prev : next;
      });
    },
    []
  );

  // Load table state from Supabase when schema changes
  useEffect(() => {
    if (!schemaId || !enableTableStatePersistence) return;

    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) return;

        const state = await loadTableState(supabase, schemaId);
        if (state) {
          if (state.sorting) setSorting(state.sorting);
          if (state.columnFilters) setColumnFilters(state.columnFilters);
          if (state.columnOrder) setColumnOrder(state.columnOrder);
          if (state.columnVisibility) setColumnVisibility(state.columnVisibility);
          if (state.columnPinning) setColumnPinning(state.columnPinning);
          setGlobalFilter(state.globalFilter ?? "");
        }
      } catch {
        // Silently handle errors
      }
    };

    void load();
  }, [
    schemaId,
    supabase,
    enableTableStatePersistence,
    setSorting,
    setColumnFilters,
    setColumnOrder,
    setColumnVisibility,
    setColumnPinning,
    setGlobalFilter,
  ]);

  // Initialize debounced save function
  useEffect(() => {
    if (!schemaId || !enableTableStatePersistence) {
      debouncedSaveRef.current = null;
      return;
    }

    debouncedSaveRef.current = createDebouncedSave(supabase, schemaId, 500);

    return () => {
      if (
        debouncedSaveRef.current &&
        typeof (debouncedSaveRef.current as unknown as { flush?: () => void }).flush === "function"
      ) {
        (debouncedSaveRef.current as unknown as { flush: () => void }).flush();
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
      columnSizes: {},
      globalFilter,
    };

    debouncedSaveRef.current(state);

    if (onTableStateChangeRef.current) {
      onTableStateChangeRef.current(state);
    }
  }, [
    sorting,
    columnFilters,
    columnOrder,
    columnVisibility,
    columnPinning,
    globalFilter,
    enableTableStatePersistence,
  ]);

  return {
    sorting,
    columnFilters,
    columnOrder,
    columnVisibility,
    columnPinning,
    globalFilter,
    setSorting,
    setColumnFilters,
    setColumnOrder,
    setColumnVisibility,
    setColumnPinning,
    setGlobalFilter,
  };
}

/**
 * Creates the table state object for TanStack Table
 */
export function useTableState(gridState: GridState) {
  return useMemo(
    () => ({
      sorting: gridState.sorting,
      columnFilters: gridState.columnFilters,
      columnOrder: gridState.columnOrder,
      columnVisibility: gridState.columnVisibility,
      columnPinning: gridState.columnPinning,
      globalFilter: gridState.globalFilter,
    }),
    [
      gridState.sorting,
      gridState.columnFilters,
      gridState.columnOrder,
      gridState.columnVisibility,
      gridState.columnPinning,
      gridState.globalFilter,
    ]
  );
}
