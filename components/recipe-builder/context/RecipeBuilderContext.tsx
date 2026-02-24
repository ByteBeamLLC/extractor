'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  Recipe,
  DashboardStats,
  RecipeBuilderViewType,
  NavigationParams,
  CustomIngredient,
} from '../types'

/**
 * Recipe Builder Context
 *
 * Provides state management for the Recipe Builder module including:
 * - Navigation state within the module
 * - Dashboard statistics (fetched from API)
 * - Recipe CRUD operations
 * - Single recipe fetching by ID
 *
 * Note: Recipe list pagination is handled locally in RecipesView,
 * not in this context. This avoids loading all recipes into memory.
 */

// Context state interface
interface RecipeBuilderState {
  customIngredients: CustomIngredient[]
  loading: boolean
  error: string | null

  // Navigation
  currentView: RecipeBuilderViewType
  selectedRecipeId: string | null
  selectedIngredientId: string | null
  navigationHistory: RecipeBuilderViewType[]

  // Statistics
  stats: DashboardStats
}

// Context actions interface
interface RecipeBuilderActions {
  // Navigation
  navigateTo: (view: RecipeBuilderViewType, params?: NavigationParams) => void
  goBack: () => void

  // Recipe operations
  getRecipeById: (id: string) => Promise<Recipe | undefined>
  createRecipe: (recipe: Partial<Recipe>) => Promise<Recipe | null>
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<Recipe | null>

  // Ingredient operations
  getIngredientById: (id: string) => CustomIngredient | undefined

  // Data refresh
  refreshStats: () => Promise<void>
}

type RecipeBuilderContextType = RecipeBuilderState & RecipeBuilderActions

const RecipeBuilderContext = createContext<RecipeBuilderContextType | undefined>(
  undefined
)

// Initial state
const initialState: RecipeBuilderState = {
  customIngredients: [],
  loading: true,
  error: null,
  currentView: 'dashboard',
  selectedRecipeId: null,
  selectedIngredientId: null,
  navigationHistory: [],
  stats: {
    recipesCount: 0,
    subRecipesCount: 0,
    ingredientsCount: 0,
    menusCount: 0,
    publishedCount: 0,
    draftCount: 0,
  },
}

interface RecipeBuilderProviderProps {
  children: ReactNode
  initialView?: RecipeBuilderViewType
}

export function RecipeBuilderProvider({
  children,
  initialView = 'dashboard',
}: RecipeBuilderProviderProps) {
  const [state, setState] = useState<RecipeBuilderState>({
    ...initialState,
    currentView: initialView,
  })

  // Load dashboard stats from the stats API
  const loadStats = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await fetch('/api/recipe-builder/stats')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch stats')
      }

      const { data: stats } = await response.json()

      setState((prev) => ({
        ...prev,
        stats,
        loading: false,
        error: null,
      }))
    } catch (err) {
      console.error('Failed to load stats:', err)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load stats',
      }))
    }
  }, [])

  // Navigation functions
  const navigateTo = useCallback(
    (view: RecipeBuilderViewType, params?: NavigationParams) => {
      setState((prev) => ({
        ...prev,
        currentView: view,
        selectedRecipeId: params?.recipeId ?? prev.selectedRecipeId,
        selectedIngredientId: params?.ingredientId ?? prev.selectedIngredientId,
        navigationHistory: [...prev.navigationHistory, prev.currentView],
      }))
    },
    []
  )

  const goBack = useCallback(() => {
    setState((prev) => {
      const newHistory = [...prev.navigationHistory]
      const previousView = newHistory.pop() || 'dashboard'
      return {
        ...prev,
        currentView: previousView,
        navigationHistory: newHistory,
        // Clear selection when going back
        selectedRecipeId:
          previousView === 'recipes' ? null : prev.selectedRecipeId,
        selectedIngredientId:
          previousView === 'ingredients' ? null : prev.selectedIngredientId,
      }
    })
  }, [])

  // Fetch a single recipe by ID from the API
  const getRecipeById = useCallback(async (id: string): Promise<Recipe | undefined> => {
    try {
      const response = await fetch(`/api/recipe-builder/recipes?id=${id}`)
      if (!response.ok) {
        if (response.status === 404) return undefined
        throw new Error('Failed to fetch recipe')
      }
      const { data } = await response.json()
      return data
    } catch (err) {
      console.error('Failed to fetch recipe:', err)
      return undefined
    }
  }, [])

  // Ingredient query functions
  const getIngredientById = useCallback(
    (id: string) => state.customIngredients.find((i) => i.id === id),
    [state.customIngredients]
  )

  // Helper to trigger Arabic translation for a recipe
  const triggerTranslation = useCallback(async (
    recipeId: string,
    fieldsToTranslate?: string[]
  ) => {
    try {
      if (fieldsToTranslate && fieldsToTranslate.length > 0) {
        // Partial translation - only specific fields changed
        await fetch('/api/recipe/translate-artwork', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipeId, fieldsToTranslate }),
        })
      } else {
        // Full translation for new recipes
        await fetch('/api/recipe/translate-artwork', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipeId }),
        })
      }
    } catch (error) {
      // Log but don't fail the recipe operation
      console.error('Failed to trigger translation:', error)
    }
  }, [])

  // Helper to compare translatable fields and return which ones changed
  const getChangedTranslatableFields = useCallback((
    oldRecipe: Recipe | undefined,
    newRecipe: Partial<Recipe>
  ): string[] => {
    if (!oldRecipe) return []

    const changedFields: string[] = []

    // Check name
    if (newRecipe.name !== undefined && newRecipe.name !== oldRecipe.name) {
      changedFields.push('name')
    }

    // Check ingredients (compare by stringifying the names)
    if (newRecipe.ingredients !== undefined) {
      const oldIngredientNames = (oldRecipe.ingredients || []).map(i => i.name).sort().join(',')
      const newIngredientNames = (newRecipe.ingredients || []).map(i => i.name).sort().join(',')
      if (oldIngredientNames !== newIngredientNames) {
        changedFields.push('ingredients')
      }
    }

    // Check allergens
    if (newRecipe.allergens !== undefined) {
      const oldAllergens = (oldRecipe.allergens || []).sort().join(',')
      const newAllergens = (newRecipe.allergens || []).sort().join(',')
      if (oldAllergens !== newAllergens) {
        changedFields.push('allergens')
      }
    }

    // Check diet_types
    if (newRecipe.diet_types !== undefined) {
      const oldDietTypes = (oldRecipe.diet_types || []).sort().join(',')
      const newDietTypes = (newRecipe.diet_types || []).sort().join(',')
      if (oldDietTypes !== newDietTypes) {
        changedFields.push('diet_types')
      }
    }

    return changedFields
  }, [])

  // Create a new recipe
  const createRecipe = useCallback(async (recipe: Partial<Recipe>): Promise<Recipe> => {
    const response = await fetch('/api/recipe-builder/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || 'Failed to create recipe'
      console.error('Failed to create recipe:', errorMessage)
      throw new Error(errorMessage)
    }

    const { data: newRecipe } = await response.json()

    // Refresh stats after creating a recipe
    loadStats()

    // Trigger Arabic translation for new recipe (async, don't block)
    triggerTranslation(newRecipe.id)

    return newRecipe
  }, [triggerTranslation, loadStats])

  // Update an existing recipe
  const updateRecipe = useCallback(async (id: string, recipe: Partial<Recipe>): Promise<Recipe> => {
    // Fetch the old recipe to compare translatable fields
    const oldRecipe = await getRecipeById(id)

    const response = await fetch(`/api/recipe-builder/recipes?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || 'Failed to update recipe'
      console.error('Failed to update recipe:', errorMessage)
      throw new Error(errorMessage)
    }

    const { data: updatedRecipe } = await response.json()

    // Check if any translatable fields changed and trigger translation
    const changedFields = getChangedTranslatableFields(oldRecipe, recipe)
    if (changedFields.length > 0) {
      triggerTranslation(id, changedFields)
    }

    return updatedRecipe
  }, [getRecipeById, getChangedTranslatableFields, triggerTranslation])

  // Refresh stats
  const refreshStats = useCallback(async () => {
    await loadStats()
  }, [loadStats])

  // Load stats on mount
  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Context value
  const value: RecipeBuilderContextType = {
    ...state,
    navigateTo,
    goBack,
    getRecipeById,
    createRecipe,
    updateRecipe,
    getIngredientById,
    refreshStats,
  }

  return (
    <RecipeBuilderContext.Provider value={value}>
      {children}
    </RecipeBuilderContext.Provider>
  )
}

// Custom hook for consuming the context
export function useRecipeBuilder() {
  const context = useContext(RecipeBuilderContext)
  if (!context) {
    throw new Error(
      'useRecipeBuilder must be used within a RecipeBuilderProvider'
    )
  }
  return context
}

// Selector hooks for specific parts of the context
export function useRecipeBuilderNavigation() {
  const { currentView, selectedRecipeId, selectedIngredientId, navigateTo, goBack } =
    useRecipeBuilder()
  return { currentView, selectedRecipeId, selectedIngredientId, navigateTo, goBack }
}

export function useRecipes() {
  const {
    loading,
    error,
    stats,
    getRecipeById,
    createRecipe,
    updateRecipe,
    refreshStats,
  } = useRecipeBuilder()
  return {
    loading,
    error,
    stats,
    getRecipeById,
    createRecipe,
    updateRecipe,
    refreshStats,
  }
}

export function useCustomIngredients() {
  const { customIngredients, loading, error, getIngredientById } =
    useRecipeBuilder()
  return { customIngredients, loading, error, getIngredientById }
}
