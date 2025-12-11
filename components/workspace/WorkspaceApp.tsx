"use client"

import { useCallback, useMemo, useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import { DashboardHome } from "./DashboardHome"
import { TemplateSelectorDialog } from "./TemplateSelectorDialog"
import { WorkspaceProvider, useWorkspaceStore } from "./WorkspaceStoreProvider"
import type { AgentType } from "./types"
import { DataExtractionPlatform } from "@/components/data-extraction-platform"
import type { SchemaDefinition } from "@/lib/schema"
import type { SchemaTemplateDefinition } from "@/lib/schema-templates"
import { DataExtractionErrorBoundary } from "@/components/DataExtractionErrorBoundary"

export function WorkspaceApp({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  return (
    <WorkspaceProvider>
      <WorkspaceShell isEmbedded={isEmbedded} />
    </WorkspaceProvider>
  )
}

function WorkspaceShell({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const {
    tabs,
    activeTabId,
    schemas,
    isLoadingSchemas,
    loadSchemasError,
    openSchemaTab,
    closeTab,
    setActiveTab,
    createSchema,
    refreshSchemas,
    syncSchemasFromEditor,
    pendingSchemaCreate,
    clearPendingSchemaCreate,
    templates,
    isLoadingTemplates,
    loadTemplatesError,
    refreshTemplates,
    createTemplateFromSchema,
  } = useWorkspaceStore()

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0], [tabs, activeTabId, tabs])

  const handleCreateSchema = useCallback(
    async ({ name, agent, templateId }: { name: string; agent: AgentType; templateId?: string | null }) => {
      const created = await createSchema({ name, agent, templateId })
      if (created) {
        openSchemaTab(created.id)
        setIsTemplateDialogOpen(false)
      }
    },
    [createSchema, openSchemaTab],
  )

  return (
    <div className={cn("flex h-full flex-col bg-background", !isEmbedded && "min-h-screen")}>
      <div className="border-b border-border bg-muted/40">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex min-h-[3rem] items-stretch gap-1 px-4 py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={cn(
                  "group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeTabId === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "bg-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground",
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="truncate max-w-[12rem]">{tab.title}</span>
                {tab.closable ? (
                  <X
                    className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100"
                    onClick={(event) => {
                      event.stopPropagation()
                      closeTab(tab.id)
                    }}
                  />
                ) : null}
              </button>
            ))}
            <Button variant="ghost" size="sm" className="ml-2 flex items-center gap-1" onClick={() => setIsTemplateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        </ScrollArea>
      </div>
      <main className="flex-1">
        {activeTab?.type === "home" ? (
          <DashboardHome
            schemas={schemas}
            isLoading={isLoadingSchemas}
            loadError={loadSchemasError}
            onRefresh={refreshSchemas}
            onOpenSchema={openSchemaTab}
            onCreateNew={() => setIsTemplateDialogOpen(true)}
          />
        ) : (
          <SchemaEditor
            schemaId={activeTab?.type === "schema" ? activeTab.schemaId : undefined}
            onSchemasChanged={syncSchemasFromEditor}
            pendingSchemaCreate={pendingSchemaCreate}
            clearPendingSchemaCreate={clearPendingSchemaCreate}
            templates={templates}
            onCreateTemplate={createTemplateFromSchema}
            isEmbedded={isEmbedded}
          />
        )}
      </main>

      <TemplateSelectorDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        templates={templates}
        isLoading={isLoadingTemplates}
        loadError={loadTemplatesError}
        onRefreshTemplates={refreshTemplates}
        onChooseTemplate={(templateId, { name, agent }) => handleCreateSchema({ name, agent, templateId })}
        onCreateBlank={({ name, agent, templateId }) => handleCreateSchema({ name, agent, templateId })}
      />
    </div>
  )
}

interface SchemaEditorProps {
  schemaId?: string
  onSchemasChanged: (definitions: SchemaDefinition[]) => void
  pendingSchemaCreate: ReturnType<typeof useWorkspaceStore>["pendingSchemaCreate"]
  clearPendingSchemaCreate: () => void
  templates: SchemaTemplateDefinition[]
  onCreateTemplate: (
    schema: SchemaDefinition,
    input: { name: string; description?: string; agent: AgentType },
  ) => Promise<{ success: true; template: SchemaTemplateDefinition } | { success: false; error: string }>
  isEmbedded?: boolean
}

function SchemaEditor({
  schemaId,
  onSchemasChanged,
  pendingSchemaCreate,
  clearPendingSchemaCreate,
  templates,
  onCreateTemplate,
  isEmbedded = false,
}: SchemaEditorProps) {
  return (
    <div className="flex h-full flex-col">
      <DataExtractionErrorBoundary
        context={{
          source: "WorkspaceApp",
          schemaId: schemaId ?? null,
          hasPendingCreate: Boolean(pendingSchemaCreate),
          isEmbedded,
        }}
      >
        <DataExtractionPlatform
          externalActiveSchemaId={schemaId}
          onSchemasChanged={onSchemasChanged}
          pendingSchemaCreate={pendingSchemaCreate}
          onPendingCreateConsumed={clearPendingSchemaCreate}
          templateLibrary={templates}
          onCreateTemplate={onCreateTemplate}
          isEmbedded={isEmbedded}
        />
      </DataExtractionErrorBoundary>
    </div>
  )
}
