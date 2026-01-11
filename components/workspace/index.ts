/**
 * Workspace component exports
 */

export { WorkspaceApp } from "./WorkspaceApp"
export { WorkspaceProvider, useWorkspaceStore } from "./WorkspaceStoreProvider"
export { DashboardHome } from "./DashboardHome"
export { TemplateSelectorDialog } from "./TemplateSelectorDialog"
export type * from "./types"

// Hooks
export {
  HOME_TAB,
  PLACEHOLDER_SCHEMAS,
  LOCAL_TEMPLATE_STORAGE_KEY,
  LOCAL_TABS_STORAGE_KEY,
  TABS_SAVE_DEBOUNCE_MS,
  readGuestTemplates,
  writeGuestTemplates,
  readGuestTabs,
  writeGuestTabs,
  useWorkspaceTabs,
  useWorkspaceTemplates,
  useWorkspaceSchemas,
} from "./hooks"
