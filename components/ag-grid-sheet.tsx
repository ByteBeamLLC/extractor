"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import "@/styles/structured-data.css"

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
    opts?: { refreshRowHeight?: () => void; mode?: 'interactive' | 'summary' | 'detail'; isRowExpanded?: boolean },
  ) => ReactNode
  getStatusIcon: (status: ExtractionJob["status"]) => ReactNode
  renderStatusPill: (
    status: ExtractionJob["status"],
    opts?: { size?: 'default' | 'compact' },
  ) => ReactNode
  onEditColumn: (column: FlatLeaf) => void
  onDeleteColumn: (columnId: string) => void
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void
  expandedRowIds?: string[]
  onToggleRowExpansion?: (jobId: string) => void
}

const DEFAULT_DATA_COL_WIDTH = 220

interface FileCellRendererParams extends ICellRendererParams<GridRow> {
  getStatusIcon: (status: ExtractionJob["status"]) => ReactNode
  renderStatusPill: (
    status: ExtractionJob["status"],
    opts?: { size?: 'default' | 'compact' },
  ) => ReactNode
  isRowExpanded?: boolean
  onToggleRowExpansion?: (jobId: string) => void
  hasStructuredData?: boolean
  refreshRowHeights?: () => void
}

interface ValueCellRendererParams extends ICellRendererParams<GridRow> {
  columnMeta: FlatLeaf
  renderCellValue: (
    column: FlatLeaf,
    job: ExtractionJob,
    opts?: { refreshRowHeight?: () => void; mode?: 'interactive' | 'summary' | 'detail'; isRowExpanded?: boolean },
  ) => ReactNode
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void
  isRowExpanded?: boolean
}

// Integrated cell renderer for structured data types - appears as part of the table cell
function StructuredDataRenderer({ 
  data, 
  type, 
  field,
  isExpanded = false
}: { 
  data: any
  type: 'object' | 'list' | 'table'
  field: FlatLeaf
  isExpanded?: boolean
}) {
  if (!isExpanded) {
    // Show summary view inline
    if (!data) return <span className="text-slate-400 italic text-xs">No data</span>
    
    if (type === 'object') {
      const summaryFields = (field as any).children?.filter((child: any) => child.displayInSummary) || []
      const summaryText = summaryFields.map((f: any) => `${f.name}: ${data[f.id] || '—'}`).join(', ')
      return <span className="text-xs text-slate-600">{summaryText || 'Object data'}</span>
    }
    
    if (type === 'list') {
      const count = Array.isArray(data) ? data.length : 0
      return <span className="text-xs text-slate-600">{count} items</span>
    }
    
    if (type === 'table') {
      const count = Array.isArray(data) ? data.length : 0
      const columns = (field as any).columns?.length || 0
      return <span className="text-xs text-slate-600">{count} rows, {columns} cols</span>
    }
  }

  // Show detailed view integrated within the cell
  return (
    <div className="w-full">
      {/* Summary line for context */}
      <div className="mb-2 pb-1 border-b border-slate-200">
        {type === 'object' && (
          <span className="text-xs font-medium text-slate-700">Object Fields:</span>
        )}
        {type === 'list' && (
          <span className="text-xs font-medium text-slate-700">List ({Array.isArray(data) ? data.length : 0} items):</span>
        )}
        {type === 'table' && (
          <span className="text-xs font-medium text-slate-700">
            Table ({Array.isArray(data) ? data.length : 0} rows × {(field as any).columns?.length || 0} cols):
          </span>
        )}
      </div>

      {/* Detailed content integrated in cell */}
      {type === 'object' && data && (
        <div className="space-y-1">
          {((field as any).children || []).map((child: any) => (
            <div key={child.id} className="flex items-start text-xs border-l-2 border-slate-200 pl-2">
              <span className="font-medium text-slate-600 w-20 flex-shrink-0 truncate">{child.name}:</span>
              <span className="text-slate-800 flex-1 break-words">
                {data[child.id] !== undefined ? String(data[child.id]) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {type === 'list' && Array.isArray(data) && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {data.map((item, index) => (
            <div key={index} className="flex items-start text-xs border-l-2 border-slate-200 pl-2">
              <span className="font-medium text-slate-600 w-12 flex-shrink-0">[{index + 1}]:</span>
              <span className="text-slate-800 flex-1 break-words">
                {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
              </span>
            </div>
          ))}
        </div>
      )}

      {type === 'table' && Array.isArray(data) && (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {((field as any).columns || []).map((col: any) => (
                  <th key={col.id} className="text-left p-1 font-medium text-slate-700 border-b border-r border-slate-200 truncate min-w-16">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 8).map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-25'}>
                  {((field as any).columns || []).map((col: any) => (
                    <td key={col.id} className="p-1 text-slate-800 border-b border-r border-slate-200 truncate">
                      {row[col.id] !== undefined ? String(row[col.id]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
              {data.length > 8 && (
                <tr className="bg-slate-50">
                  <td colSpan={(field as any).columns?.length || 1} className="p-1 text-center text-slate-500 italic text-xs">
                    +{data.length - 8} more rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
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
        {params.hasStructuredData && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              params.onToggleRowExpansion?.(job.id)
              // Trigger AG Grid to recalculate row heights after expansion
              queueMicrotask(() => params.refreshRowHeights?.())
            }}
            className="flex items-center justify-center w-5 h-5 rounded text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={params.isRowExpanded ? "Collapse row" : "Expand row"}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                params.isRowExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
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
    // Since we use autoHeight: true, AG Grid will automatically adjust row heights
    // when content changes, so no manual intervention is needed
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

  // Determine render mode based on row expansion state
  const renderMode = params.isRowExpanded ? 'detail' : 'summary'

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

  // Check if this is a structured data type that should use the custom renderer
  const isStructuredType = params.columnMeta.type === 'object' || 
                           params.columnMeta.type === 'list' || 
                           params.columnMeta.type === 'table'

  if (isStructuredType) {
    const data = job.results?.[params.columnMeta.id]
    return (
      <div 
        className="w-full" 
        data-column-id={params.column?.getColId()} 
        data-cell-type={params.columnMeta.type}
      >
        <StructuredDataRenderer 
          data={data}
          type={params.columnMeta.type as 'object' | 'list' | 'table'}
          field={params.columnMeta}
          isExpanded={params.isRowExpanded}
        />
      </div>
    )
  }

  return (
    <div 
      className="w-full" 
      data-column-id={params.column?.getColId()} 
      data-cell-type={params.columnMeta.type}
      onDoubleClick={startEdit}
    >
      {params.renderCellValue(params.columnMeta, job, { 
        refreshRowHeight, 
        mode: renderMode, 
        isRowExpanded: params.isRowExpanded 
      })}
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
    <div className="bb-ag-header-clickable group flex w-full items-center justify-between gap-2">
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
  expandedRowIds = [],
  onToggleRowExpansion,
}: AgGridSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<AgGridReact<GridRow>>(null)
  const [pinPlusRight, setPinPlusRight] = useState(false)
  
  // Helper function to check if a job has structured data
  const hasStructuredData = useCallback((job: ExtractionJob) => {
    return columns.some(col => {
      const value = job.results?.[col.id]
      return (col.type === 'object' || col.type === 'list' || col.type === 'table') && value
    })
  }, [columns])
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
        cellRendererParams: (params: any) => ({
          getStatusIcon,
          renderStatusPill,
          isRowExpanded: expandedRowIds.includes(params.data?.__job?.id || ''),
          onToggleRowExpansion,
          hasStructuredData: params.data?.__job ? hasStructuredData(params.data.__job) : false,
          refreshRowHeights: () => {
            // Since we use autoHeight: true, we don't need to manually reset heights
            // AG Grid will automatically adjust row heights when content changes
          },
        }),
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
        },
        cellRenderer: ValueCellRenderer,
        cellRendererParams: (params: any) => ({
          columnMeta: column,
          renderCellValue,
          onUpdateCell,
          isRowExpanded: expandedRowIds.includes(params.data?.__job?.id || ''),
        }),
        cellClass: (params) => {
          const classes = ["ag-cell-wrap-text"]
          // Add data attribute via CSS class for structured data types
          if (column.type === 'object' || column.type === 'list' || column.type === 'table') {
            classes.push(`cell-type-${column.type}`)
          }
          return classes.join(' ')
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
  }, [columns, getStatusIcon, renderStatusPill, renderCellValue, onEditColumn, onDeleteColumn, onAddColumn, pinPlusRight, expandedRowIds, onToggleRowExpansion, hasStructuredData])

  const defaultColDef = useMemo<ColDef<GridRow>>(
    () => ({
      resizable: true,
      sortable: false,
      suppressHeaderMenuButton: true,
      cellClass: "ag-cell-wrap-text",
      autoHeight: true,
      wrapText: true,
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
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        rowClassRules={rowClassRules}
        suppressRowVirtualisation={false}
        rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
        theme="legacy"
        headerHeight={48}
        domLayout='normal'
        onRowClicked={onRowClicked}
        animateRows
        overlayNoRowsTemplate="<div class='py-12 text-muted-foreground text-sm'>No extraction results yet. Upload documents to get started.</div>"
      />
    </div>
  )
}
