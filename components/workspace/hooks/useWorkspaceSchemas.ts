"use client"

import { useCallback, useState } from "react"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Database } from "@/lib/supabase/types"
import type { SchemaDefinition } from "@/lib/schema"
import type { SchemaTemplateDefinition } from "@/lib/schema-templates"
import type { AgentType, SchemaSummary } from "../types"
import { PLACEHOLDER_SCHEMAS } from "./workspaceConstants"

export interface PendingSchemaCreate {
  id: string
  name: string
  templateId?: string | null
  agent: AgentType
}

export interface UseWorkspaceSchemasResult {
  schemas: SchemaSummary[]
  isLoadingSchemas: boolean
  loadSchemasError: string | null
  pendingSchemaCreate: PendingSchemaCreate | null
  refreshSchemas: () => Promise<void>
  createSchema: (options: {
    name: string
    agent: AgentType
    templateId?: string | null
  }) => Promise<SchemaSummary | null>
  syncSchemasFromEditor: (definitions: SchemaDefinition[]) => void
  clearPendingSchemaCreate: () => void
  decorateSummaryWithTemplate: (summary: SchemaSummary) => SchemaSummary
  setSchemas: React.Dispatch<React.SetStateAction<SchemaSummary[]>>
}

function mapDefinitionToSummary(
  definition: SchemaDefinition,
  options?: { templateDisplayName?: string | null }
): SchemaSummary {
  const name = definition.name || "Data Extraction Schema"
  const agent: AgentType =
    definition.templateId && definition.templateId.startsWith("pharma") ? "pharma" : "standard"
  return {
    id: definition.id,
    name,
    tabTitle: name,
    templateId: definition.templateId ?? undefined,
    templateDisplayName: options?.templateDisplayName ?? undefined,
    agentType: agent,
    lastModified: definition.updatedAt ?? definition.createdAt,
    thumbnailUrl: undefined,
  }
}

export function useWorkspaceSchemas(
  templateMap: Map<string, SchemaTemplateDefinition>,
  onSchemasChange?: (schemas: SchemaSummary[]) => void
): UseWorkspaceSchemasResult {
  const session = useSession()
  const supabase = useSupabaseClient<Database>()

  const [schemas, setSchemas] = useState<SchemaSummary[]>([])
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false)
  const [loadSchemasError, setLoadSchemasError] = useState<string | null>(null)
  const [pendingSchemaCreate, setPendingSchemaCreate] = useState<PendingSchemaCreate | null>(null)

  const decorateSummaryWithTemplate = useCallback(
    (summary: SchemaSummary): SchemaSummary => {
      const templateId = summary.templateId ?? null
      if (!templateId) {
        if (summary.templateDisplayName == null) {
          return summary
        }
        if (summary.templateDisplayName === undefined) {
          return summary
        }
        return { ...summary, templateDisplayName: undefined }
      }
      const template = templateMap.get(templateId)
      const displayName = template?.name ?? null
      if ((displayName ?? undefined) === summary.templateDisplayName) {
        return summary
      }
      return {
        ...summary,
        templateDisplayName: displayName ?? undefined,
      }
    },
    [templateMap]
  )

  const fetchSchemas = useCallback(async () => {
    if (!session?.user?.id) {
      setSchemas(PLACEHOLDER_SCHEMAS)
      onSchemasChange?.(PLACEHOLDER_SCHEMAS)
      return
    }

    setIsLoadingSchemas(true)
    setLoadSchemasError(null)

    const { data, error } = await supabase
      .from("schemas")
      .select("id,name,template_id,updated_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      setLoadSchemasError(error.message)
      setSchemas([])
    } else {
      const mapped: SchemaSummary[] =
        data?.map((row) => {
          const templateId = row.template_id ?? undefined
          const templateName = templateId ? templateMap.get(templateId)?.name ?? null : null
          return mapDefinitionToSummary(
            {
              id: row.id,
              name: row.name ?? "Data Extraction Schema",
              fields: [],
              jobs: [],
              templateId,
              createdAt: row.updated_at ? new Date(row.updated_at) : undefined,
              updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
            } as SchemaDefinition,
            { templateDisplayName: templateName }
          )
        }) ?? []
      setSchemas(mapped)
      onSchemasChange?.(mapped)
    }

    setIsLoadingSchemas(false)
  }, [session?.user?.id, supabase, templateMap, onSchemasChange])

  const refreshSchemas = useCallback(async () => {
    await fetchSchemas()
  }, [fetchSchemas])

  const syncSchemasFromEditor = useCallback(
    (definitions: SchemaDefinition[]) => {
      if (!definitions || definitions.length === 0) {
        setSchemas([])
        return
      }
      const summaries = definitions.map((definition) =>
        mapDefinitionToSummary(definition, {
          templateDisplayName: definition.templateId
            ? templateMap.get(definition.templateId)?.name ?? null
            : undefined,
        })
      )
      setSchemas(summaries)
      onSchemasChange?.(summaries)
    },
    [templateMap, onSchemasChange]
  )

  const createSchema = useCallback(
    async ({
      name,
      agent,
      templateId,
    }: {
      name: string
      agent: AgentType
      templateId?: string | null
    }) => {
      const schemaName = name.trim() || "Untitled schema"
      const now = new Date()
      const resolvedTemplateId = templateId ?? null
      const templateDisplayName =
        resolvedTemplateId && resolvedTemplateId !== ""
          ? templateMap.get(resolvedTemplateId)?.name ?? null
          : undefined

      if (!session?.user?.id) {
        const id = `guest-${Date.now()}`
        const summary: SchemaSummary = {
          id,
          name: schemaName,
          tabTitle: schemaName,
          agentType: agent,
          templateId: resolvedTemplateId ?? undefined,
          templateDisplayName,
          lastModified: now,
          thumbnailUrl: null,
        }
        setSchemas((prev) => [summary, ...prev])
        return summary
      }

      const userId = session.user.id
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const payload: Database["public"]["Tables"]["schemas"]["Insert"] = {
        id,
        user_id: userId,
        name: schemaName,
        fields: [],
        template_id: resolvedTemplateId,
        visual_groups: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }

      const { error } = await supabase.from("schemas").upsert(payload)
      if (error) {
        setLoadSchemasError(error.message)
        return null
      }

      setLoadSchemasError(null)
      const summary: SchemaSummary = {
        id,
        name: schemaName,
        tabTitle: schemaName,
        agentType: agent,
        templateId: resolvedTemplateId ?? undefined,
        templateDisplayName,
        lastModified: now,
        thumbnailUrl: null,
      }

      setSchemas((prev) => [summary, ...prev])
      setPendingSchemaCreate({
        id,
        name: schemaName,
        agent,
        templateId: resolvedTemplateId,
      })
      return summary
    },
    [session?.user?.id, supabase, templateMap]
  )

  const clearPendingSchemaCreate = useCallback(() => {
    setPendingSchemaCreate(null)
  }, [])

  return {
    schemas,
    isLoadingSchemas,
    loadSchemasError,
    pendingSchemaCreate,
    refreshSchemas,
    createSchema,
    syncSchemasFromEditor,
    clearPendingSchemaCreate,
    decorateSummaryWithTemplate,
    setSchemas,
  }
}
