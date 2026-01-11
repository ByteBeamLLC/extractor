/**
 * Workspace constants
 */

import type { WorkspaceTab, SchemaSummary } from "../types"

export const HOME_TAB: WorkspaceTab = {
  id: "home",
  type: "home",
  title: "Home",
  closable: false,
}

export const PLACEHOLDER_SCHEMAS: SchemaSummary[] = [
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

export const LOCAL_TEMPLATE_STORAGE_KEY = "workspace_custom_templates_v1"
export const LOCAL_TABS_STORAGE_KEY = "workspace_tabs_v1"
export const TABS_SAVE_DEBOUNCE_MS = 500
