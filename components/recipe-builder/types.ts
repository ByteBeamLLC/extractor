/**
 * Recipe Builder Type Definitions
 *
 * Core types for the Recipe Builder module including recipes, ingredients,
 * nutrition data, and related entities.
 */

// Nutrient value with quantity and unit
export interface NutrientValue {
  quantity: number
  unit: string
}

// Individual ingredient in a recipe
export interface Ingredient {
  name: string
  ingredient_id: string
  entity_ingredient_id: string
  quantity: number
  quantity_in_grams: number
  unit: string
  source: string
  yield_percent: number
  yield_quantity_in_grams: number
  cost: number
  is_starred: boolean
  composite_ingredients: string[]
  allergens: string[]
  user_allergens: string[]
  may_contain_allergens: string[]
  user_may_contain_allergens: string[]
  nutrients: Record<string, NutrientValue>
}

// Serving information for a recipe
export interface Serving {
  total_yield_grams: number
  serving_size_grams: number
  total_cooked_weight_grams: number
  servings_per_package: number
  serving_unit: string
  serving_description: string
  scale_factor: number
}

// Nutrition information for a recipe
export interface Nutrition {
  total_yield_grams: number
  serving_size_grams: number
  per_recipe_total: Record<string, NutrientValue>
  per_serving: Record<string, NutrientValue>
  per_100g?: Record<string, NutrientValue>
  summary: {
    calories: number
    net_carbs: number
  }
}

// Cost breakdown for a recipe
export interface Costs {
  food_cost: number
  food_cost_type: string
  labour_cost: number
  labour_cost_type: string
  packaging_cost: number
  packaging_cost_type: string
  wastage_cost: number
  wastage_cost_type: string
  total_cost: number
  total_ingredient_cost: number
  selling_price_inclusive_vat: number
  selling_price_exclusive_vat: number
  per_serving_selling_price: number
  net_profit: number
  vat_percent: number
  aggregator_commission: number
  aggregator_commission_type: string
}

// Recipe labels for display
export interface RecipeLabels {
  ingredient_list: string[]
  allergen_list: string[]
  diet_type_list: string[]
  business_address_list: string[]
}

// Recipe metadata
export interface RecipeMetadata {
  is_sub_recipe: boolean
  is_imported_recipe: boolean
  qr_image: string | null
  cover_image: string | null
  packaging_logo: string | null
}

// Inventory/Stock tracking
export interface RecipeInventory {
  stock_quantity: number
  stock_unit: string // 'portions', 'units', 'kg', etc.
  min_stock_alert: number | null // Alert when stock falls below this
  last_stock_update: string | null
}

// Arabic translations for packaging artwork
export interface RecipeTranslations {
  name_ar: string | null
  ingredients_ar: string[] | null
  allergens_ar: string[] | null
  diet_types_ar: string[] | null
  translations_updated_at: string | null
}

// Complete recipe entity
export interface Recipe {
  id: string
  name: string
  category: string
  sub_category: string | null
  status: RecipeStatus
  description: string
  created_at: string
  updated_at: string
  preparation_time_minutes: number | null
  barcode: string | null // EAN-13 barcode
  serving: Serving
  diet_types: string[]
  allergens: string[]
  may_contain_allergens: string[]
  nutrition: Nutrition
  ingredients: Ingredient[]
  steps: string[]
  costs: Costs
  labels: RecipeLabels
  metadata: RecipeMetadata
  inventory: RecipeInventory
  // Arabic translations for packaging artwork
  name_ar?: string | null
  ingredients_ar?: string[] | null
  allergens_ar?: string[] | null
  diet_types_ar?: string[] | null
  translations_updated_at?: string | null
}

// Recipe status enum
export type RecipeStatus = 'PUBLISHED' | 'DRAFT'

// Dashboard statistics
export interface DashboardStats {
  recipesCount: number
  subRecipesCount: number
  ingredientsCount: number
  menusCount: number
  publishedCount: number
  draftCount: number
}

// Recipe Builder view types
export type RecipeBuilderViewType =
  | 'dashboard'
  | 'recipes'
  | 'recipe-detail'
  | 'recipe-edit'
  | 'ingredients'
  | 'ingredients-manage'
  | 'ingredients-custom'
  | 'ingredient-detail'

// Navigation context for Recipe Builder
export interface RecipeBuilderNavigation {
  currentView: RecipeBuilderViewType
  selectedRecipeId: string | null
  selectedIngredientId: string | null
  navigateTo: (view: RecipeBuilderViewType, params?: NavigationParams) => void
  goBack: () => void
}

// Navigation parameters
export interface NavigationParams {
  recipeId?: string
  ingredientId?: string
}

// Ingredient category options
export const INGREDIENT_CATEGORIES = [
  'Meat & Poultry',
  'Seafood',
  'Dairy & Eggs',
  'Vegetables',
  'Fruits',
  'Grains & Cereals',
  'Legumes & Pulses',
  'Nuts & Seeds',
  'Oils & Fats',
  'Herbs & Spices',
  'Condiments & Sauces',
  'Beverages',
  'Sweeteners',
  'Baking Ingredients',
  'Other',
] as const

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]

// Custom ingredient type (for user-created ingredients)
export interface CustomIngredient {
  id: string
  name: string
  display_name?: string
  category: IngredientCategory
  brand?: string
  compound_ingredients: string[]
  weight: number
  weight_unit: 'G' | 'KG' | 'ML' | 'L'
  cost: number
  allergens: string[]
  may_contain_allergens: string[]
  nutrients: Record<string, NutrientValue>
  created_at: string
  updated_at: string
}
