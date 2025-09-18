"use client"

import { useCallback, useMemo } from "react"
import type { ComponentProps, ReactNode } from "react"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import type { ColDef, GetRowIdParams, ICellRendererParams, IHeaderParams, RowClassRules } from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"

import type { ExtractionJob, FlatLeaf } from "@/lib/schema"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import "@/styles/ag-grid-overrides.css"

if (!(ModuleRegistry as any).__bbAllCommunityRegistered) {
  ModuleRegistry.registerModules([AllCommunityModule])
  ;(ModuleRegistry as any).__bbAllCommunityRegistered = true
}

type GridRow = {
  __job: ExtractionJob
  fileName: string
  status: ExtractionJob["status"]
  [key: string]: unknown
}

interface AgGridSheetProps {
  columns: FlatLeaf[]
  jobs: ExtractionJob[]
  selectedRowId: string | null
  onSelectRow: (jobId: string) => void
  renderCellValue: (
    column: FlatLeaf,
    job: ExtractionJob,
    opts?: { refreshRowHeight?: () => void },
  ) => ReactNode
  getStatusIcon: (status: ExtractionJob["status"]) => ReactNode
  renderStatusPill: (
    status: ExtractionJob["status"],
    opts?: { size?: 'default' | 'compact' },
  ) => ReactNode
  onEditColumn: (column: FlatLeaf) => void
  onDeleteColumn: (columnId: string) => void
}

interface FileCellRendererParams extends ICellRendererParams<GridRow> {
  getStatusIcon: (status: ExtractionJob["status"]) => ReactNode
  renderStatusPill: (
    status: ExtractionJob["status"],
    opts?: { size?: 'default' | 'compact' },
  ) => ReactNode
}

interface ValueCellRendererParams extends ICellRendererParams<GridRow> {
  columnMeta: FlatLeaf
  renderCellValue: (
    column: FlatLeaf,
    job: ExtractionJob,
    opts?: { refreshRowHeight?: () => void; mode?: 'interactive' | 'summary' | 'detail' },
  ) => ReactNode
}

interface ColumnHeaderRendererParams extends IHeaderParams<GridRow> {
  columnMeta: FlatLeaf
  onEditColumn: (column: FlatLeaf) => void
  onDeleteColumn: (columnId: string) => void
}

function FileCellRenderer(params: FileCellRendererParams) {
  const job = params.data?.__job
  if (!job) return null

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-2">
        {params.getStatusIcon(job.status)}
        {params.renderStatusPill(job.status, { size: 'compact' })}
      </div>
      <span className="truncate text-sm font-medium text-slate-700" title={job.fileName}>
        {job.fileName}
      </span>
    </div>
  )
}

function ValueCellRenderer(params: ValueCellRendererParams) {
  const job = params.data?.__job
  if (!job) return <span className="text-muted-foreground">—</span>

  const refreshRowHeight = () => {
    queueMicrotask(() => {
      params.api.resetRowHeights({ rowNodes: [params.node] })
    })
  }

  return (
    <div className="w-full" data-column-id={params.column?.getColId()}>
      {params.renderCellValue(params.columnMeta, job, { refreshRowHeight, mode: 'interactive' })}
    </div>
  )
}

function RowIndexRenderer(params: ICellRendererParams<GridRow>) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      {(params.node?.rowIndex ?? 0) + 1}
    </span>
  )
}

function ColumnHeaderRenderer({ columnMeta, onEditColumn, onDeleteColumn }: ColumnHeaderRendererParams) {
  return (
    <div className="bb-ag-header-clickable flex w-full items-center justify-between gap-2">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault()
          onEditColumn(columnMeta)
        }}
        className="flex min-w-0 flex-1 items-center gap-2 truncate text-left text-sm font-semibold text-slate-700 transition-colors hover:text-primary focus:outline-none"
      >
        <span className="truncate" title={columnMeta.name}>
          {columnMeta.name}
        </span>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onDeleteColumn(columnMeta.id)
        }}
        className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-300"
        aria-label={`Delete column ${columnMeta.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function AgGridSheet({
  columns,
  jobs,
  selectedRowId,
  onSelectRow,
  renderCellValue,
  getStatusIcon,
  renderStatusPill,
  onEditColumn,
  onDeleteColumn,
}: AgGridSheetProps) {
  const rowData = useMemo<GridRow[]>(() => {
    return jobs.map((job) => {
      const valueMap: Record<string, unknown> = {}
      for (const col of columns) {
        valueMap[col.id] = job.results?.[col.id] ?? null
      }
      return {
        __job: job,
        fileName: job.fileName,
        status: job.status,
        ...valueMap,
      }
    })
  }, [columns, jobs])

  const columnDefs = useMemo<ColDef<GridRow>[]>(() => {
    const defs: ColDef<GridRow>[] = [
      {
        headerName: "#",
        colId: "row-index",
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        pinned: "left",
        suppressHeaderMenuButton: true,
        suppressMovable: true,
        resizable: false,
        width: 60,
        maxWidth: 60,
        minWidth: 56,
        cellRenderer: RowIndexRenderer,
        cellClass: "flex items-center justify-center gap-1",
        headerClass: "flex items-center justify-center text-xs font-semibold uppercase tracking-wide text-slate-400",
      },
      {
        headerName: "File",
        colId: "file-name",
        field: "fileName",
        pinned: "left",
        width: 220,
        minWidth: 200,
        maxWidth: 260,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        sortable: false,
        cellRenderer: FileCellRenderer,
        cellRendererParams: {
          getStatusIcon,
          renderStatusPill,
        },
        cellClass: "ag-cell-wrap-text",
        autoHeight: true,
        wrapText: true,
      },
    ]

    for (const column of columns) {
      defs.push({
        headerName: column.name,
        colId: column.id,
        field: column.id,
        minWidth: 180,
        flex: 1,
        resizable: true,
        sortable: false,
        autoHeight: true,
        wrapText: true,
        tooltipValueGetter: () =>
          [column.description, column.extractionInstructions].filter(Boolean).join(" • "),
        headerTooltip: [column.description, column.extractionInstructions].filter(Boolean).join(" • ") || undefined,
        headerComponent: ColumnHeaderRenderer,
        headerComponentParams: {
          columnMeta: column,
          onEditColumn,
          onDeleteColumn,
        },
        cellRenderer: ValueCellRenderer,
        cellRendererParams: {
          columnMeta: column,
          renderCellValue,
        },
      })
    }

    return defs
  }, [columns, getStatusIcon, renderStatusPill, renderCellValue, onEditColumn, onDeleteColumn])

  const defaultColDef = useMemo<ColDef<GridRow>>(
    () => ({
      resizable: true,
      sortable: false,
      suppressHeaderMenuButton: true,
      cellClass: "ag-cell-wrap-text",
    }),
    [],
  )

  const getRowId = useCallback((params: GetRowIdParams<GridRow>) => params.data?.__job.id ?? "", [])

  const rowClassRules = useMemo<RowClassRules>(
    () => ({
      "ag-row-selected": (params) => params.data?.__job.id === selectedRowId,
    }),
    [selectedRowId],
  )

  const onRowClicked = useCallback<NonNullable<ComponentProps<typeof AgGridReact<GridRow>>["onRowClicked"]>>(
    (event) => {
      const job = event.data?.__job
      if (job) {
        onSelectRow(job.id)
      }
    },
    [onSelectRow],
  )

  return (
    <div className={cn("ag-theme-quartz ag-theme-bytebeam h-full w-full")}> 
      <AgGridReact<GridRow>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        rowClassRules={rowClassRules}
        suppressRowVirtualisation={false}
        rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
        theme="legacy"
        headerHeight={48}
        rowHeight={60}
        onRowClicked={onRowClicked}
        animateRows
        overlayNoRowsTemplate="<div class='py-12 text-muted-foreground text-sm'>No extraction results yet. Upload documents to get started.</div>"
      />
    </div>
  )
}
