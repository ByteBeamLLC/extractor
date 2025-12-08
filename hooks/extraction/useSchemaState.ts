"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import type { SchemaDefinition, SchemaField } from "@/lib/schema"
import { flattenFields } from "@/lib/schema"
import { createInitialSchemaDefinition } from "@/lib/extraction/schema-helpers"

export interface UseSchemaStateOptions {
  initialSchemaId?: string
}

export interface UseSchemaStateReturn {
  // State
  schemas: SchemaDefinition[]
  activeSchemaId: string
  activeSchema: SchemaDefinition
  displayColumns: SchemaField[]
  
  // Refs
  schemasRef: React.MutableRefObject<SchemaDefinition[]>
  initialSchemaRef: React.MutableRefObject<SchemaDefinition | null>
  
  // Actions
  setSchemas: React.Dispatch<React.SetStateAction<SchemaDefinition[]>>
  setActiveSchemaId: React.Dispatch<React.SetStateAction<string>>
  applySchemaUpdate: (
    schemaId: string,
    updater: (schema: SchemaDefinition) => SchemaDefinition
  ) => SchemaDefinition | null
  
  // Derived state
  hasWorkspaceContent: boolean
}

/**
 * Hook for managing schema state (schemas array, active schema, updates)
 */
export function useSchemaState(options: UseSchemaStateOptions = {}): UseSchemaStateReturn {
  const { initialSchemaId } = options
  
  // Create initial schema
  const initialSchemaRef = useRef<SchemaDefinition | null>(null)
  if (!initialSchemaRef.current) {
    initialSchemaRef.current = createInitialSchemaDefinition()
  }
  
  // Schema state
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([initialSchemaRef.current])
  const schemasRef = useRef<SchemaDefinition[]>([initialSchemaRef.current])
  
  // Keep ref in sync with state
  schemasRef.current = schemas
  
  // Active schema tracking
  const [activeSchemaId, setActiveSchemaId] = useState<string>(
    initialSchemaId || initialSchemaRef.current.id
  )
  
  // Derive active schema
  const activeSchema = useMemo(
    () => schemas.find((s) => s.id === activeSchemaId) || initialSchemaRef.current!,
    [schemas, activeSchemaId]
  )
  
  // Flatten fields for grid display
  const displayColumns = useMemo(
    () => flattenFields(activeSchema.fields),
    [activeSchema.fields]
  )
  
  // Check if workspace has any content
  const hasWorkspaceContent = useMemo(
    () =>
      schemas.some(
        (schema) => (schema.fields?.length ?? 0) > 0 || (schema.jobs?.length ?? 0) > 0
      ),
    [schemas]
  )
  
  // Apply an update to a specific schema
  const applySchemaUpdate = useCallback(
    (
      schemaId: string,
      updater: (schema: SchemaDefinition) => SchemaDefinition
    ): SchemaDefinition | null => {
      let updatedSchema: SchemaDefinition | null = null
      setSchemas((prev) =>
        prev.map((schema) => {
          if (schema.id !== schemaId) return schema
          const draft = { ...schema }
          const updated = updater(draft)
          const next = {
            ...updated,
            updatedAt: new Date(),
            createdAt: updated.createdAt ?? schema.createdAt,
          }
          updatedSchema = next
          return next
        })
      )
      return updatedSchema
    },
    []
  )
  
  return {
    // State
    schemas,
    activeSchemaId,
    activeSchema,
    displayColumns,
    
    // Refs
    schemasRef,
    initialSchemaRef,
    
    // Actions
    setSchemas,
    setActiveSchemaId,
    applySchemaUpdate,
    
    // Derived state
    hasWorkspaceContent,
  }
}

