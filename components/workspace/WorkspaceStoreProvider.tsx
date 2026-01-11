"use client"

import { createContext, useCallback, useContext, useEffect, useMemo } from "react"
import type { SchemaDefinition } from "@/lib/schema"
import type { AgentType, SchemaSummary, WorkspaceTab } from "./types"
import type { SchemaTemplateDefinition } from "@/lib/schema-templates"
import {
  useWorkspaceTabs,
  useWorkspaceTemplates,
  useWorkspaceSchemas,
  type PendingSchemaCreate,
} from "./hooks"

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

export function WorkspaceProvider({ children }: { children: React.ReactNode } = { children: null }) {
  // Templates hook - provides template data and operations
  const {
    templates,
    templateMap,
    isLoadingTemplates,
    loadTemplatesError,
    refreshTemplates,
    createTemplateFromSchema,
  } = useWorkspaceTemplates()

  // Tabs hook - provides tab state and operations
  const {
    tabs,
    activeTabId,
    setActiveTab,
    openSchemaTab: openSchemaTabInternal,
    closeTab,
    updateTabsWithSummaries,
    loadTabs,
  } = useWorkspaceTabs()

  // Schemas hook - provides schema data and operations
  const {
    schemas,
    isLoadingSchemas,
    loadSchemasError,
    pendingSchemaCreate,
    refreshSchemas,
    createSchema: createSchemaInternal,
    syncSchemasFromEditor: syncSchemasFromEditorInternal,
    clearPendingSchemaCreate,
    decorateSummaryWithTemplate,
    setSchemas,
  } = useWorkspaceSchemas(templateMap, updateTabsWithSummaries)

  // Load initial data
  useEffect(() => {
    void refreshSchemas()
    void loadTabs()
  }, [refreshSchemas, loadTabs])

  // Decorate schemas with template display names when templates change
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
        updateTabsWithSummaries(next)
        return next
      }
      return prev
    })
  }, [decorateSummaryWithTemplate, setSchemas, updateTabsWithSummaries])

  // Wrapper to ensure tab exists after schema creation
  const ensureTabExists = useCallback(
    (schema: SchemaSummary | undefined) => {
      if (!schema) return
      openSchemaTabInternal(schema.id, schemas.concat(schema))
    },
    [openSchemaTabInternal, schemas]
  )

  // Wrap openSchemaTab to use current schemas
  const openSchemaTab = useCallback(
    (schemaId: string) => {
      openSchemaTabInternal(schemaId, schemas)
    },
    [openSchemaTabInternal, schemas]
  )

  // Wrap createSchema to also open the tab
  const createSchema = useCallback(
    async (options: { name: string; agent: AgentType; templateId?: string | null }) => {
      const summary = await createSchemaInternal(options)
      if (summary) {
        ensureTabExists(summary)
      }
      return summary
    },
    [createSchemaInternal, ensureTabExists]
  )

  // Wrap syncSchemasFromEditor to also update tabs
  const syncSchemasFromEditor = useCallback(
    (definitions: SchemaDefinition[]) => {
      syncSchemasFromEditorInternal(definitions)
    },
    [syncSchemasFromEditorInternal]
  )

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
    ]
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
