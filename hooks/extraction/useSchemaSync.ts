"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { SchemaDefinition } from "@/lib/schema"
import type { Database } from "@/lib/supabase/types"
import type { SchemaSyncInfo, CommitSchemaOptions } from "@/lib/extraction/types"
import {
  schemaDefinitionToRow,
  extractionJobToRow,
  schemaRowToDefinition,
  createInitialSchemaDefinition,
} from "@/lib/extraction/schema-helpers"

export interface UseSchemaSyncOptions {
  userId: string | undefined
  supabase: SupabaseClient<Database>
  schemas: SchemaDefinition[]
  setSchemas: React.Dispatch<React.SetStateAction<SchemaDefinition[]>>
  setActiveSchemaId: React.Dispatch<React.SetStateAction<string>>
  applySchemaUpdate: (
    schemaId: string,
    updater: (schema: SchemaDefinition) => SchemaDefinition
  ) => SchemaDefinition | null
  openAuthDialog: (mode: "sign-in" | "sign-up") => void
}

export interface UseSchemaSyncReturn {
  // State
  schemaSyncState: Record<string, SchemaSyncInfo>
  isWorkspaceLoading: boolean
  loadWorkspaceError: string | null
  
  // Refs
  schemaSyncStateRef: React.MutableRefObject<Record<string, SchemaSyncInfo>>
  lastLoadedUserIdRef: React.MutableRefObject<string | null>
  guestSchemasRef: React.MutableRefObject<SchemaDefinition[] | null>
  hasInitialLoadCompletedRef: React.MutableRefObject<boolean>
  
  // Actions
  setSchemaSyncState: React.Dispatch<React.SetStateAction<Record<string, SchemaSyncInfo>>>
  syncSchema: (schema: SchemaDefinition, opts?: { includeJobs?: boolean }) => Promise<void>
  deleteSchemaRecord: (schemaId: string) => Promise<void>
  commitSchemaUpdate: (
    schemaId: string,
    updater: (schema: SchemaDefinition) => SchemaDefinition,
    options?: CommitSchemaOptions
  ) => SchemaDefinition | null
}

/**
 * Hook for syncing schemas with Supabase
 */
export function useSchemaSync(options: UseSchemaSyncOptions): UseSchemaSyncReturn {
  const {
    userId,
    supabase,
    schemas,
    setSchemas,
    setActiveSchemaId,
    applySchemaUpdate,
    openAuthDialog,
  } = options

  // Sync state
  const [schemaSyncState, setSchemaSyncState] = useState<Record<string, SchemaSyncInfo>>({})
  const schemaSyncStateRef = useRef<Record<string, SchemaSyncInfo>>({})
  
  // Loading state
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false)
  const [loadWorkspaceError, setLoadWorkspaceError] = useState<string | null>(null)
  
  // Tracking refs
  const lastLoadedUserIdRef = useRef<string | null>(null)
  const guestSchemasRef = useRef<SchemaDefinition[] | null>(null)
  const hasInitialLoadCompletedRef = useRef(false)

  // Keep sync state ref updated
  useEffect(() => {
    schemaSyncStateRef.current = schemaSyncState
  }, [schemaSyncState])

  // Track guest schemas
  useEffect(() => {
    if (!userId) {
      guestSchemasRef.current = schemas
    }
  }, [schemas, userId])

  // Sync a single schema to Supabase
  const syncSchema = useCallback(
    async (schema: SchemaDefinition, opts?: { includeJobs?: boolean }) => {
      if (!userId) {
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

      const includeJobs = opts?.includeJobs ?? false

      try {
        const schemaRow = schemaDefinitionToRow(schema, userId)
        await supabase.from("schemas").upsert([schemaRow])

        if (includeJobs) {
          const jobRows = (schema.jobs ?? []).map((job) =>
            extractionJobToRow(job, schema.id, userId)
          )

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
            await supabase
              .from("extraction_jobs")
              .delete()
              .eq("schema_id", schema.id)
              .eq("user_id", userId)
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
    [userId, supabase, openAuthDialog]
  )

  // Delete a schema from Supabase
  const deleteSchemaRecord = useCallback(
    async (schemaId: string) => {
      if (!userId) return
      
      setSchemaSyncState((prev) => ({
        ...prev,
        [schemaId]: {
          status: 'saving',
          updatedAt: prev[schemaId]?.updatedAt,
        },
      }))
      
      try {
        await supabase
          .from("extraction_jobs")
          .delete()
          .eq("schema_id", schemaId)
          .eq("user_id", userId)
        await supabase
          .from("schemas")
          .delete()
          .eq("id", schemaId)
          .eq("user_id", userId)
        
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
    [userId, supabase]
  )

  // Apply update and sync to Supabase
  const commitSchemaUpdate = useCallback(
    (
      schemaId: string,
      updater: (schema: SchemaDefinition) => SchemaDefinition,
      commitOptions?: CommitSchemaOptions
    ) => {
      const updated = applySchemaUpdate(schemaId, updater)
      const shouldPersist = commitOptions?.persistSchema ?? true
      const includeJobs = commitOptions?.includeJobs ?? false
      
      if (updated && userId && shouldPersist) {
        void syncSchema(updated, { includeJobs })
      }
      
      return updated
    },
    [applySchemaUpdate, userId, syncSchema]
  )

  // Load workspace from Supabase when user logs in
  useEffect(() => {
    if (!userId) {
      lastLoadedUserIdRef.current = null
      const fresh = createInitialSchemaDefinition()
      setSchemas([fresh])
      setActiveSchemaId(fresh.id)
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

        if (schemaError) throw schemaError

        const { data: jobRows, error: jobError } = await supabase
          .from("extraction_jobs")
          .select("*")
          .eq("user_id", userId)

        if (jobError) throw jobError

        const schemaData = schemaRows ?? []
        const jobData = jobRows ?? []

        const guestSchemas = guestSchemasRef.current
        const hasLocalWorkspace =
          Array.isArray(guestSchemas) &&
          guestSchemas.some(
            (schema) => (schema.fields?.length ?? 0) > 0 || (schema.jobs?.length ?? 0) > 0
          )

        if (schemaData.length === 0 && hasLocalWorkspace) {
          if (cancelled) return
          lastLoadedUserIdRef.current = userId
          hasInitialLoadCompletedRef.current = true
          setSchemaSyncState({})
          setIsWorkspaceLoading(false)
          return
        }

        const remoteSchemas =
          schemaData.length > 0
            ? schemaData.map((row) => schemaRowToDefinition(row, jobData))
            : [createInitialSchemaDefinition()]

        if (cancelled) return

        setSchemas(remoteSchemas)
        setActiveSchemaId(remoteSchemas[0].id)
        lastLoadedUserIdRef.current = userId
        hasInitialLoadCompletedRef.current = true
        
        // Initialize sync state for loaded schemas
        const initialSyncState: Record<string, SchemaSyncInfo> = {}
        remoteSchemas.forEach((schema) => {
          initialSyncState[schema.id] = {
            status: 'idle',
            updatedAt: schema.updatedAt,
          }
        })
        setSchemaSyncState(initialSyncState)
        
      } catch (error) {
        console.error('Failed to load workspace', error)
        if (!cancelled) {
          setLoadWorkspaceError(
            error instanceof Error ? error.message : 'Failed to load workspace.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsWorkspaceLoading(false)
        }
      }
    }

    void loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [userId, supabase, setSchemas, setActiveSchemaId])

  return {
    // State
    schemaSyncState,
    isWorkspaceLoading,
    loadWorkspaceError,
    
    // Refs
    schemaSyncStateRef,
    lastLoadedUserIdRef,
    guestSchemasRef,
    hasInitialLoadCompletedRef,
    
    // Actions
    setSchemaSyncState,
    syncSchema,
    deleteSchemaRecord,
    commitSchemaUpdate,
  }
}

