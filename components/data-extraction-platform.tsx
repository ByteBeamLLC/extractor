"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { SetupBanner } from "./setup-banner"
import { AgGridSheet } from "./ag-grid-sheet"
import { TransformBuilder } from "@/components/transform-builder"
import { cn } from "@/lib/utils"
 
import {
  type DataType,
  type DataPrimitive,
  type TransformationType,
  type SchemaField,
  type ObjectField,
  type ListField,
  type TableField,
  type LeafField,
  type SchemaDefinition,
  type ExtractionJob,
  type VisualGroup,
  flattenFields,
  updateFieldById,
  removeFieldById,
  flattenResultsById,
  createVisualGroup,
  addVisualGroup,
  removeVisualGroup,
} from "@/lib/schema"
 
import {
  buildDependencyGraph,
  topologicalSort,
  validateDependencies,
  getFieldDependents,
} from "@/lib/dependency-resolver"
 
import {
  Upload,
  Plus,
  Settings,
  FileText,
  Hash,
  Type,
  Calendar,
  Mail,
  Link,
  Phone,
  MapPin,
  ToggleLeft,
  List,
  Globe,
  Calculator,
  Zap,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  Maximize2,
  Eye,
  Layers,
  Edit,
  Save,
} from "lucide-react"
 

// Types moved to lib/schema

const dataTypeIcons: Record<DataType, any> = {
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

const transformationIcons: Record<TransformationType, any> = {
  currency_conversion: Calculator,
  classification: Zap,
  calculation: Calculator,
  gemini_api: Zap,
  custom: Settings,
}

const compositeBadgeStyles: Record<'object' | 'table' | 'list', string> = {
  object: 'bg-[#e6f0ff] text-[#2782ff] dark:bg-[#0b2547] dark:text-[#8fbfff]',
  table: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  list: 'bg-[#e6f0ff] text-[#2782ff] dark:bg-[#0b2547] dark:text-[#8fbfff]',
}

const compositeBadgeLabels: Record<'object' | 'table' | 'list', string> = {
  object: 'Object',
  table: 'Table',
  list: 'List',
}


const simpleDataTypeOptions: Array<{ value: DataType; label: string }> = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'Link' },
  { value: 'address', label: 'Address' },
  { value: 'richtext', label: 'Rich Text' },
]

const complexDataTypeOptions: Array<{ value: DataType; label: string }> = [
  { value: 'object', label: 'Object (Group of fields)' },
  { value: 'table', label: 'Table (Rows and columns)' },
  { value: 'list', label: 'List (Array of items)' },
]

// Downscale large images client-side to avoid Vercel 413 limits
async function maybeDownscaleImage(
  file: File,
  opts?: { maxDim?: number; quality?: number; targetBytes?: number },
): Promise<{ blob: Blob; type: string; name: string }> {
  try {
    const targetBytes = opts?.targetBytes ?? 3_000_000 // ~3 MB for extra headroom
    if (!file.type?.startsWith('image/')) {
      return { blob: file, type: file.type || 'application/octet-stream', name: file.name }
    }
    if (file.size <= targetBytes) {
      return { blob: file, type: file.type || 'image/jpeg', name: file.name }
    }

    const maxDim = opts?.maxDim ?? 2000
    const initialQuality = opts?.quality ?? 0.8

    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return { blob: file, type: file.type || 'image/jpeg', name: file.name }
    }

    const type = 'image/jpeg'
    let attempt = 0
    let currentQuality = initialQuality
    let dimensionScale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    let blob: Blob | null = null

    while (attempt < 6) {
      const width = Math.max(1, Math.round(bitmap.width * dimensionScale))
      const height = Math.max(1, Math.round(bitmap.height * dimensionScale))
      canvas.width = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(bitmap, 0, 0, width, height)

      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), type, currentQuality)
      })
      if (!blob) {
        break
      }
      if (blob.size <= targetBytes) {
        break
      }

      // Reduce both quality and dimensions for the next iteration
      currentQuality = Math.max(0.4, currentQuality * 0.82)
      dimensionScale = Math.max(0.4, dimensionScale * 0.85)
      attempt += 1
    }

    bitmap.close?.()

    if (!blob) {
      return { blob: file, type: file.type || 'image/jpeg', name: file.name }
    }

    return {
      blob,
      type,
      name: file.name.replace(/\.(png|jpe?g|webp|bmp|gif|heic)$/i, '.jpg'),
    }
  } catch {
    return { blob: file, type: file.type || 'application/octet-stream', name: file.name }
  }
}

//

/* Handsontable wrapper omitted (using custom grid) */

/* function HandsontableWrapper() {
  const hotTableRef = useRef<any>(null)
  // no-op placeholder to keep file stable; grid below is the source of truth
  const tableData = []

  // Column configuration
  const columnConfig = useMemo(() => {
    const config: any[] = [
      { 
        data: 0, 
        type: 'numeric',
        width: 50,
        readOnly: true,
        className: 'htCenter htMiddle'
      },
      { 
        data: 1, 
        type: 'text',
        width: 200,
        readOnly: true
      }
    ]
    
    const columns: any[] = []
    columns.forEach((column, index) => {
      config.push({
        data: index + 2,
        type: column.type === 'number' || column.type === 'decimal' ? 'numeric' : 'text',
        width: 150,
        readOnly: true
      })
    })
    
    return config
  }, [columns])

  // Custom column headers with enhanced display
  const nestedHeaders = undefined
  
  // Force re-render when columns or data change
  useEffect(() => {}, [])

  // Handle column header clicks
  const afterOnCellMouseDown = (event: MouseEvent, coords: any, TD: HTMLTableCellElement) => {
    // Only handle header clicks
    if (coords.row !== -1) return
    
    const col = coords.col
    if (col < 2) return // Skip row number and file columns
    
    const columnIndex = col - 2
    if (columnIndex >= 0 && columnIndex < columns.length) {
      const column = columns[columnIndex]
      
      // Check if it's a right-click for delete
      if (event.button === 2) {
        event.preventDefault()
        event.stopPropagation()
        const confirmDelete = window.confirm(`Delete column "${column.name}"?`)
        if (confirmDelete) {
          onColumnDelete(column.id)
        }
      } else if (event.button === 0) {
        // Left click for configuration
        setTimeout(() => {
          onColumnClick(column)
        }, 0)
      }
    }
  }

  const hotSettings: any = {
    data: tableData,
    colHeaders: true,
    nestedHeaders: nestedHeaders,
    columns: columnConfig,
    rowHeaders: false,
    width: '100%',
    height: '100%',
    stretchH: 'all' as const,
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
    afterOnCellMouseDown: afterOnCellMouseDown,
    manualColumnResize: true,
    manualRowResize: false,
    contextMenu: {
      items: {
        'copy': {
          name: 'Copy'
        },
        'sep1': '---------',
        'export_csv': {
          name: 'Export to CSV',
          callback: () => {
            onExportCSV()
          }
        }
      }
    },
    filters: true,
    dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
    columnSorting: true,
    sortIndicator: true,
    autoColumnSize: false,
    wordWrap: true,
    renderAllRows: false,
    fragmentSelection: true,
    disableVisualSelection: false,
    selectionMode: 'multiple',
    outsideClickDeselects: false,
    fillHandle: false, // Disable fill handle since data is read-only
    readOnly: true,
    trimWhitespace: true,
    search: true,
    className: 'htMiddle',
    cell: jobs.map((job, rowIndex) => {
      const cells = []
      // Style the file name column based on status
      cells.push({
        row: rowIndex,
        col: 1,
        className: job.status === 'error' ? 'status-error' : 
                   job.status === 'processing' ? 'status-processing' : 
                   job.status === 'completed' ? 'status-completed' : 'status-pending'
      })
      return cells
    }).flat()
  }

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {columns.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No schema defined yet</p>
            <p className="text-sm">Start by adding columns to define your data extraction schema.</p>
          </div>
        </div>
      ) : (
        <HotTable
          ref={hotTableRef}
          settings={hotSettings}
          key={`hot-${columns.length}-${jobs.length}`}
        />
      )}
    </div>
  )
} */

export function DataExtractionPlatform() {
  const initialSchema: SchemaDefinition = {
    id: `schema_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: "Data Extraction Schema",
    fields: [],
    jobs: [],
  }
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([initialSchema])
  const [activeSchemaId, setActiveSchemaId] = useState<string>(initialSchema.id)
  const activeSchema = schemas.find((s) => s.id === activeSchemaId) || initialSchema
  // Agent type selection
  type AgentType = "standard" | "pharma"
  const [selectedAgent, setSelectedAgent] = useState<AgentType>("standard")
  const fields = activeSchema.fields
  const jobs = activeSchema.jobs
  const displayColumns = useMemo(() => flattenFields(fields), [fields])
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('Active schema:', activeSchema.name, 'Fields count:', fields.length)
  }
  const [selectedColumn, setSelectedColumn] = useState<SchemaField | null>(null)
  const [draftColumn, setDraftColumn] = useState<SchemaField | null>(null)
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false)
  const [columnDialogMode, setColumnDialogMode] = useState<'create' | 'edit'>('create')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Schema name editing
  const [editingSchemaName, setEditingSchemaName] = useState(false)
  const [schemaNameInput, setSchemaNameInput] = useState<string>(activeSchema.name)
  const isDraftTransformation = !!draftColumn?.isTransformation
  
  // UI state for modern grid behaviors
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  // Pharma agent editing state
  const [pharmaEditingSection, setPharmaEditingSection] = useState<string | null>(null)
  const [pharmaEditedValues, setPharmaEditedValues] = useState<Record<string, string>>({})
  // Column grouping state
  const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(new Set())
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState<string>('')
  const [contextMenuColumn, setContextMenuColumn] = useState<string | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  // F&B translation collapsible state per job
  const [fnbCollapse, setFnbCollapse] = useState<Record<string, { en: boolean; ar: boolean }>>({})
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({})
  // Table modal state
  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [tableModalData, setTableModalData] = useState<{
    column: SchemaField
    job: ExtractionJob
    rows: Record<string, any>[]
    columnHeaders: { key: string; label: string }[]
  } | null>(null)
  // ROI modal state
  const [roiOpen, setRoiOpen] = useState(false)
  const [roiStage, setRoiStage] = useState<'calc' | 'result'>('calc')
  const [docsPerMonth, setDocsPerMonth] = useState<string>('')
  const [timePerDoc, setTimePerDoc] = useState<string>('')
  const [hourlyCost, setHourlyCost] = useState<string>('')
  const [totalHoursSaved, setTotalHoursSaved] = useState<number>(0)
  const [monthlyDollarSavings, setMonthlyDollarSavings] = useState<number | null>(null)
  const [annualDollarSavings, setAnnualDollarSavings] = useState<number | null>(null)
  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length
  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [jobs],
  )
  // Avoid referencing process.env in client runtime
  const { BOOKING_URL } = require("@/lib/publicEnv") as { BOOKING_URL: string }
  const isSchemaFresh = (s: SchemaDefinition) => (s.fields?.length ?? 0) === 0 && (s.jobs?.length ?? 0) === 0

  // Sidebar disabled

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }), [])

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [],
  )

  const formatNumericValue = (raw: unknown): string | null => {
    const candidate = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(candidate)) return null
    return numberFormatter.format(candidate)
  }

  const formatDateValue = (raw: unknown): string | null => {
    if (!raw) return null
    const date = raw instanceof Date ? raw : new Date(raw as any)
    if (Number.isNaN(date.getTime())) return null
    return dateFormatter.format(date)
  }

  const cellKey = (jobId: string, columnId: string) => `${jobId}-${columnId}`

  const isCellExpanded = (jobId: string, columnId: string) => !!expandedCells[cellKey(jobId, columnId)]

  const toggleCellExpansion = (jobId: string, columnId: string) => {
    const key = cellKey(jobId, columnId)
    setExpandedCells((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const openTableModal = (
    column: SchemaField,
    job: ExtractionJob,
    rows: Record<string, any>[],
    columnHeaders: { key: string; label: string }[]
  ) => {
    setTableModalData({ column, job, rows, columnHeaders })
    setTableModalOpen(true)
  }

  const findChildLabel = (column: SchemaField, key: string): string | undefined => {
    if (column.type === 'object') {
      const objectColumn = column as Extract<SchemaField, { type: 'object' }>
      const child = objectColumn.children?.find((childField) => childField.id === key || childField.name === key)
      return child?.name
    }
    if (column.type === 'table') {
      const tableColumn = column as Extract<SchemaField, { type: 'table' }>
      const child = tableColumn.columns?.find((childField) => childField.id === key || childField.name === key)
      return child?.name
    }
    if (column.type === 'list') {
      const listColumn = column as Extract<SchemaField, { type: 'list' }>
      const item = listColumn.item
      if (item.type === 'object') {
        const objectItem = item as Extract<SchemaField, { type: 'object' }>
        const child = objectItem.children?.find((childField) => childField.id === key || childField.name === key)
        return child?.name
      }
    }
    return undefined
  }

  const prettifyKey = (key: string) => key.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

  const getObjectEntries = (column: SchemaField, value: Record<string, any>) => {
    return Object.entries(value)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([key, v]) => ({
        label: findChildLabel(column, key) ?? prettifyKey(key),
        value: v,
      }))
  }

  const firstNonEmptyText = (value: Record<string, any>) => {
    for (const v of Object.values(value)) {
      if (v && typeof v === 'string') {
        const trimmed = v.trim()
        if (trimmed) return trimmed
      }
    }
    return null
  }

  const createLeafField = (name = 'field', type: DataPrimitive = 'string'): LeafField => ({
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    type,
    description: '',
    extractionInstructions: '',
    required: false,
  })

  const cloneField = <T extends SchemaField>(field: T): T => JSON.parse(JSON.stringify(field)) as T

  const normaliseDraftForType = (prev: SchemaField, nextType: DataType): SchemaField => {
    if (nextType === 'object') {
      const existing = (prev as any).children as SchemaField[] | undefined
      const children = existing?.length ? existing.map((child) => cloneField(child)) : [createLeafField('name'), createLeafField('value')]
      return {
        ...prev,
        type: 'object',
        children,
      } as ObjectField
    }
    if (nextType === 'table') {
      const existing = (prev as any).columns as SchemaField[] | undefined
      const columns = existing?.length ? existing.map((col) => cloneField(col)) : [createLeafField('Column 1'), createLeafField('Column 2')]
      return {
        ...prev,
        type: 'table',
        columns,
      } as TableField
    }
    if (nextType === 'list') {
      const existing = (prev as any).item as SchemaField | undefined
      const item = existing ? cloneField(existing) : createLeafField('item')
      return {
        ...prev,
        type: 'list',
        item,
      } as ListField
    }
    const leaf: LeafField = {
      ...(prev as any),
      type: nextType,
    }
    delete (leaf as any).children
    delete (leaf as any).columns
    delete (leaf as any).item
    return leaf
  }

  const changeDraftType = (nextType: DataType) => {
    setDraftColumn((prev) => {
      if (!prev) return prev
      return normaliseDraftForType(prev, nextType)
    })
  }

  const addObjectSubField = () => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'object') return prev
      const objectDraft = prev as ObjectField
      const children = [...(objectDraft.children || []).map((child) => cloneField(child)), createLeafField(`Field ${objectDraft.children.length + 1}`)]
      return { ...objectDraft, children }
    })
  }

  const updateObjectSubField = (childId: string, updates: Partial<LeafField>) => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'object') return prev
      const objectDraft = prev as ObjectField
      const children = (objectDraft.children || []).map((child) => (child.id === childId ? { ...child, ...updates } : child))
      return { ...objectDraft, children }
    })
  }

  const removeObjectSubField = (childId: string) => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'object') return prev
      const objectDraft = prev as ObjectField
      const children = (objectDraft.children || []).filter((child) => child.id !== childId)
      return { ...objectDraft, children }
    })
  }

  const addTableColumn = () => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'table') return prev
      const tableDraft = prev as TableField
      const columns = [...(tableDraft.columns || []).map((col) => cloneField(col)), createLeafField(`Column ${tableDraft.columns.length + 1}`)]
      return { ...tableDraft, columns }
    })
  }

  const updateTableColumn = (columnId: string, updates: Partial<LeafField>) => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'table') return prev
      const tableDraft = prev as TableField
      const columns = (tableDraft.columns || []).map((col) => (col.id === columnId ? { ...col, ...updates } : col))
      return { ...tableDraft, columns }
    })
  }

  const removeTableColumn = (columnId: string) => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'table') return prev
      const tableDraft = prev as TableField
      const columns = (tableDraft.columns || []).filter((col) => col.id !== columnId)
      return { ...tableDraft, columns }
    })
  }

  const updateListItemType = (nextType: DataPrimitive) => {
    setDraftColumn((prev) => {
      if (!prev || prev.type !== 'list') return prev
      const listDraft = prev as ListField
      return {
        ...listDraft,
        item: {
          ...(listDraft.item ? cloneField(listDraft.item) : createLeafField('item')),
          type: nextType,
        },
      }
    })
  }

  // Column grouping functions
  const toggleColumnSelection = (columnId: string) => {
    setSelectedColumnIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(columnId)) {
        newSet.delete(columnId)
      } else {
        newSet.add(columnId)
      }
      return newSet
    })
  }

  const openGroupDialog = () => {
    if (selectedColumnIds.size < 2) return
    setGroupName('')
    setIsGroupDialogOpen(true)
  }

  const handleColumnRightClick = (columnId: string, event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenuColumn(columnId)
    setContextMenuPosition({ x: event.clientX, y: event.clientY })
  }

  const startGroupingFromContext = () => {
    if (!contextMenuColumn) return
    // Auto-select the right-clicked column
    setSelectedColumnIds(new Set([contextMenuColumn]))
    setGroupName('')
    setIsGroupDialogOpen(true)
    // Close context menu
    setContextMenuColumn(null)
    setContextMenuPosition(null)
  }

  const closeContextMenu = () => {
    setContextMenuColumn(null)
    setContextMenuPosition(null)
  }

  const createGroupedObject = () => {
    if (!groupName.trim() || selectedColumnIds.size < 2) return

    // Capture the selected IDs and group name before state updates
    const selectedIds = Array.from(selectedColumnIds)
    const newGroupName = groupName.trim()

    setSchemas((prev) => {
      return prev.map((schema) => {
        if (schema.id !== activeSchemaId) return schema

        // Create visual group (keeps fields intact, just adds visual grouping)
        const newGroup = createVisualGroup(newGroupName, selectedIds)
        return addVisualGroup(schema, newGroup)
      })
    })

    // Reset selection and close dialog
    setSelectedColumnIds(new Set())
    setGroupName('')
    setIsGroupDialogOpen(false)
  }

  const renderStructuredConfig = () => {
    if (!draftColumn) return null
    if (draftColumn.type === 'object') {
      const objectDraft = draftColumn as ObjectField
      const children = objectDraft.children || []
      return (
        <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Object Fields</p>
              <p className="text-xs text-slate-500">Define the sub-fields that make up this object.</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addObjectSubField}>
              <Plus className="mr-1 h-4 w-4" />
              Add Sub-Field
            </Button>
          </div>
          <div className="space-y-3">
            {children.length === 0 ? (
              <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                No sub-fields yet. Add at least one field to describe this object.
              </div>
            ) : (
              children.map((child) => (
                <div key={child.id} className="flex flex-col gap-3 rounded-xl bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-end">
                  <button
                    type="button"
                    onClick={() => updateObjectSubField(child.id, { displayInSummary: !child.displayInSummary })}
                    className={cn(
                      'order-last self-start rounded-md px-2 py-2 text-slate-300 hover:text-yellow-500 sm:order-none',
                      child.displayInSummary ? 'text-yellow-500' : 'text-slate-300',
                    )}
                    title="Set as display field for collapsed view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Field Name</Label>
                    <Input
                      value={child.name}
                      onChange={(event) => updateObjectSubField(child.id, { name: event.target.value })}
                      placeholder="e.g., Name"
                    />
                  </div>
                  <div className="w-full space-y-1 sm:w-48">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</Label>
                    <Select
                      value={child.type}
                      onValueChange={(value: DataPrimitive) => updateObjectSubField(child.id, { type: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="decimal">Decimal</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="boolean">Yes / No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeObjectSubField(child.id)}
                    className="self-start text-slate-400 hover:text-slate-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )
    }

    if (draftColumn.type === 'table') {
      const tableDraft = draftColumn as TableField
      const columns = tableDraft.columns || []
      return (
        <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Table Columns</p>
              <p className="text-xs text-slate-500">List the columns that each row in this table should include.</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addTableColumn}>
              <Plus className="mr-1 h-4 w-4" />
              Add Column
            </Button>
          </div>
          <div className="space-y-3">
            {columns.length === 0 ? (
              <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                No columns yet. Add the first column to describe your table structure.
              </div>
            ) : (
              columns.map((col, index) => (
                <div key={col.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{index + 1}</span>
                  <Input
                    value={col.name}
                    onChange={(event) => updateTableColumn(col.id, { name: event.target.value })}
                    placeholder="Column name"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTableColumn(col.id)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )
    }

    if (draftColumn.type === 'list') {
      const listDraft = draftColumn as ListField
      const itemType = listDraft.item?.type ?? 'string'
      return (
        <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">List Item Type</p>
            <p className="text-xs text-slate-500">Choose the type of value each item in this list should store.</p>
          </div>
          <Select value={itemType} onValueChange={(value: DataPrimitive) => updateListItemType(value)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select an item type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="decimal">Decimal</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
    return null
  }

  // Minimal nested templates to seed schemas
  const NESTED_TEMPLATES: { id: string; name: string; description?: string; fields: SchemaField[] }[] = [
    // {
    //   id: "fnb-label-compliance",
    //   name: "F&B Label Compliance",
    //   description: "Primary-language extraction + EN/AR translation in split view.",
    //   fields: [],
    // },
    {
      id: "invoice-nested",
      name: "Invoice",
      description: "Nested vendor/customer and totals.",
      fields: [
        { id: "invoice_number", name: "invoice_number", type: "string", description: "Unique invoice ID", extractionInstructions: "Look for 'Invoice #', 'Invoice No.'", required: true },
        { id: "invoice_date", name: "invoice_date", type: "date", description: "Issue date", extractionInstructions: "Normalize to YYYY-MM-DD", required: true },
        { id: "due_date", name: "due_date", type: "date", description: "Payment due date" },
        { id: "po_number", name: "po_number", type: "string", description: "PO number if present" },
        {
          id: "vendor",
          name: "vendor",
          type: "object",
          description: "Vendor details",
          children: [
            { id: "vendor_name", name: "name", type: "string", description: "Vendor name", required: true },
            { id: "vendor_country", name: "country", type: "string", description: "Vendor country" },
            { id: "vendor_address", name: "address", type: "string", description: "Vendor address" },
            { id: "vendor_tax_id", name: "tax_id", type: "string", description: "Tax/VAT ID" },
          ],
        },
        {
          id: "customer",
          name: "customer",
          type: "object",
          description: "Customer details",
          children: [
            { id: "customer_name", name: "name", type: "string", description: "Customer name" },
            { id: "customer_address", name: "address", type: "string", description: "Billing address" },
          ],
        },
        {
          id: "line_items",
          name: "line_items",
          type: "list",
          description: "Itemized products/services",
          item: {
            id: "line_item",
            name: "item",
            type: "object",
            children: [
              { id: "li_desc", name: "description", type: "string" },
              { id: "li_qty", name: "quantity", type: "number" },
              { id: "li_unit_price", name: "unit_price", type: "number" },
              { id: "li_total", name: "total", type: "number" },
            ],
          },
        },
        { id: "subtotal", name: "subtotal", type: "number" },
        { id: "tax_amount", name: "tax_amount", type: "number" },
        {
          id: "total_amount",
          name: "total_amount",
          type: "object",
          description: "Final total as amount + currency",
          children: [
            { id: "total_amount_value", name: "amount", type: "number", description: "Amount" },
            { id: "total_amount_ccy", name: "currency", type: "string", description: "Currency code" },
          ],
        },
      ],
    },
    {
      id: "po-simple",
      name: "Purchase Order (simple)",
      description: "Basic PO fields.",
      fields: [
        { id: "po_number", name: "po_number", type: "string", description: "PO identifier.", required: true },
        { id: "order_date", name: "order_date", type: "date", description: "Date PO created." },
        { id: "vendor_name", name: "vendor_name", type: "string", description: "Supplier/vendor name." },
        { id: "shipping_address", name: "shipping_address", type: "string", description: "Ship To address." },
        { id: "billing_address", name: "billing_address", type: "string", description: "Billing address." },
        {
          id: "line_items",
          name: "line_items",
          type: "list",
          description: "Goods/services requested.",
          item: {
            id: "po_item",
            name: "item",
            type: "object",
            children: [
              { id: "po_item_sku", name: "sku", type: "string" },
              { id: "po_item_desc", name: "description", type: "string" },
              { id: "po_item_qty", name: "quantity", type: "number" },
              { id: "po_item_unit_price", name: "unit_price", type: "number" },
              { id: "po_item_total", name: "total", type: "number" },
            ],
          },
        },
        { id: "total_amount", name: "total_amount", type: "number", description: "PO total value.", required: true },
        { id: "requested_by", name: "requested_by", type: "string", description: "Requester or department." },
      ],
    },
    {
      id: "pharma-artwork",
      name: "Pharma Artwork",
      description: "Key data points for pharmaceutical packaging/artwork.",
      fields: [
        { id: "product_name", name: "product_name", type: "string", description: "Product name as printed on artwork.", required: true },
        { id: "batch_number", name: "batch_number", type: "string", description: "Batch/Lot number (e.g., LOT/BN).", required: true },
        { id: "manufacturing_date", name: "manufacturing_date", type: "date", description: "Manufacturing date (MFG).", required: false },
        { id: "expiry_date", name: "expiry_date", type: "date", description: "Expiry/Best Before date (EXP).", required: true },
        { id: "barcode", name: "barcode", type: "string", description: "Linear/2D barcode data if present." },
        { id: "pharmacode", name: "pharmacode", type: "string", description: "Pharmacode value printed for packaging control." },
      ],
    },
  ]
  // Simple built-in templates (placeholder). You will provide real ones later.
  const SCHEMA_TEMPLATES: {
    id: string
    name: string
    description?: string
    fields: SchemaField[]
  }[] = [
    {
      id: "invoice-nested",
      name: "Invoice (Nested)",
      description: "Nested vendor/customer and totals.",
      fields: [
        { id: "invoice_number", name: "invoice_number", type: "string", description: "Unique invoice ID", extractionInstructions: "Look for 'Invoice #', 'Invoice No.'", required: true },
        { id: "invoice_date", name: "invoice_date", type: "date", description: "Issue date", extractionInstructions: "Normalize to YYYY-MM-DD", required: true },
        { id: "due_date", name: "due_date", type: "date", description: "Payment due date" },
        { id: "po_number", name: "po_number", type: "string", description: "PO number if present" },
        {
          id: "vendor",
          name: "vendor",
          type: "object",
          description: "Vendor details",
          children: [
            { id: "vendor_name", name: "name", type: "string", description: "Vendor name", required: true },
            { id: "vendor_country", name: "country", type: "string", description: "Vendor country" },
            { id: "vendor_address", name: "address", type: "string", description: "Vendor address" },
            { id: "vendor_tax_id", name: "tax_id", type: "string", description: "Tax/VAT ID" },
          ],
        },
        {
          id: "customer",
          name: "customer",
          type: "object",
          description: "Customer details",
          children: [
            { id: "customer_name", name: "name", type: "string", description: "Customer name" },
            { id: "customer_address", name: "address", type: "string", description: "Billing address" },
          ],
        },
        {
          id: "line_items",
          name: "line_items",
          type: "list",
          description: "Itemized products/services",
          item: {
            id: "line_item",
            name: "item",
            type: "object",
            children: [
              { id: "li_desc", name: "description", type: "string" },
              { id: "li_qty", name: "quantity", type: "number" },
              { id: "li_unit_price", name: "unit_price", type: "number" },
              { id: "li_total", name: "total", type: "number" },
            ],
          },
        },
        { id: "subtotal", name: "subtotal", type: "number" },
        { id: "tax_amount", name: "tax_amount", type: "number" },
        {
          id: "total_amount",
          name: "total_amount",
          type: "object",
          description: "Final total as amount + currency",
          children: [
            { id: "total_amount_value", name: "amount", type: "number", description: "Amount" },
            { id: "total_amount_ccy", name: "currency", type: "string", description: "Currency code" },
          ],
        },
      ],
    },
    {
      id: "po-simple",
      name: "Purchase Order (simple)",
      description: "Basic PO fields.",
      fields: [
        {
          id: "po_number",
          name: "po_number",
          type: "string",
          description: "PO identifier.",
          extractionInstructions: "Top labels: 'Purchase Order #', 'PO Number', 'PO No.'.",
          required: true,
        },
        {
          id: "order_date",
          name: "order_date",
          type: "date",
          description: "Date PO created.",
          extractionInstructions: "Labels 'Date', 'Order Date' near po_number.",
        },
        {
          id: "vendor_name",
          name: "vendor_name",
          type: "string",
          description: "Supplier/vendor name.",
          extractionInstructions: "Sections 'Vendor', 'Supplier', 'To'.",
        },
        { id: "shipping_address", name: "shipping_address", type: "string", description: "Ship To address.", extractionInstructions: "'Ship To', 'Deliver To'." },
        { id: "billing_address", name: "billing_address", type: "string", description: "Billing address.", extractionInstructions: "'Bill To', 'Invoice To'." },
        {
          id: "line_items",
          name: "line_items",
          type: "list",
          description: "Goods/services requested.",
          extractionInstructions: "Main items section: Item/SKU, Description, Quantity, Unit Price, Line Total.",
          item: {
            id: "po_item",
            name: "item",
            type: "object",
            children: [
              { id: "po_item_sku", name: "sku", type: "string" },
              { id: "po_item_desc", name: "description", type: "string" },
              { id: "po_item_qty", name: "quantity", type: "number" },
              { id: "po_item_unit_price", name: "unit_price", type: "number" },
              { id: "po_item_total", name: "total", type: "number" },
            ],
          },
        },
        { id: "total_amount", name: "total_amount", type: "number", description: "PO total value.", extractionInstructions: "'Total', 'Grand Total'.", required: true },
        { id: "requested_by", name: "requested_by", type: "string", description: "Requester or department.", extractionInstructions: "'Requested by', 'Attention', 'Buyer'." },
      ],
    },
    {
      id: "receipt",
      name: "Receipt",
      description: "Payment proof details for expenses.",
      columns: [
        { name: "merchant_name", type: "string", description: "Store/provider name.", extractionInstructions: "Prominent text at top, may be stylized." },
        { name: "merchant_address", type: "address", description: "Store address.", extractionInstructions: "Below merchant name; may include phone." },
        { name: "transaction_date", type: "date", description: "Purchase date.", extractionInstructions: "Label 'Date'." },
        { name: "transaction_time", type: "string", description: "Purchase time.", extractionInstructions: "Near transaction_date; formats HH:MM(:SS) AM/PM." },
        { name: "line_items", type: "list", description: "Purchased items.", extractionInstructions: "Rows between header and subtotal: Item, Qty, Price." },
        { name: "tax_amount", type: "number", description: "Tax paid.", extractionInstructions: "'Tax', 'VAT', 'GST'." },
        { name: "total_amount", type: "number", description: "Final amount paid.", extractionInstructions: "'Total', 'Balance', or payment method label." },
        { name: "payment_method", type: "string", description: "Payment method.", extractionInstructions: "'Paid by' or card name; last 4 digits indicative." },
      ],
    },
    {
      id: "resume",
      name: "Resume / CV",
      description: "Candidate professional and educational history.",
      columns: [
        { name: "full_name", type: "string", description: "Candidate full name.", extractionInstructions: "Most prominent text at top." },
        { name: "email_address", type: "email", description: "Email address.", extractionInstructions: "String with @ in contact section." },
        { name: "phone_number", type: "phone", description: "Phone number.", extractionInstructions: "Numbers with dashes/parentheses; consider intl codes." },
        { name: "location", type: "address", description: "City, state, country.", extractionInstructions: "Header contact area (e.g., 'Beirut, Lebanon')." },
        { name: "work_experience", type: "list", description: "Jobs list.", extractionInstructions: "Sections 'Experience', extract Job Title, Company, Location, Start Date, End Date, Responsibilities." },
        { name: "education", type: "list", description: "Education list.", extractionInstructions: "Section 'Education'; Institution, Degree, Field, Graduation Date." },
        { name: "skills", type: "list", description: "Skills list.", extractionInstructions: "Section 'Skills'; list items or comma-separated." },
      ],
    },
    {
      id: "bill-of-lading",
      name: "Bill of Lading (BOL)",
      description: "Shipping and freight document details.",
      columns: [
        { name: "bol_number", type: "string", description: "Tracking number.", extractionInstructions: "'Bill of Lading No.', 'BOL #', often near barcode." },
        { name: "carrier_name", type: "string", description: "Freight carrier.", extractionInstructions: "Labels 'Carrier', 'Shipping Line'." },
        { name: "shipper_details", type: "object", description: "Sender info.", extractionInstructions: "Box 'Shipper'/'From'; extract Name and Address." },
        { name: "consignee_details", type: "object", description: "Recipient info.", extractionInstructions: "Box 'Consignee'/'To'; extract Name and Address." },
        { name: "port_of_loading", type: "string", description: "Origin port/location.", extractionInstructions: "'Port of Loading', 'Origin'." },
        { name: "port_of_discharge", type: "string", description: "Destination port/location.", extractionInstructions: "'Port of Discharge', 'Destination'." },
        { name: "freight_description", type: "list", description: "Goods details.", extractionInstructions: "Main items table: Number of Packages, Description, Weight, Measurements." },
        { name: "freight_terms", type: "string", description: "Payment terms.", extractionInstructions: "'Freight Prepaid' or 'Freight Collect'." },
      ],
    },
    {
      id: "patient-registration",
      name: "Patient Registration Form",
      description: "Patient demographic and insurance info.",
      columns: [
        { name: "patient_full_name", type: "string", description: "Full legal name.", extractionInstructions: "Labels 'Patient Name', 'Full Name'. Extract First/Middle/Last when separate." },
        { name: "date_of_birth", type: "date", description: "DOB.", extractionInstructions: "Labels 'Date of Birth', 'DOB'. Validate realism." },
        { name: "gender", type: "string", description: "Gender.", extractionInstructions: "Often checkboxes or dropdown; 'Gender', 'Sex'." },
        { name: "patient_address", type: "address", description: "Home address.", extractionInstructions: "'Address', 'Home Address'. Extract Street/City/State/Zip." },
        { name: "phone_number", type: "phone", description: "Primary contact phone.", extractionInstructions: "'Phone', 'Contact No.'" },
        { name: "emergency_contact_name", type: "string", description: "Emergency contact name.", extractionInstructions: "Section 'Emergency Contact'." },
        { name: "emergency_contact_phone", type: "phone", description: "Emergency contact phone.", extractionInstructions: "In 'Emergency Contact' section, 'Phone' field." },
        { name: "primary_insurance_provider", type: "string", description: "Insurance company.", extractionInstructions: "'Insurance Company', 'Provider', 'Payer'." },
        { name: "policy_number", type: "string", description: "Policy/member ID.", extractionInstructions: "'Policy #', 'Member ID', 'ID Number'." },
        { name: "group_number", type: "string", description: "Group number.", extractionInstructions: "Near policy number; 'Group #'." },
        { name: "primary_care_physician", type: "string", description: "PCP name.", extractionInstructions: "'Primary Care Physician', 'PCP'." },
        { name: "medical_history", type: "object", description: "Allergies/medications/surgeries.", extractionInstructions: "Sections 'Medical History'/'Health Information'." },
      ],
    },
    {
      id: "medical-claim-cms1500",
      name: "Medical Claim Form (CMS-1500)",
      description: "Billing info from CMS-1500.",
      columns: [
        { name: "patient_name", type: "string", description: "Patient full name.", extractionInstructions: "Corresponds to Box 2." },
        { name: "patient_dob_sex", type: "object", description: "DOB and sex.", extractionInstructions: "Box 3; extract both date and sex." },
        { name: "insureds_name", type: "string", description: "Insured person name.", extractionInstructions: "Box 4." },
        { name: "patient_address", type: "address", description: "Patient address.", extractionInstructions: "Box 5: street, city, state, zip." },
        { name: "insureds_id_number", type: "string", description: "Policy number.", extractionInstructions: "Box 1a." },
        { name: "insurance_plan_name", type: "string", description: "Insurance company/program.", extractionInstructions: "Top 'CARRIER' or Box 11c." },
        { name: "diagnosis_codes", type: "list", description: "ICD-10 codes.", extractionInstructions: "Box 21; extract all listed codes." },
        { name: "service_lines", type: "list", description: "Services provided.", extractionInstructions: "Box 24; for each row: Date of Service, Place of Service, Procedure Code, Diagnosis Pointer, Charges, Units." },
        { name: "federal_tax_id", type: "string", description: "Provider tax ID.", extractionInstructions: "Box 25; SSN or EIN." },
        { name: "total_charge", type: "number", description: "Total charge.", extractionInstructions: "Box 28 'Total Charge'." },
        { name: "rendering_provider_npi", type: "string", description: "Rendering provider NPI.", extractionInstructions: "Box 24J." },
      ],
    },
    {
      id: "explanation-of-benefits",
      name: "Explanation of Benefits (EOB)",
      description: "Details of insurer claim processing.",
      columns: [
        { name: "patient_name", type: "string", description: "Patient name.", extractionInstructions: "Labels 'Patient', 'Member'." },
        { name: "claim_number", type: "string", description: "Claim number.", extractionInstructions: "'Claim #', 'Claim Number'." },
        { name: "provider_name", type: "string", description: "Provider name.", extractionInstructions: "'Provider', 'Doctor', 'Hospital'." },
        { name: "service_details", type: "list", description: "Service line breakdown.", extractionInstructions: "Main table: Date of Service, Description, Amount Billed, Amount Allowed, Deductible, Copay/Coinsurance, Not Covered, Amount Paid by Plan." },
        { name: "amount_billed", type: "number", description: "Total billed.", extractionInstructions: "'Total Charges'/'Amount Billed'." },
        { name: "amount_paid_by_plan", type: "number", description: "Total plan payment.", extractionInstructions: "'Plan Paid'/'Total Payment'." },
        { name: "patient_responsibility", type: "number", description: "Amount patient owes.", extractionInstructions: "'Patient Responsibility'/'You Owe'." },
        { name: "denial_reason_codes", type: "list", description: "Non-coverage reason codes.", extractionInstructions: "Section 'Remarks'/'Notes'/'Adjustments'." },
      ],
    },
    {
      id: "prescription-form",
      name: "Prescription Form",
      description: "Medication and directions for dispensing.",
      columns: [
        { name: "patient_name", type: "string", description: "Patient full name.", extractionInstructions: "Field 'Patient Name'/'For:'." },
        { name: "patient_dob", type: "date", description: "DOB for verification.", extractionInstructions: "'DOB'/'Date of Birth'." },
        { name: "prescriber_name", type: "string", description: "Doctor name.", extractionInstructions: "Near signature line or in header, may include titles (MD, DO, NP)." },
        { name: "prescriber_dea_number", type: "string", description: "DEA number.", extractionInstructions: "Field 'DEA #'; 2 letters + 7 digits." },
        { name: "medication_name", type: "string", description: "Drug name.", extractionInstructions: "After 'Rx'; brand or generic." },
        { name: "strength", type: "string", description: "Dosage strength.", extractionInstructions: "Immediately after drug name (e.g., 500mg)." },
        { name: "dosage_instructions", type: "string", description: "Sig/instructions.", extractionInstructions: "'Sig:'/'Instructions:' section; free text." },
        { name: "quantity", type: "string", description: "Quantity to dispense.", extractionInstructions: "'Disp:'/'Qty:'/'Quantity'." },
        { name: "refills", type: "number", description: "Number of refills.", extractionInstructions: "Field 'Refills'; default often 0." },
        { name: "date_of_issue", type: "date", description: "Prescription date.", extractionInstructions: "Field 'Date' near signature." },
      ],
    },
    {
      id: "certificate-liability-insurance",
      name: "Certificate of Liability Insurance (ACORD 25)",
      description: "Evidence of insurance coverage.",
      columns: [
        { name: "producer", type: "object", description: "Agent/broker issuer.", extractionInstructions: "Box 'PRODUCER'; extract Name and Address." },
        { name: "insured", type: "object", description: "Insured individual or entity.", extractionInstructions: "Box 'INSURED'; extract Name and Address." },
        { name: "certificate_holder", type: "object", description: "To whom certificate is issued.", extractionInstructions: "Bottom left 'CERTIFICATE HOLDER'; extract Name/Address." },
        { name: "policies", type: "list", description: "Active policies.", extractionInstructions: "Main table rows A,B,C... extract Insurance Type, Policy Number, Effective Date, Expiration Date." },
        { name: "insurer_a", type: "string", description: "Insurer A name.", extractionInstructions: "List 'INSURER(S) AFFORDING COVERAGE'." },
        { name: "general_liability_limits", type: "object", description: "GL coverage limits.", extractionInstructions: "Find 'GENERAL LIABILITY' row and extract limits (Each Occurrence, Damage to Premises, etc.)." },
        { name: "description_of_operations", type: "string", description: "Description of operations/locations/vehicles.", extractionInstructions: "Large bottom box; extract full text." },
      ],
    },
    {
      id: "proof-of-delivery",
      name: "Proof of Delivery (POD)",
      description: "Signed confirmation of goods delivered.",
      columns: [
        { name: "tracking_number", type: "string", description: "Shipment tracking number.", extractionInstructions: "'Tracking #', 'Waybill No.', 'Reference No.' near barcode." },
        { name: "shipper_name", type: "string", description: "Shipper name.", extractionInstructions: "Section 'Shipper'/'From'." },
        { name: "recipient_name", type: "string", description: "Recipient name.", extractionInstructions: "Section 'Recipient'/'Consignee'." },
        { name: "delivery_address", type: "address", description: "Delivery address.", extractionInstructions: "Within 'Recipient'/'Consignee'." },
        { name: "delivery_date", type: "date", description: "Delivery date.", extractionInstructions: "Label 'Delivery Date'." },
        { name: "recipient_signature", type: "boolean", description: "Signature present.", extractionInstructions: "Box 'Signature' – confirm presence." },
        { name: "printed_name", type: "string", description: "Printed name of signer.", extractionInstructions: "Field 'Printed Name'/ 'Name'." },
        { name: "condition_of_goods", type: "string", description: "Condition notes.", extractionInstructions: "Notes/Remarks or checklist (Damaged/Intact)." },
      ],
    },
    {
      id: "legal-summons",
      name: "Legal Summons",
      description: "Court notice requiring response.",
      columns: [
        { name: "court_name", type: "string", description: "Court name and jurisdiction.", extractionInstructions: "Official heading at top of document." },
        { name: "case_number", type: "string", description: "Court-assigned identifier.", extractionInstructions: "'Case Number', 'Docket No.', 'Index No.'." },
        { name: "plaintiff_name", type: "string", description: "Plaintiff name.", extractionInstructions: "Plaintiff(s) section." },
        { name: "defendant_name", type: "string", description: "Defendant name.", extractionInstructions: "Defendant(s) section." },
        { name: "date_of_issue", type: "date", description: "Issued date.", extractionInstructions: "Near clerk signature/stamp." },
        { name: "response_deadline", type: "date", description: "Deadline to respond.", extractionInstructions: "Phrases like 'You must respond within [XX] days'; compute based on date_of_issue when provided." },
        { name: "plaintiffs_attorney", type: "object", description: "Plaintiff's attorney name and address.", extractionInstructions: "Signature block identifying Attorney for Plaintiff." },
      ],
    },
    {
      id: "utility-bill",
      name: "Utility Bill",
      description: "Billing and usage details for utilities.",
      columns: [
        { name: "service_provider_name", type: "string", description: "Utility company name.", extractionInstructions: "Prominent name/logo at top." },
        { name: "account_number", type: "string", description: "Customer account number.", extractionInstructions: "'Account Number'/'Account #'." },
        { name: "service_address", type: "address", description: "Service address.", extractionInstructions: "Section 'Service Address'." },
        { name: "billing_period", type: "object", description: "Start and end dates for service period.", extractionInstructions: "Labels 'Billing Period'/'Service Dates'; extract start and end." },
        { name: "statement_date", type: "date", description: "Bill date.", extractionInstructions: "'Bill Date'/'Statement Date'/'Invoice Date'." },
        { name: "amount_due", type: "number", description: "Amount due.", extractionInstructions: "Prominent 'Amount Due'/'Total Due' value." },
        { name: "due_date", type: "date", description: "Payment due date.", extractionInstructions: "'Due Date'/'Pay By'." },
        { name: "usage_details", type: "object", description: "Usage metrics.", extractionInstructions: "Section 'Usage'/'Consumption'; extract values like kWh/Gallons/Therms and meter readings if present." },
      ],
    },
  ]

  const applySchemaTemplate = (templateId: string) => {
    const tpl = NESTED_TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return
    if (isSchemaFresh(activeSchema)) {
      setSchemas((prev) =>
        prev.map((s) => (s.id === activeSchemaId ? { ...s, name: tpl.name, fields: tpl.fields, templateId } : s)),
      )
    } else {
      const newSchema: SchemaDefinition = {
        id: `schema_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: tpl.name,
        fields: tpl.fields,
        jobs: [],
        templateId,
      }
      setSchemas((prev) => [...prev, newSchema])
      setActiveSchemaId(newSchema.id)
    }
  }

  // ROI helpers
  const shouldShowRoi = () => {
    try {
      const lastShown = localStorage.getItem('bb_roi_last_shown')
      if (lastShown) {
        const last = Number(lastShown)
        if (!Number.isNaN(last)) {
          const days = (Date.now() - last) / (1000 * 60 * 60 * 24)
          if (days < 30) return false
        }
      }
      const count = Number.parseInt(localStorage.getItem('bb_success_count') || '0') || 0
      return count >= 3
    } catch {
      return false
    }
  }

  const recordSuccessAndMaybeOpenRoi = () => {
    try {
      const current = Number.parseInt(localStorage.getItem('bb_success_count') || '0') || 0
      const next = current + 1
      localStorage.setItem('bb_success_count', String(next))
      if (next >= 3) {
        const lastShown = Number(localStorage.getItem('bb_roi_last_shown') || '0')
        const days = lastShown ? (Date.now() - lastShown) / (1000 * 60 * 60 * 24) : Infinity
        if (days >= 30) {
          setRoiStage('calc')
          setRoiOpen(true)
        }
      }
    } catch {}
  }

  const onCloseRoi = (open: boolean) => {
    setRoiOpen(open)
    if (!open) {
      try { localStorage.setItem('bb_roi_last_shown', String(Date.now())) } catch {}
    }
  }

  const calculateSavings = () => {
    const d = Math.max(0, Number(docsPerMonth) || 0)
    const t = Math.max(0, Number(timePerDoc) || 0)
    const h = Math.max(0, Number(hourlyCost) || 0)
    const minutes = d * t
    const hours = Math.round(minutes / 60)
    setTotalHoursSaved(hours)
    if (h > 0) {
      const monthly = hours * h
      setMonthlyDollarSavings(monthly)
      setAnnualDollarSavings(monthly * 12)
    } else {
      setMonthlyDollarSavings(null)
      setAnnualDollarSavings(null)
    }
    setRoiStage('result')
  }

  // Helpers to update active schema's fields and jobs
  const setFields = (
    updater: SchemaField[] | ((prev: SchemaField[]) => SchemaField[]),
  ) => {
    setSchemas((prev) =>
      prev.map((s) => (s.id === activeSchemaId ? { ...s, fields: typeof updater === "function" ? (updater as any)(s.fields) : updater } : s)),
    )
  }

  const setJobs = (
    updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
  ) => {
    setSchemas((prev) =>
      prev.map((s) => (s.id === activeSchemaId ? { ...s, jobs: typeof updater === "function" ? (updater as any)(s.jobs) : updater } : s)),
    )
  }

  const addSchema = () => {
    const nextIndex = schemas.length + 1
    const newSchema: SchemaDefinition = {
      id: `schema_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `Schema ${nextIndex}`,
      fields: [],
      jobs: [],
    }
    setSchemas((prev) => [...prev, newSchema])
    setActiveSchemaId(newSchema.id)
    setSelectedColumn(null)
    setIsColumnDialogOpen(false)
    
  }

  const closeSchema = (id: string) => {
    setSchemas((prev) => {
      const filtered = prev.filter((s) => s.id !== id)
      if (filtered.length === 0) {
        const fallback: SchemaDefinition = {
          id: `schema_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: "Data Extraction Schema",
          fields: [],
          jobs: [],
        }
        setActiveSchemaId(fallback.id)
        return [fallback]
      }
      if (id === activeSchemaId) setActiveSchemaId(filtered[filtered.length - 1].id)
      return filtered
    })
    setSelectedColumn(null)
    setIsColumnDialogOpen(false)
  }

  const addColumn = () => {
    const newColumn: SchemaField = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Column ${displayColumns.length + 1}`,
      type: "string",
      description: "",
      extractionInstructions: "",
      required: false,
    }
    const updatedFields = [...fields, newColumn]
    setFields(updatedFields)
    setColumnDialogMode('create')
    // Open dialog after a short delay to ensure state is updated
    setTimeout(() => {
      setSelectedColumn(newColumn)
      setDraftColumn(JSON.parse(JSON.stringify(newColumn)))
      setIsColumnDialogOpen(true)
    }, 100)
  }

  const handleDraftFieldTypeChange = (isTransformation: boolean) => {
    setDraftColumn((prev) => {
      if (!prev) return prev
      if (isTransformation) {
        return {
          ...prev,
          isTransformation: true,
          transformationType: prev.transformationType || "calculation",
        }
      }
      const {
        transformationType,
        transformationConfig,
        transformationSource,
        transformationSourceColumnId,
        ...rest
      } = prev
      return {
        ...rest,
        isTransformation: false,
      } as SchemaField
    })
  }

  const updateColumn = (columnId: string, updates: Partial<SchemaField>) => {
    setFields((prev) => updateFieldById(prev, columnId, (f) => {
      // Normalize shape when changing type between leaf/compound kinds
      const next = { ...f, ...updates } as SchemaField
      if (updates.type && updates.type !== f.type) {
        if (updates.type === 'object') {
          ;(next as any).children = Array.isArray((next as any).children) ? (next as any).children : []
          delete (next as any).item
          delete (next as any).columns
        } else if (updates.type === 'list') {
          if (!(next as any).item) {
            ;(next as any).item = {
              id: `${next.id}_item`,
              name: 'item',
              type: 'string',
              description: '',
              extractionInstructions: '',
              required: false,
            }
          }
          delete (next as any).children
          delete (next as any).columns
        } else if (updates.type === 'table') {
          ;(next as any).columns = Array.isArray((next as any).columns) ? (next as any).columns : []
          delete (next as any).children
          delete (next as any).item
        } else {
          // Leaf primitive
          delete (next as any).children
          delete (next as any).item
          delete (next as any).columns
        }
      }
      return next
    }))
    if (selectedColumn?.id === columnId) setSelectedColumn({ ...selectedColumn, ...updates } as SchemaField)
    
  }

  const deleteColumn = (columnId: string) => {
    setSchemas((prev) => 
      prev.map((schema) => {
        if (schema.id !== activeSchemaId) return schema
        
        // Remove field from fields
        const newFields = removeFieldById(schema.fields, columnId)
        
        // Clean up visual groups: remove field from groups and delete empty groups
        const updatedGroups = (schema.visualGroups || [])
          .map(group => ({
            ...group,
            fieldIds: group.fieldIds.filter(id => id !== columnId)
          }))
          .filter(group => group.fieldIds.length > 0)
        
        return {
          ...schema,
          fields: newFields,
          visualGroups: updatedGroups
        }
      })
    )
    
    if (selectedColumn?.id === columnId) {
      setSelectedColumn(null)
      setIsColumnDialogOpen(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    if (fields.length === 0 && activeSchema.templateId !== 'fnb-label-compliance' && selectedAgent !== 'pharma') {
      alert("Please define at least one column before uploading files.")
      return
    }

    for (const file of Array.from(files)) {
      const newJob: ExtractionJob = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        status: "pending",
        createdAt: new Date(),
        agentType: selectedAgent,
      }
      setJobs((prev) => [...prev, newJob])
      setSelectedRowId(newJob.id)

      try {
        // Update status to processing
        setJobs((prev) => prev.map((job) => (job.id === newJob.id ? { ...job, status: "processing" } : job)))

        // Build nested schema tree without transformation fields
        const filterTransforms = (fs: SchemaField[]): SchemaField[] =>
          fs
            .filter((f) => !f.isTransformation)
            .map((f) => {
              if (f.type === "object") return { ...f, children: filterTransforms(f.children) }
              if (f.type === "list") return { ...f }
              if (f.type === "table") return { ...f, columns: filterTransforms(f.columns) }
              return f
            })
        const schemaTree = filterTransforms(fields)

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log("[bytebeam] Sending schemaTree:", schemaTree)
          // eslint-disable-next-line no-console
          console.log("[bytebeam] File:", file.name, file.type)
        }

        const compressionOptions = {
          targetBytes: 3_000_000,
          maxDim: 1800,
          quality: 0.75,
        }
        const compressed = await maybeDownscaleImage(file, compressionOptions)
        const uploadBlob = compressed.blob
        const uploadType = compressed.type || file.type || 'application/octet-stream'
        const uploadName = compressed.name || file.name
        const imageSizeExceededMessage = 'File is still larger than 3 MB after compression. Please resize or crop the image and try again.'
        const maxImageBytes = compressionOptions.targetBytes ?? 3_000_000

        if (uploadType.startsWith('image/') && uploadBlob.size > maxImageBytes) {
          throw new Error(imageSizeExceededMessage)
        }

        // Convert (potentially compressed) blob to base64 for downstream APIs
        const base64Data = await new Promise<string>((resolve, reject) => {
          try {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              const commaIndex = result.indexOf(",")
              resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
            }
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(uploadBlob)
          } catch (e) {
            reject(e)
          }
        })

        const fileData = {
          name: uploadName,
          type: uploadType,
          size: uploadBlob.size,
          data: base64Data,
        }

        // Special Pharma E-Commerce Content Generation flow
        if (selectedAgent === 'pharma') {
          try {
            // Prepare data for pharma API
            const pharmaPayload: any = {
              imageBase64: uploadType.startsWith('image/') ? base64Data : undefined,
              fileName: uploadName,
            }

            // For non-image files, try to extract text
            if (!uploadType.startsWith('image/')) {
              // For text files, decode base64 to text
              if (uploadType.includes('text') || uploadType.includes('csv')) {
                const textBytes = atob(base64Data)
                pharmaPayload.extractedText = textBytes
              } else {
                // For PDFs and other documents, send the file data
                // The API will handle text extraction
                pharmaPayload.fileData = fileData
              }
            }

            const pharmaResponse = await fetch('/api/pharma/extract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(pharmaPayload),
            })

            if (pharmaResponse.status === 413) {
              throw new Error('The uploaded file exceeds the 3 MB limit. Please compress or resize the file and retry.')
            }

            if (!pharmaResponse.ok) {
              const errText = await pharmaResponse.text().catch(() => `${pharmaResponse.status} ${pharmaResponse.statusText}`)
              throw new Error(`Pharma extraction failed: ${pharmaResponse.status} ${pharmaResponse.statusText} - ${errText}`)
            }

            const pharmaResult = await pharmaResponse.json()

            if (!pharmaResult?.success) {
              throw new Error(pharmaResult?.error || 'Pharma extraction failed')
            }

            // Store pharma results
            const finalResults: Record<string, any> = {
              pharma_data: pharmaResult,
            }

            setJobs((prev) =>
              prev.map((job) =>
                job.id === newJob.id
                  ? { ...job, status: 'completed', results: finalResults, completedAt: new Date() }
                  : job,
              ),
            )
            recordSuccessAndMaybeOpenRoi()
          } catch (e) {
            console.error('Pharma flow error:', e)
            setJobs((prev) =>
              prev.map((job) =>
                job.id === newJob.id
                  ? { ...job, status: 'error', completedAt: new Date() }
                  : job,
              ),
            )
          }
          continue
        }

        // Special F&B Label Compliance flow: extraction then translation using fixed prompts
        if (activeSchema.templateId === 'fnb-label-compliance') {
          try {
            const r1 = await fetch('/api/fnb/extract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ file: fileData }),
            })
            if (r1.status === 413) {
              throw new Error('The uploaded file exceeds the 3 MB limit for F&B extraction. Please compress or resize the image and retry.')
            }
            if (!r1.ok) {
              const errText = await r1.text().catch(() => `${r1.status} ${r1.statusText}`)
              throw new Error(`Extraction request failed: ${r1.status} ${r1.statusText} - ${errText}`)
            }
            const j1 = await r1.json()
            if (!j1?.success) throw new Error(j1?.error || 'Extraction failed')
            const extraction = j1.data

            const source = extraction?.product_initial_language ?? extraction
            const r2 = await fetch('/api/fnb/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source }),
            })
            if (!r2.ok) {
              const errText = await r2.text().catch(() => `${r2.status} ${r2.statusText}`)
              throw new Error(`Translation request failed: ${r2.status} ${r2.statusText} - ${errText}`)
            }
            const j2 = await r2.json()
            if (!j2?.success) throw new Error(j2?.error || 'Translation failed')

            const finalResults: Record<string, any> = {
              fnb_extraction: extraction,
              fnb_translation: j2.data,
            }

            setJobs((prev) =>
              prev.map((job) =>
                job.id === newJob.id
                  ? { ...job, status: 'completed', results: finalResults, completedAt: new Date() }
                  : job,
              ),
            )
            recordSuccessAndMaybeOpenRoi()
          } catch (e) {
            console.error('FNB flow error:', e)
            setJobs((prev) =>
              prev.map((job) =>
                job.id === newJob.id
                  ? { ...job, status: 'error', completedAt: new Date() }
                  : job,
              ),
            )
          }
          continue
        }

        // Call extraction API with JSON instead of FormData
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: fileData,
            schemaTree,
            extractionPromptOverride: undefined,
          }),
        })

        const responseBody = await response.text()
        if (!response.ok) {
          throw new Error(
            `Extraction failed (${response.status} ${response.statusText}): ${responseBody.slice(0, 500)}`,
          )
        }

        let result: any
        try {
          result = responseBody ? JSON.parse(responseBody) : {}
        } catch (parseError) {
          throw new Error(
            `Failed to parse extraction response: ${
              parseError instanceof Error ? parseError.message : String(parseError)
            }. Body snippet: ${responseBody.slice(0, 200)}`,
          )
        }
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log("[bytebeam] API response:", result)
        }

        if (result.success) {
          if (Array.isArray(result.warnings) && result.warnings.length > 0) {
            console.warn('[bytebeam] Extraction warnings:', result.warnings)
          }
          // Flatten nested results (by field id) for grid/transform use
          const finalResults = flattenResultsById(fields, result.results)

          // Validate dependencies before execution
          const dependencyErrors = validateDependencies(displayColumns)
          if (dependencyErrors.length > 0) {
            console.warn('[bytebeam] Dependency validation errors:', dependencyErrors)
          }

          // Build dependency graph and execution waves
          const graph = buildDependencyGraph(displayColumns)
          const waves = topologicalSort(graph)
          
          // Track field status for error propagation
          const fieldStatus = new Map<string, { status: 'success' | 'error' | 'blocked', error?: string }>()

          // Execute transformations wave by wave (synchronous types first)
          const synchronousTypes = ['calculation', 'currency_conversion', 'classification']
          
          for (const wave of waves) {
            const syncFields = wave.fields.filter(col => 
              col.isTransformation && synchronousTypes.includes(col.transformationType || '')
            )
            
            syncFields.forEach((col) => {
              // Check if any dependencies failed or are blocked
              const dependencies = graph.edges.get(col.id) || new Set()
              const blockedBy: string[] = []
              
              dependencies.forEach(depId => {
                const depStatus = fieldStatus.get(depId)
                if (depStatus && (depStatus.status === 'error' || depStatus.status === 'blocked')) {
                  const depField = displayColumns.find(f => f.id === depId)
                  blockedBy.push(depField?.name || depId)
                }
              })
              
              if (blockedBy.length > 0) {
                fieldStatus.set(col.id, { 
                  status: 'blocked', 
                  error: `Blocked by failed dependencies: ${blockedBy.join(', ')}` 
                })
                finalResults[col.id] = `Error: Blocked by ${blockedBy.join(', ')}`
                return
              }
              
              if (col.transformationType === "calculation" && col.transformationConfig) {
                try {
                  let expression = col.transformationConfig

                  // Replace column references with actual values
                  // Build a map of replacements first to avoid issues with overlapping replacements
                  const replacements: { pattern: string; value: string }[] = []
                  const columnReferences = expression.match(/\{([^}]+)\}/g)
                  
                  if (columnReferences) {
                    for (const ref of columnReferences) {
                      const fieldName = ref.slice(1, -1).trim()
                      const referencedColumn = displayColumns.find((c) => c.name === fieldName)
                      let valueToReplace = "0"
                      
                      if (referencedColumn) {
                        const value = finalResults[referencedColumn.id]
                        if (value !== undefined && value !== null) {
                          const numericValue = Number.parseFloat(value.toString())
                          if (!isNaN(numericValue)) {
                            valueToReplace = numericValue.toString()
                          } else {
                            console.warn(
                              `Non-numeric value for referenced column '${fieldName}' in calculation. Using 0.`,
                            )
                          }
                        }
                      } else {
                        console.warn(`Referenced column '${fieldName}' not found in calculation. Using 0.`)
                      }
                      
                      replacements.push({ pattern: ref, value: valueToReplace })
                    }
                    
                    // Apply all replacements using a function replacer to avoid regex issues
                    for (const { pattern, value } of replacements) {
                      // Use split and join for safe string replacement
                      expression = expression.split(pattern).join(value)
                    }
                  }

                  // Simple safe evaluation for basic math operations only
                  // Remove any non-math characters to prevent code injection
                  const safeExpression = expression.replace(/[^0-9+\-*/.() ]/g, "")
                  if (safeExpression !== expression) {
                    console.warn("Invalid characters removed from calculation expression")
                  }

                  // Check if expression is empty or invalid before evaluation
                  if (!safeExpression || safeExpression.trim() === "") {
                    finalResults[col.id] = 0
                  } else {
                    try {
                      // Use Function constructor with timeout protection
                      const func = new Function(`"use strict"; return (${safeExpression})`)
                      const result = func()
                      
                      // Validate the result
                      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                        finalResults[col.id] = result
                      } else {
                        console.warn("Calculation resulted in non-numeric value")
                        finalResults[col.id] = 0
                      }
                    } catch (evalError) {
                      console.error("Error evaluating expression:", evalError)
                      finalResults[col.id] = 0
                    }
                  }
                  fieldStatus.set(col.id, { status: 'success' })
                } catch (e) {
                  console.error("Calculation error:", e)
                  const errorMsg = `Error: ${e instanceof Error ? e.message : "Invalid calculation"}`
                  finalResults[col.id] = errorMsg
                  fieldStatus.set(col.id, { status: 'error', error: errorMsg })
                }
              } else if (col.transformationType === "currency_conversion") {
                try {
                  // Support structured config or legacy string expressions
                  let amount = 0
                  let rate = 1
                  let decimals: number | undefined

                  const cfg = col.transformationConfig
                  const resolveColumnValueById = (id: string): number => {
                    const v = finalResults[id]
                    const n = Number.parseFloat(String(v))
                    return isNaN(n) ? 0 : n
                  }
                  const resolveBraceOrNumber = (ref: any): number => {
                    if (typeof ref === "number") return ref
                    if (typeof ref === "string") {
                      const m = ref.match(/^\{([^}]+)\}$/)
                      if (m) {
                        const byName = displayColumns.find((c) => c.name === m[1].trim())
                        const v = byName ? finalResults[byName.id] : undefined
                        const n = Number.parseFloat(String(v))
                        return isNaN(n) ? 0 : n
                      }
                      const n = Number.parseFloat(ref)
                      return isNaN(n) ? 0 : n
                    }
                    return 0
                  }

                  if (cfg && typeof cfg === "object" && (cfg.amount || cfg.rate)) {
                    const amt = cfg.amount || { type: "number", value: 0 }
                    const rt = cfg.rate || { type: "number", value: 1 }
                    amount = amt.type === "column" ? resolveColumnValueById(String(amt.value)) : resolveBraceOrNumber(amt.value)
                    rate = rt.type === "column" ? resolveColumnValueById(String(rt.value)) : resolveBraceOrNumber(rt.value)
                    decimals = typeof cfg.decimals === "number" ? cfg.decimals : undefined
                  } else {
                    const cfgText = String(cfg || "")
                    try {
                      const j = JSON.parse(cfgText)
                      amount = resolveBraceOrNumber(j.amount ?? j.value)
                      rate = resolveBraceOrNumber(j.rate ?? j.fxRate ?? j.multiplier)
                      decimals = typeof j.decimals === "number" ? j.decimals : undefined
                    } catch {
                      // Fallback to formula string like "{Amount} * 3.75"
                      let expr = cfgText
                      const refs = expr.match(/\{([^}]+)\}/g)
                      if (refs) {
                        for (const r of refs) {
                          const name = r.slice(1, -1).trim()
                          const refCol = displayColumns.find((c) => c.name === name)
                          const v = refCol ? finalResults[refCol.id] : undefined
                          const n = Number.parseFloat(String(v))
                          expr = expr.split(r).join(!isNaN(n) ? String(n) : "0")
                        }
                      }
                      const safe = expr.replace(/[^0-9+\-*/.() ]/g, "")
                      const fn = new Function(`"use strict"; return (${safe})`)
                      const out = fn()
                      const num = typeof out === "number" && isFinite(out) ? out : 0
                      finalResults[col.id] = num
                      fieldStatus.set(col.id, { status: 'success' })
                      return
                    }
                  }

                  let out = amount * rate
                  if (typeof decimals === "number") {
                    const p = Math.pow(10, Math.max(0, decimals))
                    out = Math.round(out * p) / p
                  }
                  finalResults[col.id] = out
                  fieldStatus.set(col.id, { status: 'success' })
                } catch (e) {
                  console.error("Currency conversion error:", e)
                  finalResults[col.id] = 0
                  fieldStatus.set(col.id, { status: 'error', error: String(e) })
                }
              } else if (col.transformationType === "gemini_api") {
                // Defer to server for LLM transformation
                // This block will be handled asynchronously after the loop
                
              } else if (col.transformationType === "classification") {
                // Simple classification based on rules
                finalResults[col.id] = "Classified result"
                fieldStatus.set(col.id, { status: 'success' })
              } else {
                finalResults[col.id] = "Transformation result"
                fieldStatus.set(col.id, { status: 'success' })
              }
            })
          }

          // Update with initial transformation results (calc/currency/classification)
          setJobs((prev) =>
            prev.map((job) =>
              job.id === newJob.id
                ? {
                    ...job,
                    status: "completed",
                    results: finalResults,
                    completedAt: new Date(),
                  }
                : job,
            ),
          )

          // Now perform any async Gemini transformations wave by wave
          for (const wave of waves) {
            const geminiFields = wave.fields.filter(col => 
              col.isTransformation && col.transformationType === 'gemini_api'
            )
            
            for (const tcol of geminiFields) {
              // Check if any dependencies failed or are blocked
              const dependencies = graph.edges.get(tcol.id) || new Set()
              const blockedBy: string[] = []
              
              dependencies.forEach(depId => {
                const depStatus = fieldStatus.get(depId)
                if (depStatus && (depStatus.status === 'error' || depStatus.status === 'blocked')) {
                  const depField = displayColumns.find(f => f.id === depId)
                  blockedBy.push(depField?.name || depId)
                }
              })
              
              if (blockedBy.length > 0) {
                fieldStatus.set(tcol.id, { 
                  status: 'blocked', 
                  error: `Blocked by failed dependencies: ${blockedBy.join(', ')}` 
                })
                finalResults[tcol.id] = `Error: Blocked by ${blockedBy.join(', ')}`
                continue
              }
              
              try {
              const source = tcol.transformationSource || "column"
              
              // Build field schema for type-aware formatting
              const fieldSchema: any = {
                type: tcol.type,
                name: tcol.name,
                description: tcol.description,
                constraints: tcol.constraints,
              }
              
              // Add type-specific schema information
              if (tcol.type === 'object' && 'children' in tcol) {
                fieldSchema.children = tcol.children
              } else if (tcol.type === 'list' && 'item' in tcol) {
                fieldSchema.item = tcol.item
              } else if (tcol.type === 'table' && 'columns' in tcol) {
                fieldSchema.columns = tcol.columns
              }
              
              let payload: any = {
                type: "gemini",
                prompt: String(tcol.transformationConfig || ""),
                inputSource: source,
                fieldType: tcol.type,
                fieldSchema: fieldSchema,
              }
              if (source === "document") {
                payload.file = fileData
              } else {
                // Extract all column references from the prompt
                const columnValues: Record<string, any> = {}
                const promptText = String(tcol.transformationConfig || "")
                const refs = promptText.match(/\{([^}]+)\}/g) || []
                
                for (const ref of refs) {
                  const refName = ref.slice(1, -1).trim()
                  
                  // Check if this is a visual group reference
                  const visualGroup = activeSchema.visualGroups?.find((g) => g.name === refName)
                  if (visualGroup) {
                    // Build an object with all fields from this group
                    const groupData: Record<string, any> = {}
                    for (const fieldId of visualGroup.fieldIds) {
                      const field = displayColumns.find((c) => c.id === fieldId)
                      if (field && finalResults[fieldId] !== undefined) {
                        groupData[field.name] = finalResults[fieldId]
                      }
                    }
                    columnValues[refName] = groupData
                  } else {
                    // Regular column reference
                    const refCol = displayColumns.find((c) => c.name === refName)
                    if (refCol && finalResults[refCol.id] !== undefined) {
                      columnValues[refName] = finalResults[refCol.id]
                    }
                  }
                }
                
                payload.columnValues = columnValues
              }

              const resp = await fetch("/api/transform", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              })
              const data = await resp.json()
              if (data?.success) {
                let val: any = data.result
                try { val = JSON.parse(data.result) } catch {}
                finalResults[tcol.id] = val
                fieldStatus.set(tcol.id, { status: 'success' })
              } else {
                const errorMsg = data?.error || "Transformation failed"
                finalResults[tcol.id] = errorMsg
                fieldStatus.set(tcol.id, { status: 'error', error: errorMsg })
              }
            } catch (e) {
                console.error("Gemini transform error:", e)
                const errorMsg = "Error: " + String(e)
                finalResults[tcol.id] = errorMsg
                fieldStatus.set(tcol.id, { status: 'error', error: errorMsg })
              }
            }
          }

          // Patch job with final results after async transformations
          setJobs((prev) =>
            prev.map((job) =>
              job.id === newJob.id
                ? {
                    ...job,
                    results: finalResults,
                  }
                : job,
            ),
          )
          // Lead modal trigger after successful extraction
          recordSuccessAndMaybeOpenRoi()
        } else {
          throw new Error(result.error || "Extraction failed")
        }
      } catch (error) {
        console.error("Extraction error:", error)
        setJobs((prev) =>
          prev.map((job) =>
            job.id === newJob.id
              ? {
                  ...job,
                  status: "error",
                  completedAt: new Date(),
                }
              : job,
          ),
        )
      }
    }

    // Clear the file input so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getStatusIcon = (status: ExtractionJob["status"]) => {
    const iconSizing = "h-3.5 w-3.5"
    switch (status) {
      case "completed":
        return <CheckCircle className={`${iconSizing} text-accent`} />
      case "processing":
        return <Clock className={`${iconSizing} text-primary animate-spin`} />
      case "error":
        return <AlertCircle className={`${iconSizing} text-destructive`} />
      default:
        return <Clock className={`${iconSizing} text-muted-foreground`} />
    }
  }

  const renderStatusPill = (
    status: ExtractionJob["status"],
    opts?: { size?: 'default' | 'compact' },
  ) => {
    const size = opts?.size ?? 'default'
    const base = cn(
      'inline-flex items-center rounded-full font-semibold uppercase tracking-wide transition-colors',
      size === 'compact' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]',
    )

    if (status === 'completed') {
      return (
        <span className={cn(base, 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300')}>
          Completed
        </span>
      )
    }
    if (status === 'processing') {
      return (
        <span className={cn(base, 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300')}>
          Processing
        </span>
      )
    }
    if (status === 'error') {
      return (
        <span className={cn(base, 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300')}>
          Error
        </span>
      )
    }
    return <span className={cn(base, 'bg-muted text-muted-foreground')}>Pending</span>
  }

  const getCellAlignClasses = (type: DataType) => {
    if (type === 'number' || type === 'decimal') return 'text-right [font-variant-numeric:tabular-nums]'
    if (type === 'date') return 'font-mono text-xs'
    return 'text-left'
  }

  type GridRenderMode = 'interactive' | 'summary' | 'detail'

  const renderCellValue = (
    column: SchemaField,
    job: ExtractionJob,
    opts?: { refreshRowHeight?: () => void; mode?: GridRenderMode },
  ) => {
    const value = job.results?.[column.id]
    if (job.status === 'error') return <span className="text-sm text-destructive">—</span>
    if (job.status !== 'completed') return <Skeleton className="h-4 w-24" />

    const mode: GridRenderMode = opts?.mode ?? 'interactive'

    const isEmptyValue =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim().length === 0) ||
      (Array.isArray(value) && value.length === 0)

    if (isEmptyValue) {
      return <span className="text-muted-foreground">—</span>
    }

    if (column.type === 'boolean') {
      const truthy = Boolean(value)
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
            truthy
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {truthy ? 'True' : 'False'}
        </span>
      )
    }

    if (column.type === 'number' || column.type === 'decimal') {
      const formatted = formatNumericValue(value)
      return (
        <span className="text-sm font-medium text-foreground tabular-nums">
          {formatted ?? String(value)}
        </span>
      )
    }

    if (column.type === 'date') {
      const formatted = formatDateValue(value)
      return (
        <span className="font-mono text-xs" title={String(value)}>
          {formatted ?? String(value)}
        </span>
      )
    }

    const renderCompositeShell = (
      type: 'object' | 'table' | 'list',
      summary: string,
      meta: string | null,
      detail: React.ReactNode,
    ) => {
      const expanded = mode === 'detail' ? true : isCellExpanded(job.id, column.id)
      const badge = (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
            compositeBadgeStyles[type],
          )}
        >
          {compositeBadgeLabels[type]}
        </span>
      )

      const headerContent = (
        <div className="flex items-center gap-3">
          {badge}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{summary}</div>
            {meta && <div className="truncate text-xs text-muted-foreground">{meta}</div>}
          </div>
          {mode === 'interactive' && (
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                expanded ? 'rotate-180' : 'rotate-0',
              )}
            />
          )}
        </div>
      )

      if (mode === 'summary') {
        return (
          <div className="rounded-xl border border-[#2782ff]/10 bg-white/75 px-3 py-2 shadow-sm">
            {headerContent}
          </div>
        )
      }

      if (mode === 'detail') {
        return (
          <div className="space-y-2">
            <div className="rounded-xl border border-[#2782ff]/15 bg-white/85 px-3 py-2 shadow-sm">
              {headerContent}
            </div>
            <div className="rounded-xl border border-[#2782ff]/20 bg-[#e6f0ff]/60 p-3 text-sm shadow-inner dark:border-[#1a4b8f]/40 dark:bg-[#0b2547]/40">
              {detail}
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              toggleCellExpansion(job.id, column.id)
              queueMicrotask(() => opts?.refreshRowHeight?.())
            }}
            className="w-full rounded-xl border border-[#2782ff]/20 bg-white/70 px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-[1px] hover:border-[#2782ff]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2782ff]/40"
            aria-expanded={expanded}
          >
            {headerContent}
          </button>
          <div
            className={cn(
              'grid transition-all duration-300 ease-in-out',
              expanded ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0',
            )}
          >
            <div className="overflow-hidden">
              <div className="rounded-xl border border-[#2782ff]/20 bg-[#e6f0ff]/60 p-3 text-sm shadow-inner dark:border-[#1a4b8f]/40 dark:bg-[#0b2547]/40">
                {detail}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (column.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, any>
      const amountLike = record.amount ?? record.total ?? record.value
      const currencyLike = record.currency ?? record.ccy ?? record.iso ?? record.code

      // Special-case monetary object values
      if (amountLike !== undefined && (typeof amountLike === 'number' || typeof amountLike === 'string')) {
        const formattedAmount = formatNumericValue(amountLike) ?? String(amountLike)
        return (
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-foreground tabular-nums">{formattedAmount}</span>
            {currencyLike && (
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {String(currencyLike)}
              </span>
            )}
          </div>
        )
      }

      const entries = getObjectEntries(column, record)
      // Build a collapsed summary using sub-fields marked displayInSummary
      let summary = firstNonEmptyText(record) ?? ''
      if (!summary) {
        const labelsForSummary: string[] = []
        if (column.type === 'object') {
          const objectColumn = column as Extract<SchemaField, { type: 'object' }>
          const displayChildren = (objectColumn.children || []).filter((c) => (c as any).displayInSummary)
          // Map to values from record in the same order as children
          for (const child of displayChildren) {
            const valueForChild = record[child.id] ?? record[child.name]
            if (valueForChild !== undefined && valueForChild !== null && String(valueForChild).trim() !== '') {
              labelsForSummary.push(String(valueForChild))
            }
          }
        }
        summary = labelsForSummary.length > 0 ? labelsForSummary.join(' / ') : `${entries.length} ${entries.length === 1 ? 'field' : 'fields'}`
      }
      const detail = (
        <div className="space-y-2">
          {entries.map(({ label, value: entryValue }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
              <span className="max-w-[16rem] text-sm font-medium text-foreground">
                {typeof entryValue === 'number'
                  ? formatNumericValue(entryValue) ?? String(entryValue)
                  : typeof entryValue === 'boolean'
                    ? entryValue ? 'True' : 'False'
                    : typeof entryValue === 'object'
                      ? JSON.stringify(entryValue)
                      : String(entryValue)}
              </span>
            </div>
          ))}
        </div>
      )

      return renderCompositeShell('object', summary, `${entries.length} ${entries.length === 1 ? 'detail' : 'details'}`, detail)
    }

    if (column.type === 'table' && Array.isArray(value)) {
      const rows = value as Record<string, any>[]
      const columnsForTable =
        column.type === 'table' && 'columns' in column
          ? (column as Extract<SchemaField, { type: 'table' }>).columns
          : []
      const columnHeaders =
        columnsForTable.length > 0
          ? columnsForTable.map((col) => ({
              key: col.id ?? col.name,
              label: col.name,
            }))
          : Array.from(
              rows.reduce((set, row) => {
                Object.keys(row || {}).forEach((key) => set.add(key))
                return set
              }, new Set<string>()),
            ).map((key) => ({ key, label: prettifyKey(key) }))

      const detail = rows.length === 0
        ? <span className="text-sm text-muted-foreground">No entries</span>
        : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Table Preview</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openTableModal(column, job, rows, columnHeaders)}
                className="h-7 px-2 text-xs"
              >
                <Maximize2 className="mr-1 h-3 w-3" />
                View Full Table
                {rows.length > 5 && (
                  <span className="ml-1 px-1 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {rows.length}
                  </span>
                )}
              </Button>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: rows.length <= 2 ? '200px' : '300px' }}>
              <table className="min-w-full border-separate border-spacing-y-1 text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    {columnHeaders.map((header) => (
                      <th key={header.key} className="bg-white/70 px-2 py-1 text-left font-medium first:rounded-l-md last:rounded-r-md shadow-sm">{header.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, Math.min(rows.length, 5)).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30">
                      {columnHeaders.map((header) => {
                        const cell = row?.[header.key as keyof typeof row]
                        const formatted =
                          typeof cell === 'number'
                            ? formatNumericValue(cell) ?? String(cell)
                            : typeof cell === 'boolean'
                              ? cell ? 'True' : 'False'
                              : typeof cell === 'object'
                                ? JSON.stringify(cell)
                                : cell ?? '—'
                        return (
                          <td key={header.key} className="bg-white px-2 py-1 text-left text-sm first:rounded-l-md last:rounded-r-md shadow-sm">
                            <span className="block truncate" title={String(formatted)}>
                              {String(formatted)}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <div className="text-center py-2 text-xs text-muted-foreground bg-slate-50/50 rounded-b-md">
                  ... and {rows.length - 5} more rows
                </div>
              )}
            </div>
          </div>
        )

      return renderCompositeShell(
        'table',
        `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`,
        columnsForTable.length ? `${columnsForTable.length} columns` : null,
        detail,
      )
    }

    if (column.type === 'list' && Array.isArray(value)) {
      const items = value as any[]
      const meta = `${items.length} ${items.length === 1 ? 'item' : 'items'}`
      const detail = (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg bg-white/80 px-3 py-2 shadow-sm">
              {item && typeof item === 'object' ? (
                <pre className="whitespace-pre-wrap text-xs text-foreground/80">{JSON.stringify(item, null, 2)}</pre>
              ) : (
                <span className="text-sm text-foreground">{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      )

      const summary = items[0] && typeof items[0] === 'string' ? String(items[0]) : meta

      return renderCompositeShell('list', summary, meta, detail)
    }

    if (Array.isArray(value)) {
      const items = value as any[]
      return renderCompositeShell(
        'list',
        `${items.length} ${items.length === 1 ? 'item' : 'items'}`,
        null,
        <pre className="whitespace-pre-wrap text-xs text-foreground/80">{JSON.stringify(items, null, 2)}</pre>,
      )
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, any>
      const entries = Object.keys(record)
      return renderCompositeShell(
        'object',
        firstNonEmptyText(record) ?? `${entries.length} fields`,
        null,
        <pre className="whitespace-pre-wrap text-xs text-foreground/80">{JSON.stringify(record, null, 2)}</pre>,
      )
    }

    return (
      <span className="truncate text-sm" title={String(value)}>
        {String(value)}
      </span>
    )
  }

  const exportToCSV = () => {
    const formatCell = (val: unknown): string => {
      if (val === undefined || val === null) return ''
      if (typeof val === 'object') {
        try {
          return JSON.stringify(val)
        } catch {
          return String(val)
        }
      }
      return String(val)
    }

    const escapeCSV = (cell: string): string => {
      // Quote when containing comma, quote, or newline
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return '"' + cell.replace(/"/g, '""') + '"'
      }
      return cell
    }

    let headers: string[]
    let rows: string[][]

    // Check if this is pharma agent
    if (selectedAgent === 'pharma') {
      // Pharma-specific CSV export
      headers = [
        'File Name',
        'Status',
        'Trade Name',
        'Generic Name',
        'Manufacturer',
        'Drug Type',
        'Registration Number',
        'Description',
        'Composition',
        'How To Use',
        'Indication',
        'Possible Side Effects',
        'Properties',
        'Storage',
        'Matched Drug URL',
        'Search URL'
      ]

      rows = jobs.map((job) => {
        const pharmaData = job.results?.pharma_data
        const drugInfo = pharmaData?.drugInfo
        const detailedInfo = pharmaData?.detailedInfo
        
        return [
          job.fileName,
          job.status,
          formatCell(drugInfo?.tradeName),
          formatCell(drugInfo?.genericName),
          formatCell(drugInfo?.manufacturer),
          formatCell(drugInfo?.drugType),
          formatCell(drugInfo?.registrationNumber),
          formatCell(detailedInfo?.description),
          formatCell(detailedInfo?.composition),
          formatCell(detailedInfo?.howToUse),
          formatCell(detailedInfo?.indication),
          formatCell(detailedInfo?.possibleSideEffects),
          formatCell(detailedInfo?.properties),
          formatCell(detailedInfo?.storage),
          formatCell(pharmaData?.matchedDrugUrl),
          formatCell(pharmaData?.searchUrl)
        ]
      })
    } else {
      // Standard extraction CSV export
      headers = ['File Name', 'Status', ...displayColumns.map((col) => col.name)]

      rows = jobs.map((job) => {
        const row: string[] = [job.fileName, job.status]
        displayColumns.forEach((col) => {
          const value = job.results?.[col.id]
          row.push(formatCell(value))
        })
        return row
      })
    }

    // Convert to CSV string
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    const schemaLabel = selectedAgent === 'pharma' ? 'pharma_extraction' : (activeSchema.name || 'schema').replace(/[^a-z0-9-_]+/gi, '_')
    link.setAttribute('download', `${schemaLabel}_results_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // F&B: Build and print localized label PDF (printable HTML)
  const printLocalizedLabel = () => {
    try {
      const job =
        sortedJobs.find((j) => j.id === selectedRowId) ||
        sortedJobs.find((j) => j.status === 'completed') ||
        sortedJobs[sortedJobs.length - 1]
      if (!job || job.status !== 'completed') {
        alert('No completed job to print')
        return
      }
      const tr = job.results?.fnb_translation
      if (!tr) {
        alert('Translation data not available yet')
        return
      }
      const en = tr.english_product_info || {}
      const ar = tr.arabic_product_info || {}

      // Helpers
      const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const joinList = (arr: any[]) => Array.isArray(arr) ? arr.filter(Boolean).join(', ') : ''
      const setFrom = (arr: any[]) => new Set((Array.isArray(arr) ? arr : []).map((x) => String(x || '').toLowerCase()))
      const boldAllergens = (list: any[], allergens: Set<string>) => {
        if (!Array.isArray(list)) return ''
        return list.map((it: any) => {
          const s = String(it || '')
          const lower = s.toLowerCase()
          let highlighted = s
          allergens.forEach((al) => {
            if (!al) return
            if (lower.includes(al)) {
              const re = new RegExp(al.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig')
              highlighted = highlighted.replace(re, (m) => `<strong>${esc(m)}</strong>`)
            }
          })
          return highlighted
        }).join(', ')
      }

      const enAllergens = setFrom(en.allergyInformation)
      const arAllergens = setFrom(ar.allergyInformation)

      const energyKJ = esc(en?.nutritionalInformationPer100g?.energyPer100g?.kj)
      const energyKCal = esc(en?.nutritionalInformationPer100g?.energyPer100g?.kcal)

      const rowPair = (labelEn: string, labelAr: string, vEn: any, vAr: any) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #ccc;">${esc(labelEn)} / ${esc(labelAr)}</td>
          <td style="padding:6px 8px;border:1px solid #ccc;text-align:center;">
            ${esc(vEn || '')}${vEn ? '' : ''} ${vEn && vAr ? '/' : ''} ${esc(vAr || '')}
          </td>
        </tr>`

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Localized Label</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; padding: 24px; color: #111; }
    h1, h2, h3 { margin: 0 0 8px; }
    .section { margin-bottom: 14px; }
    .muted { color: #555; font-size: 12px; }
    .divider { height: 1px; background: #ddd; margin: 10px 0; }
    @media print { .no-print { display: none !important; } }
  </style>
  </head>
  <body>
    <div class="no-print" style="text-align:right;margin-bottom:12px;">
      <button onclick="window.print()" style="padding:6px 10px;border:1px solid #bbb;background:#fff;cursor:pointer;">Print</button>
    </div>

    <div class="section">
      <h2>${esc(en.productName || '')} / ${esc(ar.productName || '')}</h2>
    </div>

    <div class="section">
      <div>Product of ${esc(en?.manufacturer?.country || '')} / منتج من ${esc(ar?.manufacturer?.country || '')}</div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div><strong>Ingredients:</strong> ${boldAllergens(en.ingredients || [], enAllergens)}</div>
      <div><strong>المكونات:</strong> ${boldAllergens(ar.ingredients || [], arAllergens)}</div>
    </div>

    <div class="section">
      <div><strong>Allergy Information:</strong> ${esc(joinList(en.allergyInformation || []))}</div>
      <div><strong>معلومات الحساسية:</strong> ${esc(joinList(ar.allergyInformation || []))}</div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <h3>Nutritional Facts / حقائق غذائية</h3>
      <div class="muted">Typical values per 100g / القيم النموذجية لكل 100غ</div>
      <table style="width:100%;border-collapse:collapse;margin-top:6px;">
        <thead>
          <tr>
            <th style="padding:6px 8px;border:1px solid #ccc;text-align:left;">Nutrient / العنصر الغذائي</th>
            <th style="padding:6px 8px;border:1px solid #ccc;text-align:center;">Value / القيمة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:6px 8px;border:1px solid #ccc;">Energy / الطاقة</td>
            <td style="padding:6px 8px;border:1px solid #ccc;text-align:center;">${energyKJ} kJ / ${energyKCal} kcal</td>
          </tr>
          ${rowPair('Fat', 'الدهون', en?.nutritionalInformationPer100g?.fatPer100g, ar?.nutritionalInformationPer100g?.fatPer100g)}
          ${rowPair('of which Saturates', 'منها مشبعة', en?.nutritionalInformationPer100g?.saturatesPer100g, ar?.nutritionalInformationPer100g?.saturatesPer100g)}
          ${rowPair('Carbohydrate', 'الكربوهيدرات', en?.nutritionalInformationPer100g?.carbohydratePer100g, ar?.nutritionalInformationPer100g?.carbohydratePer100g)}
          ${rowPair('of which Sugars', 'منها سكريات', en?.nutritionalInformationPer100g?.sugarsPer100g, ar?.nutritionalInformationPer100g?.sugarsPer100g)}
          ${rowPair('Protein', 'البروتين', en?.nutritionalInformationPer100g?.proteinPer100g, ar?.nutritionalInformationPer100g?.proteinPer100g)}
          ${rowPair('Salt', 'الملح', en?.nutritionalInformationPer100g?.saltPer100g, ar?.nutritionalInformationPer100g?.saltPer100g)}
        </tbody>
      </table>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div>Storage: ${esc(en.storageInformation || '')}</div>
      <div>التخزين: ${esc(ar.storageInformation || '')}</div>
    </div>

    <div class="section">
      <div>Production Date: ____/____/______</div>
      <div>تاريخ الإنتاج: ______/____/____</div>
    </div>

    <div class="section">
      <div>Best Before / Expiry Date: ____/____/______</div>
      <div>يفضل استهلاكه قبل / تاريخ الانتهاء: ______/____/____</div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div><strong>Manufacturer / الشركة المصنعة:</strong></div>
      <div>${esc(en?.manufacturer?.name || '')}${en?.manufacturer?.location ? ', ' + esc(en?.manufacturer?.location) : ''}${en?.manufacturer?.country ? ', ' + esc(en?.manufacturer?.country) : ''}</div>
      <div>${esc(ar?.manufacturer?.name || '')}${ar?.manufacturer?.location ? '، ' + esc(ar?.manufacturer?.location) : ''}${ar?.manufacturer?.country ? '، ' + esc(ar?.manufacturer?.country) : ''}</div>
      <div>${esc(en?.manufacturer?.additionalInfo || '')}</div>
    </div>

    <div class="section">
      <div><strong>Importer / المستورد:</strong></div>
      <div>[Importer Name & Address, Saudi Arabia]</div>
      <div>[اسم المستورد وعنوانه، المملكة العربية السعودية]</div>
    </div>

    <div class="section">
      <div>Net Weight / الوزن الصافي: ${esc(en?.weightInformation?.netWeight || '')} e / ${esc(ar?.weightInformation?.netWeight || '')}</div>
    </div>

    <div class="section">
      <div>Barcode / الرمز الشريطي: ${esc(en?.barcode || '')}</div>
    </div>
  </body>
</html>`

      const w = window.open('', '_blank')
      if (!w) return alert('Popup blocked. Please allow popups to print the label.')
      w.document.open()
      w.document.write(html)
      w.document.close()
      w.focus()
      // Delay to ensure styles apply before print
      setTimeout(() => { try { w.print() } catch {} }, 200)
    } catch (e) {
      console.error('print label error', e)
      alert('Failed to build printable label')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <SetupBanner />

      {/* Tabs */}
      <div id="tab-bar" className="flex-shrink-0 bg-gray-100 pl-6 border-b border-gray-200 flex items-center">
        {/* Tab items container */}
        <div id="tab-container" className="relative flex-grow overflow-x-auto -mb-px tab-container">
          <div className="flex items-center whitespace-nowrap pr-2">
            {schemas.map((s) => {
              const isActive = s.id === activeSchemaId
              return (
                <button
                  key={s.id}
                  type="button"
                  className={cn(
                    'group relative inline-flex items-center max-w-xs mr-1 px-3 py-2 text-sm rounded-t-md border-b-2',
                    isActive
                      ? 'bg-white text-indigo-600 border-indigo-500'
                      : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-200',
                  )}
                  onClick={() => {
                    setActiveSchemaId(s.id)
                    setSelectedColumn(null)
                    setIsColumnDialogOpen(false)
                  }}
                  title={s.name}
                >
                  <span className="truncate max-w-[10rem] pr-1">{s.name}</span>
                  <span
                    className={cn(
                      'ml-1 opacity-0 group-hover:opacity-100 transition-opacity',
                      isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700',
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      closeSchema(s.id)
                    }}
                    aria-label="Close schema tab"
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                </button>
              )
            })}
            {/* Add New Tab Button: sits after last tab; sticks to right on overflow */}
            <button
              onClick={() => addSchema()}
              className="ml-2 p-2 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 sticky right-0 bg-gray-100"
              title="New schema"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 min-w-0">

        {/* Sidebar disabled on all screen sizes */}

          {/* Main Content - Excel-style Table */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Sidebar toggle removed (sidebar disabled) */}
                  {!editingSchemaName ? (
                    <button
                      type="button"
                      className="text-2xl font-bold text-foreground hover:underline text-left"
                      onClick={() => {
                        setSchemaNameInput(activeSchema.name || 'Data Extraction Schema')
                        setEditingSchemaName(true)
                      }}
                      title="Click to rename schema"
                    >
                      {activeSchema.name || 'Data Extraction Schema'}
                    </button>
                  ) : (
                    <input
                      value={schemaNameInput}
                      onChange={(e) => setSchemaNameInput(e.target.value)}
                      autoFocus
                      onBlur={() => {
                        const next = (schemaNameInput || 'Data Extraction Schema').trim()
                        setSchemas((prev) => prev.map((s) => s.id === activeSchemaId ? { ...s, name: next } : s))
                        setEditingSchemaName(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const next = (schemaNameInput || 'Data Extraction Schema').trim()
                          setSchemas((prev) => prev.map((s) => s.id === activeSchemaId ? { ...s, name: next } : s))
                          setEditingSchemaName(false)
                        } else if (e.key === 'Escape') {
                          setEditingSchemaName(false)
                          setSchemaNameInput(activeSchema.name)
                        }
                      }}
                      className="text-2xl font-bold text-foreground bg-transparent border-b border-border focus:outline-none focus:border-ring px-1"
                    />
                  )}
                </div>
              <div className="flex items-center gap-2">
                {/* Agent type selector */}
                {isSchemaFresh(activeSchema) && (
                  <Select value={selectedAgent} onValueChange={(val) => setSelectedAgent(val as AgentType)}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Extraction</SelectItem>
                      <SelectItem value="pharma">Pharma E-Commerce Content Generation</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {/* Schema template selector in header when schema fresh and standard agent */}
                {isSchemaFresh(activeSchema) && selectedAgent === "standard" && (
                  <Select onValueChange={(val) => applySchemaTemplate(val)}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {NESTED_TEMPLATES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {/* Export / Print: show Export always (non-F&B), Print gated on completion (F&B) */}
                {activeSchema.templateId === 'fnb-label-compliance' ? (
                  jobs.some((j) => j.status === 'completed') ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={printLocalizedLabel}
                      title="Print Localized Label"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Print Localized Label
                    </Button>
                  ) : null
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportToCSV()}
                    title="Export to CSV"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                )}
                {/* Group Fields button */}
                {selectedColumnIds.size >= 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openGroupDialog}
                    title="Group selected fields into an object"
                  >
                    <Layers className="h-4 w-4 mr-1" />
                    Group Fields ({selectedColumnIds.size})
                  </Button>
                )}
                {/* Add Field button moved to grid area as a floating + */}
                {/* Upload button moved to header */}
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fields.length === 0 && activeSchema.templateId !== 'fnb-label-compliance' && selectedAgent !== 'pharma'}
                  title="Upload Documents"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              </div>
            {fields.length === 0 && selectedAgent !== 'pharma' && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Start by defining your data extraction schema. Add columns for each piece of information you want to
                  extract from your documents.
                </p>
              </div>
            )}
            {fields.length === 0 && selectedAgent === 'pharma' && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Upload a pharmaceutical product image or document to extract drug information and match it with the Saudi FDA database.
                </p>
              </div>
            )}
          </div>
          {/* Main Body */}
          <div className="flex-1 overflow-auto min-h-0 min-w-0 relative">
            {(() => {
              // Determine display mode based on job agent types or selected agent
              const selectedJob = sortedJobs.find((j) => j.id === selectedRowId) || sortedJobs[sortedJobs.length - 1]
              const displayMode = selectedJob?.agentType || selectedAgent
              return displayMode
            })() === 'pharma' ? (
              <div className="p-4 space-y-4">
                {/* Simple job selector */}
                {sortedJobs.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Jobs:</span>
                    {sortedJobs.map((job, idx) => (
                      <button
                        key={job.id}
                        onClick={() => setSelectedRowId(job.id)}
                        className={`px-2 py-1 rounded border text-xs ${selectedRowId === job.id ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'}`}
                      >
                        {idx + 1}. {job.fileName}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected job panels */}
                {(() => {
                  const job = sortedJobs.find((j) => j.id === selectedRowId) || sortedJobs[sortedJobs.length - 1]
                  if (!job) return (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No results yet. Upload a drug label image or document to get started.</p>
                    </div>
                  )
                  const pharmaData = job.results?.pharma_data
                  const drugInfo = pharmaData?.drugInfo
                  const detailedInfo = pharmaData?.detailedInfo
                  const matchedDrugUrl = pharmaData?.matchedDrugUrl
                  const searchUrl = pharmaData?.searchUrl
                  
                  const KV = (label: string, value: any) => (
                    value != null && value !== '' && value !== undefined ? (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground font-medium">{label}:</span>
                        <span className="text-right break-words">{String(value)}</span>
                      </div>
                    ) : null
                  )
                  
                  const Section = (title: string, content: any) => (
                    content != null && content !== '' && content !== undefined ? (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-foreground">{title}</div>
                        <div className="text-sm whitespace-pre-wrap">{String(content)}</div>
                      </div>
                    ) : null
                  )
                  
                  return (
                    <div className="space-y-4">
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Drug Information Extracted from File</h3>
                            {getStatusIcon(job.status)}
                          </div>
                          {!drugInfo ? (
                            <div className="text-sm text-muted-foreground">No drug information extracted</div>
                          ) : (
                            <div className="space-y-2">
                              {KV('Drug Name', drugInfo?.drugName)}
                              {KV('Generic Name', drugInfo?.genericName)}
                              {KV('Manufacturer', drugInfo?.manufacturer)}
                              {KV('Active Ingredients', drugInfo?.activeIngredients)}
                              {KV('Dosage', drugInfo?.dosage)}
                              {KV('Dosage Form', drugInfo?.dosageForm)}
                              {KV('Pack Size', drugInfo?.packSize)}
                              {KV('Batch Number', drugInfo?.batchNumber)}
                              {KV('Expiry Date', drugInfo?.expiryDate)}
                              {KV('Other Identifiers', drugInfo?.otherIdentifiers)}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {searchUrl && (
                        <Card>
                          <CardContent className="p-4 space-y-2">
                            <h3 className="font-semibold text-lg">Saudi FDA Database Search</h3>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Search Query: </span>
                              <span className="font-medium">{pharmaData?.searchQuery || 'N/A'}</span>
                            </div>
                            <a 
                              href={searchUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              View Search Results
                              <Globe className="h-3 w-3" />
                            </a>
                          </CardContent>
                        </Card>
                      )}

                      {matchedDrugUrl && (
                        <Card>
                          <CardContent className="p-4 space-y-2">
                            <h3 className="font-semibold text-lg">Matched Drug</h3>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Drug ID: </span>
                              <span className="font-medium">{pharmaData?.matchedDrugId || 'N/A'}</span>
                            </div>
                            <a 
                              href={matchedDrugUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              View Drug Details on Saudi FDA
                              <Globe className="h-3 w-3" />
                            </a>
                          </CardContent>
                        </Card>
                      )}

                      {detailedInfo && (
                        <Card>
                          <CardContent className="p-4 space-y-4">
                            <h3 className="font-semibold text-lg">Detailed Drug Information</h3>
                            <Accordion type="multiple" className="w-full">
                              {[
                                { key: 'description', label: 'Description', value: detailedInfo?.description },
                                { key: 'composition', label: 'Composition', value: detailedInfo?.composition },
                                { key: 'howToUse', label: 'How To Use', value: detailedInfo?.howToUse },
                                { key: 'indication', label: 'Indication', value: detailedInfo?.indication },
                                { key: 'possibleSideEffects', label: 'Possible Side Effects', value: detailedInfo?.possibleSideEffects },
                                { key: 'properties', label: 'Properties', value: detailedInfo?.properties },
                                { key: 'storage', label: 'Storage', value: detailedInfo?.storage },
                              ].map(section => {
                                if (!section.value || section.value === null) return null
                                
                                const isEditing = pharmaEditingSection === section.key
                                const currentValue = pharmaEditedValues[section.key] ?? section.value
                                
                                const handleSave = () => {
                                  // Update the job results with the edited value
                                  const updatedJobs = jobs.map(j => {
                                    if (j.id === job.id && j.results) {
                                      return {
                                        ...j,
                                        results: {
                                          ...j.results,
                                          pharma_data: {
                                            ...j.results.pharma_data,
                                            detailedInfo: {
                                              ...j.results.pharma_data?.detailedInfo,
                                              [section.key]: currentValue
                                            }
                                          }
                                        }
                                      }
                                    }
                                    return j
                                  })
                                  setJobs(updatedJobs)
                                  setPharmaEditingSection(null)
                                }
                                
                                const handleEdit = () => {
                                  setPharmaEditedValues({ ...pharmaEditedValues, [section.key]: section.value })
                                  setPharmaEditingSection(section.key)
                                }
                                
                                const handleCancel = () => {
                                  setPharmaEditingSection(null)
                                  const newValues = { ...pharmaEditedValues }
                                  delete newValues[section.key]
                                  setPharmaEditedValues(newValues)
                                }
                                
                                return (
                                  <AccordionItem key={section.key} value={section.key}>
                                    <AccordionTrigger className="text-left hover:no-underline">
                                      <div className="flex items-center justify-between w-full pr-4">
                                        <span className="font-semibold">{section.label}</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="space-y-2 pt-2">
                                        {isEditing ? (
                                          <div className="space-y-2">
                                            <Textarea
                                              value={currentValue}
                                              onChange={(e) => setPharmaEditedValues({ ...pharmaEditedValues, [section.key]: e.target.value })}
                                              className="min-h-[200px] font-normal"
                                            />
                                            <div className="flex gap-2">
                                              <Button size="sm" onClick={handleSave}>
                                                <Save className="h-3 w-3 mr-1" />
                                                Save
                                              </Button>
                                              <Button size="sm" variant="outline" onClick={handleCancel}>
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <div className="text-sm whitespace-pre-wrap">{currentValue}</div>
                                            <Button size="sm" variant="outline" onClick={handleEdit}>
                                              <Edit className="h-3 w-3 mr-1" />
                                              Edit
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                )
                              })}
                            </Accordion>
                          </CardContent>
                        </Card>
                      )}

                      {pharmaData?.message && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">{pharmaData.message}</div>
                          </CardContent>
                        </Card>
                      )}

                      {job.status === 'error' && (
                        <Card className="border-destructive">
                          <CardContent className="p-4 space-y-2">
                            <div className="font-semibold text-destructive">Error</div>
                            <div className="text-sm text-destructive">
                              {pharmaData?.error || 'An error occurred during drug information extraction. Please try again with a clearer image or document.'}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {job.status === 'processing' && !pharmaData && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground animate-pulse">
                              Processing drug information extraction and Saudi FDA database search...
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )
                })()}
              </div>
            ) : activeSchema.templateId === 'fnb-label-compliance' ? (
              <div className="p-4 space-y-4">
                {/* Simple job selector */}
                {sortedJobs.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Jobs:</span>
                    {sortedJobs.map((job, idx) => (
                      <button
                        key={job.id}
                        onClick={() => setSelectedRowId(job.id)}
                        className={`px-2 py-1 rounded border text-xs ${selectedRowId === job.id ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'}`}
                      >
                        {idx + 1}. {job.fileName}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected job panels */}
                {(() => {
                  const job = sortedJobs.find((j) => j.id === selectedRowId) || sortedJobs[sortedJobs.length - 1]
                  if (!job) return (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No results yet. Upload a label image to get started.</p>
                    </div>
                  )
                  const extraction = job.results?.fnb_extraction?.product_initial_language || job.results?.fnb_extraction
                  const translation = job.results?.fnb_translation
                  const collapseState = fnbCollapse[job.id] || { en: false, ar: false }
                  const toggleEN = () => setFnbCollapse((prev) => ({ ...prev, [job.id]: { ...collapseState, en: !collapseState.en } }))
                  const toggleAR = () => setFnbCollapse((prev) => ({ ...prev, [job.id]: { ...collapseState, ar: !collapseState.ar } }))
                  const KV = (label: string, value: any) => (
                    value != null && value !== '' && value !== undefined ? (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-right break-words">{String(value)}</span>
                      </div>
                    ) : null
                  )
                  const List = (label: string, arr: any[]) => (
                    Array.isArray(arr) && arr.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">{label}</div>
                        <ul className="list-disc pl-5 text-sm space-y-0.5">
                          {arr.map((it, i) => (
                            <li key={i}>{String(it)}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  )
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Extraction Result (Primary Language)</h3>
                            {getStatusIcon(job.status)}
                          </div>
                          {!extraction ? (
                            <div className="text-sm text-muted-foreground">No extraction data</div>
                          ) : (
                            <div className="space-y-3">
                              {KV('Barcode', extraction?.barcode)}
                              {KV('Product Name', extraction?.productName)}
                              <div className="space-y-1">
                                <div className="text-sm font-medium">Manufacturer</div>
                                <div className="space-y-1 rounded border p-2">
                                  {KV('Name', extraction?.manufacturer?.name)}
                                  {KV('Location', extraction?.manufacturer?.location)}
                                  {KV('Additional Info', extraction?.manufacturer?.additionalInfo)}
                                  {KV('Country', extraction?.manufacturer?.country)}
                                </div>
                              </div>
                              {KV('Product Description', extraction?.productDescription)}
                              {List('Ingredients', extraction?.ingredients)}
                              <div className="space-y-1">
                                <div className="text-sm font-medium">Serving Size Information</div>
                                <div className="space-y-1 rounded border p-2">
                                  {KV('Serving Size', extraction?.servingSizeInformation?.servingSize)}
                                  {KV('Unit', extraction?.servingSizeInformation?.servingSizeUnit)}
                                  {KV('Servings / Container', extraction?.servingSizeInformation?.servingsPerContainer)}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-sm font-medium">Nutritional Information (per 100g)</div>
                                <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                                  {KV('Energy (kJ)', extraction?.nutritionalInformationPer100g?.energyPer100g?.kj)}
                                  {KV('Energy (kcal)', extraction?.nutritionalInformationPer100g?.energyPer100g?.kcal)}
                                  {KV('Fat', extraction?.nutritionalInformationPer100g?.fatPer100g)}
                                  {KV('Saturates', extraction?.nutritionalInformationPer100g?.saturatesPer100g)}
                                  {KV('Carbohydrate', extraction?.nutritionalInformationPer100g?.carbohydratePer100g)}
                                  {KV('Sugars', extraction?.nutritionalInformationPer100g?.sugarsPer100g)}
                                  {KV('Fibre', extraction?.nutritionalInformationPer100g?.fiberPer100g)}
                                  {KV('Protein', extraction?.nutritionalInformationPer100g?.proteinPer100g)}
                                  {KV('Salt', extraction?.nutritionalInformationPer100g?.saltPer100g)}
                                  {KV('Sodium', extraction?.nutritionalInformationPer100g?.sodiumPer100g)}
                                  {KV('Cholesterol', extraction?.nutritionalInformationPer100g?.cholesterolPer100g)}
                                  {KV('Trans Fat', extraction?.nutritionalInformationPer100g?.transFatPer100g)}
                                  {KV('Added Sugar', extraction?.nutritionalInformationPer100g?.includesAddedSugarPer100g)}
                                </div>
                              </div>
                              {KV('Storage Information', extraction?.storageInformation)}
                              {KV('Usage Information', extraction?.usageInformation)}
                              {List('Allergy Information', extraction?.allergyInformation)}
                              <div className="space-y-1">
                                <div className="text-sm font-medium">Weight Information</div>
                                <div className="space-y-1 rounded border p-2">
                                  {KV('Net Weight', extraction?.weightInformation?.netWeight)}
                                  {KV('Packaging Weight', extraction?.weightInformation?.packagingWeight)}
                                </div>
                              </div>
                              {KV('Product Status', extraction?.productStatus)}
                              {KV('Status Reason', extraction?.productStatusReason)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Translations (EN / AR)</h3>
                            {getStatusIcon(job.status)}
                          </div>
                          {!translation ? (
                            <div className="text-sm text-muted-foreground">No translation data</div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {/* English */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">English</div>
                                  <button className="text-xs text-muted-foreground underline" onClick={toggleEN}>
                                    {collapseState.en ? 'Expand' : 'Collapse'}
                                  </button>
                                </div>
                                {!collapseState.en && (
                                <div className="space-y-2 rounded border p-2">
                                  {KV('Barcode', translation?.english_product_info?.barcode)}
                                  {KV('Product Name', translation?.english_product_info?.productName)}
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Manufacturer</div>
                                    <div className="space-y-1 rounded border p-2">
                                      {KV('Name', translation?.english_product_info?.manufacturer?.name)}
                                      {KV('Location', translation?.english_product_info?.manufacturer?.location)}
                                      {KV('Additional Info', translation?.english_product_info?.manufacturer?.additionalInfo)}
                                      {KV('Country', translation?.english_product_info?.manufacturer?.country)}
                                    </div>
                                  </div>
                                  {KV('Product Description', translation?.english_product_info?.productDescription)}
                                  {List('Ingredients', translation?.english_product_info?.ingredients)}
                                  <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                                    {KV('Energy (kJ)', translation?.english_product_info?.nutritionalInformationPer100g?.energyPer100g?.kj)}
                                    {KV('Energy (kcal)', translation?.english_product_info?.nutritionalInformationPer100g?.energyPer100g?.kcal)}
                                    {KV('Fat', translation?.english_product_info?.nutritionalInformationPer100g?.fatPer100g)}
                                    {KV('Saturates', translation?.english_product_info?.nutritionalInformationPer100g?.saturatesPer100g)}
                                    {KV('Carbohydrate', translation?.english_product_info?.nutritionalInformationPer100g?.carbohydratePer100g)}
                                    {KV('Sugars', translation?.english_product_info?.nutritionalInformationPer100g?.sugarsPer100g)}
                                    {KV('Fibre', translation?.english_product_info?.nutritionalInformationPer100g?.fiberPer100g)}
                                    {KV('Protein', translation?.english_product_info?.nutritionalInformationPer100g?.proteinPer100g)}
                                    {KV('Salt', translation?.english_product_info?.nutritionalInformationPer100g?.saltPer100g)}
                                  </div>
                                  {KV('Storage Information', translation?.english_product_info?.storageInformation)}
                                  {KV('Usage Information', translation?.english_product_info?.usageInformation)}
                                  {List('Allergy Information', translation?.english_product_info?.allergyInformation)}
                                  <div className="space-y-1 rounded border p-2">
                                    {KV('Net Weight', translation?.english_product_info?.weightInformation?.netWeight)}
                                    {KV('Packaging Weight', translation?.english_product_info?.weightInformation?.packagingWeight)}
                                  </div>
                                </div>
                                )}
                              </div>
                              {/* Arabic */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">Arabic</div>
                                  <button className="text-xs text-muted-foreground underline" onClick={toggleAR}>
                                    {collapseState.ar ? 'Expand' : 'Collapse'}
                                  </button>
                                </div>
                                {!collapseState.ar && (
                                <div className="space-y-2 rounded border p-2">
                                  {KV('Barcode', translation?.arabic_product_info?.barcode)}
                                  {KV('Product Name', translation?.arabic_product_info?.productName)}
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Manufacturer</div>
                                    <div className="space-y-1 rounded border p-2">
                                      {KV('Name', translation?.arabic_product_info?.manufacturer?.name)}
                                      {KV('Location', translation?.arabic_product_info?.manufacturer?.location)}
                                      {KV('Additional Info', translation?.arabic_product_info?.manufacturer?.additionalInfo)}
                                      {KV('Country', translation?.arabic_product_info?.manufacturer?.country)}
                                    </div>
                                  </div>
                                  {KV('Product Description', translation?.arabic_product_info?.productDescription)}
                                  {List('Ingredients', translation?.arabic_product_info?.ingredients)}
                                  <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                                    {KV('Energy (kJ)', translation?.arabic_product_info?.nutritionalInformationPer100g?.energyPer100g?.kj)}
                                    {KV('Energy (kcal)', translation?.arabic_product_info?.nutritionalInformationPer100g?.energyPer100g?.kcal)}
                                    {KV('Fat', translation?.arabic_product_info?.nutritionalInformationPer100g?.fatPer100g)}
                                    {KV('Saturates', translation?.arabic_product_info?.nutritionalInformationPer100g?.saturatesPer100g)}
                                    {KV('Carbohydrate', translation?.arabic_product_info?.nutritionalInformationPer100g?.carbohydratePer100g)}
                                    {KV('Sugars', translation?.arabic_product_info?.nutritionalInformationPer100g?.sugarsPer100g)}
                                    {KV('Fibre', translation?.arabic_product_info?.nutritionalInformationPer100g?.fiberPer100g)}
                                    {KV('Protein', translation?.arabic_product_info?.nutritionalInformationPer100g?.proteinPer100g)}
                                    {KV('Salt', translation?.arabic_product_info?.nutritionalInformationPer100g?.saltPer100g)}
                                  </div>
                                  {KV('Storage Information', translation?.arabic_product_info?.storageInformation)}
                                  {KV('Usage Information', translation?.arabic_product_info?.usageInformation)}
                                  {List('Allergy Information', translation?.arabic_product_info?.allergyInformation)}
                                  <div className="space-y-1 rounded border p-2">
                                    {KV('Net Weight', translation?.arabic_product_info?.weightInformation?.netWeight)}
                                    {KV('Packaging Weight', translation?.arabic_product_info?.weightInformation?.packagingWeight)}
                                  </div>
                                </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="p-4 h-full">
                <AgGridSheet
                  columns={displayColumns}
                  jobs={sortedJobs}
                  selectedRowId={selectedRowId}
                  onSelectRow={(jobId) => setSelectedRowId(jobId)}
                  onAddColumn={() => addColumn()}
                  renderCellValue={renderCellValue}
                  getStatusIcon={getStatusIcon}
                  renderStatusPill={renderStatusPill}
                  onUpdateCell={(jobId, columnId, value) => {
                    setJobs((prev) =>
                      prev.map((job) =>
                        job.id === jobId
                          ? { ...job, results: { ...(job.results || {}), [columnId]: value } }
                          : job,
                      ),
                    )
                  }}
                  onEditColumn={(column) => {
                    setSelectedColumn(column)
                    setDraftColumn(JSON.parse(JSON.stringify(column)))
                    setColumnDialogMode('edit')
                    setIsColumnDialogOpen(true)
                  }}
                  onDeleteColumn={deleteColumn}
                  onColumnRightClick={handleColumnRightClick}
                  visualGroups={activeSchema.visualGroups || []}
                />
              </div>
            )}
          </div>
      </div>

      {/* Column Configuration Modal (hidden for F&B fixed mode) */}
      {activeSchema.templateId !== 'fnb-label-compliance' && (
        <Dialog
          open={isColumnDialogOpen}
          onOpenChange={(open) => {
            setIsColumnDialogOpen(open)
            if (!open) {
              setDraftColumn(null)
              setColumnDialogMode('create')
            }
          }}
        >
          <DialogContent className="max-w-xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
            <DialogHeader className="border-b border-slate-200/70 px-6 py-5">
              <DialogTitle className="text-xl font-semibold">
                {columnDialogMode === 'edit' ? 'Edit Field' : 'Add New Field'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Configure how this data point is extracted and structured for your grid.
              </DialogDescription>
            </DialogHeader>

            {draftColumn && (
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 min-h-0">
                <section className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Field Source</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'flex h-auto flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left shadow-none transition-all',
                        !isDraftTransformation
                          ? 'border-[#2782ff]/70 bg-[#e6f0ff]/70 text-[#2782ff] hover:bg-[#d9e9ff]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                      )}
                      aria-pressed={!isDraftTransformation}
                      onClick={() => handleDraftFieldTypeChange(false)}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <FileText className="h-4 w-4" />
                        Extraction
                      </span>
                      <span className="text-xs text-slate-500">Extract directly from the document</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'flex h-auto flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left shadow-none transition-all',
                        isDraftTransformation
                          ? 'border-[#2782ff]/70 bg-[#e6f0ff]/70 text-[#2782ff] hover:bg-[#d9e9ff]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                      )}
                      aria-pressed={isDraftTransformation}
                      onClick={() => handleDraftFieldTypeChange(true)}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Zap className="h-4 w-4" />
                        Transformation
                      </span>
                      <span className="text-xs text-slate-500">Compute value from other fields</span>
                    </Button>
                  </div>
                </section>

                <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-5 shadow-sm">
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="column-name">Field Name</Label>
                      <Input
                        id="column-name"
                        value={draftColumn.name}
                        onChange={(event) => setDraftColumn({ ...draftColumn, name: event.target.value })}
                        placeholder="e.g., Manufacturer"
                      />
                    </div>
                    {/* Description has been merged with Extraction Guidance below */}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="column-type">Data Type</Label>
                      <Select value={draftColumn.type} onValueChange={(value: DataType) => changeDraftType(value)}>
                        <SelectTrigger id="column-type">
                          <SelectValue placeholder="Select a data type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Simple Types</SelectLabel>
                            {simpleDataTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Structured Types</SelectLabel>
                            {complexDataTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    {renderStructuredConfig()}

                    <div className="flex items-center gap-3 pt-1">
                      <Checkbox
                        id="column-required"
                        checked={!!draftColumn.required}
                        onCheckedChange={(checked) => setDraftColumn({ ...draftColumn, required: checked === true })}
                      />
                      <Label htmlFor="column-required" className="text-sm font-medium text-slate-600">
                        Required field
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-5 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-700">Field Guidance</h3>
                    <p className="text-xs text-slate-500">Describe this field and how to extract it. This text helps teammates and the AI.</p>
                  </div>
                  {isDraftTransformation ? (
                    <TransformBuilder
                      allColumns={displayColumns}
                      selected={draftColumn}
                      onUpdate={(updates) => setDraftColumn({ ...draftColumn, ...updates })}
                      visualGroups={activeSchema.visualGroups}
                    />
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="field-guidance">Field Guidance</Label>
                      <Textarea
                        id="field-guidance"
                        value={draftColumn.extractionInstructions || draftColumn.description || ''}
                        onChange={(event) => setDraftColumn({ ...draftColumn, description: event.target.value, extractionInstructions: event.target.value })}
                        placeholder="Explain what this field is and how to extract it from the document."
                        rows={5}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-slate-200/70 bg-white/95 px-6 py-4">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsColumnDialogOpen(false)
                    setDraftColumn(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!selectedColumn || !draftColumn) return
                    const updates: Partial<SchemaField> = {
                      name: draftColumn.name,
                      type: draftColumn.type,
                      description: draftColumn.description,
                      required: !!draftColumn.required,
                      extractionInstructions: draftColumn.extractionInstructions,
                      // constraints removed from tool logic
                      isTransformation: !!draftColumn.isTransformation,
                      transformationType: draftColumn.transformationType,
                      transformationConfig: draftColumn.transformationConfig,
                      transformationSource: draftColumn.transformationSource,
                      transformationSourceColumnId: draftColumn.transformationSourceColumnId,
                    }
                    if (draftColumn.type === 'object') {
                      (updates as any).children = (draftColumn as ObjectField).children
                    }
                    if (draftColumn.type === 'table') {
                      (updates as any).columns = (draftColumn as TableField).columns
                    }
                    if (draftColumn.type === 'list') {
                      (updates as any).item = (draftColumn as ListField).item
                    }
                    updateColumn(selectedColumn.id, updates)
                    setIsColumnDialogOpen(false)
                    setDraftColumn(null)
                  }}
                >
                  Save Field
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Advanced Automation ROI Modal */}
      <Dialog open={roiOpen} onOpenChange={onCloseRoi}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {roiStage === 'calc'
                ? 'You just processed 1 document. What if you could automate the next 5 steps?'
                : 'Your estimated savings'}
            </DialogTitle>
            <DialogDescription>
              {roiStage === 'calc'
                ? 'Estimate how much time and money full workflow automation could save each month.'
                : 'These savings are based on the numbers you entered in the calculator.'}
            </DialogDescription>
          </DialogHeader>

          {roiStage === 'calc' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Simple data extraction is just the start. The real power of Bytebeam is in automating the entire, multi‑step process that follows—turning raw documents into decisions, actions, and results.
              </p>
              <p className="text-sm">Imagine a workflow that can:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li><span className="mr-1">✅</span><strong>Extract & Validate:</strong> Pull invoice data, then automatically validate it against purchase orders in your database and flag discrepancies.</li>
                <li><span className="mr-1">✅</span><strong>Analyze & Flag:</strong> Read a 50‑page legal contract, identify all non‑compliant clauses based on your custom rules, and generate a summary report.</li>
                <li><span className="mr-1">✅</span><strong>Route & Decide:</strong> Process an incoming trade compliance form, determine the correct regional office based on its contents, and forward it with a recommended action.</li>
              </ul>

              <div className="rounded-md border p-3" id="roi-calculator">
                <h3 className="font-medium">Find out the real cost of your <em>entire</em> manual workflow.</h3>
                <p className="text-sm text-muted-foreground">Enter your estimates below to see your potential savings.</p>
                <div className="mt-3 grid gap-3">
                  <div>
                    <Label>1. Documents processed per month</Label>
                    <Input type="number" placeholder="e.g., 500" value={docsPerMonth} onChange={(e) => setDocsPerMonth(e.target.value)} />
                  </div>
                  <div>
                    <Label>2. Average time for the <em>full process</em> (in minutes)</Label>
                    <Input type="number" placeholder="e.g., 15" value={timePerDoc} onChange={(e) => setTimePerDoc(e.target.value)} />
                    <p className="text-[11px] text-muted-foreground">Note: Include all steps, not just data entry.</p>
                  </div>
                  <div>
                    <Label>3. (Optional) Average hourly team cost ($)</Label>
                    <Input type="number" placeholder="e.g., 35" value={hourlyCost} onChange={(e) => setHourlyCost(e.target.value)} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button id="calculate-btn" onClick={calculateSavings}>Calculate My Savings 📈</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3" id="roi-results">
              <h2 className="text-lg">You could save an estimated <strong>{totalHoursSaved} hours</strong> every month.</h2>
              {monthlyDollarSavings != null && annualDollarSavings != null && (
                <h3 className="text-base">That's around <strong>${monthlyDollarSavings.toLocaleString()}</strong> per month, or <strong>${annualDollarSavings.toLocaleString()}</strong> back in your budget every year.</h3>
              )}
              <p className="text-sm text-muted-foreground">Ready to claim that time back? Let's have a quick chat to map out the exact automation strategy to get you there.</p>
              <div className="flex items-center gap-3">
                <Button asChild>
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="cta-button">Book a 15‑min Strategy Call</a>
                </Button>
                <small className="text-muted-foreground"><em>Your schedule is open to map this out</em></small>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Table Modal */}
      <Dialog open={tableModalOpen} onOpenChange={setTableModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Table: {tableModalData?.column.name}
            </DialogTitle>
            <DialogDescription>
              Inspect the parsed rows for this table field. Scroll to review every value.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            {tableModalData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{tableModalData.rows.length} {tableModalData.rows.length === 1 ? 'row' : 'rows'}</span>
                  <span>{tableModalData.columnHeaders.length} columns</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                        {tableModalData.columnHeaders.map((header) => (
                          <th key={header.key} className="bg-slate-50 px-3 py-2 text-left font-medium first:rounded-l-md last:rounded-r-md border">
                            {header.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableModalData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          {tableModalData.columnHeaders.map((header) => {
                            const cell = row?.[header.key as keyof typeof row]
                            const formatted =
                              typeof cell === 'number'
                                ? formatNumericValue(cell) ?? String(cell)
                                : typeof cell === 'boolean'
                                  ? cell ? 'True' : 'False'
                                  : typeof cell === 'object'
                                    ? JSON.stringify(cell)
                                    : cell ?? '—'
                            return (
                              <td key={header.key} className="px-3 py-2 text-left text-sm first:rounded-l-md last:rounded-r-md border">
                                <span className="block" title={String(formatted)}>
                                  {String(formatted)}
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Column Right-Click Context Menu */}
      {contextMenuPosition && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeContextMenu}
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]"
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
            }}
          >
            <button
              onClick={startGroupingFromContext}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              Create Object
            </button>
          </div>
        </>
      )}

      {/* Group Fields Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={(open) => {
        setIsGroupDialogOpen(open)
        if (!open) {
          setSelectedColumnIds(new Set())
          setGroupName('')
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Group Fields into Object</DialogTitle>
            <DialogDescription>
              Select the fields to group together, then provide a name for the object.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border p-3 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium mb-3">Select fields to group:</p>
              <div className="space-y-2">
                {fields.map((field) => (
                  <label key={field.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded">
                    <Checkbox
                      checked={selectedColumnIds.has(field.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedColumnIds(prev => new Set([...prev, field.id]))
                        } else {
                          setSelectedColumnIds(prev => {
                            const newSet = new Set(prev)
                            newSet.delete(field.id)
                            return newSet
                          })
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{field.name}</div>
                      {field.type !== 'string' && (
                        <div className="text-xs text-muted-foreground capitalize">{field.type}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {selectedColumnIds.size >= 2 && (
              <div>
                <Label htmlFor="group-name">Object Name *</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Invoice Details, Customer Info"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && groupName.trim() && selectedColumnIds.size >= 2) {
                      createGroupedObject()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedColumnIds.size} fields selected
                </p>
              </div>
            )}
            
            {selectedColumnIds.size < 2 && (
              <p className="text-sm text-muted-foreground">
                Select at least 2 fields to create a group.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsGroupDialogOpen(false)
                setSelectedColumnIds(new Set())
                setGroupName('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createGroupedObject}
              disabled={!groupName.trim() || selectedColumnIds.size < 2}
            >
              Create Object
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
