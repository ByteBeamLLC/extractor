"use client";

import { useState, useCallback, useRef } from "react";
import type { Table } from "@tanstack/react-table";
import type { GridRow } from "../types";

export interface UseColumnDragDropResult {
  draggedColumn: string | null;
  handleColumnDragStart: (columnId: string, e: React.DragEvent) => void;
  handleColumnDragOver: (e: React.DragEvent) => void;
  handleColumnDrop: (targetColumnId: string, e: React.DragEvent) => void;
  handleColumnDragEnd: () => void;
}

/**
 * Hook for handling column drag and drop reordering
 */
export function useColumnDragDrop(
  tableRef: React.RefObject<Table<GridRow> | null>
): UseColumnDragDropResult {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  const handleColumnDragStart = useCallback(
    (columnId: string, e: React.DragEvent) => {
      if (!e.dataTransfer) return;
      setDraggedColumn(columnId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", columnId);
    },
    []
  );

  const handleColumnDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleColumnDrop = useCallback(
    (targetColumnId: string, e: React.DragEvent) => {
      e.preventDefault();
      const sourceColumnId = e.dataTransfer.getData("text/plain");

      if (!sourceColumnId || sourceColumnId === targetColumnId) {
        setDraggedColumn(null);
        return;
      }

      const table = tableRef.current;
      if (!table) {
        setDraggedColumn(null);
        return;
      }

      // Get current column order
      const currentOrder = table.getState().columnOrder;
      const allColumns = table.getAllLeafColumns().map((col) => col.id);
      const activeOrder =
        Array.isArray(currentOrder) && currentOrder.length > 0
          ? currentOrder
          : allColumns;

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
    },
    [tableRef]
  );

  const handleColumnDragEnd = useCallback(() => {
    setDraggedColumn(null);
  }, []);

  return {
    draggedColumn,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDrop,
    handleColumnDragEnd,
  };
}
