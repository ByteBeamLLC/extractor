'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateText } from '@/lib/openrouter'

export interface KnowledgeBase {
    id: string
    name: string
    parent_id: string | null
    user_id: string
    created_at: string
    children?: KnowledgeBase[]
}

export interface KnowledgeDocument {
    id: string
    name: string
    type: 'file' | 'link'
    status: 'indexed' | 'processing' | 'error' | 'pending'
    ai_status: 'grounded' | 'analyzing' | 'ready'
    size: string | null
    url: string | null
    knowledge_base_id: string | null
    updated_at: string
    user_id: string
    content?: string
    storage_path?: string
    mime_type?: string
}

type PdfParseFn = (data: Buffer, options?: any) => Promise<{ text?: string }>
let pdfParseSingleton: PdfParseFn | null = null

async function loadPdfParse(): Promise<PdfParseFn | null> {
    if (pdfParseSingleton) return pdfParseSingleton
    try {
        const mod = await import('pdf-parse')
        const fn = (mod as any).default ?? mod
        if (typeof fn === 'function') {
            pdfParseSingleton = fn as PdfParseFn
            return pdfParseSingleton
        }
        console.warn('pdf-parse module did not expose a function')
        return null
    } catch (error) {
        console.error('Failed to load pdf-parse:', error)
        return null
    }
}

export async function getKnowledgeBases() {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
        .from('knowledge_bases')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching knowledge bases:', error)
        return []
    }

    // Build tree structure
    const buildTree = (items: KnowledgeBase[], parentId: string | null = null): KnowledgeBase[] => {
        return items
            .filter(item => item.parent_id === parentId)
            .map(item => ({
                ...item,
                children: buildTree(items, item.id)
            }))
    }

    return buildTree(data as KnowledgeBase[])
}

export async function getKnowledgeDocuments(folderId: string | null = null) {
    const supabase = createSupabaseServerClient()
    let query = supabase
        .from('knowledge_documents')
        .select('*')
        .order('updated_at', { ascending: false })

    if (folderId) {
        query = query.eq('knowledge_base_id', folderId)
    } else {
        query = query.is('knowledge_base_id', null)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching knowledge documents:', error)
        return []
    }

    return data as KnowledgeDocument[]
}

export async function createKnowledgeBase(name: string, parentId: string | null = null) {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
        .from('knowledge_bases')
        .insert({ name, parent_id: parentId })
        .select()
        .single()

    if (error) {
        console.error('Error creating knowledge base:', error)
        throw new Error('Failed to create folder')
    }

    revalidatePath('/knowledge')
    return data
}

export async function createKnowledgeDocument(document: Partial<KnowledgeDocument>, formData?: FormData) {
    const supabase = createSupabaseServerClient()

    // Initial insert with processing status
    const { data: newDoc, error } = await supabase
        .from('knowledge_documents')
        .insert({
            ...document,
            status: 'processing',
            ai_status: 'analyzing'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating knowledge document:', error)
        throw new Error('Failed to create document')
    }

    revalidatePath('/knowledge')

    // Process in background (simulated by not awaiting the result in the UI response, 
    // but here we await to ensure completion for simplicity in this iteration)
    // In a real production app, this might be offloaded to a queue.
    try {
        if (newDoc.type === 'link' && newDoc.url) {
            await processLink(newDoc.id, newDoc.url)
        } else if (newDoc.type === 'file' && formData) {
            const file = formData.get('file') as File
            if (file) {
                await processFile(newDoc.id, file)
            }
        }
    } catch (processError) {
        console.error('Error processing document:', processError)
        await supabase
            .from('knowledge_documents')
            .update({ status: 'error', ai_status: 'ready' })
            .eq('id', newDoc.id)
    }

    revalidatePath('/knowledge')
    return newDoc
}

async function processLink(docId: string, url: string) {
    const supabase = createSupabaseServerClient()

    try {
        // Use Jina Reader to get markdown
        const jinaUrl = `https://r.jina.ai/${url}`
        const response = await fetch(jinaUrl)

        if (!response.ok) {
            throw new Error(`Jina Reader failed: ${response.statusText}`)
        }

        const markdown = await response.text()

        await supabase
            .from('knowledge_documents')
            .update({
                content: markdown,
                status: 'indexed',
                ai_status: 'grounded' // Assuming successful extraction means grounded for now
            })
            .eq('id', docId)

    } catch (error) {
        console.error('Error processing link:', error)
        throw error
    }
}

async function processFile(docId: string, file: File) {
    const supabase = createSupabaseServerClient()

    try {
        // 1. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const filePath = `${docId}.${fileExt}`

        const { error: uploadError } = await supabase
            .storage
            .from('knowledge_assets')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        // 2. Process Content
        let markdown = ''
        const mimeType = file.type

        if (mimeType === 'application/pdf') {
            // Handle PDF: Extract text using pdf-parse then format with LLM
            const pdfParse = await loadPdfParse()
            if (!pdfParse) {
                throw new Error('Failed to load PDF parser')
            }

            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const pdfData = await pdfParse(buffer)
            const rawText = pdfData.text

            const { text } = await generateText({
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Format the following document text as clean markdown. Preserve tables and structure where possible.' },
                            { type: 'text', text: rawText }
                        ]
                    }
                ]
            })
            markdown = text
        } else if (mimeType.startsWith('image/')) {
            // Handle Image: Send directly to Gemini
            const arrayBuffer = await file.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')

            const { text } = await generateText({
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Extract all text from this document and format it as markdown. Preserve tables and structure.' },
                            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
                        ]
                    }
                ]
            })
            markdown = text
        } else if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv') {
            markdown = await file.text()
        } else {
            markdown = `Preview not available for ${mimeType}. File is stored securely.`
        }

        // 3. Update Document
        await supabase
            .from('knowledge_documents')
            .update({
                content: markdown,
                storage_path: filePath,
                mime_type: mimeType,
                size: formatBytes(file.size),
                status: 'indexed',
                ai_status: 'grounded'
            })
            .eq('id', docId)

    } catch (error) {
        console.error('Error processing file:', error)
        throw error
    }
}

export async function deleteKnowledgeItem(id: string, type: 'folder' | 'file') {
    const supabase = createSupabaseServerClient()
    const table = type === 'folder' ? 'knowledge_bases' : 'knowledge_documents'

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

    if (error) {
        console.error(`Error deleting ${type}:`, error)
        throw new Error(`Failed to delete ${type}`)
    }

    revalidatePath('/knowledge')
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export async function getKnowledgeContentForTransformation(ref: { type: 'file' | 'folder', id: string }): Promise<{ content: string, tokenEstimate: number, items: string[] }> {
    const supabase = createSupabaseServerClient()
    let content = ''
    let items: string[] = []

    if (ref.type === 'file') {
        console.log(`[bytebeam] Fetching content for document ID: ${ref.id}`)

        // Use limit(1) instead of single() to handle duplicate documents
        const { data: docData, error } = await supabase
            .from('knowledge_documents')
            .select('name, content')
            .eq('id', ref.id)
            .limit(1)

        const data = docData?.[0]

        if (error) {
            console.error('[bytebeam] Error fetching document content:', error)
            return { content: '', tokenEstimate: 0, items: [] }
        }

        if (!data) {
            console.warn('[bytebeam] No document found with ID:', ref.id)
            return { content: '', tokenEstimate: 0, items: [] }
        }

        console.log(`[bytebeam] Document found: ${data.name}`)
        console.log(`[bytebeam] Content length: ${data.content?.length || 0} characters`)

        if (!data.content || data.content.trim().length === 0) {
            console.warn(`[bytebeam] WARNING: Document "${data.name}" has no content!`)
        }

        content = `Document: ${data.name}\n\n${data.content || ''}`
        items.push(data.name)
    } else if (ref.type === 'folder') {
        // Fetch all documents in the folder
        const { data, error } = await supabase
            .from('knowledge_documents')
            .select('name, content')
            .eq('knowledge_base_id', ref.id)
            .eq('status', 'indexed') // Only use indexed documents

        if (error || !data) {
            console.error('Error fetching folder content:', error)
            return { content: '', tokenEstimate: 0, items: [] }
        }

        content = data.map(doc => `Document: ${doc.name}\n\n${doc.content || ''}`).join('\n\n---\n\n')
        items = data.map(doc => doc.name)
    }

    // Rough token estimate (4 chars per token)
    const tokenEstimate = Math.ceil(content.length / 4)

    console.log(`[bytebeam] Knowledge content prepared: ${tokenEstimate} tokens from ${items.length} item(s)`)

    return { content, tokenEstimate, items }
}

export async function findKnowledgeItemByName(name: string): Promise<{ type: 'file' | 'folder', id: string } | null> {
    const supabase = createSupabaseServerClient()

    // Prepare search variants
    const searchName = name.trim()
    const searchNameNoExt = searchName.replace(/\.[^.]+$/, '') // Remove extension

    console.log(`[bytebeam] KB Lookup - Searching for: "${searchName}"`)
    console.log(`[bytebeam] KB Lookup - Without extension: "${searchNameNoExt}"`)

    // Try 1: Exact match on folders (use limit(1) to handle duplicates)
    const { data: folderData, error: folderError } = await supabase
        .from('knowledge_bases')
        .select('id, name')
        .eq('name', searchName)
        .limit(1)

    const folder = folderData?.[0]
    console.log(`[bytebeam] KB Lookup - Try 1 (exact folder): ${folder ? 'FOUND' : 'not found'}${folderError ? ` (error: ${folderError.message})` : ''}`)

    if (folder) {
        return { type: 'folder', id: folder.id }
    }

    // Try 2: Exact match on documents (use limit(1) to handle duplicates)
    let { data: docData, error: docError } = await supabase
        .from('knowledge_documents')
        .select('id, name')
        .eq('name', searchName)
        .limit(1)

    let doc = docData?.[0]
    console.log(`[bytebeam] KB Lookup - Try 2 (exact doc): ${doc ? 'FOUND' : 'not found'}${docError ? ` (error: ${docError.message})` : ''}`)

    if (doc) {
        console.log(`[bytebeam] KB Lookup - Matched document ID: ${doc.id}`)
        return { type: 'file', id: doc.id }
    }

    // Try 3: Match without extension
    if (searchNameNoExt !== searchName) {
        const { data: docNoExtData, error: docNoExtError } = await supabase
            .from('knowledge_documents')
            .select('id, name')
            .eq('name', searchNameNoExt)
            .limit(1)

        const docNoExt = docNoExtData?.[0]
        console.log(`[bytebeam] KB Lookup - Try 3 (no ext): ${docNoExt ? 'FOUND' : 'not found'}${docNoExtError ? ` (error: ${docNoExtError.message})` : ''}`)

        if (docNoExt) {
            console.log(`[bytebeam] KB Lookup - Matched document ID: ${docNoExt.id}`)
            return { type: 'file', id: docNoExt.id }
        }
    }

    // Try 4: Case-insensitive match with ILIKE
    const { data: docIlikeData, error: docIlikeError } = await supabase
        .from('knowledge_documents')
        .select('id, name')
        .ilike('name', searchName)
        .limit(1)

    const docIlike = docIlikeData?.[0]
    console.log(`[bytebeam] KB Lookup - Try 4 (ilike): ${docIlike ? 'FOUND' : 'not found'}${docIlikeError ? ` (error: ${docIlikeError.message})` : ''}`)

    if (docIlike) {
        console.log(`[bytebeam] KB Lookup - Matched document ID: ${docIlike.id}`)
        return { type: 'file', id: docIlike.id }
    }

    // Try 5: Case-insensitive match without extension
    if (searchNameNoExt !== searchName) {
        const { data: docIlikeNoExtData, error: docIlikeNoExtError } = await supabase
            .from('knowledge_documents')
            .select('id, name')
            .ilike('name', searchNameNoExt)
            .limit(1)

        const docIlikeNoExt = docIlikeNoExtData?.[0]
        console.log(`[bytebeam] KB Lookup - Try 5 (ilike no ext): ${docIlikeNoExt ? 'FOUND' : 'not found'}${docIlikeNoExtError ? ` (error: ${docIlikeNoExtError.message})` : ''}`)

        if (docIlikeNoExt) {
            console.log(`[bytebeam] KB Lookup - Matched document ID: ${docIlikeNoExt.id}`)
            return { type: 'file', id: docIlikeNoExt.id }
        }
    }

    // DEBUG: List all available documents to help diagnose
    const { data: allDocs } = await supabase
        .from('knowledge_documents')
        .select('id, name')
        .limit(10)

    console.warn(`[bytebeam] KB Lookup - FAILED after all attempts for: "${searchName}"`)
    console.warn(`[bytebeam] KB Lookup - Available documents (first 10):`, allDocs?.map(d => d.name) || [])

    return null
}
