"use client"

import { DataExtractionPlatform } from "@/components/data-extraction-platform"
import { DataExtractionErrorBoundary } from "@/components/DataExtractionErrorBoundary"
import { ENABLE_DASHBOARD } from "@/lib/workspace/featureFlags"
import { WorkspaceApp } from "@/components/workspace/WorkspaceApp"
import { useCallback, useEffect, useState } from "react"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import type { Database } from "@/lib/supabase/types"
import type { SchemaDefinition } from "@/lib/schema"
import type { SchemaTemplateDefinition } from "@/lib/schema-templates"
import { cloneSchemaFields } from "@/lib/schema-templates"
import type { AgentType } from "@/components/workspace/types"

export function HomeView() {
    if (ENABLE_DASHBOARD) {
        return <WorkspaceApp isEmbedded={true} />
    }

    return <StandaloneDataExtractor />
}

function StandaloneDataExtractor() {
    const session = useSession()
    const supabase = useSupabaseClient()
    const [templates, setTemplates] = useState<SchemaTemplateDefinition[]>([])

    // Load templates from Supabase or localStorage
    useEffect(() => {
        const loadTemplates = async () => {
            if (!session?.user?.id) {
                // Guest user - load public templates from Supabase + localStorage custom templates
                const guestTemplates: SchemaTemplateDefinition[] = []

                // Load public templates from Supabase (no auth required)
                try {
                    const { data, error } = await supabase
                        .from("schema_templates")
                        .select("id,name,description,agent_type,fields,is_public,created_at,updated_at")
                        .eq("is_public", true)
                        .order("updated_at", { ascending: false })

                    if (!error && data) {
                        const publicTemplates = data.map((row) => ({
                            id: row.id,
                            name: row.name,
                            description: row.description,
                            agentType: row.agent_type === "pharma" ? "pharma" : "standard",
                            fields: cloneSchemaFields((Array.isArray(row.fields) ? row.fields : []) as any),
                            ownerId: null,
                            isCustom: false, // Public templates are not custom
                            allowedDomains: null,
                            createdAt: row.created_at ? new Date(row.created_at) : undefined,
                            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
                        })) as SchemaTemplateDefinition[]
                        guestTemplates.push(...publicTemplates)
                    }
                } catch (err) {
                    console.error("Failed to load public templates:", err)
                }

                // Load custom templates from localStorage
                const LOCAL_TEMPLATE_STORAGE_KEY = "workspace_custom_templates_v1"
                try {
                    const raw = typeof window !== "undefined" ? window.localStorage.getItem(LOCAL_TEMPLATE_STORAGE_KEY) : null
                    if (raw) {
                        const parsed = JSON.parse(raw)
                        if (Array.isArray(parsed)) {
                            const localTemplates: SchemaTemplateDefinition[] = parsed
                                .map((item: any) => {
                                    const candidateId =
                                        typeof item?.id === "string"
                                            ? item.id
                                            : typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                                                ? crypto.randomUUID()
                                                : `guest-template-${Date.now()}`
                                    const name = typeof item?.name === "string" ? item.name : "Untitled template"
                                    const fieldsValue = Array.isArray(item?.fields) ? item.fields : []
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
                            guestTemplates.push(...localTemplates)
                        }
                    }
                } catch (err) {
                    console.error("Failed to load localStorage templates:", err)
                }

                console.log("[Templates Debug] Guest user - loaded templates:", guestTemplates.map(t => ({ id: t.id, name: t.name, agentType: t.agentType, fieldCount: t.fields.length, isCustom: t.isCustom })))
                setTemplates(guestTemplates)
            } else {
                // Authenticated user - load from Supabase (RLS handles domain filtering)
                const { data, error } = await supabase
                    .from("schema_templates")
                    .select("id,name,description,agent_type,fields,allowed_domains,is_public,created_at,updated_at,user_id")
                    .order("updated_at", { ascending: false })

                if (error) {
                    console.error("Failed to load templates:", error)
                    setTemplates([])
                    return
                }

                const loadedTemplates: SchemaTemplateDefinition[] =
                    data?.map((row) => ({
                        id: row.id,
                        name: row.name,
                        description: row.description,
                        agentType: row.agent_type === "pharma" ? "pharma" : "standard",
                        fields: cloneSchemaFields((Array.isArray(row.fields) ? row.fields : []) as any),
                        ownerId: row.user_id,
                        isCustom: !row.is_public, // Public templates are not custom, user-created templates are custom
                        allowedDomains: row.allowed_domains,
                        createdAt: row.created_at ? new Date(row.created_at) : undefined,
                        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
                    })) ?? []
                console.log("[Templates Debug] Authenticated user - loaded templates:", loadedTemplates.map(t => ({ id: t.id, name: t.name, agentType: t.agentType, fieldCount: t.fields.length, isCustom: t.isCustom })))
                setTemplates(loadedTemplates)
            }
        }

        void loadTemplates()
    }, [session?.user?.id, supabase])

    const createTemplateFromSchema = useCallback(
        async (
            schema: SchemaDefinition,
            options: { name: string; description?: string; agent: AgentType },
        ): Promise<{ success: true; template: SchemaTemplateDefinition } | { success: false; error: string }> => {
            const templateName = options.name.trim() || schema.name || "Untitled template"
            const templateDescription = options.description?.trim() ?? ""
            const fields = cloneSchemaFields(schema.fields ?? [])
            const now = new Date()

            if (!session?.user?.id) {
                // Guest user - save to localStorage
                const LOCAL_TEMPLATE_STORAGE_KEY = "workspace_custom_templates_v1"
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

                try {
                    // Read existing templates
                    const existing = typeof window !== "undefined" ? window.localStorage.getItem(LOCAL_TEMPLATE_STORAGE_KEY) : null
                    const templates: SchemaTemplateDefinition[] = existing ? JSON.parse(existing) : []

                    // Add new template
                    templates.unshift({
                        id: guestTemplate.id,
                        name: guestTemplate.name,
                        description: guestTemplate.description ?? null,
                        agentType: guestTemplate.agentType,
                        fields: guestTemplate.fields,
                        createdAt: guestTemplate.createdAt?.toISOString(),
                        updatedAt: guestTemplate.updatedAt?.toISOString(),
                    } as any)

                    // Save back to localStorage
                    if (typeof window !== "undefined") {
                        window.localStorage.setItem(LOCAL_TEMPLATE_STORAGE_KEY, JSON.stringify(templates))
                    }

                    return { success: true, template: guestTemplate }
                } catch (error) {
                    return { success: false, error: "Failed to save template to local storage" }
                }
            }

            // Authenticated user - save to Supabase
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
                .select("id,name,description,agent_type,fields,allowed_domains,created_at,updated_at,user_id")
                .single()

            if (error || !data) {
                const message = error?.message ?? "Failed to create template"
                return { success: false, error: message }
            }

            const template: SchemaTemplateDefinition = {
                id: data.id,
                name: data.name,
                description: data.description,
                agentType: data.agent_type === "pharma" ? "pharma" : "standard",
                fields: cloneSchemaFields((Array.isArray(data.fields) ? data.fields : []) as any),
                ownerId: data.user_id,
                isCustom: true,
                allowedDomains: data.allowed_domains,
                createdAt: data.created_at ? new Date(data.created_at) : undefined,
                updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
            }

            // Refresh templates list
            setTemplates(prev => [template, ...prev])

            return { success: true, template }
        },
        [session?.user?.id, supabase, setTemplates],
    )

    return (
        <DataExtractionErrorBoundary context={{ source: "HomeView", embedMode: "standalone" }}>
            <DataExtractionPlatform
                onCreateTemplate={createTemplateFromSchema}
                templateLibrary={templates}
                isEmbedded={true}
            />
        </DataExtractionErrorBoundary>
    )
}
