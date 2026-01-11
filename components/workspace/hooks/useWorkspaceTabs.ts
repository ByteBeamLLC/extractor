"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Database } from "@/lib/supabase/types"
import type { WorkspaceTab, SchemaSummary } from "../types"
import { HOME_TAB, TABS_SAVE_DEBOUNCE_MS } from "./workspaceConstants"
import { readGuestTabs, writeGuestTabs } from "./guestStorage"

export interface UseWorkspaceTabsResult {
  tabs: WorkspaceTab[]
  activeTabId: string
  setActiveTab: (tabId: string) => void
  openSchemaTab: (schemaId: string, schemas: SchemaSummary[]) => void
  closeTab: (tabId: string) => void
  updateTabsWithSummaries: (summaries: SchemaSummary[]) => void
  loadTabs: () => Promise<void>
}

/**
 * Updates tabs with the latest schema summaries
 */
function updateTabTitles(tabs: WorkspaceTab[], summaries: SchemaSummary[]): WorkspaceTab[] {
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

export function useWorkspaceTabs(): UseWorkspaceTabsResult {
  const session = useSession()
  const supabase = useSupabaseClient<Database>()
  const [tabs, setTabs] = useState<WorkspaceTab[]>([HOME_TAB])
  const [activeTabId, setActiveTabId] = useState<string>(HOME_TAB.id)
  const saveTabsRef = useRef<NodeJS.Timeout | null>(null)

  // Load tabs from Supabase or local storage
  const loadTabs = useCallback(async () => {
    if (!session?.user?.id) {
      const guestTabs = readGuestTabs()
      setTabs(guestTabs)
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
        console.error("Error loading tabs:", error)
        return
      }

      if (data?.open_tabs && Array.isArray(data.open_tabs)) {
        const loadedTabs = data.open_tabs as WorkspaceTab[]
        const validTabs = loadedTabs.filter((tab: Record<string, unknown>) => {
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

        if (!validTabs.some((tab) => tab.id === "home")) {
          validTabs.unshift(HOME_TAB)
        }

        setTabs(validTabs)

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
  const saveTabs = useCallback(
    async (tabsToSave: WorkspaceTab[], activeTab: string) => {
      if (!session?.user?.id) {
        writeGuestTabs(tabsToSave)
        return
      }

      if (saveTabsRef.current) {
        clearTimeout(saveTabsRef.current)
      }

      saveTabsRef.current = setTimeout(async () => {
        try {
          const activeTabObj = tabsToSave.find((tab) => tab.id === activeTab)
          const lastOpenedSchema =
            activeTabObj?.type === "schema" ? activeTabObj.schemaId : null

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
            open_tabs: tabsToStore as unknown as Record<string, unknown>,
            last_opened_schema: lastOpenedSchema,
            updated_at: new Date().toISOString(),
          })

          if (error) {
            console.error("Error saving tabs:", error)
          }
        } catch (err) {
          console.error("Error saving tabs:", err)
        }
      }, TABS_SAVE_DEBOUNCE_MS)
    },
    [session?.user?.id, supabase]
  )

  // Save tabs when they change
  useEffect(() => {
    if (tabs.length > 0) {
      void saveTabs(tabs, activeTabId)
    }
  }, [tabs, activeTabId, saveTabs])

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId && tab.type === "schema"
          ? { ...tab, lastOpenedAt: Date.now() }
          : tab
      )
    )
  }, [])

  const openSchemaTab = useCallback(
    (schemaId: string, schemas: SchemaSummary[]) => {
      const schema = schemas.find((item) => item.id === schemaId)
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
    },
    []
  )

  const closeTab = useCallback(
    (tabId: string) => {
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
    },
    [activeTabId]
  )

  const updateTabsWithSummaries = useCallback((summaries: SchemaSummary[]) => {
    setTabs((prev) => updateTabTitles(prev, summaries))
  }, [])

  return {
    tabs,
    activeTabId,
    setActiveTab,
    openSchemaTab,
    closeTab,
    updateTabsWithSummaries,
    loadTabs,
  }
}
