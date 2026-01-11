"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Database } from "@/lib/supabase/types"
import type { SchemaDefinition, SchemaField } from "@/lib/schema"
import type { SchemaTemplateDefinition } from "@/lib/schema-templates"
import { getStaticSchemaTemplates, cloneSchemaFields } from "@/lib/schema-templates"
import type { AgentType } from "../types"
import { readGuestTemplates, writeGuestTemplates } from "./guestStorage"

export interface UseWorkspaceTemplatesResult {
  templates: SchemaTemplateDefinition[]
  templateMap: Map<string, SchemaTemplateDefinition>
  isLoadingTemplates: boolean
  loadTemplatesError: string | null
  refreshTemplates: () => Promise<void>
  createTemplateFromSchema: (
    schema: SchemaDefinition,
    options: { name: string; description?: string; agent: AgentType }
  ) => Promise<
    { success: true; template: SchemaTemplateDefinition } | { success: false; error: string }
  >
}

export function useWorkspaceTemplates(): UseWorkspaceTemplatesResult {
  const session = useSession()
  const supabase = useSupabaseClient<Database>()

  const [customTemplates, setCustomTemplates] = useState<SchemaTemplateDefinition[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [loadTemplatesError, setLoadTemplatesError] = useState<string | null>(null)

  const staticTemplates = useMemo(
    () => getStaticSchemaTemplates(session?.user?.email),
    [session?.user?.email]
  )

  const templates = useMemo(() => {
    const seen = new Map<string, SchemaTemplateDefinition>()
    for (const tpl of staticTemplates) {
      seen.set(tpl.id, tpl)
    }
    for (const tpl of customTemplates) {
      seen.set(tpl.id, tpl)
    }
    return Array.from(seen.values())
  }, [staticTemplates, customTemplates])

  const templateMap = useMemo(() => {
    const map = new Map<string, SchemaTemplateDefinition>()
    templates.forEach((template) => {
      map.set(template.id, template)
    })
    return map
  }, [templates])

  const mapTemplateRow = useCallback(
    (row: Database["public"]["Tables"]["schema_templates"]["Row"]): SchemaTemplateDefinition => ({
      id: row.id,
      name: row.name,
      description: row.description,
      agentType: row.agent_type === "pharma" ? "pharma" : "standard",
      fields: cloneSchemaFields((Array.isArray(row.fields) ? row.fields : []) as SchemaField[]),
      ownerId: row.user_id,
      isCustom: !(row.is_public ?? false),
      allowedDomains: row.allowed_domains,
      allowedEmails: row.allowed_emails,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    }),
    []
  )

  const fetchTemplates = useCallback(async () => {
    if (!session?.user?.id) {
      const guestTemplates = readGuestTemplates()
      setCustomTemplates(guestTemplates)
      setIsLoadingTemplates(false)
      setLoadTemplatesError(null)
      return
    }

    setIsLoadingTemplates(true)
    setLoadTemplatesError(null)

    const { data, error } = await supabase
      .from("schema_templates")
      .select(
        "id,name,description,agent_type,fields,allowed_domains,allowed_emails,is_public,created_at,updated_at,user_id"
      )
      .order("updated_at", { ascending: false })

    if (error) {
      setLoadTemplatesError(error.message)
      setCustomTemplates([])
    } else {
      const mapped =
        data?.map((row) =>
          mapTemplateRow(row as Database["public"]["Tables"]["schema_templates"]["Row"])
        ) ?? []
      setCustomTemplates(mapped)
      setLoadTemplatesError(null)
    }

    setIsLoadingTemplates(false)
  }, [mapTemplateRow, session?.user?.id, supabase])

  useEffect(() => {
    void fetchTemplates()
  }, [fetchTemplates])

  const refreshTemplates = useCallback(async () => {
    await fetchTemplates()
  }, [fetchTemplates])

  const createTemplateFromSchema = useCallback(
    async (
      schema: SchemaDefinition,
      options: { name: string; description?: string; agent: AgentType }
    ): Promise<
      { success: true; template: SchemaTemplateDefinition } | { success: false; error: string }
    > => {
      const templateName = options.name.trim() || schema.name || "Untitled template"
      const templateDescription = options.description?.trim() ?? ""
      const fields = cloneSchemaFields(schema.fields ?? [])
      const now = new Date()
      setLoadTemplatesError(null)

      if (!session?.user?.id) {
        const id =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `guest-template-${Date.now()}`
        const guestTemplate: SchemaTemplateDefinition = {
          id,
          name: templateName,
          description: templateDescription.length > 0 ? templateDescription : null,
          agentType: options.agent,
          fields,
          isCustom: true,
          ownerId: null,
          createdAt: now,
          updatedAt: now,
        }
        setCustomTemplates((prev) => {
          const next = [guestTemplate, ...prev]
          writeGuestTemplates(next)
          return next
        })
        return { success: true, template: guestTemplate }
      }

      setIsLoadingTemplates(true)
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const payload: Database["public"]["Tables"]["schema_templates"]["Insert"] = {
        id,
        user_id: session.user.id,
        name: templateName,
        description: templateDescription.length > 0 ? templateDescription : null,
        agent_type: options.agent,
        fields: fields as unknown as Database["public"]["Tables"]["schema_templates"]["Insert"]["fields"],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }

      const { data, error } = await supabase
        .from("schema_templates")
        .insert(payload)
        .select(
          "id,name,description,agent_type,fields,allowed_domains,allowed_emails,is_public,created_at,updated_at,user_id"
        )
        .single()

      setIsLoadingTemplates(false)

      if (error || !data) {
        const message = error?.message ?? "Failed to create template"
        setLoadTemplatesError(message)
        return { success: false, error: message }
      }

      setLoadTemplatesError(null)
      const template = mapTemplateRow(
        data as Database["public"]["Tables"]["schema_templates"]["Row"]
      )
      setCustomTemplates((prev) => [template, ...prev])
      return { success: true, template }
    },
    [mapTemplateRow, session?.user?.id, supabase]
  )

  return {
    templates,
    templateMap,
    isLoadingTemplates,
    loadTemplatesError,
    refreshTemplates,
    createTemplateFromSchema,
  }
}
