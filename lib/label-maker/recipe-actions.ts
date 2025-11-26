'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LabelData, CostingData } from '@/components/label-maker/LabelDataForm'

// Recipe data structure stored in Knowledge Hub
export interface RecipeDocument {
    id: string
    name: string
    label_data: LabelData
    costing_data: CostingData | null
    category: string | null
    tags: string[]
    notes: string | null
    created_at: string
    updated_at: string
}

export interface RecipeListItem {
    id: string
    name: string
    category: string | null
    updated_at: string
    created_at: string
    folder_name: string | null
}

// Constants
const RECIPES_FOLDER_NAME = 'Recipes'
const RECIPE_FILE_EXTENSION = '.recipe.json'

/**
 * Get or create the Recipes folder in Knowledge Hub
 */
export async function getOrCreateRecipesFolder(): Promise<string> {
    const supabase = createSupabaseServerClient()
    
    // Check if Recipes folder exists
    const { data: existing, error: findError } = await supabase
        .from('knowledge_bases')
        .select('id')
        .eq('name', RECIPES_FOLDER_NAME)
        .is('parent_id', null)
        .limit(1)
    
    if (findError) {
        console.error('Error finding recipes folder:', findError)
        throw new Error('Failed to access Knowledge Hub')
    }
    
    if (existing && existing.length > 0) {
        return existing[0].id
    }
    
    // Create Recipes folder
    const { data: newFolder, error: createError } = await supabase
        .from('knowledge_bases')
        .insert({ name: RECIPES_FOLDER_NAME, parent_id: null })
        .select()
        .single()
    
    if (createError) {
        console.error('Error creating recipes folder:', createError)
        throw new Error('Failed to create Recipes folder')
    }
    
    return newFolder.id
}

/**
 * Get all recipes from Knowledge Hub
 */
export async function getRecipes(): Promise<RecipeListItem[]> {
    const supabase = createSupabaseServerClient()
    
    // Get all recipe documents (files ending with .recipe.json)
    const { data, error } = await supabase
        .from('knowledge_documents')
        .select(`
            id,
            name,
            updated_at,
            created_at,
            knowledge_base_id,
            content
        `)
        .like('name', `%${RECIPE_FILE_EXTENSION}`)
        .order('updated_at', { ascending: false })
    
    if (error) {
        console.error('Error fetching recipes:', error)
        return []
    }
    
    // Get folder names for each recipe
    const folderIds = [...new Set(data.filter(d => d.knowledge_base_id).map(d => d.knowledge_base_id))]
    let folderMap: Record<string, string> = {}
    
    if (folderIds.length > 0) {
        const { data: folders } = await supabase
            .from('knowledge_bases')
            .select('id, name')
            .in('id', folderIds)
        
        if (folders) {
            folderMap = Object.fromEntries(folders.map(f => [f.id, f.name]))
        }
    }
    
    return data.map(doc => {
        // Try to parse category from content
        let category: string | null = null
        try {
            if (doc.content) {
                const parsed = JSON.parse(doc.content)
                category = parsed.category || null
            }
        } catch {}
        
        return {
            id: doc.id,
            name: doc.name.replace(RECIPE_FILE_EXTENSION, ''),
            category,
            updated_at: doc.updated_at,
            created_at: doc.created_at,
            folder_name: doc.knowledge_base_id ? folderMap[doc.knowledge_base_id] || null : null
        }
    })
}

/**
 * Get a single recipe by document ID
 */
export async function getRecipe(id: string): Promise<RecipeDocument | null> {
    const supabase = createSupabaseServerClient()
    
    const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('id', id)
        .single()
    
    if (error || !data) {
        console.error('Error fetching recipe:', error)
        return null
    }
    
    try {
        const content = JSON.parse(data.content || '{}')
        return {
            id: data.id,
            name: data.name.replace(RECIPE_FILE_EXTENSION, ''),
            label_data: content.label_data,
            costing_data: content.costing_data || null,
            category: content.category || null,
            tags: content.tags || [],
            notes: content.notes || null,
            created_at: data.created_at,
            updated_at: data.updated_at
        }
    } catch (parseError) {
        console.error('Error parsing recipe content:', parseError)
        return null
    }
}

/**
 * Create a new recipe in Knowledge Hub
 */
export async function createRecipe(
    name: string,
    labelData: LabelData,
    folderId?: string,
    category?: string,
    tags?: string[],
    notes?: string
): Promise<RecipeDocument> {
    const supabase = createSupabaseServerClient()
    
    // Use provided folder or get/create default Recipes folder
    const targetFolderId = folderId || await getOrCreateRecipesFolder()
    
    // Create recipe content as JSON
    const content = JSON.stringify({
        label_data: labelData,
        costing_data: labelData.costing,
        category: category || null,
        tags: tags || [],
        notes: notes || null
    }, null, 2)
    
    const fileName = `${name}${RECIPE_FILE_EXTENSION}`
    
    const { data, error } = await supabase
        .from('knowledge_documents')
        .insert({
            name: fileName,
            type: 'file',
            status: 'indexed',
            ai_status: 'ready',
            content,
            knowledge_base_id: targetFolderId,
            mime_type: 'application/json'
        })
        .select()
        .single()
    
    if (error) {
        console.error('Error creating recipe:', error)
        throw new Error('Failed to create recipe')
    }
    
    revalidatePath('/knowledge')
    revalidatePath('/label-maker')
    
    return {
        id: data.id,
        name,
        label_data: labelData,
        costing_data: labelData.costing,
        category: category || null,
        tags: tags || [],
        notes: notes || null,
        created_at: data.created_at,
        updated_at: data.updated_at
    }
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(
    id: string,
    updates: {
        name?: string
        labelData?: LabelData
        category?: string | null
        tags?: string[]
        notes?: string | null
    }
): Promise<RecipeDocument> {
    const supabase = createSupabaseServerClient()
    
    // Get existing recipe
    const existing = await getRecipe(id)
    if (!existing) {
        throw new Error('Recipe not found')
    }
    
    // Merge updates
    const newLabelData = updates.labelData ?? existing.label_data
    const content = JSON.stringify({
        label_data: newLabelData,
        costing_data: newLabelData.costing,
        category: updates.category !== undefined ? updates.category : existing.category,
        tags: updates.tags ?? existing.tags,
        notes: updates.notes !== undefined ? updates.notes : existing.notes
    }, null, 2)
    
    const updatePayload: Record<string, any> = {
        content,
        updated_at: new Date().toISOString()
    }
    
    // Update name if provided
    if (updates.name && updates.name !== existing.name) {
        updatePayload.name = `${updates.name}${RECIPE_FILE_EXTENSION}`
    }
    
    const { data, error } = await supabase
        .from('knowledge_documents')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()
    
    if (error) {
        console.error('Error updating recipe:', error)
        throw new Error('Failed to update recipe')
    }
    
    revalidatePath('/knowledge')
    revalidatePath('/label-maker')
    
    return {
        id: data.id,
        name: updates.name ?? existing.name,
        label_data: newLabelData,
        costing_data: newLabelData.costing,
        category: updates.category !== undefined ? updates.category : existing.category,
        tags: updates.tags ?? existing.tags,
        notes: updates.notes !== undefined ? updates.notes : existing.notes,
        created_at: data.created_at,
        updated_at: data.updated_at
    }
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(id: string): Promise<void> {
    const supabase = createSupabaseServerClient()
    
    const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', id)
    
    if (error) {
        console.error('Error deleting recipe:', error)
        throw new Error('Failed to delete recipe')
    }
    
    revalidatePath('/knowledge')
    revalidatePath('/label-maker')
}

/**
 * Duplicate a recipe
 */
export async function duplicateRecipe(id: string): Promise<RecipeDocument> {
    const original = await getRecipe(id)
    if (!original) {
        throw new Error('Recipe not found')
    }
    
    return createRecipe(
        `${original.name} (Copy)`,
        original.label_data,
        undefined, // Use default folder
        original.category ?? undefined,
        original.tags,
        original.notes ?? undefined
    )
}

/**
 * Get Knowledge Hub folders for recipe storage
 */
export async function getKnowledgeFolders(): Promise<Array<{ id: string; name: string }>> {
    const supabase = createSupabaseServerClient()
    
    const { data, error } = await supabase
        .from('knowledge_bases')
        .select('id, name')
        .order('name')
    
    if (error) {
        console.error('Error fetching folders:', error)
        return []
    }
    
    return data
}

/**
 * Get unique categories from all recipes
 */
export async function getRecipeCategories(): Promise<string[]> {
    const recipes = await getRecipes()
    const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))] as string[]
    return categories.sort()
}

// Re-export types for backwards compatibility
export type Recipe = RecipeDocument
