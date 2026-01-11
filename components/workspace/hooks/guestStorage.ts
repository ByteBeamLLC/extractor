/**
 * Guest storage utilities for workspace
 * Handles local storage for unauthenticated users
 */

import type { WorkspaceTab } from "../types"
import type { SchemaTemplateDefinition, SchemaField } from "@/lib/schema"
import { cloneSchemaFields } from "@/lib/schema-templates"
import { LOCAL_TEMPLATE_STORAGE_KEY, LOCAL_TABS_STORAGE_KEY, HOME_TAB } from "./workspaceConstants"

/**
 * Reads custom templates from local storage for guest users
 */
export function readGuestTemplates(): SchemaTemplateDefinition[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(LOCAL_TEMPLATE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item: Record<string, unknown>) => {
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
          createdAt: item?.createdAt ? new Date(item.createdAt as string) : undefined,
          updatedAt: item?.updatedAt ? new Date(item.updatedAt as string) : undefined,
        } as SchemaTemplateDefinition
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Writes custom templates to local storage for guest users
 */
export function writeGuestTemplates(templates: SchemaTemplateDefinition[]): void {
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

/**
 * Reads workspace tabs from local storage for guest users
 */
export function readGuestTabs(): WorkspaceTab[] {
  if (typeof window === "undefined") return [HOME_TAB]
  try {
    const raw = window.localStorage.getItem(LOCAL_TABS_STORAGE_KEY)
    if (!raw) return [HOME_TAB]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [HOME_TAB]

    // Validate and filter tabs - ensure home tab exists
    const tabs = parsed.filter((tab: Record<string, unknown>) => {
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

/**
 * Writes workspace tabs to local storage for guest users
 */
export function writeGuestTabs(tabs: WorkspaceTab[]): void {
  if (typeof window === "undefined") return
  try {
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
