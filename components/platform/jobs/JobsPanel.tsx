"use client"

import type { ReactNode } from "react"

import type { ExtractionJob, FlatLeaf } from "@/lib/schema/types"
import type { ColumnHandlers } from "../columns/ColumnsPanel"
import { JobsGrid } from "./JobsGrid"

interface JobsPanelProps extends ColumnHandlers {
  columns: FlatLeaf[]
  jobs: ExtractionJob[]
  selectedRowId: string | null
  onSelectRow: (jobId: string) => void
  renderCellValue: (
    column: FlatLeaf,
    job: ExtractionJob,
    opts?: { refreshRowHeight?: () => void }
  ) => ReactNode
  getStatusIcon: (status: ExtractionJob["status"]) => ReactNode
  renderStatusPill: (status: ExtractionJob["status"], opts?: { size?: "default" | "compact" }) => ReactNode
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void
}

export function JobsPanel({
  columns,
  jobs,
  selectedRowId,
  onSelectRow,
  renderCellValue,
  getStatusIcon,
  renderStatusPill,
  onUpdateCell,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
}: JobsPanelProps) {
  return (
    <div className="h-full">
      <JobsGrid
        columns={columns}
        jobs={jobs}
        selectedRowId={selectedRowId}
        onSelectRow={onSelectRow}
        onAddColumn={onAddColumn}
        renderCellValue={renderCellValue}
        getStatusIcon={getStatusIcon}
        renderStatusPill={renderStatusPill}
        onEditColumn={onEditColumn}
        onDeleteColumn={onDeleteColumn}
        onUpdateCell={onUpdateCell}
      />
    </div>
  )
}
