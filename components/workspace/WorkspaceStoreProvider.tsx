"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Database } from "@/lib/supabase/types"

import type { AgentType, SchemaSummary, WorkspaceTab } from "./types"
import type { SchemaDefinition, SchemaField } from "@/lib/schema"
import type { SchemaTemplateDefinition } from "@/lib/schema-templates"
import { getStaticSchemaTemplates, cloneSchemaFields } from "@/lib/schema-templates"

type WorkspaceStoreValue = {
  schemas: SchemaSummary[]
  isLoadingSchemas: boolean
  loadSchemasError: string | null
  tabs: WorkspaceTab[]
  activeTabId: string
  setActiveTab: (tabId: string) => void
  openSchemaTab: (schemaId: string) => void
  closeTab: (tabId: string) => void
  refreshSchemas: () => Promise<void>
  createSchema: (options: { name: string; agent: AgentType; templateId?: string | null }) => Promise<SchemaSummary | null>
  syncSchemasFromEditor: (definitions: SchemaDefinition[]) => void
  templates: SchemaTemplateDefinition[]
  isLoadingTemplates: boolean
  loadTemplatesError: string | null
  refreshTemplates: () => Promise<void>
  createTemplateFromSchema: (
    schema: SchemaDefinition,
    options: { name: string; description?: string; agent: AgentType },
  ) => Promise<{ success: true; template: SchemaTemplateDefinition } | { success: false; error: string }>
  pendingSchemaCreate: PendingSchemaCreate | null
  clearPendingSchemaCreate: () => void
}

const WorkspaceStoreContext = createContext<WorkspaceStoreValue | undefined>(undefined)

const HOME_TAB: WorkspaceTab = {
  id: "home",
  type: "home",
  title: "Home",
  closable: false,
}

const PLACEHOLDER_SCHEMAS: SchemaSummary[] = [
  {
    id: "demo-invoice",
    name: "Invoice extraction",
    tabTitle: "Invoice project",
    templateId: "invoice-nested",
    templateDisplayName: "Invoice",
    agentType: "standard",
    lastModified: new Date(Date.now() - 60 * 60 * 1000),
    thumbnailUrl: null,
  },
  {
    id: "demo-pharma",
    name: "Pharma RA Artwork",
    tabTitle: "RA artwork audit",
    templateId: "pharma-artwork",
    templateDisplayName: "Pharma Artwork",
    agentType: "pharma",
    lastModified: new Date(Date.now() - 6 * 60 * 60 * 1000),
    thumbnailUrl: null,
  },
]

const LOCAL_TEMPLATE_STORAGE_KEY = "workspace_custom_templates_v1"
const LOCAL_TABS_STORAGE_KEY = "workspace_tabs_v1"

function mapDefinitionToSummary(
  definition: SchemaDefinition,
  options?: { templateDisplayName?: string | null },
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

function updateTabsWithSummaries(tabs: WorkspaceTab[], summaries: SchemaSummary[]): WorkspaceTab[] {
  return tabs.map((tab) => {
    if (tab.type !== "schema") return tab
    const summary = summaries.find((schema) => schema.id === tab.schemaId)
    if (!summary) return tab
    return {
      ...tab,
      title: summary.tabTitle ?? summary.name,
      templateId: summary.templateId,
      agentType: summary.agentType,
    }
  })
}

type PendingSchemaCreate = {
  id: string
  name: string
  templateId?: string | null
  agent: AgentType
}

function readGuestTemplates(): SchemaTemplateDefinition[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(LOCAL_TEMPLATE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item: any) => {
        const candidateId =
          typeof item?.id === "string"
            ? item.id
            : typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `guest-template-${Date.now()}`
        const name = typeof item?.name === "string" ? item.name : "Untitled template"
        const fieldsValue = Array.isArray(item?.fields) ? (item.fields as SchemaField[]) : []
        return {
          id: candidateId,
          name,
          description: typeof item?.description === "string" ? item.description : null,
          agentType: item?.agentType === "pharma" ? "pharma" : "standard",
          fields: cloneSchemaFields(fieldsValue),
          isCustom: true,
          ownerId: null,
          createdAt: item?.createdAt ? new Date(item.createdAt) : undefined,
          updatedAt: item?.updatedAt ? new Date(item.updatedAt) : undefined,
        } as SchemaTemplateDefinition
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

function writeGuestTemplates(templates: SchemaTemplateDefinition[]) {
  if (typeof window === "undefined") return
  try {
    const payload = templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description ?? null,
      agentType: template.agentType,
      fields: template.fields,
      createdAt: template.createdAt ? template.createdAt.toISOString() : null,
      updatedAt: template.updatedAt ? template.updatedAt.toISOString() : null,
    }))
    window.localStorage.setItem(LOCAL_TEMPLATE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage errors (private browsing, quota, etc.)
  }
}

function readGuestTabs(): WorkspaceTab[] {
  if (typeof window === "undefined") return [HOME_TAB]
  try {
    const raw = window.localStorage.getItem(LOCAL_TABS_STORAGE_KEY)
    if (!raw) return [HOME_TAB]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [HOME_TAB]
    // Validate and filter tabs - ensure home tab exists
    const tabs = parsed.filter((tab: any) => {
      if (tab.id === "home") {
        return tab.type === "home" && typeof tab.title === "string"
      }
      return (
        tab.type === "schema" &&
        typeof tab.id === "string" &&
        typeof tab.schemaId === "string" &&
        typeof tab.title === "string"
      )
    }) as WorkspaceTab[]
    // Ensure home tab exists
    if (!tabs.some((tab) => tab.id === "home")) {
      return [HOME_TAB, ...tabs]
    }
    return tabs
  } catch {
    return [HOME_TAB]
  }
}

function writeGuestTabs(tabs: WorkspaceTab[]) {
  if (typeof window === "undefined") return
  try {
    // Only save non-home tabs for guests, or all tabs if needed
    const payload = tabs.map((tab) => ({
      id: tab.id,
      type: tab.type,
      schemaId: tab.type === "schema" ? tab.schemaId : undefined,
      title: tab.title,
      templateId: tab.type === "schema" ? tab.templateId : undefined,
      agentType: tab.type === "schema" ? tab.agentType : undefined,
      closable: tab.closable,
      lastOpenedAt: tab.type === "schema" ? tab.lastOpenedAt : undefined,
    }))
    window.localStorage.setItem(LOCAL_TABS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage errors (private browsing, quota, etc.)
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode } = { children: null }) {
  const session = useSession()
  const supabase = useSupabaseClient<Database>()

  const [schemas, setSchemas] = useState<SchemaSummary[]>([])
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false)
  const [loadSchemasError, setLoadSchemasError] = useState<string | null>(null)

  const [tabs, setTabs] = useState<WorkspaceTab[]>([HOME_TAB])
  const [activeTabId, setActiveTabId] = useState<string>(HOME_TAB.id)
  const [pendingSchemaCreate, setPendingSchemaCreate] = useState<PendingSchemaCreate | null>(null)
  const [customTemplates, setCustomTemplates] = useState<SchemaTemplateDefinition[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [loadTemplatesError, setLoadTemplatesError] = useState<string | null>(null)
  const staticTemplates = useMemo(() => getStaticSchemaTemplates(session?.user?.email), [session?.user?.email])
  const templates = useMemo(
    () => {
      const seen = new Map<string, SchemaTemplateDefinition>()
      for (const tpl of staticTemplates) {
        seen.set(tpl.id, tpl)
      }
      for (const tpl of customTemplates) {
        seen.set(tpl.id, tpl)
      }
      return Array.from(seen.values())
    },
    [staticTemplates, customTemplates],
  )
  const templateMap = useMemo(() => {
    const map = new Map<string, SchemaTemplateDefinition>()
    templates.forEach((template) => {
      map.set(template.id, template)
    })
    return map
  }, [templates])
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
    [templateMap],
  )

  const mapTemplateRow = useCallback(
    (row: Database["public"]["Tables"]["schema_templates"]["Row"]): SchemaTemplateDefinition => ({
      id: row.id,
      name: row.name,
      description: row.description,
      agentType: row.agent_type === "pharma" ? "pharma" : "standard",
      fields: cloneSchemaFields((Array.isArray(row.fields) ? row.fields : []) as SchemaField[]),
      ownerId: row.user_id,
      isCustom: !(row.is_public ?? false), // Public templates are not custom, user-created templates are custom
      allowedDomains: row.allowed_domains,
      allowedEmails: row.allowed_emails,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    }),
    [],
  )

  const fetchSchemas = useCallback(async () => {
    if (!session?.user?.id) {
      setSchemas(PLACEHOLDER_SCHEMAS)
      setTabs((prev) => updateTabsWithSummaries(prev, PLACEHOLDER_SCHEMAS))
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
            { templateDisplayName: templateName },
          )
        }) ?? []
      setSchemas(mapped)
      setTabs((prev) => updateTabsWithSummaries(prev, mapped))
    }

    setIsLoadingSchemas(false)
  }, [session?.user?.id, supabase, templateMap])

  // Load tabs from Supabase or local storage
  const loadTabs = useCallback(async () => {
    if (!session?.user?.id) {
      // For guests, load from local storage
      const guestTabs = readGuestTabs()
      setTabs(guestTabs)
      // Set active tab to first tab or home
      const firstTab = guestTabs[0]
      if (firstTab) {
        setActiveTabId(firstTab.id)
      }
      return
    }

    try {
      const { data, error } = await supabase
        .from("workspace_preferences")
        .select("open_tabs, last_opened_schema")
        .eq("user_id", session.user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" - that's okay, we'll create it
        console.error("Error loading tabs:", error)
        return
      }

      if (data?.open_tabs && Array.isArray(data.open_tabs)) {
        const loadedTabs = data.open_tabs as WorkspaceTab[]
        // Validate tabs
        const validTabs = loadedTabs.filter((tab: any) => {
          if (tab.id === "home") {
            return tab.type === "home" && typeof tab.title === "string"
          }
          return (
            tab.type === "schema" &&
            typeof tab.id === "string" &&
            typeof tab.schemaId === "string" &&
            typeof tab.title === "string"
          )
        }) as WorkspaceTab[]

        // Ensure home tab exists
        if (!validTabs.some((tab) => tab.id === "home")) {
          validTabs.unshift(HOME_TAB)
        }

        setTabs(validTabs)

        // Set active tab from preferences or use first tab
        const lastOpenedSchema = data.last_opened_schema
        if (lastOpenedSchema) {
          const schemaTab = validTabs.find(
            (tab) => tab.type === "schema" && tab.schemaId === lastOpenedSchema
          )
          if (schemaTab) {
            setActiveTabId(schemaTab.id)
          } else {
            setActiveTabId(validTabs[0]?.id ?? HOME_TAB.id)
          }
        } else {
          setActiveTabId(validTabs[0]?.id ?? HOME_TAB.id)
        }
      }
    } catch (err) {
      console.error("Error loading tabs:", err)
    }
  }, [session?.user?.id, supabase])

  // Save tabs to Supabase (debounced)
  const saveTabsRef = useRef<NodeJS.Timeout | null>(null)
  const saveTabs = useCallback(
    async (tabsToSave: WorkspaceTab[], activeTab: string) => {
      if (!session?.user?.id) {
        // For guests, save to local storage
        writeGuestTabs(tabsToSave)
        return
      }

      // Clear existing timeout
      if (saveTabsRef.current) {
        clearTimeout(saveTabsRef.current)
      }

      // Debounce the save
      saveTabsRef.current = setTimeout(async () => {
        try {
          // Extract schema ID from active tab if it's a schema tab
          const activeTabObj = tabsToSave.find((tab) => tab.id === activeTab)
          const lastOpenedSchema =
            activeTabObj?.type === "schema" ? activeTabObj.schemaId : null

          // Prepare tabs for storage (remove unnecessary fields)
          const tabsToStore = tabsToSave.map((tab) => ({
            id: tab.id,
            type: tab.type,
            schemaId: tab.type === "schema" ? tab.schemaId : undefined,
            title: tab.title,
            templateId: tab.type === "schema" ? tab.templateId : undefined,
            agentType: tab.type === "schema" ? tab.agentType : undefined,
            closable: tab.closable,
            lastOpenedAt: tab.type === "schema" ? tab.lastOpenedAt : undefined,
          }))

          const { error } = await supabase.from("workspace_preferences").upsert({
            user_id: session.user.id,
            open_tabs: tabsToStore as any,
            last_opened_schema: lastOpenedSchema,
            updated_at: new Date().toISOString(),
          })

          if (error) {
            console.error("Error saving tabs:", error)
          }
        } catch (err) {
          console.error("Error saving tabs:", err)
        }
      }, 500) // 500ms debounce
    },
    [session?.user?.id, supabase]
  )

  useEffect(() => {
    void fetchSchemas()
    void loadTabs()
  }, [fetchSchemas, loadTabs])

  // Save tabs when they change
  useEffect(() => {
    if (tabs.length > 0) {
      void saveTabs(tabs, activeTabId)
    }
  }, [tabs, activeTabId, saveTabs])

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

    // Fetch templates - RLS policy will handle domain-based and email-based access
    const { data, error } = await supabase
      .from("schema_templates")
      .select("id,name,description,agent_type,fields,allowed_domains,allowed_emails,is_public,created_at,updated_at,user_id")
      .order("updated_at", { ascending: false })

    if (error) {
      setLoadTemplatesError(error.message)
      setCustomTemplates([])
    } else {
      const mapped = data?.map((row) => mapTemplateRow(row as any)) ?? []
      setCustomTemplates(mapped)
      setLoadTemplatesError(null)
    }

    setIsLoadingTemplates(false)
  }, [mapTemplateRow, session?.user?.id, supabase])

  useEffect(() => {
    void fetchTemplates()
  }, [fetchTemplates])
  useEffect(() => {
    setSchemas((prev) => {
      let changed = false
      const next = prev.map((summary) => {
        const decorated = decorateSummaryWithTemplate(summary)
        if (decorated !== summary) {
          changed = true
        }
        return decorated
      })
      if (changed) {
        setTabs((prevTabs) => updateTabsWithSummaries(prevTabs, next))
        return next
      }
      return prev
    })
  }, [decorateSummaryWithTemplate])
  const refreshSchemas = useCallback(async () => {
    await fetchSchemas()
  }, [fetchSchemas])

  const refreshTemplates = useCallback(async () => {
    await fetchTemplates()
  }, [fetchTemplates])

  const syncSchemasFromEditor = useCallback(
    (definitions: SchemaDefinition[]) => {
      if (!definitions || definitions.length === 0) {
        setSchemas([])
        return
      }
      const summaries = definitions.map((definition) =>
        mapDefinitionToSummary(definition, {
          templateDisplayName: definition.templateId ? templateMap.get(definition.templateId)?.name ?? null : undefined,
        }),
      )
      setSchemas(summaries)
      setTabs((prev) => updateTabsWithSummaries(prev, summaries))
    },
    [templateMap],
  )

  const ensureTabExists = useCallback((schema: SchemaSummary | undefined) => {
    if (!schema) return
    setTabs((prev) => {
      const exists = prev.some((tab) => tab.id === `schema-${schema.id}`)
      if (exists) return prev
      return [
        ...prev,
        {
          id: `schema-${schema.id}`,
          type: "schema",
          schemaId: schema.id,
          title: schema.tabTitle ?? schema.name,
          templateId: schema.templateId,
          agentType: schema.agentType,
          closable: true,
          lastOpenedAt: Date.now(),
        },
      ]
    })
    setActiveTabId(`schema-${schema.id}`)
  }, [])

  const openSchemaTab = useCallback(
    (schemaId: string) => {
      const schema = schemas.find((item) => item.id === schemaId)
      ensureTabExists(schema)
    },
    [ensureTabExists, schemas],
  )

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      if (tabId === HOME_TAB.id) return prev
      const filtered = prev.filter((tab) => tab.id !== tabId)
      if (filtered.length === 0) {
        setActiveTabId(HOME_TAB.id)
        return [HOME_TAB]
      }
      if (activeTabId === tabId) {
        const next = filtered[filtered.length - 1]
        setActiveTabId(next.id)
      }
      return filtered
    })
  }, [activeTabId])

  const setActiveTab = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId)
      // Update lastOpenedAt for the tab
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === tabId && tab.type === "schema"
            ? { ...tab, lastOpenedAt: Date.now() }
            : tab
        )
      )
    },
    []
  )

  const createSchema = useCallback(
    async ({ name, agent, templateId }: { name: string; agent: AgentType; templateId?: string | null }) => {
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
        ensureTabExists(summary)
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
      ensureTabExists(summary)
      setPendingSchemaCreate({
        id,
        name: schemaName,
        agent,
        templateId: resolvedTemplateId,
      })
      return summary
    },
    [ensureTabExists, session?.user?.id, supabase, templateMap],
  )

  const createTemplateFromSchema = useCallback(
    async (
      schema: SchemaDefinition,
      options: { name: string; description?: string; agent: AgentType },
    ): Promise<{ success: true; template: SchemaTemplateDefinition } | { success: false; error: string }> => {
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
        .select("id,name,description,agent_type,fields,allowed_domains,allowed_emails,is_public,created_at,updated_at,user_id")
        .single()

      setIsLoadingTemplates(false)

      if (error || !data) {
        const message = error?.message ?? "Failed to create template"
        setLoadTemplatesError(message)
        return { success: false, error: message }
      }

      setLoadTemplatesError(null)
      const template = mapTemplateRow(data as any)
      setCustomTemplates((prev) => [template, ...prev])
      return { success: true, template }
    },
    [mapTemplateRow, session?.user?.id, supabase],
  )

  const clearPendingSchemaCreate = useCallback(() => {
    setPendingSchemaCreate(null)
  }, [])

  const value = useMemo<WorkspaceStoreValue>(
    () => ({
      schemas,
      isLoadingSchemas,
      loadSchemasError,
      tabs,
      activeTabId,
      setActiveTab,
      openSchemaTab,
      closeTab,
      refreshSchemas,
      createSchema,
      templates,
      isLoadingTemplates,
      loadTemplatesError,
      refreshTemplates,
      createTemplateFromSchema,
      syncSchemasFromEditor,
      pendingSchemaCreate,
      clearPendingSchemaCreate,
    }),
    [
      schemas,
      isLoadingSchemas,
      loadSchemasError,
      tabs,
      activeTabId,
      setActiveTab,
      openSchemaTab,
      closeTab,
      refreshSchemas,
      createSchema,
      templates,
      isLoadingTemplates,
      loadTemplatesError,
      refreshTemplates,
      createTemplateFromSchema,
      syncSchemasFromEditor,
      pendingSchemaCreate,
      clearPendingSchemaCreate,
    ],
  )

  return <WorkspaceStoreContext.Provider value={value}>{children}</WorkspaceStoreContext.Provider>
}

export function useWorkspaceStore() {
  const ctx = useContext(WorkspaceStoreContext)
  if (!ctx) {
    throw new Error("useWorkspaceStore must be used within WorkspaceProvider")
  }
  return ctx
}
