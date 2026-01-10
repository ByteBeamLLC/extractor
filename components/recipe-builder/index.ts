/**
 * Recipe Builder Module
 *
 * A complete recipe management system for creating, editing, and managing
 * recipes with nutrition facts, ingredients, costs, and preparation steps.
 */

// Main module component
export { RecipeBuilderModule } from './RecipeBuilderModule'

// Context and hooks
export {
  RecipeBuilderProvider,
  useRecipeBuilder,
  useRecipeBuilderNavigation,
  useRecipes,
  useCustomIngredients,
} from './context/RecipeBuilderContext'

// View components
export { DashboardView } from './views/DashboardView'
export { RecipesView } from './views/RecipesView'
export { RecipeDetailView } from './views/RecipeDetailView'
export { RecipeBuilderView } from './views/RecipeBuilderView'
export { IngredientsView } from './views/IngredientsView'
export { USDAIngredientsView } from './views/USDAIngredientsView'

// Shared components
export { MacroChart, NutritionLabel, TrafficLightLabel, CreateIngredientModal } from './components'

// Types
export type {
  Recipe,
  Ingredient,
  CustomIngredient,
  NutrientValue,
  Serving,
  Nutrition,
  Costs,
  RecipeLabels,
  RecipeMetadata,
  RecipeStatus,
  DashboardStats,
  RecipeBuilderViewType,
  NavigationParams,
  IngredientCategory,
} from './types'

export { INGREDIENT_CATEGORIES } from './types'
