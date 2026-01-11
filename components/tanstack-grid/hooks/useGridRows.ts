"use client";

import { useMemo } from "react";
import type { Row } from "@tanstack/react-table";
import type { GridRow, ExtractionJob, SchemaColumn } from "../types";
import { sanitizeValue } from "../utils/sanitizeValue";

export interface VirtualizedGridRow {
  key: string;
  type: "row" | "detail";
  row: Row<GridRow>;
}

/**
 * Transforms extraction jobs to grid rows with sanitized values
 */
export function useGridRows(
  jobs: ExtractionJob[],
  columns: SchemaColumn[],
  schemaId?: string
): GridRow[] {
  return useMemo(() => {
    return jobs.map((job) => {
      const valueMap: Record<string, unknown> = {};

      for (const col of columns) {
        if (col.type === "input") {
          const doc = job.inputDocuments?.[col.id];
          valueMap[col.id] = doc?.fileName ?? doc?.textValue ?? null;
        } else {
          const rawValue = job.results?.[col.id] ?? null;

          // If a non-structured column receives an object, coerce to string
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
  }, [columns, jobs, schemaId]);
}

/**
 * Creates virtualized rows with expansion support
 */
export function useVirtualizedRows(
  tableRows: Row<GridRow>[],
  expandedRowId: string | null | undefined
): VirtualizedGridRow[] {
  return useMemo(() => {
    const items: VirtualizedGridRow[] = [];

    for (const row of tableRows) {
      items.push({ key: row.id, type: "row", row });

      if (row.original.__job.id === expandedRowId) {
        items.push({ key: `${row.id}-detail`, type: "detail", row });
      }
    }

    return items;
  }, [tableRows, expandedRowId]);
}
