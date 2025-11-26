"use client"

import * as React from "react"
import { RecipeListView } from "@/components/label-maker/RecipeListView"
import { LabelMakerView } from "@/components/label-maker/LabelMakerView"
import { DEFAULT_LABEL_DATA } from "@/components/label-maker/LabelDataForm"
import type { RecipeDocument } from "@/lib/label-maker/recipe-actions"

type ViewMode = "list" | "editor"

export function LabelMakerPage() {
    const [viewMode, setViewMode] = React.useState<ViewMode>("list")
    const [selectedRecipe, setSelectedRecipe] = React.useState<RecipeDocument | null>(null)

    const handleSelectRecipe = (recipe: RecipeDocument) => {
        setSelectedRecipe(recipe)
        setViewMode("editor")
    }

    const handleNewRecipe = () => {
        setSelectedRecipe(null)
        setViewMode("editor")
    }

    const handleBack = () => {
        setViewMode("list")
        setSelectedRecipe(null)
    }

    if (viewMode === "editor") {
        return (
            <div className="h-full flex flex-col">
                {/* Back button header */}
                <div className="h-10 border-b flex items-center px-4 bg-background shrink-0">
                    <button
                        onClick={handleBack}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        ← Back to Recipes
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <LabelMakerView
                        initialData={selectedRecipe?.label_data ?? DEFAULT_LABEL_DATA}
                        initialRecipeId={selectedRecipe?.id}
                        onSave={() => {
                            // Optionally go back to list after save
                        }}
                    />
                </div>
            </div>
        )
    }

    return (
        <RecipeListView
            onSelectRecipe={handleSelectRecipe}
            onNewRecipe={handleNewRecipe}
        />
    )
}

export default LabelMakerPage

