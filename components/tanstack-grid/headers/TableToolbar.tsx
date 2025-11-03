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

  // Debounce search input - wait for user to finish typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 600); // Increased from 300ms to 600ms for better UX

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      searchCacheRef.current[schemaId] = { query: "", results: [] };
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      onSearchResults?.({ jobIds: [], query: "" });
      // Clear the global filter when search is empty
      table.setGlobalFilter("");
      return;
    }

    const performSearch = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      setIsSearching(true);
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: debouncedQuery,
            schemaId,
          }),
          signal: abortControllerRef.current.signal, // Add abort signal
        });

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.results || []);
          searchCacheRef.current[schemaId] = {
            query: debouncedQuery,
            results: data.results || [],
          };
          
          // Notify parent of matching job IDs FIRST before setting filter
          const matchingJobIds = data.results.map((r: SearchResult) => r.jobId);
          console.log(`[TableToolbar] Search found ${matchingJobIds.length} matching jobs:`, matchingJobIds);
          
          onSearchResults?.({
            jobIds: matchingJobIds,
            query: debouncedQuery,
          });

          // Set global filter with search query AFTER updating matching IDs
          // Use setTimeout to ensure state has updated
          setTimeout(() => {
            table.setGlobalFilter(debouncedQuery);
            console.log(`[TableToolbar] Applied global filter: "${debouncedQuery}"`);
          }, 0);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("[TableToolbar] Search error:", error);
        }
      } finally {
        setIsSearching(false);
      }
    };

    void performSearch();
  }, [debouncedQuery, schemaId, table, onSearchResults]);

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

    if (cachedQuery.trim().length > 0) {
      table.setGlobalFilter(cachedQuery);
      const ids = cachedResults.map((result) => result.jobId);
      onSearchResults?.({ jobIds: ids, query: cachedQuery });
    } else {
      table.setGlobalFilter("");
      onSearchResults?.({ jobIds: [], query: "" });
    }
  }, [schemaId, table, onSearchResults]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setDebouncedQuery("");
    searchCacheRef.current[schemaId] = { query: "", results: [] };
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    table.setGlobalFilter("");
    onSearchResults?.({ jobIds: [], query: "" });
  };

  const clearFilters = useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  const clearSorting = useCallback(() => {
    table.resetSorting();
  }, [table]);

  const resetAll = useCallback(() => {
    clearSearch();
    clearFilters();
    clearSorting();
    table.resetColumnVisibility();
    table.resetColumnOrder();
    table.resetColumnPinning();
  }, [table, clearFilters, clearSorting]);

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
            onChange={(e) => setSearchQuery(e.target.value)}
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
