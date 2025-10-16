export type AgentType = "standard" | "pharma"

export type WorkspaceTab =
  | {
      id: "home"
      type: "home"
      title: string
      closable: false
    }
  | {
      id: string
      type: "schema"
      schemaId: string
      title: string
      templateId?: string | null
      agentType?: AgentType
      closable: boolean
      lastOpenedAt: number
    }

export interface SchemaSummary {
  id: string
  name: string
  tabTitle: string
  templateId?: string | null
  templateDisplayName?: string | null
  agentType?: AgentType
  lastModified?: Date
  thumbnailUrl?: string | null
  isFavorite?: boolean
  folderId?: string | null
}

export interface WorkspaceStateSnapshot {
  tabs: WorkspaceTab[]
  activeTabId: string
  schemas: SchemaSummary[]
}
