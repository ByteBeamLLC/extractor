// Core types for Recipe Builder and Label Maker

// Nutritional data per 100g for an ingredient
export interface IngredientNutrition {
    // Required components (per 100g)
    calories: number           // kcal
    totalFat: number           // g
    saturatedFat: number       // g
    transFat: number           // g
    cholesterol: number        // mg
    sodium: number             // mg
    totalCarbohydrates: number // g
    dietaryFiber: number       // g
    totalSugars: number        // g
    addedSugars: number        // g
    protein: number            // g
    
    // Optional vitamins (per 100g)
    vitaminA?: number          // mcg RAE
    vitaminC?: number          // mg
    vitaminD?: number          // mcg
    vitaminE?: number          // mg
    vitaminK?: number          // mcg
    thiamin?: number           // mg (B1)
    riboflavin?: number        // mg (B2)
    niacin?: number            // mg (B3)
    vitaminB6?: number         // mg
    folate?: number            // mcg DFE
    vitaminB12?: number        // mcg
    
    // Optional minerals (per 100g)
    calcium?: number           // mg
    iron?: number              // mg
    potassium?: number         // mg
    magnesium?: number         // mg
    zinc?: number              // mg
    phosphorus?: number        // mg
}

// Default empty nutrition
export const EMPTY_NUTRITION: IngredientNutrition = {
    calories: 0,
    totalFat: 0,
    saturatedFat: 0,
    transFat: 0,
    cholesterol: 0,
    sodium: 0,
    totalCarbohydrates: 0,
    dietaryFiber: 0,
    totalSugars: 0,
    addedSugars: 0,
    protein: 0,
}

// A single ingredient in a recipe with full data
export interface RecipeIngredient {
    id: string
    name: string
    
    // Quantity in recipe
    amount: number
    unit: 'g' | 'kg' | 'ml' | 'L' | 'pieces' | 'tbsp' | 'tsp' | 'cups' | 'oz' | 'lb'
    gramsEquivalent: number    // Actual weight in grams (for nutrition calc)
    
    // Waste/yield
    wastePercent: number       // % discarded (e.g., 10 for 10% waste)
    
    // Nutritional data (per 100g of this ingredient)
    nutrition: IngredientNutrition
    
    // Allergens associated with this ingredient
    allergens: string[]
    
    // Costing
    costPerUnit: number        // Cost per cost unit
    costUnit: 'kg' | 'g' | 'L' | 'ml' | 'piece'
    
    // Source/reference
    specSheetId?: string       // Reference to uploaded spec sheet in Knowledge Hub
    notes?: string
}

// Recipe data (different from Label data - this is the builder)
export interface Recipe {
    id: string
    name: string
    description: string
    
    // Yield settings
    recipeYield: number        // Total yield amount
    yieldUnit: 'g' | 'kg' | 'ml' | 'L' | 'servings' | 'pieces'
    servingSize: number        // Size of one serving
    servingSizeUnit: 'g' | 'ml' | 'pieces' | 'cups' | 'tbsp'
    servingsPerRecipe: number  // Calculated: recipeYield / servingSize
    
    // Ingredients
    ingredients: RecipeIngredient[]
    
    // Sub-recipes (recipes within recipes, e.g., sauce in a main dish)
    subRecipes?: Array<{
        recipeId: string
        amount: number
        unit: string
    }>
    
    // Calculated nutrition (per serving)
    calculatedNutrition?: IngredientNutrition
    
    // Allergens (auto-aggregated from ingredients)
    allergens: string[]
    mayContainAllergens: string[]
    
    // Costing
    costing: {
        totalIngredientsCost: number
        laborHours: number
        hourlyRate: number
        laborCost: number
        packagingCost: number
        overheadPercent: number
        overheadCost: number
        totalCost: number
        costPerServing: number
        targetMarginPercent: number
        suggestedPrice: number
    }
    
    // Metadata
    category: string
    tags: string[]
    notes: string
    createdAt: string
    updatedAt: string
}

// Common allergens list
export const COMMON_ALLERGENS = [
    "Cereals containing gluten",
    "Wheat",
    "Crustaceans",
    "Eggs",
    "Fish",
    "Peanuts",
    "Soybeans",
    "Milk",
    "Tree nuts",
    "Almonds",
    "Cashews",
    "Walnuts",
    "Celery",
    "Mustard",
    "Sesame seeds",
    "Sulphites",
    "Lupin",
    "Molluscs"
]

// Unit conversion to grams (for calculating nutrition)
export const UNIT_TO_GRAMS: Record<string, number> = {
    'g': 1,
    'kg': 1000,
    'oz': 28.35,
    'lb': 453.59,
    'ml': 1, // Assumes density of 1 (water-like)
    'L': 1000,
    'tbsp': 15,
    'tsp': 5,
    'cups': 240,
    'pieces': 100, // Default assumption, should be overridden
}

// Helper to generate unique ID
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Helper to create empty ingredient
export function createEmptyIngredient(): RecipeIngredient {
    return {
        id: generateId(),
        name: '',
        amount: 0,
        unit: 'g',
        gramsEquivalent: 0,
        wastePercent: 0,
        nutrition: { ...EMPTY_NUTRITION },
        allergens: [],
        costPerUnit: 0,
        costUnit: 'kg',
    }
}

// Calculate nutrition for a single ingredient based on amount used
export function calculateIngredientNutrition(
    ingredient: RecipeIngredient
): IngredientNutrition {
    // Get usable grams (after waste)
    const usableGrams = ingredient.gramsEquivalent * (1 - ingredient.wastePercent / 100)
    const factor = usableGrams / 100 // Nutrition data is per 100g
    
    return {
        calories: ingredient.nutrition.calories * factor,
        totalFat: ingredient.nutrition.totalFat * factor,
        saturatedFat: ingredient.nutrition.saturatedFat * factor,
        transFat: ingredient.nutrition.transFat * factor,
        cholesterol: ingredient.nutrition.cholesterol * factor,
        sodium: ingredient.nutrition.sodium * factor,
        totalCarbohydrates: ingredient.nutrition.totalCarbohydrates * factor,
        dietaryFiber: ingredient.nutrition.dietaryFiber * factor,
        totalSugars: ingredient.nutrition.totalSugars * factor,
        addedSugars: ingredient.nutrition.addedSugars * factor,
        protein: ingredient.nutrition.protein * factor,
        // Optional vitamins/minerals
        vitaminA: ingredient.nutrition.vitaminA ? ingredient.nutrition.vitaminA * factor : undefined,
        vitaminC: ingredient.nutrition.vitaminC ? ingredient.nutrition.vitaminC * factor : undefined,
        vitaminD: ingredient.nutrition.vitaminD ? ingredient.nutrition.vitaminD * factor : undefined,
        calcium: ingredient.nutrition.calcium ? ingredient.nutrition.calcium * factor : undefined,
        iron: ingredient.nutrition.iron ? ingredient.nutrition.iron * factor : undefined,
        potassium: ingredient.nutrition.potassium ? ingredient.nutrition.potassium * factor : undefined,
    }
}

// Calculate total recipe nutrition from all ingredients
export function calculateRecipeNutrition(
    ingredients: RecipeIngredient[],
    servingsPerRecipe: number
): IngredientNutrition {
    // Sum up all ingredient contributions
    const totals: IngredientNutrition = { ...EMPTY_NUTRITION }
    
    for (const ing of ingredients) {
        const contrib = calculateIngredientNutrition(ing)
        totals.calories += contrib.calories
        totals.totalFat += contrib.totalFat
        totals.saturatedFat += contrib.saturatedFat
        totals.transFat += contrib.transFat
        totals.cholesterol += contrib.cholesterol
        totals.sodium += contrib.sodium
        totals.totalCarbohydrates += contrib.totalCarbohydrates
        totals.dietaryFiber += contrib.dietaryFiber
        totals.totalSugars += contrib.totalSugars
        totals.addedSugars += contrib.addedSugars
        totals.protein += contrib.protein
        
        // Optional nutrients
        if (contrib.vitaminA) totals.vitaminA = (totals.vitaminA || 0) + contrib.vitaminA
        if (contrib.vitaminC) totals.vitaminC = (totals.vitaminC || 0) + contrib.vitaminC
        if (contrib.vitaminD) totals.vitaminD = (totals.vitaminD || 0) + contrib.vitaminD
        if (contrib.calcium) totals.calcium = (totals.calcium || 0) + contrib.calcium
        if (contrib.iron) totals.iron = (totals.iron || 0) + contrib.iron
        if (contrib.potassium) totals.potassium = (totals.potassium || 0) + contrib.potassium
    }
    
    // Divide by servings to get per-serving values
    if (servingsPerRecipe > 0) {
        const perServing: IngredientNutrition = {
            calories: Math.round(totals.calories / servingsPerRecipe),
            totalFat: Math.round(totals.totalFat / servingsPerRecipe * 10) / 10,
            saturatedFat: Math.round(totals.saturatedFat / servingsPerRecipe * 10) / 10,
            transFat: Math.round(totals.transFat / servingsPerRecipe * 10) / 10,
            cholesterol: Math.round(totals.cholesterol / servingsPerRecipe),
            sodium: Math.round(totals.sodium / servingsPerRecipe),
            totalCarbohydrates: Math.round(totals.totalCarbohydrates / servingsPerRecipe * 10) / 10,
            dietaryFiber: Math.round(totals.dietaryFiber / servingsPerRecipe * 10) / 10,
            totalSugars: Math.round(totals.totalSugars / servingsPerRecipe * 10) / 10,
            addedSugars: Math.round(totals.addedSugars / servingsPerRecipe * 10) / 10,
            protein: Math.round(totals.protein / servingsPerRecipe * 10) / 10,
        }
        
        // Optional nutrients per serving
        if (totals.vitaminA) perServing.vitaminA = Math.round(totals.vitaminA / servingsPerRecipe)
        if (totals.vitaminC) perServing.vitaminC = Math.round(totals.vitaminC / servingsPerRecipe * 10) / 10
        if (totals.vitaminD) perServing.vitaminD = Math.round(totals.vitaminD / servingsPerRecipe * 10) / 10
        if (totals.calcium) perServing.calcium = Math.round(totals.calcium / servingsPerRecipe)
        if (totals.iron) perServing.iron = Math.round(totals.iron / servingsPerRecipe * 10) / 10
        if (totals.potassium) perServing.potassium = Math.round(totals.potassium / servingsPerRecipe)
        
        return perServing
    }
    
    return totals
}

// Aggregate allergens from all ingredients
export function aggregateAllergens(ingredients: RecipeIngredient[]): string[] {
    const allergenSet = new Set<string>()
    for (const ing of ingredients) {
        for (const allergen of ing.allergens) {
            allergenSet.add(allergen)
        }
    }
    return Array.from(allergenSet).sort()
}

// Calculate ingredient cost
export function calculateIngredientCost(ingredient: RecipeIngredient): number {
    if (!ingredient.amount || !ingredient.costPerUnit) return 0
    
    // Convert to cost unit basis
    const gramsUsed = ingredient.gramsEquivalent
    let costUnitGrams: number
    
    switch (ingredient.costUnit) {
        case 'kg': costUnitGrams = 1000; break
        case 'g': costUnitGrams = 1; break
        case 'L': costUnitGrams = 1000; break // Assumes density ~1
        case 'ml': costUnitGrams = 1; break
        case 'piece': return ingredient.amount * ingredient.costPerUnit // Direct multiplication
        default: costUnitGrams = 1000
    }
    
    return (gramsUsed / costUnitGrams) * ingredient.costPerUnit
}

// Calculate total recipe cost
export function calculateRecipeCost(
    ingredients: RecipeIngredient[],
    laborHours: number,
    hourlyRate: number,
    packagingCost: number,
    overheadPercent: number
): {
    ingredientsCost: number
    laborCost: number
    packagingCost: number
    overheadCost: number
    totalCost: number
} {
    const ingredientsCost = ingredients.reduce((sum, ing) => sum + calculateIngredientCost(ing), 0)
    const laborCost = laborHours * hourlyRate
    const subtotal = ingredientsCost + laborCost + packagingCost
    const overheadCost = subtotal * (overheadPercent / 100)
    const totalCost = subtotal + overheadCost
    
    return {
        ingredientsCost,
        laborCost,
        packagingCost,
        overheadCost,
        totalCost,
    }
}

// Daily Value percentages (FDA 2020)
export const DAILY_VALUES = {
    totalFat: 78,          // g
    saturatedFat: 20,      // g
    cholesterol: 300,      // mg
    sodium: 2300,          // mg
    totalCarbohydrates: 275, // g
    dietaryFiber: 28,      // g
    addedSugars: 50,       // g
    protein: 50,           // g
    vitaminD: 20,          // mcg
    calcium: 1300,         // mg
    iron: 18,              // mg
    potassium: 4700,       // mg
    vitaminA: 900,         // mcg RAE
    vitaminC: 90,          // mg
}

// Calculate % Daily Value for a nutrient
export function calculateDailyValuePercent(
    nutrientName: keyof typeof DAILY_VALUES,
    amount: number
): number {
    const dv = DAILY_VALUES[nutrientName]
    if (!dv) return 0
    return Math.round((amount / dv) * 100)
}














