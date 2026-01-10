'use client'

import React from 'react'
import { RecipeBuilderProvider, useRecipeBuilderNavigation } from './context/RecipeBuilderContext'
import { DashboardView } from './views/DashboardView'
import { RecipesView } from './views/RecipesView'
import { IngredientsView } from './views/IngredientsView'
import type { RecipeBuilderViewType } from './types'

/**
 * Recipe Builder Module
 *
 * Main container component for the Recipe Builder feature.
 * Handles view routing and provides the context provider.
 */

interface RecipeBuilderModuleProps {
  initialView?: RecipeBuilderViewType
}

// View router component
function RecipeBuilderRouter() {
  const { currentView } = useRecipeBuilderNavigation()

  switch (currentView) {
    case 'dashboard':
      return <DashboardView />
    case 'recipes':
    case 'recipe-detail':
    case 'recipe-edit':
      return <RecipesView />
    case 'ingredients':
    case 'ingredients-manage':
    case 'ingredients-custom':
    case 'ingredient-detail':
      return <IngredientsView />
    default:
      return <DashboardView />
  }
}

export function RecipeBuilderModule({ initialView = 'dashboard' }: RecipeBuilderModuleProps) {
  return (
    <RecipeBuilderProvider initialView={initialView}>
      <div className="flex flex-col h-full w-full overflow-auto">
        <RecipeBuilderRouter />
      </div>
    </RecipeBuilderProvider>
  )
}

// Named exports for direct view access (used by page.tsx)
export { DashboardView, RecipesView, IngredientsView }
