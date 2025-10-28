import { useState, useCallback } from "react";

/**
 * Hook for managing cell expansion state (for object, list, and table types)
 * Tracks which cells are expanded across all rows using jobId + columnId
 */
export function useCellExpansionState() {
  // Map of jobId -> Set of columnIds that are expanded
  const [expandedCells, setExpandedCells] = useState<Map<string, Set<string>>>(
    () => new Map()
  );

  const isCellExpanded = useCallback(
    (jobId: string, columnId: string): boolean => {
      const columnSet = expandedCells.get(jobId);
      return columnSet?.has(columnId) ?? false;
    },
    [expandedCells]
  );

  const toggleCellExpanded = useCallback(
    (jobId: string, columnId: string) => {
      setExpandedCells((prev) => {
        const next = new Map(prev);
        const columnSet = next.get(jobId) ?? new Set();
        
        if (columnSet.has(columnId)) {
          columnSet.delete(columnId);
        } else {
          columnSet.add(columnId);
        }

        if (columnSet.size === 0) {
          next.delete(jobId);
        } else {
          next.set(jobId, columnSet);
        }

        return next;
      });
    },
    []
  );

  const expandCell = useCallback((jobId: string, columnId: string) => {
    setExpandedCells((prev) => {
      const next = new Map(prev);
      const columnSet = next.get(jobId) ?? new Set();
      columnSet.add(columnId);
      next.set(jobId, columnSet);
      return next;
    });
  }, []);

  const collapseCell = useCallback((jobId: string, columnId: string) => {
    setExpandedCells((prev) => {
      const next = new Map(prev);
      const columnSet = next.get(jobId);
      
      if (columnSet) {
        columnSet.delete(columnId);
        if (columnSet.size === 0) {
          next.delete(jobId);
        } else {
          next.set(jobId, columnSet);
        }
      }

      return next;
    });
  }, []);

  return {
    isCellExpanded,
    toggleCellExpanded,
    expandCell,
    collapseCell,
  };
}

