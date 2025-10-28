"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { SetupBanner } from "./setup-banner"
// import { AgGridSheet } from "./ag-grid-sheet"
import { TanStackGridSheet } from "./tanstack-grid/TanStackGridSheet"
import { PrimitiveCell } from "./tanstack-grid/cells/PrimitiveCell"
import { EditableObjectCell } from "./tanstack-grid/cells/EditableObjectCell"
import { ListCell } from "./tanstack-grid/cells/ListCell"
import { SingleSelectCell } from "./tanstack-grid/cells/SingleSelectCell"
import { MultiSelectCell } from "./tanstack-grid/cells/MultiSelectCell"
import { OCRDetailModal } from "@/components/OCRDetailModal"
import { TransformBuilder } from "@/components/transform-builder"
import { cn } from "@/lib/utils"
 
type AgentType = "standard" | "pharma"

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
  type ExtractionResultsMeta,
  type FieldReviewMeta,
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
  computeInitialReviewMeta,
  extractResultsMeta,
  mergeResultsWithMeta,
  sanitizeResultsFromFlat,
  sanitizeResultsFromTree,
} from "@/lib/extraction-results"
 
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
  Loader2,
  Sparkle,
  CheckSquare,
  ListChecks,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Database } from "@/lib/supabase/types"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import { useToast } from "@/components/ui/use-toast"
import type { SchemaTemplateDefinition } from "@/lib/schema-templates"
import { cloneSchemaFields, getStaticSchemaTemplates } from "@/lib/schema-templates"

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
  single_select: CheckSquare,
  multi_select: ListChecks,
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
  { value: 'single_select', label: 'Single Select (Choose one)' },
  { value: 'multi_select', label: 'Multi Select (Choose many)' },
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

type SchemaRow = Database["public"]["Tables"]["schemas"]["Row"]
type ExtractionJobRow = Database["public"]["Tables"]["extraction_jobs"]["Row"]

type SchemaSyncInfo = {
  status: 'idle' | 'saving' | 'error'
  updatedAt?: Date
  error?: string
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value)
}

function createInitialSchemaDefinition(): SchemaDefinition {
  return {
    id: generateUuid(),
    name: "Data Extraction Schema",
    fields: [],
    jobs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function schemaRowToDefinition(row: SchemaRow, jobRows: ExtractionJobRow[]): SchemaDefinition {
  const jobs = jobRows
    .filter((job) => job.schema_id === row.id)
    .map((job) => extractionJobRowToJob(job))

  return {
    id: row.id,
    name: row.name ?? "Data Extraction Schema",
    fields: Array.isArray(row.fields) ? (row.fields as unknown as SchemaField[]) : [],
    jobs,
    templateId: row.template_id ?? undefined,
    visualGroups: Array.isArray(row.visual_groups)
      ? (row.visual_groups as unknown as VisualGroup[])
      : undefined,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }
}

function extractionJobRowToJob(row: ExtractionJobRow): ExtractionJob {
  const raw = (row.results as Record<string, any> | null) ?? undefined
  const { values, meta } = extractResultsMeta(raw)

  return {
    id: row.id,
    fileName: row.file_name,
    status: row.status,
    results: values ?? undefined,
    review: meta?.review ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    agentType: row.agent_type ?? undefined,
    ocrMarkdown: row.ocr_markdown ?? null,
    ocrAnnotatedImageUrl: row.ocr_annotated_image_url ?? null,
    originalFileUrl: row.original_file_url ?? null,
  }
}

function schemaDefinitionToRow(schema: SchemaDefinition, userId: string): SchemaRow {
  return {
    id: schema.id,
    user_id: userId,
    name: schema.name,
    fields: schema.fields as unknown as SchemaRow["fields"],
    template_id: schema.templateId ?? null,
    visual_groups: (schema.visualGroups ?? null) as unknown as SchemaRow["visual_groups"],
    created_at: schema.createdAt ? schema.createdAt.toISOString() : null,
    updated_at: new Date().toISOString(),
  }
}

function extractionJobToRow(job: ExtractionJob, schemaId: string, userId: string): ExtractionJobRow {
  const baseResults = job.results ? { ...job.results } : {}
  let meta: ExtractionResultsMeta | undefined

  if (job.review && Object.keys(job.review).length > 0) {
    const confidenceMap = Object.entries(job.review).reduce<Record<string, number | null>>(
      (acc, [fieldId, info]) => {
        if (info && typeof info.confidence === "number") {
          acc[fieldId] = Math.max(0, Math.min(1, info.confidence))
        } else if (info && info.confidence === null) {
          acc[fieldId] = null
        }
        return acc
      },
      {},
    )

    meta = {
      review: job.review,
    }

    if (Object.keys(confidenceMap).length > 0) {
      meta.confidence = confidenceMap
    }
  }

  const merged = mergeResultsWithMeta(baseResults, meta)
  const serializedResults =
    Object.keys(merged).length === 0 ? null : (merged as ExtractionJobRow["results"])

  return {
    id: job.id,
    schema_id: schemaId,
    user_id: userId,
    file_name: job.fileName,
    status: job.status,
    results: serializedResults,
     ocr_markdown: job.ocrMarkdown ?? null,
     ocr_annotated_image_url: job.ocrAnnotatedImageUrl ?? null,
     original_file_url: job.originalFileUrl ?? null,
    agent_type: job.agentType ?? null,
    created_at: job.createdAt?.toISOString() ?? new Date().toISOString(),
    completed_at: job.completedAt ? job.completedAt.toISOString() : null,
    updated_at: new Date().toISOString(),
  }
}

function sortObject(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sortObject)
  }
  if (value && typeof value === "object") {
    const sortedKeys = Object.keys(value).sort()
    return sortedKeys.reduce<Record<string, any>>((acc, key) => {
      acc[key] = sortObject(value[key])
      return acc
    }, {})
  }
  return value
}

function stableStringify(value: any): string {
  if (value === undefined) return "undefined"
  return JSON.stringify(sortObject(value))
}

function jobsShallowEqual(a: ExtractionJob, b: ExtractionJob): boolean {
  if (a === b) {
    return true
  }

  const createdAtA = a.createdAt ? a.createdAt.getTime() : null
  const createdAtB = b.createdAt ? b.createdAt.getTime() : null
  const completedAtA = a.completedAt ? a.completedAt.getTime() : null
  const completedAtB = b.completedAt ? b.completedAt.getTime() : null

  const resultsA = a.results ?? null
  const resultsB = b.results ?? null
  const resultsEqual = stableStringify(resultsA) === stableStringify(resultsB)
  const reviewA = a.review ?? null
  const reviewB = b.review ?? null
  const reviewEqual = stableStringify(reviewA) === stableStringify(reviewB)

  return (
    a.id === b.id &&
    a.fileName === b.fileName &&
    a.status === b.status &&
    (a.agentType ?? null) === (b.agentType ?? null) &&
    (a.ocrMarkdown ?? null) === (b.ocrMarkdown ?? null) &&
    (a.ocrAnnotatedImageUrl ?? null) === (b.ocrAnnotatedImageUrl ?? null) &&
    (a.originalFileUrl ?? null) === (b.originalFileUrl ?? null) &&
    createdAtA === createdAtB &&
    completedAtA === completedAtB &&
    resultsEqual &&
    reviewEqual
  )
}

function diffJobLists(prevJobs: ExtractionJob[], nextJobs: ExtractionJob[]) {
  const prevMap = new Map(prevJobs.map((job) => [job.id, job]))
  const upsert: ExtractionJob[] = []
  const deleted: string[] = []

  for (const job of nextJobs) {
    const prev = prevMap.get(job.id)
    if (!prev) {
      upsert.push(job)
    } else {
      if (!jobsShallowEqual(prev, job)) {
        upsert.push(job)
      }
      prevMap.delete(job.id)
    }
  }

  prevMap.forEach((_, jobId) => {
    deleted.push(jobId)
  })

  return { upsert, deleted }
}

function upsertJobInList(list: ExtractionJob[], job: ExtractionJob): ExtractionJob[] {
  const index = list.findIndex((existing) => existing.id === job.id)
  if (index === -1) {
    return [...list, job]
  }
  const next = [...list]
  next[index] = job
  return next
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

interface DataExtractionPlatformProps {
  externalActiveSchemaId?: string
  onSchemasChanged?: (schemas: SchemaDefinition[]) => void
  pendingSchemaCreate?: {
    id: string
    name: string
    templateId?: string | null
    agent: AgentType
  } | null
  onPendingCreateConsumed?: () => void
  templateLibrary?: SchemaTemplateDefinition[]
  onCreateTemplate?: (
    schema: SchemaDefinition,
    input: { name: string; description?: string; agent: AgentType },
  ) => Promise<{ success: true; template: SchemaTemplateDefinition } | { success: false; error: string }>
}

export function DataExtractionPlatform({
  externalActiveSchemaId,
  onSchemasChanged,
  pendingSchemaCreate,
  onPendingCreateConsumed,
  templateLibrary,
  onCreateTemplate,
}: DataExtractionPlatformProps = {}) {
  const initialSchemaRef = useRef<SchemaDefinition | null>(null)
  if (!initialSchemaRef.current) {
    initialSchemaRef.current = createInitialSchemaDefinition()
  }
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([initialSchemaRef.current])
  const schemasRef = useRef<SchemaDefinition[]>([initialSchemaRef.current])
  const [activeSchemaId, setActiveSchemaId] = useState<string>(initialSchemaRef.current.id)
  const activeSchema = schemas.find((s) => s.id === activeSchemaId) || initialSchemaRef.current
  const isEmbedded = Boolean(externalActiveSchemaId)
  const [selectedAgent, setSelectedAgent] = useState<AgentType>("standard")
  const fields = activeSchema.fields
  const jobs = activeSchema.jobs
  const displayColumns = useMemo(() => flattenFields(fields), [fields])
  const session = useSession()
  const supabase = useSupabaseClient()
  const { openAuthDialog } = useAuthDialog()
  const { toast } = useToast()
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false)
  const [loadWorkspaceError, setLoadWorkspaceError] = useState<string | null>(null)
  const [schemaSyncState, setSchemaSyncState] = useState<Record<string, SchemaSyncInfo>>({})
  const schemaSyncStateRef = useRef<Record<string, SchemaSyncInfo>>({})
  const lastLoadedUserIdRef = useRef<string | null>(null)
  const guestSchemasRef = useRef<SchemaDefinition[] | null>(null)
  const guestPromptShownRef = useRef(false)
  const [schemaDeletionDialog, setSchemaDeletionDialog] = useState<SchemaDefinition | null>(null)
  const hasInitialLoadCompletedRef = useRef(false)
  const autoAppliedTemplatesRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!externalActiveSchemaId) return
    setActiveSchemaId((current) => {
      if (current === externalActiveSchemaId) return current
      const exists = schemas.some((schema) => schema.id === externalActiveSchemaId)
      return exists ? externalActiveSchemaId : current
    })
  }, [externalActiveSchemaId, schemas])
  useEffect(() => {
    onSchemasChanged?.(schemas)
  }, [schemas, onSchemasChanged])
  useEffect(() => {
    schemasRef.current = schemas
  }, [schemas])
  useEffect(() => {
    schemaSyncStateRef.current = schemaSyncState
  }, [schemaSyncState])
  useEffect(() => {
    if (!isEmbedded) return
    // Only re-run when the templateId actually changes
    const nextAgent = inferAgentTypeFromSchema(activeSchema)
    setSelectedAgent((prev) => {
      // Only update if actually different
      if (prev === nextAgent) return prev
      return nextAgent
    })
  }, [isEmbedded, activeSchema.templateId])
  const applySchemaUpdate = useCallback(
    (schemaId: string, updater: (schema: SchemaDefinition) => SchemaDefinition): SchemaDefinition | null => {
      let updatedSchema: SchemaDefinition | null = null
      setSchemas((prev) =>
        prev.map((schema) => {
          if (schema.id !== schemaId) return schema
          const draft = { ...schema }
          const updated = updater(draft)
          const next = { ...updated, updatedAt: new Date(), createdAt: updated.createdAt ?? schema.createdAt }
          updatedSchema = next
          return next
        }),
      )
      return updatedSchema
    },
    [],
  )
  const hasWorkspaceContent = useMemo(
    () =>
      schemas.some(
        (schema) => (schema.fields?.length ?? 0) > 0 || (schema.jobs?.length ?? 0) > 0,
      ),
    [schemas],
  )
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('Active schema:', activeSchema.name, 'Fields count:', fields.length)
  }
  useEffect(() => {
    if (!session?.user?.id) {
      guestSchemasRef.current = schemas
    }
  }, [schemas, session?.user?.id])
  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (event: BeforeUnloadEvent) => {
      const hasPendingSync = Object.values(schemaSyncState).some((state) => state.status === 'saving')
      const hasSyncError = Object.values(schemaSyncState).some((state) => state.status === 'error')
      const shouldWarn = session?.user?.id ? hasPendingSync || hasSyncError || isWorkspaceLoading : hasWorkspaceContent
      if (shouldWarn) {
        event.preventDefault()
        event.returnValue = "You have unsaved progress. Sign in to save your work."
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [schemaSyncState, hasWorkspaceContent, isWorkspaceLoading, session?.user?.id])
  useEffect(() => {
    if (session?.user?.id) {
      guestPromptShownRef.current = false
      return
    }
    const hasCompletedJob = schemas.some((schema) =>
      schema.jobs.some((job) => job.status === "completed"),
    )
    if (hasCompletedJob && !guestPromptShownRef.current) {
      guestPromptShownRef.current = true
      openAuthDialog("sign-up")
    }
  }, [openAuthDialog, schemas, session?.user?.id])
  const [selectedColumn, setSelectedColumn] = useState<SchemaField | null>(null)
  const [draftColumn, setDraftColumn] = useState<SchemaField | null>(null)
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false)
  const [columnDialogMode, setColumnDialogMode] = useState<'create' | 'edit'>('create')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Schema name editing
  const [editingSchemaName, setEditingSchemaName] = useState(false)
  const [schemaNameInput, setSchemaNameInput] = useState<string>(activeSchema.name)
  const isDraftTransformation = !!draftColumn?.isTransformation
  useEffect(() => {
    const userId = session?.user?.id

    if (!userId) {
      lastLoadedUserIdRef.current = null
      const fresh = createInitialSchemaDefinition()
      setSchemas([fresh])
      setActiveSchemaId(fresh.id)
      setSchemaNameInput(fresh.name)
      setSchemaSyncState({})
      setLoadWorkspaceError(null)
      hasInitialLoadCompletedRef.current = true
      return
    }

    if (lastLoadedUserIdRef.current === userId) {
      hasInitialLoadCompletedRef.current = true
      return
    }

    hasInitialLoadCompletedRef.current = false

    let cancelled = false
    const loadWorkspace = async () => {
      setIsWorkspaceLoading(true)
      setLoadWorkspaceError(null)
      try {
        const { data: schemaRows, error: schemaError } = await supabase
          .from("schemas")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })

        if (schemaError) {
          throw schemaError
        }

        const { data: jobRows, error: jobError } = await supabase
          .from("extraction_jobs")
          .select("*")
          .eq("user_id", userId)

        if (jobError) {
          throw jobError
        }

        const schemaData = schemaRows ?? []
        const jobData = jobRows ?? []

        const guestSchemas = guestSchemasRef.current
        const hasLocalWorkspace =
          Array.isArray(guestSchemas) &&
          guestSchemas.some(
            (schema) => (schema.fields?.length ?? 0) > 0 || (schema.jobs?.length ?? 0) > 0,
          )

        if (schemaData.length === 0 && hasLocalWorkspace) {
          if (cancelled) return
          lastLoadedUserIdRef.current = userId
          hasInitialLoadCompletedRef.current = true
          setSchemaSyncState({})
          return
        }

    const remoteSchemas =
      schemaData.length > 0
        ? schemaData.map((row) => schemaRowToDefinition(row, jobData))
        : [createInitialSchemaDefinition()]

    if (cancelled) return

    const localSchemasSnapshot = schemasRef.current
    const localMap = new Map(localSchemasSnapshot.map((schema) => [schema.id, schema]))
    const mergedSchemas: SchemaDefinition[] = remoteSchemas.map((remote) => {
      const local = localMap.get(remote.id)
      if (!local) return remote
      const syncStatus = schemaSyncStateRef.current[remote.id]?.status
      const localUpdatedAt = local.updatedAt?.getTime() ?? 0
      const remoteUpdatedAt = remote.updatedAt?.getTime() ?? 0
      if (syncStatus === 'saving' || localUpdatedAt > remoteUpdatedAt) {
        return local
      }
      return remote
    })

    const remoteIds = new Set(remoteSchemas.map((schema) => schema.id))
    localSchemasSnapshot.forEach((local) => {
      if (!remoteIds.has(local.id)) {
        mergedSchemas.push(local)
      }
    })

    if (mergedSchemas.length === 0) {
      mergedSchemas.push(createInitialSchemaDefinition())
    }

    setSchemas(mergedSchemas)
    const nextActive = mergedSchemas.find((schema) => schema.id === activeSchemaId) ?? mergedSchemas[0]
    setActiveSchemaId(nextActive.id)
    setSchemaNameInput(nextActive.name)
    guestSchemasRef.current = null
    lastLoadedUserIdRef.current = userId
    setSchemaSyncState((prev) => {
      const nextState: Record<string, SchemaSyncInfo> = {}
      mergedSchemas.forEach((schema) => {
        const previous = prev[schema.id]
        nextState[schema.id] =
          previous ?? {
            status: 'idle',
            updatedAt: schema.updatedAt,
          }
      })
      return nextState
    })
        hasInitialLoadCompletedRef.current = true
      } catch (error) {
        if (!cancelled) {
          setLoadWorkspaceError(error instanceof Error ? error.message : "Failed to load your saved workspace.")
        }
      } finally {
        if (!cancelled) {
          setIsWorkspaceLoading(false)
          if (!hasInitialLoadCompletedRef.current) {
            hasInitialLoadCompletedRef.current = true
          }
        }
      }
    }

    loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [session?.user?.id, supabase])
  const schemaIdsKey = useMemo(() => {
    if (!session?.user?.id) return ""
    const ids = schemas.map((schema) => schema.id).sort()
    return ids.join(",")
  }, [schemas, session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) return
    if (!schemaIdsKey) return

    const schemaIds = schemaIdsKey.split(",").filter((id) => id.length > 0)
    if (schemaIds.length === 0) return

    const filterList = schemaIds.map((id) => `'${id}'`).join(",")
    const channelName = `job-sync-${schemaIdsKey.replace(/,/g, "-")}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extraction_jobs',
          filter: `schema_id=in.(${filterList})`,
        },
        (payload) => {
          const eventType = payload.eventType
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const row = payload.new as ExtractionJobRow | null
            if (!row?.schema_id) return
            const mapped = extractionJobRowToJob(row)
            setSchemas((prev) =>
              prev.map((schema) => {
                if (schema.id !== row.schema_id) return schema
                const nextJobs = upsertJobInList(schema.jobs ?? [], mapped)
                return { ...schema, jobs: nextJobs }
              }),
            )
          } else if (eventType === 'DELETE') {
            const row = payload.old as ExtractionJobRow | null
            if (!row?.schema_id || !row.id) return
            setSchemas((prev) =>
              prev.map((schema) => {
                if (schema.id !== row.schema_id) return schema
                return { ...schema, jobs: (schema.jobs ?? []).filter((job) => job.id !== row.id) }
              }),
            )
          }
        },
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [schemaIdsKey, session?.user?.id, supabase])

  // UI state for modern grid behaviors
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [ocrModalJobId, setOcrModalJobId] = useState<string | null>(null)
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
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
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
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [templateNameInput, setTemplateNameInput] = useState<string>(activeSchema.name)
  const [templateDescriptionInput, setTemplateDescriptionInput] = useState<string>("")
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  useEffect(() => {
    if (isTemplateDialogOpen) return
    setTemplateNameInput(activeSchema.name || "New template")
  }, [activeSchema.name, isTemplateDialogOpen])
  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length
  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [jobs],
  )

  const ocrModalJob = useMemo(
    () => (ocrModalJobId ? sortedJobs.find((job) => job.id === ocrModalJobId) ?? null : null),
    [ocrModalJobId, sortedJobs],
  )

  useEffect(() => {
    if (ocrModalJobId && !sortedJobs.some((job) => job.id === ocrModalJobId)) {
      setOcrModalJobId(null)
    }
  }, [ocrModalJobId, sortedJobs])
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

  const toggleRowExpansion = (jobId: string) => {
    setExpandedRowId((prev) => (prev === jobId ? null : jobId))
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
    if (nextType === 'single_select' || nextType === 'multi_select') {
      const leaf: LeafField = {
        ...(prev as any),
        type: nextType,
        constraints: {
          ...prev.constraints,
          options: prev.constraints?.options || []
        }
      }
      delete (leaf as any).children
      delete (leaf as any).columns
      delete (leaf as any).item
      return leaf
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

  const addSelectOption = () => {
    setDraftColumn((prev) => {
      if (!prev || (prev.type !== 'single_select' && prev.type !== 'multi_select')) return prev
      const currentOptions = prev.constraints?.options || []
      const newOption = `Option ${currentOptions.length + 1}`
      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          options: [...currentOptions, newOption]
        }
      }
    })
  }

  const updateSelectOption = (index: number, newValue: string) => {
    setDraftColumn((prev) => {
      if (!prev || (prev.type !== 'single_select' && prev.type !== 'multi_select')) return prev
      const currentOptions = prev.constraints?.options || []
      const updatedOptions = [...currentOptions]
      updatedOptions[index] = newValue
      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          options: updatedOptions
        }
      }
    })
  }

  const removeSelectOption = (index: number) => {
    setDraftColumn((prev) => {
      if (!prev || (prev.type !== 'single_select' && prev.type !== 'multi_select')) return prev
      const currentOptions = prev.constraints?.options || []
      const updatedOptions = currentOptions.filter((_, i) => i !== index)
      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          options: updatedOptions
        }
      }
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

    commitSchemaUpdate(activeSchemaId, (schema) => {
      const newGroup = createVisualGroup(newGroupName, selectedIds)
      return addVisualGroup(schema, newGroup)
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
                        <SelectItem value="single_select">Single Select</SelectItem>
                        <SelectItem value="multi_select">Multi Select</SelectItem>
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

    if (draftColumn.type === 'single_select' || draftColumn.type === 'multi_select') {
      const options = draftColumn.constraints?.options || []
      return (
        <div id="data-type-options" className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Select Options</p>
              <p className="text-xs text-slate-500">Define the available choices for this field.</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addSelectOption}>
              <Plus className="mr-1 h-4 w-4" />
              Add Option
            </Button>
          </div>
          <div className="space-y-2">
            {options.length === 0 ? (
              <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                No options yet. Add at least one option to define the available choices.
              </div>
            ) : (
              options.map((option, index) => (
                <div key={index} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: `hsl(${(index * 137.5) % 360}, 50%, 90%)`,
                      color: `hsl(${(index * 137.5) % 360}, 60%, 25%)`,
                    }}
                  >
                    {option}
                  </span>
                  <Input
                    value={option}
                    onChange={(e) => updateSelectOption(index, e.target.value)}
                    className="flex-1 border-0 shadow-none focus-visible:ring-0"
                    placeholder="Option name"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSelectOption(index)}
                    className="h-6 w-6 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-3 w-3" />
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
              <SelectItem value="single_select">Single Select</SelectItem>
              <SelectItem value="multi_select">Multi Select</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
    return null
  }

  const staticTemplates = useMemo(() => getStaticSchemaTemplates(), [])
  const combinedTemplates = useMemo(() => {
    const registry = new Map<string, SchemaTemplateDefinition>()
    for (const tpl of staticTemplates) {
      registry.set(tpl.id, tpl)
    }
    if (templateLibrary) {
      for (const tpl of templateLibrary) {
        registry.set(tpl.id, {
          ...tpl,
          fields: cloneSchemaFields(tpl.fields ?? []),
        })
      }
    }
    return Array.from(registry.values())
  }, [staticTemplates, templateLibrary])
  const templateMap = useMemo(() => {
    const map = new Map<string, SchemaTemplateDefinition>()
    for (const tpl of combinedTemplates) {
      map.set(tpl.id, tpl)
    }
    return map
  }, [combinedTemplates])

  const inferAgentTypeFromSchema = (schema: SchemaDefinition | null | undefined): AgentType => {
    const templateId = schema?.templateId?.toLowerCase() ?? ""
    if (templateId.includes("pharma")) return "pharma"
    return "standard"
  }

  const shouldAutoApplyTemplate = (templateId: string | null | undefined) => {
    if (!templateId) return false
    if (templateId.startsWith("custom-")) return false
    const candidate = templateMap.get(templateId)
    if (!candidate) return false
    if (candidate.isCustom) return false
    return (candidate.fields?.length ?? 0) > 0
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
  const syncSchema = useCallback(
    async (schema: SchemaDefinition, opts?: { includeJobs?: boolean }) => {
      if (!session?.user?.id) {
        openAuthDialog("sign-in")
        return
      }

      setSchemaSyncState((prev) => ({
        ...prev,
        [schema.id]: {
          status: 'saving',
          updatedAt: schema.updatedAt ?? prev[schema.id]?.updatedAt,
        },
      }))

      const userId = session.user.id
      const includeJobs = opts?.includeJobs ?? false

      try {
        const schemaRow = schemaDefinitionToRow(schema, userId)
        await supabase.from("schemas").upsert([schemaRow])

        if (includeJobs) {
          const jobRows = (schema.jobs ?? []).map((job) => extractionJobToRow(job, schema.id, userId))

          if (jobRows.length > 0) {
            await supabase.from("extraction_jobs").upsert(jobRows)
            const idList = jobRows.map((row) => `'${row.id}'`).join(",")
            const deleteQuery = supabase
              .from("extraction_jobs")
              .delete()
              .eq("schema_id", schema.id)
              .eq("user_id", userId)

            if (idList.length > 0) {
              deleteQuery.not("id", "in", `(${idList})`)
            }

            await deleteQuery
          } else {
            await supabase.from("extraction_jobs").delete().eq("schema_id", schema.id).eq("user_id", userId)
          }
        }

        setSchemaSyncState((prev) => ({
          ...prev,
          [schema.id]: {
            status: 'idle',
            updatedAt: new Date(),
          },
        }))
      } catch (error) {
        console.error('Failed to sync schema', error)
        setSchemaSyncState((prev) => ({
          ...prev,
          [schema.id]: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to save workspace.',
            updatedAt: prev[schema.id]?.updatedAt,
          },
        }))
      }
    },
    [openAuthDialog, session?.user?.id, supabase],
  )

  const deleteSchemaRecord = useCallback(
    async (schemaId: string) => {
      if (!session?.user?.id) return
      setSchemaSyncState((prev) => ({
        ...prev,
        [schemaId]: {
          status: 'saving',
          updatedAt: prev[schemaId]?.updatedAt,
        },
      }))
      try {
        await supabase.from("extraction_jobs").delete().eq("schema_id", schemaId).eq("user_id", session.user.id)
        await supabase.from("schemas").delete().eq("id", schemaId).eq("user_id", session.user.id)
        setSchemaSyncState((prev) => {
          const next = { ...prev }
          delete next[schemaId]
          return next
        })
      } catch (error) {
        console.error('Failed to delete schema', error)
        setSchemaSyncState((prev) => ({
          ...prev,
          [schemaId]: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to delete schema.',
            updatedAt: prev[schemaId]?.updatedAt,
          },
        }))
      }
    },
    [session?.user?.id, supabase],
  )

  type CommitSchemaOptions = {
    persistSchema?: boolean
    includeJobs?: boolean
  }

  const commitSchemaUpdate = useCallback(
    (
      schemaId: string,
      updater: (schema: SchemaDefinition) => SchemaDefinition,
      options?: CommitSchemaOptions,
    ) => {
      const updated = applySchemaUpdate(schemaId, updater)
      const shouldPersist = options?.persistSchema ?? true
      const includeJobs = options?.includeJobs ?? false
      if (updated && session?.user?.id && shouldPersist) {
        void syncSchema(updated, { includeJobs })
      }
      return updated
    },
    [applySchemaUpdate, session?.user?.id, syncSchema],
  )

  const applySchemaTemplate = useCallback(
    (templateId: string) => {
      const tpl = templateMap.get(templateId)
      if (!tpl) return
      const templateFields = cloneSchemaFields(tpl.fields ?? [])
      if (isSchemaFresh(activeSchema)) {
        commitSchemaUpdate(activeSchemaId, (schema) => ({
          ...schema,
          name: tpl.name,
          fields: templateFields,
          templateId,
        }))
        setSchemaNameInput(tpl.name)
      } else {
        const newSchema: SchemaDefinition = {
          id: generateUuid(),
          name: tpl.name,
          fields: templateFields,
          jobs: [],
          templateId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setSchemas((prev) => [...prev, newSchema])
        setActiveSchemaId(newSchema.id)
        setSchemaNameInput(newSchema.name)
        if (session?.user?.id) {
          setSchemaSyncState((prev) => ({
            ...prev,
            [newSchema.id]: { status: 'saving', updatedAt: newSchema.updatedAt },
          }))
          void syncSchema(newSchema)
        }
      }
    },
    [
      templateMap,
      activeSchema,
      activeSchemaId,
      commitSchemaUpdate,
      isSchemaFresh,
      session?.user?.id,
      setActiveSchemaId,
      setSchemaNameInput,
      setSchemaSyncState,
      setSchemas,
      syncSchema,
    ],
  )

  const handleTemplateSave = useCallback(async () => {
    if (!onCreateTemplate) return
    if (fields.length === 0) {
      toast({
        title: "Add fields before saving",
        description: "Create at least one field so the template has structure to save.",
        variant: "destructive",
      })
      return
    }
    const trimmedName = (templateNameInput || activeSchema.name || "New template").trim()
    setTemplateNameInput(trimmedName)
    const trimmedDescription = templateDescriptionInput.trim()
    setIsSavingTemplate(true)
    try {
      const result = await onCreateTemplate(activeSchema, {
        name: trimmedName,
        description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
        agent: selectedAgent,
      })
      if (result.success) {
        setIsTemplateDialogOpen(false)
        setTemplateDescriptionInput("")
        commitSchemaUpdate(activeSchema.id, (schema) => ({
          ...schema,
          templateId: result.template.id,
        }))
        toast({
          title: "Template created",
          description: "You'll find it in the New schema template picker.",
        })
      } else {
        toast({
          title: "Unable to save template",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Unable to save template",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSavingTemplate(false)
    }
  }, [
    onCreateTemplate,
    fields.length,
    templateNameInput,
    activeSchema,
    activeSchemaId,
    templateDescriptionInput,
    selectedAgent,
    commitSchemaUpdate,
    toast,
  ])

  const activeSchemaTemplateId = activeSchema.templateId ?? null
  const activeSchemaIsFresh = isSchemaFresh(activeSchema)
  useEffect(() => {
    if (!isEmbedded) return
    if (!shouldAutoApplyTemplate(activeSchemaTemplateId)) return
    if (!activeSchemaIsFresh) return
    if (autoAppliedTemplatesRef.current.has(activeSchemaId)) return
    autoAppliedTemplatesRef.current.add(activeSchemaId)
    applySchemaTemplate(activeSchemaTemplateId)
  }, [isEmbedded, activeSchemaTemplateId, activeSchemaIsFresh, activeSchemaId, applySchemaTemplate])

  useEffect(() => {
    if (!pendingSchemaCreate) return
    const exists = schemas.some((schema) => schema.id === pendingSchemaCreate.id)
    if (exists) {
      if (onPendingCreateConsumed) onPendingCreateConsumed()
      setActiveSchemaId(pendingSchemaCreate.id)
      return
    }

    const templateId = pendingSchemaCreate.templateId ?? null
    let fields: SchemaField[] = []
    let shouldAutoApplyTemplate = false
    if (templateId) {
      const templateDef = templateMap.get(templateId)
      if (templateDef) {
        if (templateDef.isCustom) {
          fields = cloneSchemaFields(templateDef.fields ?? [])
        } else {
          shouldAutoApplyTemplate = true
        }
      }
    }

    const newSchema: SchemaDefinition = {
      id: pendingSchemaCreate.id,
      name: pendingSchemaCreate.name,
      fields,
      jobs: [],
      templateId: templateId ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setSchemas((prev) => [...prev, newSchema])
    setActiveSchemaId(newSchema.id)
    setSchemaNameInput(newSchema.name)
    setSelectedAgent(pendingSchemaCreate.agent)
    autoAppliedTemplatesRef.current.add(newSchema.id)
    if (session?.user?.id && !shouldAutoApplyTemplate) {
      setSchemaSyncState((prev) => ({
        ...prev,
        [newSchema.id]: {
          status: 'saving',
          updatedAt: newSchema.updatedAt,
        },
      }))
      void syncSchema(newSchema)
    }
    if (shouldAutoApplyTemplate) {
      setTimeout(() => {
        applySchemaTemplate(templateId ?? "")
      }, 0)
    }
    if (onPendingCreateConsumed) onPendingCreateConsumed()
  }, [
    pendingSchemaCreate,
    schemas,
    templateMap,
    setSchemas,
    setActiveSchemaId,
    setSchemaNameInput,
    session?.user?.id,
    setSchemaSyncState,
    syncSchema,
    applySchemaTemplate,
    onPendingCreateConsumed,
  ])

  const setFields = (
    updater: SchemaField[] | ((prev: SchemaField[]) => SchemaField[]),
  ) => {
    const updated = commitSchemaUpdate(activeSchemaId, (schema) => ({
      ...schema,
      fields: typeof updater === "function" ? (updater as (prev: SchemaField[]) => SchemaField[])(schema.fields) : updater,
    }))
    return updated?.fields ?? null
  }

  const syncJobRecords = useCallback(
    async (schemaId: string, payload: { upsert?: ExtractionJob[]; deleted?: string[] }) => {
      if (!session?.user?.id) return
      const userId = session.user.id
      const operations: Promise<unknown>[] = []

      if (payload.upsert && payload.upsert.length > 0) {
        const rows = payload.upsert.map((job) => extractionJobToRow(job, schemaId, userId))
        operations.push(supabase.from("extraction_jobs").upsert(rows))
      }

      if (payload.deleted && payload.deleted.length > 0) {
        operations.push(
          supabase
            .from("extraction_jobs")
            .delete()
            .eq("schema_id", schemaId)
            .eq("user_id", userId)
            .in("id", payload.deleted),
        )
      }

      if (operations.length === 0) return

      try {
        await Promise.all(operations)
      } catch (error) {
        console.error('Failed to sync jobs', error)
      }
    },
    [session?.user?.id, supabase],
  )

  const updateSchemaJobs = useCallback(
    (
      schemaId: string,
      updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
      options?: { persistSchema?: boolean; syncJobs?: boolean },
    ) => {
      const previousSchema = schemas.find((schema) => schema.id === schemaId)
      const previousJobs = previousSchema?.jobs ?? []
      let nextJobs = previousJobs

      const updated = commitSchemaUpdate(
        schemaId,
        (schema) => {
          const currentJobs = schema.jobs ?? []
          nextJobs =
            typeof updater === "function"
              ? (updater as (prev: ExtractionJob[]) => ExtractionJob[])(currentJobs)
              : Array.isArray(updater)
                ? updater
                : currentJobs
          return {
            ...schema,
            jobs: nextJobs,
          }
        },
        { persistSchema: options?.persistSchema ?? false },
      )

      if (updated && session?.user?.id && options?.syncJobs !== false) {
        const { upsert, deleted } = diffJobLists(previousJobs, nextJobs)
        if (upsert.length > 0 || deleted.length > 0) {
          void syncJobRecords(schemaId, { upsert, deleted })
        }
      }

      return updated?.jobs ?? null
    },
    [commitSchemaUpdate, schemas, session?.user?.id, syncJobRecords],
  )

  const setJobs = (
    updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[]),
    schemaId: string = activeSchemaId,
    options?: { persistSchema?: boolean; syncJobs?: boolean },
  ) => updateSchemaJobs(schemaId, updater, options)

  const updateReviewStatus = useCallback(
    (
      jobId: string,
      columnId: string,
      status: "verified" | "needs_review",
      payload?: { reason?: string | null },
    ) => {
      const nowIso = new Date().toISOString()
      updateSchemaJobs(
        activeSchemaId,
        (prev) =>
          prev.map((job) => {
            if (job.id !== jobId) return job
            const previousMeta = job.review?.[columnId]
            const originalValue =
              status === "verified"
                ? job.results?.[columnId]
                : previousMeta?.originalValue ?? job.results?.[columnId]
            const previousConfidence = previousMeta?.confidence ?? null
            let nextConfidence: number | null
            if (status === "verified") {
              nextConfidence = 1
            } else if (previousConfidence !== null) {
              nextConfidence = previousConfidence
            } else {
              nextConfidence = status === "needs_review" ? 0 : null
            }
            const nextMeta: FieldReviewMeta = {
              status,
              updatedAt: nowIso,
              reason:
                payload?.reason ??
                (status === "verified"
                  ? "Verified by user"
                  : previousMeta?.reason ?? "Requires review"),
              confidence: nextConfidence,
              verifiedAt: status === "verified" ? nowIso : null,
              verifiedBy: status === "verified" ? session?.user?.id ?? null : null,
              originalValue,
            }
            return {
              ...job,
              review: {
                ...(job.review ?? {}),
                [columnId]: nextMeta,
              },
            }
          }),
        { syncJobs: true },
      )
    },
    [activeSchemaId, session?.user?.id, updateSchemaJobs],
  )

  const handleRowDoubleClick = useCallback(
    (job: ExtractionJob) => {
      if (!job) return
      setOcrModalJobId(job.id)
    },
    [setOcrModalJobId],
  )

  const addSchema = () => {
    const nextIndex = schemas.length + 1
    const newSchema: SchemaDefinition = {
      id: generateUuid(),
      name: `Schema ${nextIndex}`,
      fields: [],
      jobs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSchemas((prev) => [...prev, newSchema])
    setActiveSchemaId(newSchema.id)
    setSchemaNameInput(newSchema.name)
    setSelectedColumn(null)
    setIsColumnDialogOpen(false)
    if (session?.user?.id) {
      setSchemaSyncState((prev) => ({
        ...prev,
        [newSchema.id]: { status: 'saving', updatedAt: newSchema.updatedAt },
      }))
      void syncSchema(newSchema)
    }
  }

  const removeSchema = (id: string) => {
    const fallback = createInitialSchemaDefinition()
    setSchemas((prev) => {
      const filtered = prev.filter((s) => s.id !== id)
      if (filtered.length === 0) {
        setActiveSchemaId(fallback.id)
        setSchemaNameInput(fallback.name)
        return [fallback]
      }
      if (id === activeSchemaId) {
        const nextActive = filtered[filtered.length - 1]
        setActiveSchemaId(nextActive.id)
        setSchemaNameInput(nextActive.name)
      }
      return filtered
    })
    if (session?.user?.id) {
      void deleteSchemaRecord(id)
      if (schemas.length === 1) {
        setSchemaSyncState((prev) => ({ ...prev, [fallback.id]: { status: 'saving', updatedAt: fallback.updatedAt } }))
        void syncSchema(fallback)
      }
    }
    setSelectedColumn(null)
    setIsColumnDialogOpen(false)
  }

  const closeSchema = (id: string) => {
    const target = schemas.find((s) => s.id === id)
    if (!target) return
    const hasData =
      (target.fields?.length ?? 0) > 0 ||
      (target.jobs?.length ?? 0) > 0
    if (hasData) {
      setSchemaDeletionDialog(target)
      return
    }
    removeSchema(id)
  }

  const handleConfirmSchemaDeletion = () => {
    if (!schemaDeletionDialog) return
    const id = schemaDeletionDialog.id
    setSchemaDeletionDialog(null)
    removeSchema(id)
  }

  const handleCancelSchemaDeletion = () => {
    setSchemaDeletionDialog(null)
  }

  const activeSchemaSync = schemaSyncState[activeSchemaId]
  const activeSchemaStatus: 'idle' | 'saving' | 'error' = activeSchemaSync?.status ?? 'idle'
  const activeSchemaError = activeSchemaSync?.status === 'error' ? activeSchemaSync.error : null
  const activeSchemaUpdatedAt = activeSchemaSync?.updatedAt

  const retryActiveSchema = useCallback(() => {
    if (!session?.user?.id) return
    const schema = schemas.find((s) => s.id === activeSchemaId)
    if (schema) {
      void syncSchema(schema)
    }
  }, [activeSchemaId, schemas, session?.user?.id, syncSchema])

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
    commitSchemaUpdate(activeSchemaId, (schema) => {
      const newFields = removeFieldById(schema.fields, columnId)
      const updatedGroups = (schema.visualGroups || [])
        .map(group => ({
          ...group,
          fieldIds: group.fieldIds.filter(id => id !== columnId)
        }))
        .filter(group => group.fieldIds.length > 0)
      return {
        ...schema,
        fields: newFields,
        visualGroups: updatedGroups,
      }
    })

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

    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    const targetSchemaId = activeSchemaId
    const agentSnapshot = selectedAgent
    const templateIdSnapshot = activeSchema.templateId
    const fieldsSnapshot = fields
    const displayColumnsSnapshot = displayColumns

    const jobsToCreate: ExtractionJob[] = fileArray.map((file) => ({
      id: generateUuid(),
      fileName: file.name,
      status: "pending" as ExtractionJob["status"],
      createdAt: new Date(),
      agentType: agentSnapshot,
      review: {},
      ocrMarkdown: null,
      ocrAnnotatedImageUrl: null,
      originalFileUrl: null,
    }))

    if (jobsToCreate.length > 0) {
      updateSchemaJobs(targetSchemaId, (prev) => [...prev, ...jobsToCreate])
      setSelectedRowId(jobsToCreate[jobsToCreate.length - 1].id)
    }

    const processEntry = async (file: File, job: ExtractionJob | undefined) => {
      if (!job) return

      const jobMeta: {
        jobId: string
        schemaId: string
        fileName: string
        agentType?: string | null
        userId?: string
      } = {
        jobId: job.id,
        schemaId: targetSchemaId,
        fileName: job.fileName,
        agentType: agentSnapshot,
      }
      if (session?.user?.id) {
        jobMeta.userId = session.user.id
      }

      const updateJobsForSchema = (
        updater: ExtractionJob[] | ((prev: ExtractionJob[]) => ExtractionJob[])
      ) => updateSchemaJobs(targetSchemaId, updater)

      try {
        updateJobsForSchema((prev) =>
          prev.map((existing) =>
            existing.id === job.id ? { ...existing, status: "processing" } : existing,
          ),
        )

        const filterTransforms = (fs: SchemaField[]): SchemaField[] =>
          fs
            .filter((f) => !f.isTransformation)
            .map((f) => {
              if (f.type === "object") return { ...f, children: filterTransforms(f.children) }
              if (f.type === "list") return { ...f }
              if (f.type === "table") return { ...f, columns: filterTransforms(f.columns) }
              return f
            })
        const schemaTree = filterTransforms(fieldsSnapshot)

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
        jobMeta.fileName = uploadName
        if (uploadName !== job.fileName) {
          updateJobsForSchema((prev) =>
            prev.map((existing) =>
              existing.id === job.id ? { ...existing, fileName: uploadName } : existing,
            ),
          )
        }
        const imageSizeExceededMessage =
          'File is still larger than 3 MB after compression. Please resize or crop the image and try again.'
        const maxImageBytes = compressionOptions.targetBytes ?? 3_000_000

        if (uploadType.startsWith('image/') && uploadBlob.size > maxImageBytes) {
          throw new Error(imageSizeExceededMessage)
        }

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

        if (agentSnapshot === 'pharma') {
          try {
            const pharmaPayload: any = {
              imageBase64: uploadType.startsWith('image/') ? base64Data : undefined,
              fileName: uploadName,
              job: jobMeta,
            }

            if (!uploadType.startsWith('image/')) {
              if (uploadType.includes('text') || uploadType.includes('csv')) {
                const textBytes = atob(base64Data)
                pharmaPayload.extractedText = textBytes
              } else {
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

            const finalResults: Record<string, any> = {
              pharma_data: pharmaResult,
            }
            const reviewMeta = computeInitialReviewMeta(finalResults)
            const completedAt = new Date()

            updateJobsForSchema((prev) =>
              prev.map((existing) =>
                existing.id === job.id
                  ? {
                      ...existing,
                      status: 'completed',
                      results: finalResults,
                      completedAt,
                      review: reviewMeta,
                    }
                  : existing,
              ),
            )
            recordSuccessAndMaybeOpenRoi()
          } catch (e) {
            console.error('Pharma flow error:', e)
            updateJobsForSchema((prev) =>
              prev.map((existing) =>
                existing.id === job.id
                  ? { ...existing, status: 'error', completedAt: new Date() }
                  : existing,
              ),
            )
          }
          return
        }

        if (templateIdSnapshot === 'fnb-label-compliance') {
          try {
            const r1 = await fetch('/api/fnb/extract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ file: fileData, job: jobMeta }),
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
              body: JSON.stringify({ source, extraction, job: jobMeta }),
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
            const reviewMeta = computeInitialReviewMeta(finalResults)
            const completedAt = new Date()

            updateJobsForSchema((prev) =>
              prev.map((existing) =>
                existing.id === job.id
                  ? {
                      ...existing,
                      status: 'completed',
                      results: finalResults,
                      completedAt,
                      review: reviewMeta,
                    }
                  : existing,
              ),
            )
            recordSuccessAndMaybeOpenRoi()
          } catch (e) {
            console.error('FNB flow error:', e)
            updateJobsForSchema((prev) =>
              prev.map((existing) =>
                existing.id === job.id
                  ? { ...existing, status: 'error', completedAt: new Date() }
                  : existing,
              ),
            )
          }
          return
        }

        const response = await fetch("/api/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: fileData,
            schemaTree,
            extractionPromptOverride: undefined,
            job: jobMeta,
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
            `Failed to parse extraction response: ${(parseError as Error).message}`,
          )
        }

        if (result.success) {
          const rawResults =
            (result.data && typeof result.data === 'object' && 'results' in result.data
              ? result.data.results
              : undefined) ??
            result.results ??
            {}
          const { values: rawValues, meta: rawMeta } = extractResultsMeta(rawResults)
          const sanitized = schemaTree?.length
            ? sanitizeResultsFromTree(schemaTree, rawValues ?? {})
            : sanitizeResultsFromFlat((result.schema ?? result.data?.schema) ?? {}, rawValues ?? {})
          const flattened = flattenResultsById(displayColumnsSnapshot, sanitized ?? {})
          const finalResults: Record<string, any> = { ...flattened }
          const graph = buildDependencyGraph(displayColumnsSnapshot, false)
          const waves = topologicalSort(graph)
          const fieldStatus = new Map<string, { status: 'pending' | 'success' | 'error' | 'blocked'; error?: string }>()
          const baseStatus = validateDependencies(graph)
          baseStatus.unresolvable.forEach((id) => fieldStatus.set(id, { status: 'blocked', error: 'Missing dependency' }))
          const pendingTransformations = displayColumnsSnapshot
            .filter((col) => col.isTransformation && !fieldStatus.has(col.id))
            .map((col) => col.id)
          pendingTransformations.forEach((id) => fieldStatus.set(id, { status: 'pending' }))

          displayColumnsSnapshot.forEach((col) => {
            if (fieldStatus.has(col.id)) return
            fieldStatus.set(col.id, { status: 'success' })
          })

          const resolvedSummaryValues = new Map<string, Record<string, any>>()

          const summaryFields = displayColumnsSnapshot.filter((col) => col.displayInSummary)
          const summaryPrimitives = summaryFields.filter((col) => col.type !== 'object')
          const summaryComposite = summaryFields.filter((col) => col.type === 'object')

          if (summaryPrimitives.length > 0) {
            const summaryObject = Object.fromEntries(
              summaryPrimitives.map((col) => [col.id, finalResults[col.id]]),
            )
            resolvedSummaryValues.set('leaf_summary', summaryObject)
          }

          summaryComposite.forEach((col) => {
            const objectValue = finalResults[col.id]
            if (!objectValue || typeof objectValue !== 'object') return
            resolvedSummaryValues.set(col.id, objectValue as Record<string, any>)
          })

          const dependencyWarnings: string[] = []

          displayColumnsSnapshot.forEach((col) => {
            if (!col.displayInSummary) return
            const dependents = getFieldDependents(graph, col.id)
            dependents.forEach((depId) => {
              const depField = displayColumnsSnapshot.find((f) => f.id === depId)
              if (depField?.displayInSummary) {
                dependencyWarnings.push(
                  `Field "${depField.name}" depends on "${col.name}" while both are part of the summary. This may cause circular references.`,
                )
              }
            })
          })

          if (dependencyWarnings.length > 0) {
            finalResults['__summary_warnings__'] = dependencyWarnings
          }

          if (resolvedSummaryValues.size > 0) {
            finalResults['__summary_values__'] = Object.fromEntries(resolvedSummaryValues)
          }

          const ensurePath = (obj: Record<string, any>, path: string[]): Record<string, any> => {
            let current = obj
            for (const key of path) {
              if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {}
              }
              current = current[key]
            }
            return current
          }

          displayColumnsSnapshot.forEach((col) => {
            if (!col.displayInSummary) return
            const parentPath = col.path.slice(0, -1)
            const destination = ensurePath(finalResults, parentPath)
            destination[col.id] = finalResults[col.id]
          })

          for (const wave of waves) {
            const geminiFields = wave.fields.filter((col) =>
              col.isTransformation && col.transformationType === 'gemini_api'
            )

            for (const tcol of geminiFields) {
              const dependencies = graph.edges.get(tcol.id) || new Set<string>()
              const blockedBy: string[] = []

              dependencies.forEach((depId) => {
                const depStatus = fieldStatus.get(depId)
                if (depStatus && (depStatus.status === 'error' || depStatus.status === 'blocked')) {
                  const depField = displayColumnsSnapshot.find((c) => c.id === depId)
                  blockedBy.push(depField?.name || depId)
                }
              })

              if (blockedBy.length > 0) {
                fieldStatus.set(tcol.id, {
                  status: 'blocked',
                  error: `Blocked by failed dependencies: ${blockedBy.join(', ')}`,
                })
                finalResults[tcol.id] = `Error: Blocked by ${blockedBy.join(', ')}`
                continue
              }

              try {
                const source = tcol.transformationSource || "column"

                const fieldSchema: any = {
                  type: tcol.type,
                  name: tcol.name,
                  description: tcol.description,
                  constraints: tcol.constraints,
                }

                if (tcol.type === 'object' && 'children' in tcol) {
                  fieldSchema.children = tcol.children
                } else if (tcol.type === 'list' && 'item' in tcol) {
                  fieldSchema.item = tcol.item
                } else if (tcol.type === 'table' && 'columns' in tcol) {
                  fieldSchema.columns = tcol.columns
                }

                // Build columnValues from dependencies by mapping column names to their extracted values
                const columnValues: Record<string, any> = {}
                const dependencies = graph.edges.get(tcol.id) || new Set<string>()
                dependencies.forEach((depId) => {
                  const depField = displayColumnsSnapshot.find((c) => c.id === depId)
                  if (depField) {
                    // Use the field name as the key
                    columnValues[depField.name] = finalResults[depId]
                  }
                })

                const promptPayload = {
                  prompt: tcol.transformationConfig || "",
                  inputSource: source,
                  columnValues,
                  fieldType: tcol.type,
                  fieldSchema,
                }

                const response = await fetch("/api/transform", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(promptPayload),
                })

                if (!response.ok) {
                  const errText = await response.text().catch(() => `${response.status} ${response.statusText}`)
                  throw new Error(`Gemini transformation failed: ${response.status} ${response.statusText} - ${errText}`)
                }

                const data = await response.json()
                if (!data?.success) throw new Error(data?.error || 'Gemini transformation failed')

                finalResults[tcol.id] = data.result?.value ?? data.result
                fieldStatus.set(tcol.id, { status: 'success' })
              } catch (e) {
                console.error("Gemini transform error:", e)
                const errorMsg = "Error: " + String(e)
                finalResults[tcol.id] = errorMsg
                fieldStatus.set(tcol.id, { status: 'error', error: errorMsg })
              }
            }
          }

          const completedAt = new Date()
          const reviewMeta = computeInitialReviewMeta(finalResults, {
            handledWithFallback: Boolean(result.handledWithFallback),
            fallbackReason: result.error,
            confidenceByField: rawMeta?.confidence,
            confidenceThreshold: 0.5,
          })

          if (rawMeta?.review) {
            const fallbackUpdatedAt = completedAt.toISOString()
            Object.entries(rawMeta.review).forEach(([fieldId, meta]) => {
              const current = reviewMeta[fieldId]
              reviewMeta[fieldId] = {
                ...current,
                ...meta,
                updatedAt: meta.updatedAt ?? current?.updatedAt ?? fallbackUpdatedAt,
                originalValue: finalResults[fieldId],
                confidence:
                  meta.confidence ?? current?.confidence ?? rawMeta.confidence?.[fieldId] ?? null,
              }
            })
          }

          fieldStatus.forEach((info, fieldId) => {
            if (info.status === 'error' || info.status === 'blocked') {
              reviewMeta[fieldId] = {
                status: 'needs_review',
                updatedAt: completedAt.toISOString(),
                reason: info.error ?? 'Transformation requires review.',
                confidence: 0,
                originalValue: finalResults[fieldId],
              }
            }
          })

          const hasOcrMarkdown = Object.prototype.hasOwnProperty.call(result, "ocrMarkdown")
          const hasOcrAnnotatedImageUrl = Object.prototype.hasOwnProperty.call(result, "ocrAnnotatedImageUrl")
          const hasOriginalFileUrl = Object.prototype.hasOwnProperty.call(result, "originalFileUrl")
          const nextOcrMarkdown =
            hasOcrMarkdown
              ? typeof result.ocrMarkdown === "string" && result.ocrMarkdown.trim().length > 0
                ? result.ocrMarkdown
                : null
              : undefined
          const nextOcrAnnotatedImageUrl =
            hasOcrAnnotatedImageUrl
              ? typeof result.ocrAnnotatedImageUrl === "string" && result.ocrAnnotatedImageUrl.length > 0
                ? result.ocrAnnotatedImageUrl
                : null
              : undefined
          const nextOriginalFileUrl =
            hasOriginalFileUrl
              ? typeof result.originalFileUrl === "string" && result.originalFileUrl.length > 0
                ? result.originalFileUrl
                : null
              : undefined

          updateJobsForSchema((prev) =>
            prev.map((existing) =>
              existing.id === job.id
                ? {
                    ...existing,
                    status: "completed",
                    completedAt,
                    results: finalResults,
                    review: reviewMeta,
                    ocrMarkdown:
                      nextOcrMarkdown !== undefined
                        ? nextOcrMarkdown
                        : existing.ocrMarkdown ?? null,
                    ocrAnnotatedImageUrl:
                      nextOcrAnnotatedImageUrl !== undefined
                        ? nextOcrAnnotatedImageUrl
                        : existing.ocrAnnotatedImageUrl ?? null,
                    originalFileUrl:
                      nextOriginalFileUrl !== undefined
                        ? nextOriginalFileUrl
                        : existing.originalFileUrl ?? null,
                  }
                : existing,
            ),
          )
          recordSuccessAndMaybeOpenRoi()
        } else {
          throw new Error(result.error || "Extraction failed")
        }
      } catch (error) {
        console.error("Extraction error:", error)
        updateJobsForSchema((prev) =>
          prev.map((existing) =>
            existing.id === job.id
              ? {
                  ...existing,
                  status: "error",
                  completedAt: new Date(),
                }
              : existing,
          ),
        )
      }
    }

    await Promise.allSettled(fileArray.map((file, index) => processEntry(file, jobsToCreate[index])))

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
    opts?: { 
      refreshRowHeight?: () => void; 
      mode?: GridRenderMode;
      onUpdateCell?: (jobId: string, columnId: string, value: unknown) => void;
      onOpenTableModal?: (
        column: SchemaField,
        job: ExtractionJob,
        rows: Record<string, any>[],
        columnHeaders: Array<{ key: string; label: string }>
      ) => void;
    },
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

    // Use new cell components if onUpdateCell is available
    if (opts?.onUpdateCell && column.type !== 'object' && column.type !== 'table' && column.type !== 'list') {
      const row: any = {
        __job: job,
        fileName: job.fileName,
        status: job.status,
        [column.id]: value,
      };
      
      // Handle select types with special components
      if (column.type === 'single_select') {
        const options = column.constraints?.options || []
        return (
          <SingleSelectCell
            value={value as string | null}
            row={row}
            columnId={column.id}
            options={options}
            onUpdateCell={opts.onUpdateCell}
          />
        )
      }
      
      if (column.type === 'multi_select') {
        const options = column.constraints?.options || []
        return (
          <MultiSelectCell
            value={value as string[] | null}
            row={row}
            columnId={column.id}
            options={options}
            onUpdateCell={opts.onUpdateCell}
          />
        )
      }
      
      return <PrimitiveCell value={value} row={row} columnId={column.id} columnType={column.type} columnMeta={column} onUpdateCell={opts.onUpdateCell} />;
    }

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
      const expanded = mode === 'detail'
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

      // For this legacy code path, just show the collapsed view
      return (
        <div className="rounded-xl border border-[#2782ff]/10 bg-white/75 px-3 py-2 shadow-sm">
          {headerContent}
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
      {!isEmbedded && (
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
      )}

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
                        commitSchemaUpdate(activeSchemaId, (schema) => ({
                          ...schema,
                          name: next,
                        }))
                        setSchemaNameInput(next)
                        setEditingSchemaName(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const next = (schemaNameInput || 'Data Extraction Schema').trim()
                          commitSchemaUpdate(activeSchemaId, (schema) => ({
                            ...schema,
                            name: next,
                          }))
                          setSchemaNameInput(next)
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
              <div className="flex flex-wrap items-center gap-2">
                {/* Agent type selector */}
                {!isEmbedded && isSchemaFresh(activeSchema) && (
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
                {!isEmbedded && isSchemaFresh(activeSchema) && selectedAgent === "standard" && (
                  <Select onValueChange={(val) => {
                    if (val === "blank") {
                      // Start from scratch - do nothing, just allow user to add fields
                      return;
                    }
                    applySchemaTemplate(val);
                  }}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Choose starting point" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blank">Start from scratch</SelectItem>
                      {combinedTemplates
                        .filter((t) => t.agentType === "standard")
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                            {t.isCustom ? " (Custom)" : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
                {onCreateTemplate ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={fields.length === 0 || isSavingTemplate}
                    onClick={() => {
                      setTemplateNameInput(activeSchema.name || "New template")
                      setTemplateDescriptionInput("")
                      setIsTemplateDialogOpen(true)
                    }}
                    title={
                      fields.length === 0
                        ? "Add at least one field before saving this schema as a template."
                        : "Save the current schema structure as a reusable template."
                    }
                    className="gap-2"
                  >
                    {isSavingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkle className="h-4 w-4" />}
                    Save template
                  </Button>
                ) : null}
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
                {session?.user ? (
                  <div className="flex items-center gap-3">
                    {isWorkspaceLoading ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Syncing…
                      </span>
                    ) : activeSchemaStatus === 'saving' ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </span>
                    ) : activeSchemaStatus === 'error' ? (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        Save failed
                      </span>
                    ) : activeSchemaUpdatedAt ? (
                      <span className="text-xs text-muted-foreground">
                        Saved {formatDistanceToNow(activeSchemaUpdatedAt, { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">All changes saved</span>
                    )}
                    {activeSchemaStatus === 'error' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryActiveSchema}
                        disabled={isWorkspaceLoading || activeSchemaStatus === 'saving'}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-1">
                    {hasWorkspaceContent && (
                      <span className="text-xs font-medium text-amber-600">
                        Sign in to save your workspace before you leave.
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAuthDialog("sign-in")}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save workspace
                    </Button>
                  </div>
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
            {(loadWorkspaceError || activeSchemaError) && (
              <div className="mt-2 space-y-1">
                {loadWorkspaceError && (
                  <p className="text-sm text-destructive">
                    {loadWorkspaceError}
                  </p>
                )}
                {activeSchemaError && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-destructive">
                      {activeSchemaError}
                    </p>
                    {session?.user && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryActiveSchema}
                        disabled={isWorkspaceLoading || activeSchemaStatus === 'saving'}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
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
                <TanStackGridSheet
                  columns={displayColumns}
                  jobs={sortedJobs}
                  selectedRowId={selectedRowId}
                  onSelectRow={(jobId) => setSelectedRowId(jobId)}
                  onRowDoubleClick={handleRowDoubleClick}
                  onAddColumn={() => addColumn()}
                  renderCellValue={renderCellValue}
                  getStatusIcon={getStatusIcon}
                  renderStatusPill={renderStatusPill}
                  onUpdateCell={(jobId, columnId, value) => {
                    updateSchemaJobs(activeSchemaId, (prev) =>
                      prev.map((job) =>
                        job.id === jobId
                          ? { ...job, results: { ...(job.results || {}), [columnId]: value } }
                          : job,
                      ),
                    )
                    updateReviewStatus(jobId, columnId, "verified", {
                      reason: "Value edited by user",
                    })
                  }}
                  onEditColumn={(column) => {
                    setSelectedColumn(column)
                    setDraftColumn(JSON.parse(JSON.stringify(column)))
                    setColumnDialogMode('edit')
                    setIsColumnDialogOpen(true)
                  }}
                  onDeleteColumn={deleteColumn}
                  onUpdateReviewStatus={updateReviewStatus}
                  onColumnRightClick={handleColumnRightClick}
                  onOpenTableModal={openTableModal}
                  visualGroups={activeSchema.visualGroups || []}
                  expandedRowId={expandedRowId}
                  onToggleRowExpansion={toggleRowExpansion}
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
      {onCreateTemplate ? (
        <Dialog open={isTemplateDialogOpen} onOpenChange={(open) => {
          if (isSavingTemplate) return
          setIsTemplateDialogOpen(open)
        }}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkle className="h-4 w-4" />
                Save as template
              </DialogTitle>
              <DialogDescription>
                Capture the current schema fields and transformations so you can reuse them when creating a new project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template name</Label>
                <Input
                  id="template-name"
                  value={templateNameInput}
                  onChange={(event) => setTemplateNameInput(event.target.value)}
                  placeholder="Invoice – net terms"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description (optional)</Label>
                <Textarea
                  id="template-description"
                  value={templateDescriptionInput}
                  onChange={(event) => setTemplateDescriptionInput(event.target.value)}
                  placeholder="What makes this schema unique or when it should be used?"
                  rows={3}
                />
              </div>
              <div className="rounded-md border border-dashed border-muted-foreground/30 px-3 py-2 text-xs text-muted-foreground">
                {fields.length === 0
                  ? "Templates save the schema layout. Add fields before saving."
                  : `This template will include ${fields.length} ${fields.length === 1 ? "field" : "fields"} along with any transformation settings.`}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTemplateDialogOpen(false)}
                disabled={isSavingTemplate}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleTemplateSave}
                disabled={isSavingTemplate || fields.length === 0 || templateNameInput.trim().length === 0}
              >
                {isSavingTemplate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkle className="mr-2 h-4 w-4" />}
                Save template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <OCRDetailModal
        open={ocrModalJobId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOcrModalJobId(null)
          }
        }}
        job={ocrModalJob}
      />

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
      <AlertDialog
        open={!!schemaDeletionDialog}
        onOpenChange={(open) => {
          if (!open) handleCancelSchemaDeletion()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schema?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <p>
                This will permanently remove "{schemaDeletionDialog?.name ?? "schema"}" and all associated jobs and
                results.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSchemaDeletion}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmSchemaDeletion}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  )
}
