"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, Filter, Eye, RotateCcw, Download } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { GridRow } from "../types";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

interface TableToolbarProps {
  table: Table<GridRow>;
  schemaId: string;
  onSearchResults?: (payload: { jobIds: string[]; query: string }) => void;
}

interface SearchResult {
  jobId: string;
  fileName: string;
  status: string;
  matchScore: number;
  matchLocations: string[];
}

export function TableToolbar({
  table,
  schemaId,
  onSearchResults,
}: TableToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef<Record<string, { query: string; results: SearchResult[] }>>({});
  const previousQueryRef = useRef<string>("");
  const previousSearchResultsRef = useRef<{ jobIds: string[]; query: string }>({ jobIds: [], query: "" });

  // Memoize table method to avoid re-running effects when table reference changes
  // Use a ref to store the table and its methods to ensure stability
  const tableRef = useRef(table);
  const tableResetMethodsRef = useRef<{
    resetColumnFilters: () => void;
    resetSorting: () => void;
    resetColumnVisibility: () => void;
    resetColumnOrder: () => void;
    resetColumnPinning: () => void;
  } | null>(null);

  useEffect(() => {
    tableRef.current = table;
    // Store reset methods in ref to maintain stable references
    tableResetMethodsRef.current = {
      resetColumnFilters: table.resetColumnFilters,
      resetSorting: table.resetSorting,
      resetColumnVisibility: table.resetColumnVisibility,
      resetColumnOrder: table.resetColumnOrder,
      resetColumnPinning: table.resetColumnPinning,
    };
  }, [table]);
  
  const setGlobalFilter = useCallback((value: string) => {
    // Skip update if the global filter already matches the new value
    const currentFilter = tableRef.current.getState().globalFilter;
    if (currentFilter === value) {
      return;
    }
    tableRef.current.setGlobalFilter(value);
  }, []);

  // Debounce search input - wait for user to finish typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 600); // Increased from 300ms to 600ms for better UX

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    // Skip if query hasn't actually changed
    if (debouncedQuery === previousQueryRef.current) {
      return;
    }
    previousQueryRef.current = debouncedQuery;

    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      searchCacheRef.current[schemaId] = { query: "", results: [] };
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // Only call onSearchResults if clearing (not already cleared)
      if (previousSearchResultsRef.current.query !== "" || previousSearchResultsRef.current.jobIds.length > 0) {
        previousSearchResultsRef.current = { jobIds: [], query: "" };
        onSearchResults?.({ jobIds: [], query: "" });
      }
      // Clear the global filter when search is empty (only if not already empty)
      const currentFilter = tableRef.current.getState().globalFilter;
      if (currentFilter !== "") {
        setGlobalFilter("");
      }
      return;
    }

    const performSearch = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      const currentAbortController = new AbortController();
      abortControllerRef.current = currentAbortController;
      const signal = currentAbortController.signal;
      
      setIsSearching(true);
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: debouncedQuery,
            schemaId,
          }),
          signal, // Add abort signal
        });

        // Check if request was aborted before processing response
        if (signal.aborted) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          
          // Check again before updating state (request might have been aborted during JSON parsing)
          if (signal.aborted) {
            return;
          }
          
          setSearchResults(data.results || []);
          searchCacheRef.current[schemaId] = {
            query: debouncedQuery,
            results: data.results || [],
          };
          
          // Notify parent of matching job IDs FIRST before setting filter
          const matchingJobIds = data.results.map((r: SearchResult) => r.jobId);
          console.log(`[TableToolbar] Search found ${matchingJobIds.length} matching jobs:`, matchingJobIds);
          
          // Final check before updating parent state
          if (!signal.aborted) {
            // Only call onSearchResults if the data actually changed
            const newSearchResults = { jobIds: matchingJobIds, query: debouncedQuery };
            const hasChanged = 
              previousSearchResultsRef.current.query !== newSearchResults.query ||
              previousSearchResultsRef.current.jobIds.length !== newSearchResults.jobIds.length ||
              !previousSearchResultsRef.current.jobIds.every((id, idx) => id === newSearchResults.jobIds[idx]);
            
            if (hasChanged) {
              previousSearchResultsRef.current = newSearchResults;
              onSearchResults?.(newSearchResults);
            }

            // Set global filter with search query AFTER updating matching IDs
            // Use setTimeout to ensure state has updated, but only if value changed
            setTimeout(() => {
              // Check one more time in case component unmounted or request was aborted
              if (!signal.aborted && abortControllerRef.current === currentAbortController) {
                const currentFilter = tableRef.current.getState().globalFilter;
                if (currentFilter !== debouncedQuery) {
                  setGlobalFilter(debouncedQuery);
                  console.log(`[TableToolbar] Applied global filter: "${debouncedQuery}"`);
                }
              }
            }, 0);
          }
        }
      } catch (error) {
        // Only log non-abort errors
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("[TableToolbar] Search error:", error);
        }
      } finally {
        // Only update loading state if this is still the current request
        if (abortControllerRef.current === currentAbortController && !signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    void performSearch();

    // Cleanup function to abort ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [debouncedQuery, schemaId, setGlobalFilter, onSearchResults]);

  // Restore per-tab search state when schema changes
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const cached = searchCacheRef.current[schemaId];
    const cachedQuery = cached?.query ?? "";
    const cachedResults = cached?.results ?? [];

    setSearchQuery(cachedQuery);
    setDebouncedQuery(cachedQuery);
    setSearchResults(cachedResults);
    previousQueryRef.current = cachedQuery;

    // If there's nothing cached, avoid firing callbacks/state updates during render/mount.
    if (!cachedQuery.trim() && cachedResults.length === 0) {
      previousSearchResultsRef.current = { jobIds: [], query: "" };
      return;
    }

    const ids = cachedResults.map((result) => result.jobId);
    const newSearchResults = { jobIds: ids, query: cachedQuery };
    previousSearchResultsRef.current = newSearchResults;

    // Only propagate if something actually changed
    setGlobalFilter(cachedQuery);
    onSearchResults?.(newSearchResults);
  }, [schemaId, setGlobalFilter, onSearchResults]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setDebouncedQuery("");
    previousQueryRef.current = "";
    searchCacheRef.current[schemaId] = { query: "", results: [] };
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setGlobalFilter("");
    const emptyResults = { jobIds: [], query: "" };
    previousSearchResultsRef.current = emptyResults;
    onSearchResults?.(emptyResults);
  }, [schemaId, setGlobalFilter, onSearchResults]);

  const clearFilters = useCallback(() => {
    tableResetMethodsRef.current?.resetColumnFilters();
  }, []);

  const clearSorting = useCallback(() => {
    tableResetMethodsRef.current?.resetSorting();
  }, []);

  const resetAll = useCallback(() => {
    clearSearch();
    clearFilters();
    clearSorting();
    tableResetMethodsRef.current?.resetColumnVisibility();
    tableResetMethodsRef.current?.resetColumnOrder();
    tableResetMethodsRef.current?.resetColumnPinning();
  }, [clearSearch, clearFilters, clearSorting]);

  const columns = table.getAllColumns().filter((column) => {
    // Filter out utility columns
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

  return (
    <div className="flex items-center justify-between gap-2 border-b bg-slate-50 px-4 py-2">
      {/* Left side - Search */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search across all files and data..."
            value={searchQuery}
            onChange={(e) => {
              const newValue = e.target.value;
              // Skip update if value hasn't changed
              if (searchQuery !== newValue) {
                setSearchQuery(newValue);
              }
            }}
            className={cn(
              "h-9 pl-9 pr-9",
              isSearching && "animate-pulse"
            )}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {searchResults.length} {searchResults.length === 1 ? "match" : "matches"}
          </Badge>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-2">
        {/* Active filters/sorts indicator */}
        {(activeFiltersCount > 0 || activeSortsCount > 0) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {activeFiltersCount > 0 && (
              <Badge variant="outline" className="h-6">
                <Filter className="mr-1 h-3 w-3" />
                {activeFiltersCount}
              </Badge>
            )}
            {activeSortsCount > 0 && (
              <Badge variant="outline" className="h-6">
                Sorted
              </Badge>
            )}
          </div>
        )}

        {/* Column visibility menu */}
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

        {/* Reset all button */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetAll}
          className="h-8"
          disabled={
            activeFiltersCount === 0 &&
            activeSortsCount === 0 &&
            hiddenColumnsCount === 0 &&
            !searchQuery
          }
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
