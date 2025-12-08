"use client"

import { useState, useCallback } from "react"
import type { SchemaField, SchemaDefinition } from "@/lib/schema"
import { updateFieldById, removeFieldById } from "@/lib/schema"
import type { CommitSchemaOptions } from "@/lib/extraction/types"

export interface UseFieldEditorOptions {
  activeSchemaId: string
  displayColumns: SchemaField[]
  commitSchemaUpdate: (
    schemaId: string,
    updater: (schema: SchemaDefinition) => SchemaDefinition,
    options?: CommitSchemaOptions
  ) => SchemaDefinition | null
  setFields: (updater: SchemaField[] | ((prev: SchemaField[]) => SchemaField[])) => SchemaField[] | null
}

export interface UseFieldEditorReturn {
  // State
  selectedColumn: SchemaField | null
  draftColumn: SchemaField | null
  isColumnDialogOpen: boolean
  columnDialogMode: 'create' | 'edit'
  isDraftTransformation: boolean
  
  // Actions
  setSelectedColumn: React.Dispatch<React.SetStateAction<SchemaField | null>>
  setDraftColumn: React.Dispatch<React.SetStateAction<SchemaField | null>>
  setIsColumnDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  setColumnDialogMode: React.Dispatch<React.SetStateAction<'create' | 'edit'>>
  
  // Field operations
  addColumn: () => void
  updateColumn: (columnId: string, updates: Partial<SchemaField>) => void
  deleteColumn: (columnId: string) => void
  handleDraftFieldTypeChange: (isTransformation: boolean) => void
  changeDraftType: (newType: SchemaField['type']) => void
  openEditColumn: (column: SchemaField) => void
  closeColumnDialog: () => void
}

/**
 * Hook for managing field/column editing dialog
 */
export function useFieldEditor(options: UseFieldEditorOptions): UseFieldEditorReturn {
  const {
    activeSchemaId,
    displayColumns,
    commitSchemaUpdate,
    setFields,
  } = options

  // Dialog state
  const [selectedColumn, setSelectedColumn] = useState<SchemaField | null>(null)
  const [draftColumn, setDraftColumn] = useState<SchemaField | null>(null)
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false)
  const [columnDialogMode, setColumnDialogMode] = useState<'create' | 'edit'>('create')
  
  // Derived state
  const isDraftTransformation = !!draftColumn?.isTransformation

  // Add a new column
  const addColumn = useCallback(() => {
    const newColumn: SchemaField = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Column ${displayColumns.length + 1}`,
      type: "string",
      description: "",
      extractionInstructions: "",
      required: false,
    }
    setColumnDialogMode('create')
    setDraftColumn(JSON.parse(JSON.stringify(newColumn)))
    setSelectedColumn(null)
    setIsColumnDialogOpen(true)
  }, [displayColumns.length])

  // Open edit dialog for an existing column
  const openEditColumn = useCallback((column: SchemaField) => {
    setColumnDialogMode('edit')
    setDraftColumn(JSON.parse(JSON.stringify(column)))
    setSelectedColumn(column)
    setIsColumnDialogOpen(true)
  }, [])

  // Close the column dialog
  const closeColumnDialog = useCallback(() => {
    setIsColumnDialogOpen(false)
    setDraftColumn(null)
    setColumnDialogMode('create')
  }, [])

  // Handle toggling between extraction and transformation
  const handleDraftFieldTypeChange = useCallback((isTransformation: boolean) => {
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
      } = prev as SchemaField & {
        transformationType?: unknown
        transformationConfig?: unknown
        transformationSource?: unknown
        transformationSourceColumnId?: unknown
      }
      return {
        ...rest,
        isTransformation: false,
      } as SchemaField
    })
  }, [])

  // Change the data type of the draft column
  const changeDraftType = useCallback((newType: SchemaField['type']) => {
    setDraftColumn((prev) => {
      if (!prev) return prev
      
      const next = { ...prev, type: newType } as SchemaField
      
      // Normalize shape when changing type between leaf/compound kinds
      if (newType === 'object') {
        (next as Record<string, unknown>).children = 
          Array.isArray((next as Record<string, unknown>).children) 
            ? (next as Record<string, unknown>).children 
            : []
        delete (next as Record<string, unknown>).item
        delete (next as Record<string, unknown>).columns
      } else if (newType === 'list') {
        if (!(next as Record<string, unknown>).item) {
          (next as Record<string, unknown>).item = {
            id: `${next.id}_item`,
            name: 'item',
            type: 'string',
            description: '',
            extractionInstructions: '',
            required: false,
          }
        }
        delete (next as Record<string, unknown>).children
        delete (next as Record<string, unknown>).columns
      } else if (newType === 'table') {
        (next as Record<string, unknown>).columns = 
          Array.isArray((next as Record<string, unknown>).columns) 
            ? (next as Record<string, unknown>).columns 
            : []
        delete (next as Record<string, unknown>).children
        delete (next as Record<string, unknown>).item
      } else {
        // Leaf primitive
        delete (next as Record<string, unknown>).children
        delete (next as Record<string, unknown>).item
        delete (next as Record<string, unknown>).columns
      }
      
      return next
    })
  }, [])

  // Update an existing column
  const updateColumn = useCallback(
    (columnId: string, updates: Partial<SchemaField>) => {
      setFields((prev) =>
        updateFieldById(prev, columnId, (f) => {
          const next = { ...f, ...updates } as SchemaField
          
          // Normalize shape when changing type
          if (updates.type && updates.type !== f.type) {
            if (updates.type === 'object') {
              (next as Record<string, unknown>).children = 
                Array.isArray((next as Record<string, unknown>).children) 
                  ? (next as Record<string, unknown>).children 
                  : []
              delete (next as Record<string, unknown>).item
              delete (next as Record<string, unknown>).columns
            } else if (updates.type === 'list') {
              if (!(next as Record<string, unknown>).item) {
                (next as Record<string, unknown>).item = {
                  id: `${next.id}_item`,
                  name: 'item',
                  type: 'string',
                  description: '',
                  extractionInstructions: '',
                  required: false,
                }
              }
              delete (next as Record<string, unknown>).children
              delete (next as Record<string, unknown>).columns
            } else if (updates.type === 'table') {
              (next as Record<string, unknown>).columns = 
                Array.isArray((next as Record<string, unknown>).columns) 
                  ? (next as Record<string, unknown>).columns 
                  : []
              delete (next as Record<string, unknown>).children
              delete (next as Record<string, unknown>).item
            } else {
              // Leaf primitive
              delete (next as Record<string, unknown>).children
              delete (next as Record<string, unknown>).item
              delete (next as Record<string, unknown>).columns
            }
          }
          return next
        })
      )
      
      if (selectedColumn?.id === columnId) {
        setSelectedColumn({ ...selectedColumn, ...updates } as SchemaField)
      }
    },
    [setFields, selectedColumn]
  )

  // Delete a column
  const deleteColumn = useCallback(
    (columnId: string) => {
      commitSchemaUpdate(activeSchemaId, (schema) => {
        const newFields = removeFieldById(schema.fields, columnId)
        const updatedGroups = (schema.visualGroups || [])
          .map((group) => ({
            ...group,
            fieldIds: group.fieldIds.filter((id) => id !== columnId),
          }))
          .filter((group) => group.fieldIds.length > 0)
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
    },
    [activeSchemaId, commitSchemaUpdate, selectedColumn]
  )

  return {
    // State
    selectedColumn,
    draftColumn,
    isColumnDialogOpen,
    columnDialogMode,
    isDraftTransformation,
    
    // Actions
    setSelectedColumn,
    setDraftColumn,
    setIsColumnDialogOpen,
    setColumnDialogMode,
    
    // Field operations
    addColumn,
    updateColumn,
    deleteColumn,
    handleDraftFieldTypeChange,
    changeDraftType,
    openEditColumn,
    closeColumnDialog,
  }
}

