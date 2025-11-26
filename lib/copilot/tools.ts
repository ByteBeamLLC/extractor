
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getKnowledgeBases, getKnowledgeDocuments, findKnowledgeItemByName, getKnowledgeContentForTransformation } from '@/lib/knowledge-actions'
import { getStaticSchemaTemplates } from '@/lib/schema-templates'

export async function list_jobs(status?: string, limit: number = 5) {
    const supabase = createSupabaseServerClient()
    let query = supabase
        .from('extraction_jobs')
        .select('id, file_name, status, created_at, agent_type, schema_id')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (status) {
        query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw new Error(`Failed to list jobs: ${error.message}`)
    return data
}

export async function get_job(job_id: string) {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
        .from('extraction_jobs')
        .select('*')
        .eq('id', job_id)
        .single()

    if (error) throw new Error(`Failed to get job: ${error.message}`)
    return data
}

export async function get_agents() {
    const supabase = createSupabaseServerClient()
    // Get DB templates
    const { data: dbTemplates, error } = await supabase
        .from('schema_templates')
        .select('id, name, description, agent_type')

    if (error) throw new Error(`Failed to get agents: ${error.message}`)

    // Get static templates
    const staticTemplates = getStaticSchemaTemplates().map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        agent_type: t.agentType
    }))

    return [...staticTemplates, ...dbTemplates]
}

export async function get_agent(agent_id: string) {
    // Check static first
    const staticTemplate = getStaticSchemaTemplates().find(t => t.id === agent_id)
    if (staticTemplate) return staticTemplate

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
        .from('schema_templates')
        .select('*')
        .eq('id', agent_id)
        .single()

    if (error) throw new Error(`Failed to get agent: ${error.message}`)
    return data
}

export async function get_knowledge_hub() {
    return await getKnowledgeBases()
}

export async function get_knowledge(query: string) {
    // Simple search implementation using findKnowledgeItemByName or listing documents
    // For now, let's list documents and filter or use the find function
    const item = await findKnowledgeItemByName(query)
    if (item) {
        return await getKnowledgeContentForTransformation(item)
    }

    // If not found by name, maybe list recent docs?
    // Let's just return a message saying not found, or list all docs
    const docs = await getKnowledgeDocuments()
    return {
        message: "Exact match not found. Here are recent documents:",
        documents: docs.map(d => ({ id: d.id, name: d.name, type: d.type }))
    }
}

export async function create_temp_job(file_base64: string, file_name: string, schema_id: string) {
    // Fetch schema definition
    const agent = await get_agent(schema_id)
    if (!agent) throw new Error(`Agent/Schema not found: ${schema_id}`)

    // Construct payload for extraction API
    const payload = {
        file: {
            data: file_base64,
            name: file_name,
            type: file_name.endsWith('.pdf') ? 'application/pdf' : 'image/png' // Simple inference
        },
        schema: agent.fields, // Assuming fields is the schema definition
        // No job meta to prevent persistence
    }

    // Call API
    // We need the absolute URL. 
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/extract`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Extraction failed: ${response.status} ${text}`)
    }

    return await response.json()
}
