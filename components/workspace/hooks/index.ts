/**
 * Workspace hooks barrel export
 */

export { HOME_TAB, PLACEHOLDER_SCHEMAS, LOCAL_TEMPLATE_STORAGE_KEY, LOCAL_TABS_STORAGE_KEY, TABS_SAVE_DEBOUNCE_MS } from "./workspaceConstants"
export { readGuestTemplates, writeGuestTemplates, readGuestTabs, writeGuestTabs } from "./guestStorage"
export { useWorkspaceTabs, type UseWorkspaceTabsResult } from "./useWorkspaceTabs"
export { useWorkspaceTemplates, type UseWorkspaceTemplatesResult } from "./useWorkspaceTemplates"
export { useWorkspaceSchemas, type UseWorkspaceSchemasResult, type PendingSchemaCreate } from "./useWorkspaceSchemas"
