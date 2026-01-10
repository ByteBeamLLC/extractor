'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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
 * - Recipe data and CRUD operations
 * - Navigation state within the module
 * - Dashboard statistics
 * - Search and filtering capabilities
 */

// Context state interface
interface RecipeBuilderState {
  // Data
  recipes: Recipe[]
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
  getRecipeById: (id: string) => Recipe | undefined
  searchRecipes: (query: string) => Recipe[]
  filterByCategory: (category: string) => Recipe[]
  filterByStatus: (status: string) => Recipe[]

  // Ingredient operations
  getIngredientById: (id: string) => CustomIngredient | undefined

  // Data refresh
  refreshData: () => Promise<void>
}

type RecipeBuilderContextType = RecipeBuilderState & RecipeBuilderActions

const RecipeBuilderContext = createContext<RecipeBuilderContextType | undefined>(
  undefined
)

// Initial state
const initialState: RecipeBuilderState = {
  recipes: [],
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

  // Load recipes from local data (will be replaced with Supabase)
  const loadRecipes = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      // TODO: Replace with Supabase fetch
      // For now, load from local JSON files via API route
      const response = await fetch('/api/recipe-builder/recipes')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch recipes')
      }

      const data = await response.json()

      // Handle both array response and object with recipes property
      const recipes: Recipe[] = Array.isArray(data) ? data : (data.recipes || [])

      setState((prev) => ({
        ...prev,
        recipes,
        loading: false,
        error: null,
      }))
    } catch (err) {
      console.error('Failed to load recipes:', err)
      setState((prev) => ({
        ...prev,
        recipes: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load recipes',
      }))
    }
  }, [])

  // Calculate statistics from recipes
  const stats = useMemo((): DashboardStats => {
    const { recipes } = state
    return {
      recipesCount: recipes.length,
      subRecipesCount: recipes.filter((r) => r.metadata?.is_sub_recipe).length,
      ingredientsCount: recipes.reduce(
        (acc, r) => acc + (r.ingredients?.length || 0),
        0
      ),
      menusCount: 0,
      publishedCount: recipes.filter((r) => r.status === 'PUBLISHED').length,
      draftCount: recipes.filter((r) => r.status === 'DRAFT').length,
    }
  }, [state.recipes])

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

  // Recipe query functions
  const getRecipeById = useCallback(
    (id: string) => state.recipes.find((r) => r.id === id),
    [state.recipes]
  )

  const searchRecipes = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase()
      return state.recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(lowerQuery) ||
          r.category?.toLowerCase().includes(lowerQuery) ||
          r.ingredients?.some((i) =>
            i.name.toLowerCase().includes(lowerQuery)
          )
      )
    },
    [state.recipes]
  )

  const filterByCategory = useCallback(
    (category: string) =>
      category
        ? state.recipes.filter((r) => r.category === category)
        : state.recipes,
    [state.recipes]
  )

  const filterByStatus = useCallback(
    (status: string) =>
      status
        ? state.recipes.filter((r) => r.status === status)
        : state.recipes,
    [state.recipes]
  )

  // Ingredient query functions
  const getIngredientById = useCallback(
    (id: string) => state.customIngredients.find((i) => i.id === id),
    [state.customIngredients]
  )

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadRecipes()
  }, [loadRecipes])

  // Load data on mount
  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  // Context value
  const value: RecipeBuilderContextType = {
    ...state,
    stats,
    navigateTo,
    goBack,
    getRecipeById,
    searchRecipes,
    filterByCategory,
    filterByStatus,
    getIngredientById,
    refreshData,
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
    recipes,
    loading,
    error,
    stats,
    getRecipeById,
    searchRecipes,
    filterByCategory,
    filterByStatus,
  } = useRecipeBuilder()
  return {
    recipes,
    loading,
    error,
    stats,
    getRecipeById,
    searchRecipes,
    filterByCategory,
    filterByStatus,
  }
}

export function useCustomIngredients() {
  const { customIngredients, loading, error, getIngredientById } =
    useRecipeBuilder()
  return { customIngredients, loading, error, getIngredientById }
}
