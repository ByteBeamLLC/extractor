"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ComponentType, ReactNode } from "react"
import { AgGridReact } from "ag-grid-react"
import type {
  ColDef,
  ColumnApi,
  ColumnResizedEvent,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IHeaderReactComp,
  IHeaderReactCompParams,
} from "ag-grid-community"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import type { FlatLeaf, ExtractionJob, DataType, TransformationType } from "@/lib/schema"
import { Calendar, Calculator, FileText, Globe, Hash, Link, List, Mail, MapPin, Phone, Settings, ToggleLeft, Trash2, Type, Zap } from "lucide-react"

export type ResultsGridRow = {
  id: string
  job: ExtractionJob
  jobIndex: number
  fileName: string
  status: ExtractionJob["status"]
} & Record<string, any>

const dataTypeIcons: Record<DataType, ComponentType<{ className?: string }>> = {
  string: Type,
  number: Hash,
  decimal: Hash,
  boolean: ToggleLeft,
  date: Calendar,
  email: Mail,
  url: Link,
  phone: Phone,
  address: MapPin,
  richtext: FileText,
  list: List,
  object: Globe,
  table: List,
}

const transformationIcons: Record<TransformationType, ComponentType<{ className?: string }>> = {
  currency_conversion: Calculator,
  classification: Zap,
  calculation: Calculator,
  gemini_api: Zap,
  custom: Settings,
}

const DEFAULT_COL_WIDTH = 192
const MIN_COL_WIDTH = 120
const MAX_COL_WIDTH = 640

interface AgResultsGridProps {
  jobs: ExtractionJob[]
  columns: FlatLeaf[]
  columnWidths: Record<string, number>
  onColumnWidthChange?: (columnId: string, width: number) => void
  onOpenColumnConfig: (column: FlatLeaf) => void
  onDeleteColumn: (columnId: string) => void
  selectedRowId: string | null
  onSelectRow: (jobId: string) => void
  renderStatusPill: (status: ExtractionJob["status"]) => ReactNode
  getStatusIcon: (status: ExtractionJob["status"]) => ReactNode
  onGridReady?: (api: GridApi<ResultsGridRow>, columnApi: ColumnApi) => void
}

interface HeaderComponentParams extends IHeaderReactCompParams {
  schemaField: FlatLeaf
  onOpenColumn: (column: FlatLeaf) => void
  onDeleteColumn: (columnId: string) => void
  Icon: ComponentType<{ className?: string }>
}

const ResultsColumnHeader = ({
  params,
}: {
  params: HeaderComponentParams
}) => {
  const { schemaField, onOpenColumn, onDeleteColumn, Icon } = params
  const sort = params.column?.getSort()

  const handleClick = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest("[data-role=delete]") || (event.target as HTMLElement).closest("[data-role=sort]")) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    onOpenColumn(schemaField)
  }

  const handleDelete = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onDeleteColumn(schemaField.id)
  }

  const handleSort = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    params.progressSort?.(event.shiftKey)
  }

  return (
    <div className="flex items-center justify-between gap-2" onClick={handleClick} role="button">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate" title={schemaField.name}>
              {schemaField.name}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={6} className="max-w-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 opacity-80" />
              <span className="text-xs font-medium">{schemaField.name}</span>
            </div>
            {schemaField.description && <p className="text-[11px] opacity-90">{schemaField.description}</p>}
            {schemaField.extractionInstructions && (
              <p className="text-[11px] opacity-70">{schemaField.extractionInstructions}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      <div className="flex items-center gap-1">
        <button
          type="button"
          data-role="sort"
          onClick={handleSort}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Sort column"
        >
          {sort === "asc" ? (
            <span className="inline-flex text-xs">▲</span>
          ) : sort === "desc" ? (
            <span className="inline-flex text-xs">▼</span>
          ) : (
            <span className="inline-flex text-xs text-muted-foreground/60">⇅</span>
          )}
        </button>
        <Button size="icon" variant="ghost" data-role="delete" onClick={handleDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

const ResultsHeaderComponent = forwardRef<IHeaderReactComp, HeaderComponentParams>((params, ref) => {
  useEffect(() => {
    const handler = () => params.api.refreshHeader()
    params.column?.addEventListener("sortChanged", handler)
    return () => {
      params.column?.removeEventListener("sortChanged", handler)
    }
  }, [params])

  useImperativeHandle(ref, () => ({
    refresh: () => true,
  }))

  return <ResultsColumnHeader params={params} />
})

interface ValueCellRendererParams extends ICellRendererParams<ResultsGridRow> {
  schemaField: FlatLeaf
}

const ValueCellRenderer: React.FC<ValueCellRendererParams> = ({ data, schemaField, value }) => {
  const job: ExtractionJob | undefined = data?.job
  const cellValue = value

  if (!job) return null
  if (job.status === "error") {
    return <span className="text-sm text-destructive">—</span>
  }
  if (job.status !== "completed") {
    return <Skeleton className="h-4 w-24" />
  }
  if (cellValue === undefined || cellValue === null || cellValue === "") {
    return <span className="text-muted-foreground">—</span>
  }
  if (schemaField.type === "boolean") {
    const truthy = Boolean(cellValue)
    return (
      <span
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-medium",
          truthy
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            : "bg-muted text-muted-foreground",
        )}
      >
        {truthy ? "True" : "False"}
      </span>
    )
  }
  if (Array.isArray(cellValue)) {
    return (
      <span className="truncate block w-full" title={JSON.stringify(cellValue)}>
        {cellValue.length} items
      </span>
    )
  }
  if (typeof cellValue === "object") {
    const str = (() => {
      try {
        return JSON.stringify(cellValue)
      } catch {
        return String(cellValue)
      }
    })()
    return (
      <span className="truncate block w-full" title={str}>
        {str}
      </span>
    )
  }
  return (
    <span className="truncate block w-full" title={String(cellValue)}>
      {String(cellValue)}
    </span>
  )
}

const FileCellRenderer: React.FC<ICellRendererParams<ResultsGridRow>> = ({ data, value, context }) => {
  if (!data) return null
  const { renderStatusPill, getStatusIcon } = context as {
    renderStatusPill: (status: ExtractionJob["status"]) => ReactNode
    getStatusIcon: (status: ExtractionJob["status"]) => ReactNode
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      {getStatusIcon(data.status)}
      <span className="shrink-0">{renderStatusPill(data.status)}</span>
      <span className="truncate" title={String(value ?? data.fileName)}>
        {value ?? data.fileName}
      </span>
    </div>
  )
}

function getCellClassName(column: FlatLeaf) {
  if (column.type === "number" || column.type === "decimal") {
    return "bb-grid-cell justify-end text-right [font-variant-numeric:tabular-nums]"
  }
  if (column.type === "date") {
    return "bb-grid-cell font-mono text-xs"
  }
  return "bb-grid-cell text-left"
}

export function AgResultsGrid({
  jobs,
  columns,
  columnWidths,
  onColumnWidthChange,
  onOpenColumnConfig,
  onDeleteColumn,
  selectedRowId,
  onSelectRow,
  renderStatusPill,
  getStatusIcon,
  onGridReady,
}: AgResultsGridProps) {
  const gridRef = useRef<AgGridReact<ResultsGridRow>>(null)
  const [gridApi, setGridApi] = useState<GridApi<ResultsGridRow> | null>(null)
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null)
  const [canScroll, setCanScroll] = useState({ left: false, right: false })
  const { resolvedTheme } = useTheme()

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [jobs],
  )

  const rowData = useMemo<ResultsGridRow[]>(() => {
    return sortedJobs.map((job, index) => {
      const row: ResultsGridRow = {
        id: job.id,
        job,
        jobIndex: index,
        fileName: job.fileName,
        status: job.status,
      }
      for (const column of columns) {
        row[column.id] = job.results?.[column.id] ?? null
      }
      return row
    })
  }, [sortedJobs, columns])

  const columnDefs = useMemo<ColDef<ResultsGridRow>[]>(() => {
    const defs: ColDef<ResultsGridRow>[] = [
      {
        headerName: "#",
        colId: "row-index",
        valueGetter: (params) => (params.node?.rowIndex != null ? params.node.rowIndex + 1 : ""),
        width: 60,
        pinned: "left",
        lockPinned: true,
        resizable: false,
        sortable: false,
        suppressMovable: true,
        suppressMenu: true,
        cellClass: "bb-grid-cell justify-center text-xs text-muted-foreground",
        headerClass: "justify-center text-xs text-muted-foreground",
        suppressCsvExport: true,
      },
      {
        headerName: "File",
        field: "fileName",
        colId: "fileName",
        pinned: "left",
        lockPinned: true,
        width: 224,
        minWidth: 200,
        maxWidth: 360,
        resizable: true,
        sortable: true,
        suppressMenu: true,
        cellRenderer: FileCellRenderer,
        tooltipField: "fileName",
        cellClass: "bb-grid-cell",
      },
      {
        headerName: "Status",
        field: "status",
        colId: "status",
        hide: true,
        suppressMovable: true,
        sortable: false,
        resizable: false,
        suppressMenu: true,
      },
    ]

    for (const column of columns) {
      const Icon = column.isTransformation
        ? transformationIcons[column.transformationType ?? "custom"]
        : dataTypeIcons[column.type as DataType]

      defs.push({
        headerName: column.name,
        field: column.id,
        colId: column.id,
        width: columnWidths[column.id] ?? DEFAULT_COL_WIDTH,
        minWidth: MIN_COL_WIDTH,
        maxWidth: MAX_COL_WIDTH,
        resizable: true,
        sortable: true,
        suppressMenu: true,
        headerComponent: ResultsHeaderComponent,
        headerComponentParams: {
          schemaField: column,
          onOpenColumn: onOpenColumnConfig,
          onDeleteColumn,
          Icon,
        },
        headerTooltip: [column.description, column.extractionInstructions].filter(Boolean).join("\n"),
        cellRenderer: ValueCellRenderer,
        cellRendererParams: { schemaField: column },
        cellClass: getCellClassName(column),
      })
    }

    return defs
  }, [columns, columnWidths, onDeleteColumn, onOpenColumnConfig])

  const defaultColDef = useMemo<ColDef<ResultsGridRow>>(
    () => ({
      resizable: true,
      sortable: true,
      filter: false,
      flex: undefined,
    }),
    [],
  )

  const handleColumnResized = useCallback(
    (event: ColumnResizedEvent<ResultsGridRow>) => {
      if (!event.finished || !event.column) return
      const colId = event.column.getColId()
      if (!colId) return
      if (!columns.find((column) => column.id === colId)) return
      onColumnWidthChange?.(colId, event.column.getActualWidth())
    },
    [columns, onColumnWidthChange],
  )

  const handleGridReady = useCallback(
    (params: GridReadyEvent<ResultsGridRow>) => {
      setGridApi(params.api)
      setColumnApi(params.columnApi)
      onGridReady?.(params.api, params.columnApi)
    },
    [onGridReady],
  )

  useEffect(() => {
    if (!columnApi) return
    for (const column of columns) {
      const width = columnWidths[column.id]
      if (typeof width !== "number") continue
      const col = columnApi.getColumn(column.id)
      if (!col) continue
      if (Math.abs(col.getActualWidth() - width) > 1) {
        columnApi.setColumnWidth(col, Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, width)), true)
      }
    }
  }, [columnApi, columns, columnWidths])

  useEffect(() => {
    if (!gridApi) return
    const root = gridApi.getGui()
    const viewport = root.querySelector(".ag-center-cols-viewport") as HTMLDivElement | null
    if (!viewport) return

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = viewport
      setCanScroll({
        left: scrollLeft > 0,
        right: scrollLeft + clientWidth < scrollWidth - 1,
      })
    }

    update()
    viewport.addEventListener("scroll", update)
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(viewport)

    return () => {
      viewport.removeEventListener("scroll", update)
      resizeObserver.disconnect()
    }
  }, [gridApi, columnDefs.length, rowData.length])

  useEffect(() => {
    if (!gridApi) return
    gridApi.forEachNode((node) => {
      if (!node.data) return
      const shouldSelect = node.data.id === selectedRowId
      if (shouldSelect !== node.isSelected()) {
        node.setSelected(shouldSelect)
      }
    })
  }, [gridApi, selectedRowId, rowData])

  const themeClass = resolvedTheme === "dark" ? "ag-theme-quartz ag-theme-quartz-dark" : "ag-theme-quartz"

  return (
    <div className="relative h-full">
      {canScroll.left && <div className="pointer-events-none absolute inset-y-0 left-[17rem] w-6 bg-gradient-to-r from-background to-transparent z-10" />}
      {canScroll.right && <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10" />}
      <div className={cn("h-full w-full relative", themeClass)}>
        <AgGridReact<ResultsGridRow>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="single"
          enableRangeSelection={true}
          columnHoverHighlight={true}
          onColumnResized={handleColumnResized}
          onGridReady={handleGridReady}
          getRowId={(params) => params.data.id}
          onRowClicked={(event) => {
            if (event.data) {
              onSelectRow(event.data.id)
            }
          }}
          animateRows={false}
          suppressDragLeaveHidesColumns={true}
          context={{ renderStatusPill, getStatusIcon }}
        />
        {rowData.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <FileText className="h-12 w-12 opacity-50" />
            <p>No extraction results yet. Upload documents to get started.</p>
            {columns.length === 0 && <p className="text-sm">Define your schema columns first.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
