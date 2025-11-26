/**
 * USDA FoodData Central API Client
 * 
 * Provides real-time search against the USDA FDC API as a fallback
 * when foods aren't found in the local database.
 * 
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 * 
 * Note: You need a free API key from https://fdc.nal.usda.gov/api-key-signup.html
 * Set it as USDA_FDC_API_KEY environment variable
 */

import type { IngredientNutrition } from '@/components/label-maker/types';

const USDA_FDC_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Nutrient ID mappings from USDA FDC
const NUTRIENT_IDS = {
  ENERGY: 1008,
  PROTEIN: 1003,
  TOTAL_FAT: 1004,
  CARBOHYDRATE: 1005,
  FIBER: 1079,
  SUGARS: 2000,
  ADDED_SUGARS: 1235,
  SATURATED_FAT: 1258,
  TRANS_FAT: 1257,
  CHOLESTEROL: 1253,
  SODIUM: 1093,
  VITAMIN_A: 1106,
  VITAMIN_C: 1162,
  VITAMIN_D: 1114,
  VITAMIN_E: 1109,
  VITAMIN_K: 1185,
  CALCIUM: 1087,
  IRON: 1089,
  POTASSIUM: 1092,
  MAGNESIUM: 1090,
  ZINC: 1095,
};

interface USDAFoodSearchResult {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: string;
  brandOwner?: string;
  score?: number;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
  }>;
}

interface USDASearchResponse {
  foods: USDAFoodSearchResult[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export interface USDAFood {
  id: string;
  fdcId: number;
  description: string;
  dataType: string;
  category?: string;
  brandOwner?: string;
  nutrition: IngredientNutrition;
  sourceAttribution: string;
}

/**
 * Search USDA FoodData Central API
 */
export async function searchUSDA(
  query: string,
  options: {
    pageSize?: number;
    dataTypes?: string[];
  } = {}
): Promise<USDAFood[]> {
  const apiKey = process.env.USDA_FDC_API_KEY || process.env.NEXT_PUBLIC_USDA_FDC_API_KEY;
  
  if (!apiKey) {
    console.warn('USDA FDC API key not configured');
    return [];
  }

  const { pageSize = 25, dataTypes } = options;

  try {
    const response = await fetch(`${USDA_FDC_BASE_URL}/foods/search?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        pageSize,
        dataType: dataTypes || ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
        sortBy: 'dataType.keyword',
        sortOrder: 'asc',
      }),
    });

    if (!response.ok) {
      console.error('USDA API error:', response.status, response.statusText);
      return [];
    }

    const data: USDASearchResponse = await response.json();
    
    return data.foods.map(food => convertUSDAFood(food));
  } catch (error) {
    console.error('USDA API search error:', error);
    return [];
  }
}

/**
 * Get detailed food info by FDC ID
 */
export async function getUSDAFood(fdcId: number): Promise<USDAFood | null> {
  const apiKey = process.env.USDA_FDC_API_KEY || process.env.NEXT_PUBLIC_USDA_FDC_API_KEY;
  
  if (!apiKey) {
    console.warn('USDA FDC API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${USDA_FDC_BASE_URL}/food/${fdcId}?api_key=${apiKey}&nutrients=${Object.values(NUTRIENT_IDS).join(',')}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error('USDA API error:', response.status);
      return null;
    }

    const food = await response.json();
    return convertUSDAFood(food);
  } catch (error) {
    console.error('USDA API get error:', error);
    return null;
  }
}

/**
 * Convert USDA food response to our format
 */
function convertUSDAFood(food: USDAFoodSearchResult | Record<string, unknown>): USDAFood {
  const nutrients = (food.foodNutrients || []) as Array<{
    nutrientId?: number;
    nutrient?: { id: number };
    nutrientName: string;
    value?: number;
    amount?: number;
  }>;

  // Helper to get nutrient value
  const getNutrient = (id: number): number => {
    const nutrient = nutrients.find(n => 
      (n.nutrientId === id) || (n.nutrient?.id === id)
    );
    return nutrient?.value ?? nutrient?.amount ?? 0;
  };

  const nutrition: IngredientNutrition = {
    calories: Math.round(getNutrient(NUTRIENT_IDS.ENERGY)),
    totalFat: Math.round(getNutrient(NUTRIENT_IDS.TOTAL_FAT) * 10) / 10,
    saturatedFat: Math.round(getNutrient(NUTRIENT_IDS.SATURATED_FAT) * 10) / 10,
    transFat: Math.round(getNutrient(NUTRIENT_IDS.TRANS_FAT) * 10) / 10,
    cholesterol: Math.round(getNutrient(NUTRIENT_IDS.CHOLESTEROL)),
    sodium: Math.round(getNutrient(NUTRIENT_IDS.SODIUM)),
    totalCarbohydrates: Math.round(getNutrient(NUTRIENT_IDS.CARBOHYDRATE) * 10) / 10,
    dietaryFiber: Math.round(getNutrient(NUTRIENT_IDS.FIBER) * 10) / 10,
    totalSugars: Math.round(getNutrient(NUTRIENT_IDS.SUGARS) * 10) / 10,
    addedSugars: Math.round(getNutrient(NUTRIENT_IDS.ADDED_SUGARS) * 10) / 10,
    protein: Math.round(getNutrient(NUTRIENT_IDS.PROTEIN) * 10) / 10,
  };

  // Optional nutrients
  const vitaminA = getNutrient(NUTRIENT_IDS.VITAMIN_A);
  const vitaminC = getNutrient(NUTRIENT_IDS.VITAMIN_C);
  const vitaminD = getNutrient(NUTRIENT_IDS.VITAMIN_D);
  const calcium = getNutrient(NUTRIENT_IDS.CALCIUM);
  const iron = getNutrient(NUTRIENT_IDS.IRON);
  const potassium = getNutrient(NUTRIENT_IDS.POTASSIUM);

  if (vitaminA) nutrition.vitaminA = Math.round(vitaminA);
  if (vitaminC) nutrition.vitaminC = Math.round(vitaminC * 10) / 10;
  if (vitaminD) nutrition.vitaminD = Math.round(vitaminD * 10) / 10;
  if (calcium) nutrition.calcium = Math.round(calcium);
  if (iron) nutrition.iron = Math.round(iron * 10) / 10;
  if (potassium) nutrition.potassium = Math.round(potassium);

  const fdcId = (food as USDAFoodSearchResult).fdcId || (food as Record<string, unknown>).fdcId as number;
  const dataType = (food as USDAFoodSearchResult).dataType || (food as Record<string, unknown>).dataType as string || 'Unknown';

  return {
    id: `usda_${fdcId}`,
    fdcId,
    description: (food as USDAFoodSearchResult).description || (food as Record<string, unknown>).description as string || '',
    dataType,
    category: (food as USDAFoodSearchResult).foodCategory || (food as Record<string, unknown>).foodCategory as string || undefined,
    brandOwner: (food as USDAFoodSearchResult).brandOwner || (food as Record<string, unknown>).brandOwner as string || undefined,
    nutrition,
    sourceAttribution: `USDA FoodData Central - ${dataType}`,
  };
}

/**
 * Quick search for autocomplete (returns minimal data)
 */
export async function quickSearchUSDA(
  query: string,
  limit = 10
): Promise<Array<{ id: string; description: string; source: string }>> {
  const foods = await searchUSDA(query, { pageSize: limit });
  
  return foods.map(food => ({
    id: food.id,
    description: food.description,
    source: `usda_${food.dataType.toLowerCase().replace(/\s+/g, '_')}`,
  }));
}

