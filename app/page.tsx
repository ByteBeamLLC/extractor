'use client'

import * as React from 'react'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { HomeView } from '@/components/views/HomeView'
import { AgentHubView } from '@/components/views/AgentHubView'
import { KnowledgeView } from '@/components/views/KnowledgeView'
import { CopilotView } from '@/components/copilot/CopilotView'
import { LabelMakerPage } from '@/components/views/LabelMakerPage'
import { WorkspaceProvider } from '@/components/workspace/WorkspaceStoreProvider'
import {
  RecipeBuilderProvider,
  DashboardView as RecipeBuilderDashboard,
  RecipesView as RecipeBuilderRecipes,
  IngredientsView as RecipeBuilderIngredients,
  USDAIngredientsView as RecipeBuilderUSDAIngredients,
} from '@/components/recipe-builder'

// Helper to check if a view is a Recipe Builder view
function isRecipeBuilderView(view: string): boolean {
  return view.startsWith('recipe-builder')
}

// Map sidebar view to Recipe Builder internal view
function getRecipeBuilderView(view: string) {
  switch (view) {
    case 'recipe-builder-dashboard':
      return <RecipeBuilderDashboard />
    case 'recipe-builder-recipes':
      return <RecipeBuilderRecipes />
    case 'recipe-builder-ingredients-usda':
      return <RecipeBuilderUSDAIngredients />
    case 'recipe-builder-ingredients':
    case 'recipe-builder-ingredients-manage':
    case 'recipe-builder-ingredients-custom':
      return <RecipeBuilderIngredients />
    default:
      return <RecipeBuilderDashboard />
  }
}

export default function Home() {
  const [activeView, setActiveView] = React.useState("home")

  // Render the active view content
  const renderContent = () => {
    // Recipe Builder views
    if (isRecipeBuilderView(activeView)) {
      return (
        <RecipeBuilderProvider>
          {getRecipeBuilderView(activeView)}
        </RecipeBuilderProvider>
      )
    }

    // Main app views
    switch (activeView) {
      case 'home':
        return <HomeView />
      case 'agent-hub':
        return <AgentHubView />
      case 'knowledge':
        return <KnowledgeView />
      case 'copilot':
        return <CopilotView />
      case 'label-maker':
        return <LabelMakerPage />
      default:
        return <HomeView />
    }
  }

  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <AppSidebar onNavigate={setActiveView} activeView={activeView} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-background">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden bg-muted/10 min-w-0">
            {renderContent()}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </WorkspaceProvider>
  )
}
