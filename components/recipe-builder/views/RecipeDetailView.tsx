'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  Clock,
  Scale,
  DollarSign,
  Edit,
  Trash2,
  MoreVertical,
  Package,
  AlertTriangle,
  Minus,
  Plus,
  Barcode,
  Copy,
  Check,
} from 'lucide-react'
import { useRecipes, useRecipeBuilderNavigation } from '../context/RecipeBuilderContext'
import { NutritionLabel } from '../components/NutritionLabel'
import { TrafficLightLabel } from '../components/TrafficLightLabel'
import { MacroChart } from '../components/MacroChart'
import { formatBarcode, generateUniqueEAN13 } from '../utils'
import type { Recipe, NutrientValue, RecipeInventory } from '../types'

/**
 * Recipe Detail View
 *
 * Displays complete recipe information including:
 * - Basic info and categories
 * - Ingredients list
 * - Preparation steps
 * - Allergens
 * - Nutrition facts with macro chart
 * - FDA Nutrition Label
 * - Traffic Light Label
 */

// Nutrient display order
const NUTRIENT_ORDER = [
  'Energy',
  'Total Carbohydrates',
  'Protein',
  'Total Fat',
  'Dietary Fiber',
  'Net Carbohydrates',
  'Total Sugar',
  'Added Sugar',
  'Saturated Fat',
  'Monounsaturated Fat',
  'Polyunsaturated Fat',
  'Trans Fat',
  'Cholesterol',
  'Calcium',
  'Sodium',
  'Iron',
  'Potassium',
  'Phosphorus',
  'Magnesium',
  'Zinc',
  'Copper',
  'Manganese',
  'Selenium',
  'Vitamin A',
  'Vitamin C',
  'Vitamin D',
  'Vitamin E',
  'Vitamin K',
  'Thiamin',
  'Riboflavin',
  'Niacin',
  'Vitamin B6',
  'Vitamin B12',
  'Folate',
]

interface RecipeDetailViewProps {
  recipeId: string
  onBack: () => void
  onEdit?: () => void
}

export function RecipeDetailView({ recipeId, onBack, onEdit }: RecipeDetailViewProps) {
  const { getRecipeById, updateRecipe, recipes } = useRecipes()
  const recipe = getRecipeById(recipeId)

  // Stock management state
  const [isUpdatingStock, setIsUpdatingStock] = useState(false)
  const [stockAdjustment, setStockAdjustment] = useState(0)

  // Barcode state
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false)
  const [barcodeCopied, setBarcodeCopied] = useState(false)

  // Auto-generate barcode if recipe doesn't have one
  React.useEffect(() => {
    const generateBarcodeIfMissing = async () => {
      if (!recipe || recipe.barcode || isGeneratingBarcode) return

      setIsGeneratingBarcode(true)
      try {
        // Get all existing barcodes from recipes
        const existingBarcodes = recipes
          .map((r) => r.barcode)
          .filter((b): b is string => !!b)

        // Generate unique barcode
        const newBarcode = generateUniqueEAN13(existingBarcodes)

        // Save to database
        await updateRecipe(recipe.id, { barcode: newBarcode })
      } catch (error) {
        console.error('Failed to generate barcode:', error)
      } finally {
        setIsGeneratingBarcode(false)
      }
    }

    generateBarcodeIfMissing()
  }, [recipe?.id, recipe?.barcode, recipes, updateRecipe, isGeneratingBarcode])

  // Copy barcode to clipboard
  const handleCopyBarcode = async () => {
    if (!recipe?.barcode) return

    try {
      await navigator.clipboard.writeText(recipe.barcode)
      setBarcodeCopied(true)
      setTimeout(() => setBarcodeCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy barcode:', error)
    }
  }

  // Handle quick stock adjustment
  const handleQuickAdjust = async (amount: number) => {
    if (!recipe) return

    const currentStock = recipe.inventory?.stock_quantity || 0
    const newStock = Math.max(0, currentStock + amount)

    setIsUpdatingStock(true)
    try {
      await updateRecipe(recipe.id, {
        inventory: {
          stock_quantity: newStock,
          stock_unit: recipe.inventory?.stock_unit || 'portions',
          min_stock_alert: recipe.inventory?.min_stock_alert || null,
          last_stock_update: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('Failed to update stock:', error)
    } finally {
      setIsUpdatingStock(false)
    }
  }

  // Handle manual stock set
  const handleSetStock = async (newStock: number) => {
    if (!recipe) return

    setIsUpdatingStock(true)
    try {
      await updateRecipe(recipe.id, {
        inventory: {
          stock_quantity: Math.max(0, newStock),
          stock_unit: recipe.inventory?.stock_unit || 'portions',
          min_stock_alert: recipe.inventory?.min_stock_alert || null,
          last_stock_update: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('Failed to update stock:', error)
    } finally {
      setIsUpdatingStock(false)
    }
  }

  // Get per 100g values - use existing data if available, otherwise calculate from per_recipe_total
  const per100gValues = useMemo(() => {
    // First check if per_100g data exists in the recipe
    if (recipe?.nutrition?.per_100g && Object.keys(recipe.nutrition.per_100g).length > 0) {
      return recipe.nutrition.per_100g
    }

    // Otherwise calculate from per_recipe_total
    if (!recipe?.nutrition?.per_recipe_total || !recipe?.nutrition?.total_yield_grams) {
      return {}
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

  if (!recipe) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Recipes
        </Button>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Recipe not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const perServing = recipe.nutrition?.per_serving || {}
  const servingSize = recipe.serving?.serving_size_grams || 100

  return (
    <div className="p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{recipe.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={recipe.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                {recipe.status}
              </Badge>
              {recipe.metadata?.is_sub_recipe && (
                <Badge variant="outline">Sub Recipe</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Prep Time</p>
              <p className="font-medium">
                {recipe.preparation_time_minutes
                  ? `${recipe.preparation_time_minutes} min`
                  : '--'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Scale className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Per Serving</p>
              <p className="font-medium">{servingSize}g</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Selling Price</p>
              <p className="font-medium">
                {recipe.costs?.selling_price_exclusive_vat
                  ? `${recipe.costs.selling_price_exclusive_vat.toFixed(2)} AED`
                  : '--'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {recipe.inventory?.min_stock_alert &&
            (recipe.inventory?.stock_quantity || 0) <= recipe.inventory.min_stock_alert ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <Package className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Stock</p>
              <p className={`font-medium ${
                recipe.inventory?.min_stock_alert &&
                (recipe.inventory?.stock_quantity || 0) <= recipe.inventory.min_stock_alert
                  ? 'text-amber-600'
                  : ''
              }`}>
                {recipe.inventory?.stock_quantity || 0} {recipe.inventory?.stock_unit || 'portions'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Barcode className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Barcode</p>
              {isGeneratingBarcode ? (
                <p className="text-sm text-muted-foreground">Generating...</p>
              ) : recipe.barcode ? (
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-medium truncate">
                    {formatBarcode(recipe.barcode)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleCopyBarcode}
                  >
                    {barcodeCopied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">--</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Quick Stock Update
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Quick adjustment buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjust(-10)}
                disabled={isUpdatingStock}
              >
                -10
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjust(-5)}
                disabled={isUpdatingStock}
              >
                -5
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjust(-1)}
                disabled={isUpdatingStock}
              >
                -1
              </Button>

              {/* Current stock display */}
              <div className="px-4 py-2 bg-muted rounded-md min-w-[100px] text-center">
                <span className="text-lg font-semibold">
                  {recipe.inventory?.stock_quantity || 0}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  {recipe.inventory?.stock_unit || 'portions'}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjust(1)}
                disabled={isUpdatingStock}
              >
                +1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjust(5)}
                disabled={isUpdatingStock}
              >
                +5
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjust(10)}
                disabled={isUpdatingStock}
              >
                +10
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Manual input */}
            <div className="flex items-center gap-2">
              <Label htmlFor="stock-input" className="text-sm whitespace-nowrap">Set to:</Label>
              <Input
                id="stock-input"
                type="number"
                min="0"
                className="w-20"
                placeholder="0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseInt((e.target as HTMLInputElement).value)
                    if (!isNaN(value)) {
                      handleSetStock(value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
                disabled={isUpdatingStock}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                  const value = parseInt(input.value)
                  if (!isNaN(value)) {
                    handleSetStock(value)
                    input.value = ''
                  }
                }}
                disabled={isUpdatingStock}
              >
                Set
              </Button>
            </div>

            {isUpdatingStock && (
              <span className="text-sm text-muted-foreground">Updating...</span>
            )}
          </div>

          {recipe.inventory?.last_stock_update && (
            <p className="text-xs text-muted-foreground mt-3">
              Last updated: {new Date(recipe.inventory.last_stock_update).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Category Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{recipe.category || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub Category</span>
                <span className="font-medium">{recipe.sub_category || '--'}</span>
              </div>
              {recipe.diet_types && recipe.diet_types.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Diet Types</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {recipe.diet_types.map((diet) => (
                      <Badge key={diet} variant="outline" className="text-xs">
                        {diet}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {recipe.description && (
                <div className="pt-2">
                  <span className="text-muted-foreground text-sm">Description</span>
                  <p className="mt-1 text-sm">{recipe.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipe.ingredients.map((ing, idx) => (
                      <TableRow key={ing.ingredient_id || idx}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{ing.name}</span>
                            {ing.source && (
                              <Badge variant="secondary" className="text-xs">
                                {ing.source === 'bytebeam' ? 'bytebeam' : 'imported'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {ing.quantity_in_grams?.toFixed(1) || ing.quantity} {ing.unit || 'g'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No ingredients added</p>
              )}
            </CardContent>
          </Card>

          {/* Preparation Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preparation</CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.steps && recipe.steps.length > 0 ? (
                <ol className="list-decimal list-inside space-y-2">
                  {recipe.steps.map((step, idx) => (
                    <li key={idx} className="text-sm">
                      {step}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No preparation steps added
                </p>
              )}
            </CardContent>
          </Card>

          {/* Allergens */}
          {((recipe.allergens && recipe.allergens.length > 0) ||
            (recipe.may_contain_allergens && recipe.may_contain_allergens.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Allergens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recipe.allergens && recipe.allergens.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Contains</p>
                    <div className="flex flex-wrap gap-2">
                      {recipe.allergens.map((allergen) => (
                        <Badge key={allergen} variant="destructive">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {recipe.may_contain_allergens && recipe.may_contain_allergens.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">May Contain</p>
                    <div className="flex flex-wrap gap-2">
                      {recipe.may_contain_allergens.map((allergen) => (
                        <Badge key={allergen} variant="outline">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Production Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Production Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cooked Weight</span>
                <span className="font-medium">
                  {recipe.serving?.total_cooked_weight_grams?.toFixed(1) ||
                    recipe.nutrition?.total_yield_grams?.toFixed(1) ||
                    '--'}{' '}
                  g
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Serving Weight</span>
                <span className="font-medium">{servingSize} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servings per Package</span>
                <span className="font-medium">
                  {recipe.serving?.servings_per_package || '--'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-medium">
                  {recipe.costs?.total_cost?.toFixed(2) || '--'} AED
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost per Serving</span>
                <span className="font-medium">
                  {recipe.costs?.per_serving_selling_price?.toFixed(2) || '--'} AED
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Macro Nutrients Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Macro Nutrients (per serving)</CardTitle>
            </CardHeader>
            <CardContent>
              <MacroChart nutrition={perServing} />
            </CardContent>
          </Card>

          {/* Nutrition Values Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nutrition Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NUTRITION TYPE</TableHead>
                      <TableHead className="text-right">
                        {recipe.nutrition?.total_yield_grams
                          ? Number.isInteger(recipe.nutrition.total_yield_grams)
                            ? recipe.nutrition.total_yield_grams
                            : recipe.nutrition.total_yield_grams.toFixed(1)
                          : '--'} GM TOTAL YIELD
                      </TableHead>
                      <TableHead className="text-right">
                        {servingSize} GM SERVING SIZE
                      </TableHead>
                      {servingSize !== 100 && (
                        <TableHead className="text-right">100 GM SERVING SIZE</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {NUTRIENT_ORDER.map((nutrient) => {
                      const perRecipeTotalVal = recipe.nutrition?.per_recipe_total?.[nutrient]
                      const perServingVal = perServing[nutrient]
                      const per100gVal = per100gValues[nutrient]
                      if (!perRecipeTotalVal && !perServingVal && !per100gVal) return null

                      return (
                        <TableRow key={nutrient}>
                          <TableCell className="font-medium">{nutrient}</TableCell>
                          <TableCell className="text-right">
                            {perRecipeTotalVal
                              ? `${perRecipeTotalVal.quantity.toFixed(2)} ${perRecipeTotalVal.unit.toUpperCase()}`
                              : '--'}
                          </TableCell>
                          <TableCell className="text-right">
                            {perServingVal
                              ? `${perServingVal.quantity.toFixed(2)} ${perServingVal.unit.toUpperCase()}`
                              : '--'}
                          </TableCell>
                          {servingSize !== 100 && (
                            <TableCell className="text-right">
                              {per100gVal
                                ? `${per100gVal.quantity.toFixed(2)} ${per100gVal.unit.toUpperCase()}`
                                : '--'}
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Label */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nutrition Label</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <NutritionLabel
                servingSize={100}
                nutrition={per100gValues}
                servingDescription="per 100g"
              />
            </CardContent>
          </Card>

          {/* Traffic Light Label */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Traffic Light Label</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <TrafficLightLabel
                servingSize={100}
                nutrition={per100gValues}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
