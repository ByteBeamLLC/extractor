'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Plus,
  Trash2,
  Star,
  Upload,
  Save,
  Send,
  Search,
} from 'lucide-react'
import { useRecipes } from '../context/RecipeBuilderContext'
import { NutritionLabel } from '../components/NutritionLabel'
import { TrafficLightLabel } from '../components/TrafficLightLabel'
import { CreateIngredientModal } from '../components/CreateIngredientModal'
import type { Recipe, Ingredient, NutrientValue, Serving, Nutrition, Costs } from '../types'

/**
 * Recipe Builder View
 *
 * Full recipe editor with 5 tabs:
 * 1. Recipe Details - basic info
 * 2. Ingredients & Nutrition - ingredient management and nutrition calculation
 * 3. Cost - cost breakdown calculator
 * 4. Prep Method - preparation steps
 * 5. Nutrition Label - label preview and settings
 */

// Unit conversion multipliers to grams
const UNIT_CONVERSIONS: Record<string, number> = {
  G: 1,
  KG: 1000,
  ML: 1,
  L: 1000,
  TBSP: 15,
  TSP: 5,
  CUP: 240,
  PIECE: 1,
}

// Recipe categories
const RECIPE_CATEGORIES = [
  'SCHOOL MENU 2023-2024',
  'REHEATABLE MEALS',
  'HOT MEALS',
  'WRAPS AND SANDWICH',
  'FITNESS FIRST MEALS',
  'KIDS',
]

// Nutrient display order with units
const NUTRIENT_ORDER_WITH_UNITS = [
  { name: 'Energy', unit: 'kcal' },
  { name: 'Total Carbohydrates', unit: 'g' },
  { name: 'Protein', unit: 'g' },
  { name: 'Total Fat', unit: 'g' },
  { name: 'Dietary Fiber', unit: 'g' },
  { name: 'Net Carbohydrates', unit: 'g' },
  { name: 'Total Sugar', unit: 'g' },
  { name: 'Added Sugar', unit: 'g' },
  { name: 'Saturated Fat', unit: 'g' },
  { name: 'Monounsaturated Fat', unit: 'g' },
  { name: 'Polyunsaturated Fat', unit: 'g' },
  { name: 'Trans Fat', unit: 'g' },
  { name: 'Cholesterol', unit: 'mg' },
  { name: 'Calcium', unit: 'mg' },
  { name: 'Sodium', unit: 'mg' },
  { name: 'Iron', unit: 'mg' },
  { name: 'Potassium', unit: 'mg' },
  { name: 'Phosphorus', unit: 'mg' },
  { name: 'Magnesium', unit: 'mg' },
  { name: 'Zinc', unit: 'mg' },
  { name: 'Copper', unit: 'mg' },
  { name: 'Manganese', unit: 'mg' },
  { name: 'Selenium', unit: 'mcg' },
  { name: 'Vitamin A', unit: 'mcg' },
  { name: 'Vitamin C', unit: 'mg' },
  { name: 'Vitamin D', unit: 'mcg' },
  { name: 'Vitamin E', unit: 'mg' },
  { name: 'Vitamin K', unit: 'mcg' },
  { name: 'Thiamin', unit: 'mg' },
  { name: 'Riboflavin', unit: 'mg' },
  { name: 'Niacin', unit: 'mg' },
  { name: 'Vitamin B6', unit: 'mg' },
  { name: 'Vitamin B12', unit: 'mcg' },
  { name: 'Folate', unit: 'mcg' },
]

// Main allergens (18)
const ALLERGEN_LIST = [
  'Dairy',
  'Fish',
  'Gluten',
  'Treenut',
  'Sesame',
  'Oats',
  'Mustard',
  'Natural latex',
  'Lupin',
  'Lentil',
  'Peanut',
  'Soy',
  'Sulfur Dioxide or Sulphites',
  'Egg',
  'Celery',
  'Molluscs',
  'Crustacean',
  'Casein',
]

// May contain allergens (45)
const MAY_CONTAIN_LIST = [
  'Banana',
  'Monosodium Glutamate',
  'Red Chilli',
  'Litchee',
  'Papaya',
  'Food Color',
  'Apple',
  'Wine',
  'Sunflower Seed',
  'Cocoa',
  'Kiwi',
  'Cinnamon',
  'Citrus',
  'Poultry Meat',
  'Garlic',
  'Caffeine',
  'Cucumber',
  'Fig',
  'Sago',
  'Pumpkin',
  'Mutton',
  'Brinjal',
  'Chickpea',
  'Food Additive',
  'Corn',
  'Ladys Finger',
  'Poppy',
  'Coconut',
  'Yeast',
  'Red Meat',
  'Tomato',
  'Tamarind',
  'Mushroom',
  'Masoor Dal',
  'Strawberry',
  'Turmeric',
  'Green Peas',
  'Asafoetida',
  'Green Grapes',
  'White Meat',
  'Mango',
  'Pineapple',
  'Carrot',
  'Beetroot',
  'Ginger',
]

// Generate unique ID
const generateId = () => `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Empty ingredient template
const createEmptyIngredient = (): Ingredient => ({
  name: '',
  ingredient_id: generateId(),
  entity_ingredient_id: generateId(),
  quantity: 0,
  quantity_in_grams: 0,
  unit: 'G',
  source: 'MANUAL',
  yield_percent: 100,
  yield_quantity_in_grams: 0,
  cost: 0,
  is_starred: false,
  composite_ingredients: [],
  allergens: [],
  user_allergens: [],
  may_contain_allergens: [],
  user_may_contain_allergens: [],
  nutrients: {},
})

// Empty recipe template
const createEmptyRecipe = (): Partial<Recipe> => ({
  id: generateId(),
  name: '',
  category: '',
  sub_category: null,
  description: '',
  status: 'DRAFT',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  preparation_time_minutes: null,
  diet_types: [],
  allergens: [],
  may_contain_allergens: [],
  ingredients: [],
  steps: [''],
  serving: {
    total_yield_grams: 0,
    serving_size_grams: 100,
    total_cooked_weight_grams: 0,
    servings_per_package: 1,
    serving_unit: 'g',
    serving_description: '',
    scale_factor: 1,
  },
  nutrition: {
    total_yield_grams: 0,
    serving_size_grams: 100,
    per_recipe_total: {},
    per_serving: {},
    summary: { calories: 0, net_carbs: 0 },
  },
  costs: {
    food_cost: 0,
    food_cost_type: 'AED',
    labour_cost: 0,
    labour_cost_type: 'AED',
    packaging_cost: 0,
    packaging_cost_type: 'AED',
    wastage_cost: 0,
    wastage_cost_type: 'AED',
    total_cost: 0,
    total_ingredient_cost: 0,
    selling_price_inclusive_vat: 0,
    selling_price_exclusive_vat: 0,
    per_serving_selling_price: 0,
    net_profit: 0,
    vat_percent: 5,
    aggregator_commission: 0,
    aggregator_commission_type: '%',
  },
  labels: {
    ingredient_list: [],
    allergen_list: [],
    diet_type_list: [],
    business_address_list: [],
  },
  metadata: {
    is_sub_recipe: false,
    is_imported_recipe: false,
    qr_image: null,
    cover_image: null,
  },
})

type TabType = 'details' | 'ingredients' | 'cost' | 'prep' | 'label'

interface RecipeBuilderViewProps {
  recipeId?: string | null
  onBack: () => void
  onSave?: (recipe: Partial<Recipe>) => void
}

export function RecipeBuilderView({ recipeId, onBack, onSave }: RecipeBuilderViewProps) {
  const { getRecipeById } = useRecipes()
  const isEditing = !!recipeId

  // Main state
  const [activeTab, setActiveTab] = useState<TabType>('details')
  const [recipe, setRecipe] = useState<Partial<Recipe>>(createEmptyRecipe())

  // Ingredient modal state
  const [showIngredientModal, setShowIngredientModal] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient>(createEmptyIngredient())
  const [editingIngredientIndex, setEditingIngredientIndex] = useState<number | null>(null)

  // Side panel state for ingredients tab
  const [sidePanel, setSidePanel] = useState<'nutrition' | 'allergens'>('nutrition')
  const [nutrientSearch, setNutrientSearch] = useState('')
  const [allergenSearch, setAllergenSearch] = useState('')
  const [allergenTab, setAllergenTab] = useState<'allergens' | 'maycontain'>('allergens')

  // Load existing recipe if editing
  useEffect(() => {
    if (isEditing && recipeId) {
      const existingRecipe = getRecipeById(recipeId)
      if (existingRecipe) {
        setRecipe(existingRecipe)
      }
    }
  }, [recipeId, isEditing, getRecipeById])

  // Calculate total weight
  const totalWeight = useMemo(() => {
    return recipe.ingredients?.reduce((sum, ing) => sum + (ing.quantity_in_grams || 0), 0) || 0
  }, [recipe.ingredients])

  // Calculate total yield weight
  const totalYieldWeight = useMemo(() => {
    return recipe.ingredients?.reduce((sum, ing) => sum + (ing.yield_quantity_in_grams || 0), 0) || 0
  }, [recipe.ingredients])

  // Recalculate nutrition when ingredients change
  const recalculateNutrition = useCallback((ingredients: Ingredient[]) => {
    const perRecipeTotal: Record<string, NutrientValue> = {}

    // Sum all nutrients from ingredients (nutrients are per 100g, scale by actual weight)
    ingredients.forEach((ing) => {
      const scaleFactor = (ing.quantity_in_grams || 0) / 100
      Object.entries(ing.nutrients || {}).forEach(([nutrientName, value]) => {
        if (!perRecipeTotal[nutrientName]) {
          perRecipeTotal[nutrientName] = { quantity: 0, unit: value.unit }
        }
        perRecipeTotal[nutrientName].quantity += value.quantity * scaleFactor
      })
    })

    // Calculate per serving values
    const servingSize = recipe.serving?.serving_size_grams || 100
    const totalYield = ingredients.reduce((sum, ing) => sum + (ing.yield_quantity_in_grams || 0), 0) || servingSize
    const scaleFactor = totalYield / servingSize

    const perServing: Record<string, NutrientValue> = {}
    Object.entries(perRecipeTotal).forEach(([nutrientName, value]) => {
      perServing[nutrientName] = {
        quantity: scaleFactor > 0 ? value.quantity / scaleFactor : 0,
        unit: value.unit,
      }
    })

    // Aggregate allergens from ingredients
    const allAllergens = new Set<string>()
    const allMayContain = new Set<string>()
    ingredients.forEach((ing) => {
      ing.allergens?.forEach((a) => allAllergens.add(a))
      ing.may_contain_allergens?.forEach((a) => allMayContain.add(a))
    })

    setRecipe((prev) => ({
      ...prev,
      allergens: Array.from(allAllergens),
      may_contain_allergens: Array.from(allMayContain),
      nutrition: {
        total_yield_grams: totalYield,
        serving_size_grams: servingSize,
        per_recipe_total: perRecipeTotal,
        per_serving: perServing,
        summary: {
          calories: perServing['Energy']?.quantity || 0,
          net_carbs: perServing['Net Carbohydrates']?.quantity || 0,
        },
      },
      serving: {
        ...prev.serving!,
        total_yield_grams: totalYield,
        total_cooked_weight_grams: totalYield,
        scale_factor: scaleFactor,
      },
    }))
  }, [recipe.serving?.serving_size_grams])

  // Ingredient handlers
  const openIngredientModal = () => {
    setEditingIngredient(createEmptyIngredient())
    setEditingIngredientIndex(null)
    setShowIngredientModal(true)
  }

  const openEditIngredientModal = (index: number) => {
    const ingredient = recipe.ingredients?.[index]
    if (ingredient) {
      setEditingIngredient({ ...ingredient })
      setEditingIngredientIndex(index)
      setShowIngredientModal(true)
    }
  }

  const handleSaveIngredient = () => {
    const unitMultiplier = UNIT_CONVERSIONS[editingIngredient.unit] || 1
    const quantityInGrams = editingIngredient.quantity * unitMultiplier
    const yieldQuantity = quantityInGrams * (editingIngredient.yield_percent / 100)

    const ingredientToSave: Ingredient = {
      ...editingIngredient,
      quantity_in_grams: quantityInGrams,
      yield_quantity_in_grams: yieldQuantity,
    }

    let updatedIngredients: Ingredient[]
    if (editingIngredientIndex !== null) {
      updatedIngredients = [...(recipe.ingredients || [])]
      updatedIngredients[editingIngredientIndex] = ingredientToSave
    } else {
      updatedIngredients = [...(recipe.ingredients || []), ingredientToSave]
    }

    setRecipe((prev) => ({ ...prev, ingredients: updatedIngredients }))
    recalculateNutrition(updatedIngredients)

    setShowIngredientModal(false)
    setEditingIngredient(createEmptyIngredient())
    setEditingIngredientIndex(null)
  }

  const handleDeleteIngredient = (index: number) => {
    const updatedIngredients = (recipe.ingredients || []).filter((_, i) => i !== index)
    setRecipe((prev) => ({ ...prev, ingredients: updatedIngredients }))
    recalculateNutrition(updatedIngredients)
  }

  const handleToggleStar = (index: number) => {
    const updatedIngredients = [...(recipe.ingredients || [])]
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      is_starred: !updatedIngredients[index].is_starred,
    }
    setRecipe((prev) => ({ ...prev, ingredients: updatedIngredients }))
  }

  const handleInlineQuantityChange = (index: number, quantity: number) => {
    const ingredient = recipe.ingredients?.[index]
    if (!ingredient) return

    const unitMultiplier = UNIT_CONVERSIONS[ingredient.unit] || 1
    const quantityInGrams = quantity * unitMultiplier
    const yieldQuantity = quantityInGrams * (ingredient.yield_percent / 100)

    const updatedIngredients = [...(recipe.ingredients || [])]
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      quantity,
      quantity_in_grams: quantityInGrams,
      yield_quantity_in_grams: yieldQuantity,
    }
    setRecipe((prev) => ({ ...prev, ingredients: updatedIngredients }))
    recalculateNutrition(updatedIngredients)
  }

  // Step handlers
  const handleAddStep = () => {
    setRecipe((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), ''],
    }))
  }

  const handleUpdateStep = (index: number, value: string) => {
    const updatedSteps = [...(recipe.steps || [])]
    updatedSteps[index] = value
    setRecipe((prev) => ({ ...prev, steps: updatedSteps }))
  }

  const handleDeleteStep = (index: number) => {
    const updatedSteps = (recipe.steps || []).filter((_, i) => i !== index)
    setRecipe((prev) => ({ ...prev, steps: updatedSteps }))
  }

  // Save handlers
  const handleSave = () => {
    const updatedRecipe = {
      ...recipe,
      updated_at: new Date().toISOString(),
      status: 'DRAFT' as const,
    }
    console.log('Saving recipe:', updatedRecipe)
    onSave?.(updatedRecipe)
  }

  const handlePublish = () => {
    const updatedRecipe = {
      ...recipe,
      updated_at: new Date().toISOString(),
      status: 'PUBLISHED' as const,
    }
    console.log('Publishing recipe:', updatedRecipe)
    onSave?.(updatedRecipe)
  }

  // Serving size change handler
  const handleServingSizeChange = (size: number) => {
    setRecipe((prev) => ({
      ...prev,
      serving: {
        ...prev.serving!,
        serving_size_grams: size,
      },
    }))
    // Recalculate with new serving size
    setTimeout(() => recalculateNutrition(recipe.ingredients || []), 0)
  }

  // Per 100g values for labels
  const per100gValues = useMemo(() => {
    if (!recipe.nutrition?.per_recipe_total || !recipe.nutrition?.total_yield_grams) {
      return recipe.nutrition?.per_serving || {}
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
  }, [recipe.nutrition])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
            </h1>
            {recipe.name && (
              <p className="text-sm text-muted-foreground">{recipe.name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handlePublish}>
            <Send className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="details" className="px-6">Recipe Details</TabsTrigger>
            <TabsTrigger value="ingredients" className="px-6">Ingredients, Nutrition Facts</TabsTrigger>
            <TabsTrigger value="cost" className="px-6">Cost</TabsTrigger>
            <TabsTrigger value="prep" className="px-6">Prep Method</TabsTrigger>
            <TabsTrigger value="label" className="px-6">Nutrition Label</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Tab 1: Recipe Details */}
          <TabsContent value="details" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Recipe Name *</Label>
                    <Input
                      id="name"
                      value={recipe.name || ''}
                      onChange={(e) => setRecipe((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter recipe name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={recipe.category || ''}
                      onValueChange={(v) => setRecipe((prev) => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECIPE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sub_category">Sub Category</Label>
                  <Input
                    id="sub_category"
                    value={recipe.sub_category || ''}
                    onChange={(e) => setRecipe((prev) => ({ ...prev, sub_category: e.target.value }))}
                    placeholder="Enter sub category (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Recipe Description</Label>
                  <Textarea
                    id="description"
                    value={recipe.description || ''}
                    onChange={(e) => setRecipe((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter recipe description (50-60 words recommended)"
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_sub_recipe"
                    checked={recipe.metadata?.is_sub_recipe || false}
                    onCheckedChange={(checked) =>
                      setRecipe((prev) => ({
                        ...prev,
                        metadata: { ...prev.metadata!, is_sub_recipe: !!checked },
                      }))
                    }
                  />
                  <Label htmlFor="is_sub_recipe">Make this as sub recipe</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cover Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your photo here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports: PNG, JPG, JPEG (max 500MB)
                  </p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Upload Photo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Ingredients & Nutrition */}
          <TabsContent value="ingredients" className="mt-0">
            <div className="space-y-4">
              {/* Top Section - Calories and Weight Inputs */}
              <div className="grid grid-cols-[1fr_400px] gap-4">
                {/* Left: Calories display */}
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Recipe Calories (per serving)</p>
                        <p className="text-3xl font-bold">
                          {(recipe.nutrition?.per_serving?.['Energy']?.quantity || 0).toFixed(0)} KCAL
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={sidePanel === 'nutrition' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSidePanel('nutrition')}
                        >
                          View Nutrition Breakdown
                        </Button>
                        <Button
                          variant={sidePanel === 'allergens' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSidePanel('allergens')}
                        >
                          View Allergens
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Side panel header */}
                <Card>
                  <CardContent className="py-4">
                    {sidePanel === 'nutrition' ? (
                      <div className="space-y-2">
                        <p className="font-semibold">Nutrition Breakdown</p>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search nutrients..."
                            value={nutrientSearch}
                            onChange={(e) => setNutrientSearch(e.target.value)}
                            className="pl-8 h-8"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">Allergens</p>
                          <div className="flex gap-2">
                            <Button
                              variant={allergenTab === 'allergens' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setAllergenTab('allergens')}
                            >
                              Allergens
                            </Button>
                            <Button
                              variant={allergenTab === 'maycontain' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setAllergenTab('maycontain')}
                            >
                              May Contain
                            </Button>
                          </div>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search allergens..."
                            value={allergenSearch}
                            onChange={(e) => setAllergenSearch(e.target.value)}
                            className="pl-8 h-8"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Weight inputs row */}
              <Card>
                <CardContent className="py-4">
                  <div className="grid grid-cols-2 gap-4 max-w-xl">
                    <div className="space-y-2">
                      <Label>Total Cooked Weight (G)</Label>
                      <Input
                        type="number"
                        value={recipe.serving?.total_cooked_weight_grams || totalYieldWeight || ''}
                        onChange={(e) =>
                          setRecipe((prev) => ({
                            ...prev,
                            serving: {
                              ...prev.serving!,
                              total_cooked_weight_grams: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Serving Size</Label>
                      <Select
                        value={String(recipe.serving?.serving_size_grams || 100)}
                        onValueChange={(v) => handleServingSizeChange(parseFloat(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50g</SelectItem>
                          <SelectItem value="100">100g</SelectItem>
                          <SelectItem value="150">150g</SelectItem>
                          <SelectItem value="200">200g</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Aligned Tables Section */}
              <div className="grid grid-cols-[1fr_400px] gap-4">
                {/* Left: Ingredients Table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle>Ingredients</CardTitle>
                    <Button size="sm" onClick={openIngredientModal}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Ingredient
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-auto max-h-[500px]">
                      <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 bg-muted/80 z-10">
                          <tr>
                            <th className="p-2 border text-left w-10">#</th>
                            <th className="p-2 border text-left w-10"></th>
                            <th className="p-2 border text-left">Ingredient</th>
                            <th className="p-2 border text-left w-16">Unit</th>
                            <th className="p-2 border text-left w-24">Quantity</th>
                            <th className="p-2 border text-left w-20">Yield %</th>
                            <th className="p-2 border text-left w-20">Yield (G)</th>
                            <th className="p-2 border text-left w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(recipe.ingredients || []).length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                No ingredients added. Click "Add Ingredient" to start.
                              </td>
                            </tr>
                          ) : (
                            (recipe.ingredients || []).map((ing, idx) => (
                              <tr
                                key={ing.ingredient_id}
                                className="cursor-pointer hover:bg-muted/30 h-[41px]"
                                onDoubleClick={() => openEditIngredientModal(idx)}
                              >
                                <td className="p-2 border text-center">{idx + 1}</td>
                                <td className="p-2 border">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleStar(idx)
                                    }}
                                  >
                                    <Star
                                      className={`w-4 h-4 ${ing.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                    />
                                  </Button>
                                </td>
                                <td className="p-2 border">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate max-w-[200px]">{ing.name}</span>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs shrink-0"
                                    >
                                      {ing.source === 'bytebeam' ? 'bytebeam' : 'imported'}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="p-2 border">{ing.unit}</td>
                                <td className="p-2 border">
                                  <Input
                                    type="number"
                                    value={ing.quantity}
                                    onChange={(e) =>
                                      handleInlineQuantityChange(idx, parseFloat(e.target.value) || 0)
                                    }
                                    className="w-20 h-7"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="p-2 border">{ing.yield_percent}%</td>
                                <td className="p-2 border">{ing.yield_quantity_in_grams.toFixed(1)}</td>
                                <td className="p-2 border">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteIngredient(idx)
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                          {(recipe.ingredients || []).length > 0 && (
                            <tr className="bg-muted/50 font-medium h-[41px]">
                              <td className="p-2 border" colSpan={4}>Total</td>
                              <td className="p-2 border">{totalWeight.toFixed(1)}</td>
                              <td className="p-2 border"></td>
                              <td className="p-2 border">{totalYieldWeight.toFixed(1)}</td>
                              <td className="p-2 border"></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Nutrition/Allergens Matrix - Aligned with Ingredients */}
                <Card>
                  <CardHeader className="py-3">
                    <div className="h-[28px]"></div> {/* Spacer to align with Ingredients header */}
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-auto max-h-[500px]">
                      {sidePanel === 'nutrition' ? (
                        <table className="w-full text-xs border-collapse">
                          <thead className="sticky top-0 bg-muted/80 z-10">
                            <tr>
                              <th className="sticky left-0 bg-muted/80 p-2 border text-left w-8 z-20">#</th>
                              {NUTRIENT_ORDER_WITH_UNITS
                                .filter((n) => !nutrientSearch || n.name.toLowerCase().includes(nutrientSearch.toLowerCase()))
                                .map((nutrient) => (
                                  <th key={nutrient.name} className="p-2 border text-center whitespace-nowrap min-w-[80px]">
                                    {nutrient.name}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(recipe.ingredients || []).map((ing, idx) => {
                              const scaleFactor = recipe.serving?.scale_factor || 1
                              return (
                                <tr key={ing.ingredient_id} className="hover:bg-muted/30 h-[41px]">
                                  <td className="sticky left-0 bg-background p-2 border text-center font-medium z-10">{idx + 1}</td>
                                  {NUTRIENT_ORDER_WITH_UNITS
                                    .filter((n) => !nutrientSearch || n.name.toLowerCase().includes(nutrientSearch.toLowerCase()))
                                    .map((nutrient) => {
                                      const rawValue = ing.nutrients?.[nutrient.name]?.quantity ?? 0
                                      const perServingValue = scaleFactor > 0 ? rawValue / scaleFactor : 0
                                      return (
                                        <td key={nutrient.name} className="p-2 border text-center whitespace-nowrap">
                                          {perServingValue.toFixed(2)} {nutrient.unit}
                                        </td>
                                      )
                                    })}
                                </tr>
                              )
                            })}
                            {(recipe.ingredients || []).length > 0 && (
                              <tr className="bg-muted font-semibold h-[41px]">
                                <td className="sticky left-0 bg-muted p-2 border z-10"></td>
                                {NUTRIENT_ORDER_WITH_UNITS
                                  .filter((n) => !nutrientSearch || n.name.toLowerCase().includes(nutrientSearch.toLowerCase()))
                                  .map((nutrient) => {
                                    const scaleFactor = recipe.serving?.scale_factor || 1
                                    const totalValue = (recipe.ingredients || []).reduce((sum, ing) => {
                                      const rawValue = ing.nutrients?.[nutrient.name]?.quantity ?? 0
                                      return sum + (scaleFactor > 0 ? rawValue / scaleFactor : 0)
                                    }, 0)
                                    return (
                                      <td key={nutrient.name} className="p-2 border text-center whitespace-nowrap">
                                        {totalValue.toFixed(2)} {nutrient.unit}
                                      </td>
                                    )
                                  })}
                              </tr>
                            )}
                            {(recipe.ingredients || []).length === 0 && (
                              <tr>
                                <td colSpan={NUTRIENT_ORDER_WITH_UNITS.length + 1} className="text-center py-8 text-muted-foreground text-sm">
                                  Add ingredients to see nutrition breakdown
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      ) : (
                        <table className="w-full text-xs border-collapse">
                          <thead className="sticky top-0 bg-muted/80 z-10">
                            <tr>
                              <th className="sticky left-0 bg-muted/80 p-2 border text-left w-8 z-20">#</th>
                              {(allergenTab === 'allergens' ? ALLERGEN_LIST : MAY_CONTAIN_LIST)
                                .filter((a) => !allergenSearch || a.toLowerCase().includes(allergenSearch.toLowerCase()))
                                .map((allergen) => (
                                  <th key={allergen} className="p-2 border text-center whitespace-nowrap min-w-[60px]">
                                    {allergen}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(recipe.ingredients || []).map((ing, idx) => {
                              const ingredientAllergens = allergenTab === 'allergens'
                                ? ing.allergens || []
                                : ing.may_contain_allergens || []
                              return (
                                <tr key={ing.ingredient_id} className="hover:bg-muted/30 h-[41px]">
                                  <td className="sticky left-0 bg-background p-2 border text-center font-medium z-10">{idx + 1}</td>
                                  {(allergenTab === 'allergens' ? ALLERGEN_LIST : MAY_CONTAIN_LIST)
                                    .filter((a) => !allergenSearch || a.toLowerCase().includes(allergenSearch.toLowerCase()))
                                    .map((allergen) => (
                                      <td key={allergen} className="p-2 border text-center">
                                        <input
                                          type="checkbox"
                                          checked={ingredientAllergens.includes(allergen)}
                                          readOnly
                                          className="w-3 h-3 cursor-default"
                                        />
                                      </td>
                                    ))}
                                </tr>
                              )
                            })}
                            {(recipe.ingredients || []).length === 0 && (
                              <tr>
                                <td colSpan={(allergenTab === 'allergens' ? ALLERGEN_LIST : MAY_CONTAIN_LIST).length + 1} className="text-center py-8 text-muted-foreground text-sm">
                                  Add ingredients to see allergen breakdown
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Cost */}
          <TabsContent value="cost" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ingredient Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead className="text-right">Weight (G)</TableHead>
                      <TableHead className="text-right">Cost (AED)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recipe.ingredients || []).map((ing, idx) => (
                      <TableRow key={ing.ingredient_id}>
                        <TableCell>{ing.name}</TableCell>
                        <TableCell className="text-right">{ing.quantity_in_grams.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{(ing.cost || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{totalWeight.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        {(recipe.ingredients || []).reduce((sum, ing) => sum + (ing.cost || 0), 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Total Yield (G)</Label>
                    <Input value={totalYieldWeight.toFixed(1)} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Cost (AED)</Label>
                    <Input
                      type="number"
                      value={recipe.costs?.total_cost || 0}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          costs: { ...prev.costs!, total_cost: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Per Serving Size (G)</Label>
                    <Input
                      type="number"
                      value={recipe.serving?.serving_size_grams || 100}
                      onChange={(e) => handleServingSizeChange(parseFloat(e.target.value) || 100)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Per Serving Cost (AED)</Label>
                    <Input
                      type="number"
                      value={recipe.costs?.per_serving_selling_price || 0}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          costs: { ...prev.costs!, per_serving_selling_price: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Food Cost (AED)</Label>
                    <Input
                      type="number"
                      value={recipe.costs?.food_cost || 0}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          costs: { ...prev.costs!, food_cost: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price (VAT Exclusive)</Label>
                    <Input
                      type="number"
                      value={recipe.costs?.selling_price_exclusive_vat || 0}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          costs: { ...prev.costs!, selling_price_exclusive_vat: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT %</Label>
                    <Input
                      type="number"
                      value={recipe.costs?.vat_percent || 5}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          costs: { ...prev.costs!, vat_percent: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price (VAT Inclusive)</Label>
                    <Input
                      type="number"
                      value={recipe.costs?.selling_price_inclusive_vat || 0}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          costs: { ...prev.costs!, selling_price_inclusive_vat: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Labour Cost (AED)</Label>
                    <Input
                      type="number"
                      value={recipe.costs?.labour_cost || 0}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          costs: { ...prev.costs!, labour_cost: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Packaging Cost (AED)</Label>
                    <Input
                      type="number"
                      value={recipe.costs?.packaging_cost || 0}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          costs: { ...prev.costs!, packaging_cost: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Wastage Cost (AED)</Label>
                    <Input
                      type="number"
                      value={recipe.costs?.wastage_cost || 0}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          costs: { ...prev.costs!, wastage_cost: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aggregator Commission (%)</Label>
                    <Input
                      type="number"
                      value={recipe.costs?.aggregator_commission || 0}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          costs: { ...prev.costs!, aggregator_commission: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Net Profit %</span>
                    <span className="text-2xl font-bold text-green-600">
                      {(recipe.costs?.net_profit || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Prep Method */}
          <TabsContent value="prep" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preparation Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={recipe.preparation_time_minutes || ''}
                    onChange={(e) =>
                      setRecipe((prev) => ({
                        ...prev,
                        preparation_time_minutes: parseFloat(e.target.value) || null,
                      }))
                    }
                    className="w-32"
                    placeholder="0"
                  />
                  <span className="text-muted-foreground">minutes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Preparation Steps</CardTitle>
                <Button size="sm" onClick={handleAddStep}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(recipe.steps || []).map((step, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Step {idx + 1}</Label>
                      {(recipe.steps || []).length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleDeleteStep(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={step}
                      onChange={(e) => handleUpdateStep(idx, e.target.value)}
                      placeholder={`Describe step ${idx + 1}...`}
                      rows={3}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Nutrition Label */}
          <TabsContent value="label" className="mt-0">
            <div className="grid grid-cols-2 gap-6">
              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Label Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Label Type</Label>
                    <Select defaultValue="vertical">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vertical">New Vertical</SelectItem>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="linear">Linear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Serving Type</Label>
                    <Select defaultValue="per-serving">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per-serving">Per Serving</SelectItem>
                        <SelectItem value="per-100g">Per 100g</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Preview Settings</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Serving Size (g)</Label>
                        <Input
                          type="number"
                          value={recipe.serving?.serving_size_grams || 100}
                          onChange={(e) => handleServingSizeChange(parseFloat(e.target.value) || 100)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Servings per Container</Label>
                        <Input
                          type="number"
                          value={recipe.serving?.servings_per_package || 1}
                          onChange={(e) =>
                            setRecipe((prev) => ({
                              ...prev,
                              serving: {
                                ...prev.serving!,
                                servings_per_package: parseInt(e.target.value) || 1,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Nutrition Facts Label</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <NutritionLabel
                      servingSize={recipe.serving?.serving_size_grams || 100}
                      nutrition={recipe.nutrition?.per_serving || {}}
                      servingDescription={`(${recipe.serving?.serving_size_grams || 100}g)`}
                      servingsPerContainer={recipe.serving?.servings_per_package}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Light Label (per 100g)</CardTitle>
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
          </TabsContent>
        </div>
      </Tabs>

      {/* Ingredient Modal */}
      <CreateIngredientModal
        isOpen={showIngredientModal}
        ingredient={editingIngredient}
        isEditing={editingIngredientIndex !== null}
        onClose={() => {
          setShowIngredientModal(false)
          setEditingIngredient(createEmptyIngredient())
          setEditingIngredientIndex(null)
        }}
        onSave={handleSaveIngredient}
        onChange={(updates) => setEditingIngredient((prev) => ({ ...prev, ...updates }))}
      />
    </div>
  )
}
