export { LabelDataForm, DEFAULT_LABEL_DATA, DEFAULT_NUTRITION_FACTS, DEFAULT_COSTING_DATA } from "./LabelDataForm"
export type { LabelData, NutritionRow, IngredientItem, CostingData } from "./LabelDataForm"
export { LabelPreview } from "./LabelPreview"
export { LabelMakerView } from "./LabelMakerView"
export { RecipeListView } from "./RecipeListView"
export { RecipeBuilderForm, DEFAULT_RECIPE_STATE } from "./RecipeBuilderForm"
export type { RecipeBuilderState } from "./RecipeBuilderForm"
export { FoodSearchAutocomplete, InlineFoodSearch } from "./FoodSearchAutocomplete"
export type { FoodSearchResult, QuickSearchResult } from "./FoodSearchAutocomplete"
export { IngredientSearch } from "./IngredientSearch"
export type { FoodResult } from "./IngredientSearch"

// Re-export types from types.ts
export type { 
    RecipeIngredient, 
    IngredientNutrition, 
    Recipe 
} from "./types"
export { 
    COMMON_ALLERGENS,
    UNIT_TO_GRAMS,
    DAILY_VALUES,
    createEmptyIngredient,
    calculateRecipeNutrition,
    calculateIngredientCost,
    calculateRecipeCost,
    aggregateAllergens,
    calculateDailyValuePercent,
    EMPTY_NUTRITION,
} from "./types"

// Utility function to convert LabelData to extraction results format
import type { LabelData, NutritionRow, IngredientItem } from "./LabelDataForm"

export function labelDataToResults(data: LabelData): Record<string, any> {
    const nutrition: Record<string, any> = {}
    
    // Map nutrition facts back to schema format
    data.nutritionFacts.forEach((row: NutritionRow) => {
        const key = row.name.toLowerCase().replace(/\s+/g, '_')
        if (row.unit === 'kcal') {
            nutrition[`energy_kcal_100`] = row.per100g
        } else if (row.unit === 'kJ') {
            nutrition[`energy_kj_100`] = row.per100g
        } else {
            nutrition[`${key}_100`] = row.per100g
        }
    })

    // Extract ingredient names from IngredientItem objects
    const ingredientNames = data.ingredients
        .filter((i: IngredientItem) => i.name?.trim())
        .map((i: IngredientItem) => i.name)

    return {
        barcode: data.barcode,
        product_name_en: data.productName,
        brand_name: data.brandName,
        product_description_en: data.productDescription,
        net_content: {
            value: data.netWeight,
            unit: data.netWeightUnit
        },
        manufacturer: {
            name_en: data.manufacturerName,
            address: data.manufacturerAddress,
            country: data.manufacturerCountry
        },
        country_of_origin: data.countryOfOrigin,
        ingredients_en: ingredientNames,
        allergens: {
            contains: data.containsAllergens,
            may_contain: data.mayContainAllergens
        },
        nutrition_per_100: nutrition,
        serving_size: data.servingSize,
        servings_per_container: data.servingsPerContainer,
        storage_instructions_en: data.storageInstructions,
        usage_instructions_en: data.usageInstructions,
        batch_number: data.batchNumber,
        production_date: data.productionDate,
        expiry_date: data.expiryDate,
        halal_status: data.halalCertified ? "Halal Certified" : "Not Certified",
        halal_certifier: data.halalCertifier
    }
}
