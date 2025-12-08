"use client"

import { useState, useCallback } from "react"
import type { ExtractionJob, SchemaDefinition } from "@/lib/schema"
import type { AgentType } from "@/lib/extraction/types"
import type { CollapseState } from "@/components/features/extraction/components/FnBResultsView"

export interface UseExtractionUIOptions {
  initialAgent?: AgentType
  initialViewMode?: 'grid' | 'gallery' | 'mission-control'
}

export interface UseExtractionUIReturn {
  // View mode
  viewMode: 'grid' | 'gallery' | 'mission-control'
  setViewMode: (mode: 'grid' | 'gallery' | 'mission-control') => void
  showGallery: boolean
  setShowGallery: (show: boolean) => void

  // Agent selection
  selectedAgent: AgentType
  setSelectedAgent: (agent: AgentType) => void

  // Job selection
  selectedJob: ExtractionJob | null
  setSelectedJob: (job: ExtractionJob | null) => void
  selectedRowId: string | null
  setSelectedRowId: (id: string | null) => void

  // Detail view
  isDetailOpen: boolean
  setIsDetailOpen: (open: boolean) => void

  // Row expansion
  expandedRowId: string | null
  setExpandedRowId: (id: string | null) => void
  toggleRowExpansion: (rowId: string | null) => void

  // Dialogs
  isManualRecordOpen: boolean
  setIsManualRecordOpen: (open: boolean) => void
  isTemplateSelectorOpen: boolean
  setIsTemplateSelectorOpen: (open: boolean) => void
  isTemplateDialogOpen: boolean
  setIsTemplateDialogOpen: (open: boolean) => void

  // Label Maker
  labelMakerJob: ExtractionJob | null
  setLabelMakerJob: (job: ExtractionJob | null) => void
  isLabelMakerNewRecord: boolean
  setIsLabelMakerNewRecord: (isNew: boolean) => void

  // Pharma editing
  pharmaEditingSection: string | null
  setPharmaEditingSection: (section: string | null) => void
  pharmaEditedValues: Record<string, string>
  setPharmaEditedValues: (values: Record<string, string>) => void

  // F&B collapse state
  fnbCollapse: Record<string, CollapseState>
  setFnbCollapse: React.Dispatch<React.SetStateAction<Record<string, CollapseState>>>
  toggleFnbEnglish: (jobId: string) => void
  toggleFnbArabic: (jobId: string) => void

  // Column selection (for grouping)
  selectedColumnIds: Set<string>
  setSelectedColumnIds: (ids: Set<string>) => void
  isGroupDialogOpen: boolean
  setIsGroupDialogOpen: (open: boolean) => void
  groupName: string
  setGroupName: (name: string) => void

  // Context menu
  contextMenuColumn: string | null
  setContextMenuColumn: (id: string | null) => void
  contextMenuPosition: { x: number; y: number } | null
  setContextMenuPosition: (pos: { x: number; y: number } | null) => void

  // Table modal
  tableModalOpen: boolean
  setTableModalOpen: (open: boolean) => void
  tableModalData: {
    column: unknown
    job: ExtractionJob | null
    rows: Record<string, unknown>[]
    columnHeaders: Array<{ key: string; label: string }>
  } | null
  setTableModalData: (data: {
    column: unknown
    job: ExtractionJob | null
    rows: Record<string, unknown>[]
    columnHeaders: Array<{ key: string; label: string }>
  } | null) => void
  openTableModal: (
    column: unknown,
    job: ExtractionJob,
    rows: Record<string, unknown>[],
    columnHeaders: Array<{ key: string; label: string }>
  ) => void
  closeTableModal: () => void

  // Schema name editing
  editingSchemaName: boolean
  setEditingSchemaName: (editing: boolean) => void
  schemaNameInput: string
  setSchemaNameInput: (name: string) => void

  // Template saving
  templateNameInput: string
  setTemplateNameInput: (name: string) => void
  templateDescriptionInput: string
  setTemplateDescriptionInput: (description: string) => void
  isSavingTemplate: boolean
  setIsSavingTemplate: (saving: boolean) => void
}

/**
 * Hook for managing extraction UI state
 * Consolidates view mode, dialogs, selections, and other UI concerns
 */
export function useExtractionUI(options: UseExtractionUIOptions = {}): UseExtractionUIReturn {
  const {
    initialAgent = "standard",
    initialViewMode = "grid",
  } = options

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'gallery' | 'mission-control'>(initialViewMode)
  const [showGallery, setShowGallery] = useState(true)

  // Agent selection
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(initialAgent)

  // Job selection
  const [selectedJob, setSelectedJob] = useState<ExtractionJob | null>(null)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  // Detail view
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Row expansion
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  const toggleRowExpansion = useCallback((rowId: string | null) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId))
  }, [])

  // Dialogs
  const [isManualRecordOpen, setIsManualRecordOpen] = useState(false)
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)

  // Label Maker
  const [labelMakerJob, setLabelMakerJob] = useState<ExtractionJob | null>(null)
  const [isLabelMakerNewRecord, setIsLabelMakerNewRecord] = useState(false)

  // Pharma editing
  const [pharmaEditingSection, setPharmaEditingSection] = useState<string | null>(null)
  const [pharmaEditedValues, setPharmaEditedValues] = useState<Record<string, string>>({})

  // F&B collapse state
  const [fnbCollapse, setFnbCollapse] = useState<Record<string, CollapseState>>({})

  const toggleFnbEnglish = useCallback((jobId: string) => {
    setFnbCollapse((prev) => ({
      ...prev,
      [jobId]: {
        ...(prev[jobId] || { en: false, ar: false }),
        en: !(prev[jobId]?.en ?? false),
      },
    }))
  }, [])

  const toggleFnbArabic = useCallback((jobId: string) => {
    setFnbCollapse((prev) => ({
      ...prev,
      [jobId]: {
        ...(prev[jobId] || { en: false, ar: false }),
        ar: !(prev[jobId]?.ar ?? false),
      },
    }))
  }, [])

  // Column selection (for grouping)
  const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(new Set())
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState<string>('')

  // Context menu
  const [contextMenuColumn, setContextMenuColumn] = useState<string | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)

  // Table modal
  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [tableModalData, setTableModalData] = useState<{
    column: unknown
    job: ExtractionJob | null
    rows: Record<string, unknown>[]
    columnHeaders: Array<{ key: string; label: string }>
  } | null>(null)

  const openTableModal = useCallback((
    column: unknown,
    job: ExtractionJob,
    rows: Record<string, unknown>[],
    columnHeaders: Array<{ key: string; label: string }>
  ) => {
    setTableModalData({ column, job, rows, columnHeaders })
    setTableModalOpen(true)
  }, [])

  const closeTableModal = useCallback(() => {
    setTableModalOpen(false)
    setTableModalData(null)
  }, [])

  // Schema name editing
  const [editingSchemaName, setEditingSchemaName] = useState(false)
  const [schemaNameInput, setSchemaNameInput] = useState<string>("")

  // Template saving
  const [templateNameInput, setTemplateNameInput] = useState<string>("")
  const [templateDescriptionInput, setTemplateDescriptionInput] = useState<string>("")
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

  return {
    // View mode
    viewMode,
    setViewMode,
    showGallery,
    setShowGallery,

    // Agent selection
    selectedAgent,
    setSelectedAgent,

    // Job selection
    selectedJob,
    setSelectedJob,
    selectedRowId,
    setSelectedRowId,

    // Detail view
    isDetailOpen,
    setIsDetailOpen,

    // Row expansion
    expandedRowId,
    setExpandedRowId,
    toggleRowExpansion,

    // Dialogs
    isManualRecordOpen,
    setIsManualRecordOpen,
    isTemplateSelectorOpen,
    setIsTemplateSelectorOpen,
    isTemplateDialogOpen,
    setIsTemplateDialogOpen,

    // Label Maker
    labelMakerJob,
    setLabelMakerJob,
    isLabelMakerNewRecord,
    setIsLabelMakerNewRecord,

    // Pharma editing
    pharmaEditingSection,
    setPharmaEditingSection,
    pharmaEditedValues,
    setPharmaEditedValues,

    // F&B collapse state
    fnbCollapse,
    setFnbCollapse,
    toggleFnbEnglish,
    toggleFnbArabic,

    // Column selection
    selectedColumnIds,
    setSelectedColumnIds,
    isGroupDialogOpen,
    setIsGroupDialogOpen,
    groupName,
    setGroupName,

    // Context menu
    contextMenuColumn,
    setContextMenuColumn,
    contextMenuPosition,
    setContextMenuPosition,

    // Table modal
    tableModalOpen,
    setTableModalOpen,
    tableModalData,
    setTableModalData,
    openTableModal,
    closeTableModal,

    // Schema name editing
    editingSchemaName,
    setEditingSchemaName,
    schemaNameInput,
    setSchemaNameInput,

    // Template saving
    templateNameInput,
    setTemplateNameInput,
    templateDescriptionInput,
    setTemplateDescriptionInput,
    isSavingTemplate,
    setIsSavingTemplate,
  }
}

