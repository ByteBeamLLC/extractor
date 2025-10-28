import type { ColumnDef, HeaderGroup } from "@tanstack/react-table";
import type { ExtractionJob, FlatLeaf, VisualGroup, SchemaField } from "@/lib/schema";
import type { ReactNode } from "react";

// Grid row data structure matching AG Grid structure
export type GridRow = {
  __job: ExtractionJob;
  fileName: string;
  status: ExtractionJob["status"];
  [key: string]: unknown;
};

// Column definition meta for custom behavior
export interface ColumnMeta extends Record<string, unknown> {
  columnMeta: FlatLeaf;
  renderCellValue: (
    column: FlatLeaf,
    job: ExtractionJob,
    opts?: { refreshRowHeight?: () => void; mode?: GridRenderMode }
  ) => ReactNode;
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void;
  onUpdateReviewStatus?: (
    jobId: string,
    columnId: string,
    status: "verified" | "needs_review",
    payload?: { reason?: string | null }
  ) => void;
  onEditColumn: (column: FlatLeaf) => void;
  onDeleteColumn: (columnId: string) => void;
  onColumnRightClick?: (columnId: string, event: React.MouseEvent) => void;
  getStatusIcon: (status: ExtractionJob["status"]) => ReactNode;
  renderStatusPill: (
    status: ExtractionJob["status"],
    opts?: { size?: "default" | "compact" }
  ) => ReactNode;
}

// Expansion state tracking
export interface CellExpansionState {
  isExpanded: (jobId: string, columnId: string) => boolean;
  toggleCellExpanded: (jobId: string, columnId: string) => void;
  expandCell: (jobId: string, columnId: string) => void;
  collapseCell: (jobId: string, columnId: string) => void;
}

// Render modes for cells
export type GridRenderMode = "interactive" | "summary" | "detail";

// Component props
export interface TanStackGridSheetProps {
  columns: FlatLeaf[];
  jobs: ExtractionJob[];
  selectedRowId: string | null;
  onSelectRow: (jobId: string) => void;
  onRowDoubleClick?: (job: ExtractionJob) => void;
  onAddColumn: () => void;
  renderCellValue: (
    column: FlatLeaf,
    job: ExtractionJob,
    opts?: { refreshRowHeight?: () => void; mode?: GridRenderMode }
  ) => ReactNode;
  getStatusIcon: (status: ExtractionJob["status"]) => ReactNode;
  renderStatusPill: (
    status: ExtractionJob["status"],
    opts?: { size?: "default" | "compact" }
  ) => ReactNode;
  onEditColumn: (column: FlatLeaf) => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void;
  onUpdateReviewStatus?: (
    jobId: string,
    columnId: string,
    status: "verified" | "needs_review",
    payload?: { reason?: string | null }
  ) => void;
  onColumnRightClick?: (columnId: string, event: React.MouseEvent) => void;
  onOpenTableModal?: (
    column: FlatLeaf,
    job: ExtractionJob,
    rows: Record<string, any>[],
    columnHeaders: Array<{ key: string; label: string }>
  ) => void;
  visualGroups?: VisualGroup[];
  expandedRowId: string | null;
  onToggleRowExpansion: (jobId: string) => void;
}

// Column grouping structure
export interface ColumnGroupDef {
  headerName: string;
  headerClass?: string;
  children: FlatLeaf[];
}

// Helper type for cell components
export interface CellRendererProps<TData = unknown> {
  value: unknown;
  row: GridRow;
  column: FlatLeaf;
  cell: {
    getValue: () => unknown;
    row: { original: GridRow };
  };
  meta: ColumnMeta;
}

// Helper type for header components
export interface HeaderRendererProps {
  column: FlatLeaf;
  meta: ColumnMeta;
  header: HeaderGroup<GridRow>;
}

