'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { NutritionLabel } from '@/components/recipe-builder/components/NutritionLabel'
import { TrafficLightLabel } from '@/components/recipe-builder/components/TrafficLightLabel'
import type { NutrientValue } from '@/components/recipe-builder/types'

/**
 * Public Nutrition Label Page
 *
 * Displays nutrition information for a recipe that can be accessed via QR code.
 * No authentication required - only published recipes are visible.
 */

interface RecipeNutrition {
  id: string
  name: string
  category: string
  serving: {
    serving_size_grams: number
    servings_per_package?: number
  }
  nutrition: {
    per_serving: Record<string, NutrientValue>
    per_recipe_total: Record<string, NutrientValue>
    total_yield_grams: number
  }
  allergens: string[]
  may_contain_allergens: string[]
  barcode: string | null
}

export default function NutritionPage() {
  const params = useParams()
  const recipeId = params?.recipeId as string

  const [recipe, setRecipe] = useState<RecipeNutrition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) return

      try {
        setLoading(true)
        const response = await fetch(`/api/nutrition/${recipeId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load nutrition information')
        }

        setRecipe(data.data)
      } catch (err: any) {
        setError(err.message || 'Failed to load nutrition information')
      } finally {
        setLoading(false)
      }
    }

    fetchRecipe()
  }, [recipeId])

  // Calculate per 100g values
  const per100gValues = useMemo(() => {
    if (!recipe?.nutrition?.per_recipe_total || !recipe?.nutrition?.total_yield_grams) {
      return recipe?.nutrition?.per_serving || {}
    }
    const totalYield = recipe.nutrition.total_yield_grams
    const result: Record<string, NutrientValue> = {}

    Object.entries(recipe.nutrition.per_recipe_total).forEach(([key, value]) => {
      if (value && typeof value.quantity === 'number') {
        result[key] = {
          quantity: (value.quantity / totalYield) * 100,
          unit: value.unit,
        }
      }
    })
    return result
  }, [recipe])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading nutrition information...</p>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    const isNotPublished = error?.includes('not yet published')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">{isNotPublished ? '📝' : '🍽️'}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isNotPublished ? 'Recipe Not Published Yet' : 'Nutrition Information Unavailable'}
          </h1>
          <p className="text-gray-600">
            {isNotPublished
              ? 'This recipe is still in draft mode. The nutrition information will be available once the recipe is published.'
              : (error || 'This recipe could not be found.')}
          </p>
        </div>
      </div>
    )
  }

  const servingSize = recipe.serving?.serving_size_grams || 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
          {recipe.category && (
            <p className="text-gray-600 mt-1">{recipe.category}</p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-4 items-start">
          {/* Left Column - Nutrition Facts Label */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-base font-semibold mb-3 text-gray-800">
              Nutrition Facts
            </h2>
            <div className="flex justify-center">
              <NutritionLabel
                servingSize={100}
                nutrition={per100gValues}
                servingDescription="per 100g"
                servingsPerContainer={recipe.serving?.servings_per_package && recipe.serving.servings_per_package > 0 ? recipe.serving.servings_per_package : undefined}
              />
            </div>
          </div>

          {/* Right Column - Traffic Light + Allergens + Barcode */}
          <div className="space-y-4">
            {/* Traffic Light Label */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-base font-semibold mb-3 text-gray-800">
                At a Glance (per 100g)
              </h2>
              <div className="flex justify-center">
                <TrafficLightLabel
                  servingSize={100}
                  nutrition={per100gValues}
                  hideHeader
                />
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Reference intake of an average adult (8400 kJ / 2000 kcal)
              </p>
            </div>

            {/* Allergens Section */}
            {((recipe.allergens && recipe.allergens.length > 0) ||
              (recipe.may_contain_allergens && recipe.may_contain_allergens.length > 0)) && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-base font-semibold mb-3 text-gray-800">
                  Allergen Information
                </h2>

                {recipe.allergens && recipe.allergens.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Contains:</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.allergens.map((allergen) => (
                        <span
                          key={allergen}
                          className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {recipe.may_contain_allergens && recipe.may_contain_allergens.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">May Contain:</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.may_contain_allergens.map((allergen) => (
                        <span
                          key={allergen}
                          className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Barcode */}
            {recipe.barcode && (
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Product Barcode</p>
                <p className="font-mono text-lg tracking-wider">{recipe.barcode}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs text-gray-500">
          <p>Nutritional values are calculated per 100g unless otherwise stated.</p>
          <p className="mt-0.5">Always check the product packaging for the most accurate information.</p>
        </footer>
      </main>
    </div>
  )
}
