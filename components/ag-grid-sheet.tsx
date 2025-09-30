"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ComponentProps, ReactNode } from "react"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import type { ColDef, ColGroupDef, GetRowIdParams, ICellRendererParams, IHeaderParams, RowClassRules } from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"

import type { ExtractionJob, FlatLeaf, VisualGroup } from "@/lib/schema"
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
  onAddColumn: () => void
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
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void
  onColumnRightClick?: (columnId: string, event: React.MouseEvent) => void
  visualGroups?: VisualGroup[]
}

const DEFAULT_DATA_COL_WIDTH = 220

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
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void
}

interface ColumnHeaderRendererParams extends IHeaderParams<GridRow> {
  columnMeta: FlatLeaf
  onEditColumn: (column: FlatLeaf) => void
  onDeleteColumn: (columnId: string) => void
  onColumnRightClick?: (columnId: string, event: React.MouseEvent) => void
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
      params.api.resetRowHeights()
    })
  }

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<any>(job.results?.[params.columnMeta.id] ?? '')

  const startEdit = () => {
    if (params.columnMeta.type === 'object' || params.columnMeta.type === 'table' || params.columnMeta.type === 'list') return
    setDraft(job.results?.[params.columnMeta.id] ?? '')
    setIsEditing(true)
  }

  const commitEdit = () => {
    setIsEditing(false)
    params.onUpdateCell(job.id, params.columnMeta.id, draft)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setDraft(job.results?.[params.columnMeta.id] ?? '')
  }

  if (isEditing) {
    const type = params.columnMeta.type
    if (type === 'number' || type === 'decimal') {
      return (
        <input
          className="w-full border rounded-md px-2 py-1 text-right"
          autoFocus
          inputMode="decimal"
          value={draft as any}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
        />
      )
    }
    if (type === 'boolean') {
      return (
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={Boolean(draft)} onChange={(e) => { setDraft(e.target.checked); params.onUpdateCell(job.id, params.columnMeta.id, e.target.checked); setIsEditing(false) }} />
        </div>
      )
    }
    if (type === 'date') {
      return (
        <input
          className="w-full border rounded-md px-2 py-1 font-mono text-xs"
          autoFocus
          type="text"
          placeholder="YYYY-MM-DD"
          value={draft as any}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
        />
      )
    }
    // default text
    return (
      <textarea
        className="w-full border rounded-md px-2 py-1 text-sm"
        rows={2}
        autoFocus
        value={draft as any}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit() } if (e.key === 'Escape') cancelEdit() }}
      />
    )
  }

  return (
    <div className="w-full" data-column-id={params.column?.getColId()} onDoubleClick={startEdit}>
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

function ColumnHeaderRenderer({ columnMeta, onEditColumn, onDeleteColumn, onColumnRightClick }: ColumnHeaderRendererParams) {
  return (
    <div 
      className="bb-ag-header-clickable group flex w-full items-center justify-between gap-2"
      onContextMenu={(e) => {
        if (onColumnRightClick) {
          e.preventDefault()
          onColumnRightClick(columnMeta.id, e as any)
        }
      }}
    >
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
        className="shrink-0 rounded-full p-1.5 text-slate-400 opacity-0 pointer-events-none transition-all hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-300 group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100"
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
  onAddColumn,
  renderCellValue,
  getStatusIcon,
  renderStatusPill,
  onEditColumn,
  onDeleteColumn,
  onUpdateCell,
  onColumnRightClick,
  visualGroups = [],
}: AgGridSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pinPlusRight, setPinPlusRight] = useState(false)
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

  const columnDefs = useMemo<(ColDef<GridRow> | ColGroupDef<GridRow>)[]>(() => {
    const defs: (ColDef<GridRow> | ColGroupDef<GridRow>)[] = [
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

    // Organize columns by visual groups
    const groupedFieldIds = new Set<string>()
    const fieldIdToGroup = new Map<string, VisualGroup>()
    
    for (const group of visualGroups) {
      for (const fieldId of group.fieldIds) {
        groupedFieldIds.add(fieldId)
        fieldIdToGroup.set(fieldId, group)
      }
    }

    // Add visual group columns with spanning headers
    for (const group of visualGroups) {
      const groupColumns = columns.filter(col => group.fieldIds.includes(col.id))
      if (groupColumns.length === 0) continue

      const children: ColDef<GridRow>[] = groupColumns.map(column => ({
        headerName: column.name,
        colId: column.id,
        field: column.id,
        width: DEFAULT_DATA_COL_WIDTH,
        minWidth: 140,
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
          onColumnRightClick,
        },
        cellRenderer: ValueCellRenderer,
        cellRendererParams: {
          columnMeta: column,
          renderCellValue,
          onUpdateCell,
        },
      }))

      // Add group definition with spanning header
      defs.push({
        headerName: group.name,
        headerClass: "ag-header-group-cell-with-group font-semibold text-slate-900 bg-slate-50",
        children,
      } as ColGroupDef<GridRow>)
    }

    // Add ungrouped columns
    for (const column of columns) {
      if (groupedFieldIds.has(column.id)) continue

      defs.push({
        headerName: column.name,
        colId: column.id,
        field: column.id,
        width: DEFAULT_DATA_COL_WIDTH,
        minWidth: 140,
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
          onColumnRightClick,
        },
        cellRenderer: ValueCellRenderer,
        cellRendererParams: {
          columnMeta: column,
          renderCellValue,
          onUpdateCell,
        },
      })
    }

    defs.push({
      headerName: "",
      colId: "bb-add-field",
      width: 56,
      minWidth: 48,
      maxWidth: 64,
      pinned: pinPlusRight ? "right" : undefined,
      resizable: false,
      suppressMovable: true,
      sortable: false,
      headerComponent: () => {
        return (
          <div className="flex w-full items-center justify-center">
            <button
              type="button"
              title="Add Field"
              onClick={(e) => { e.preventDefault(); onAddColumn() }}
              className="p-2 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 bg-gray-100"
              aria-label="Add Field"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
        )
      },
      cellRenderer: () => null,
    })

    return defs
  }, [columns, visualGroups, getStatusIcon, renderStatusPill, renderCellValue, onEditColumn, onDeleteColumn, onAddColumn, onUpdateCell, onColumnRightClick, pinPlusRight])

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

  // When grid width is smaller than total columns width, pin plus to right
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const containerWidth = el.clientWidth
      const pinnedLeftWidth = 60 + 220
      const dataColsWidth = Math.max(columns.length, 1) * DEFAULT_DATA_COL_WIDTH
      const plusColWidth = 56
      const totalNeeded = pinnedLeftWidth + dataColsWidth + plusColWidth
      setPinPlusRight(totalNeeded > containerWidth)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [columns.length])

  return (
    <div ref={containerRef} className={cn("ag-theme-quartz ag-theme-bytebeam h-full w-full")}> 
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
