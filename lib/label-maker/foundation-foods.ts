/**
 * Foundation Foods API
 * 
 * Unified search and retrieval service for the foundation foods database.
 * This module provides the main API for the label maker to search and retrieve
 * nutrition data from multiple authoritative sources.
 */

import { createClient } from '@supabase/supabase-js';
import type { IngredientNutrition } from '@/components/label-maker/types';

// Types
export type DataSource = 
  | 'usda_sr'
  | 'usda_foundation'
  | 'usda_fndds'
  | 'uk_cofid'
  | 'canada_cnf'
  | 'india_ifct'
  | 'fao_infoods'
  | 'anz_nuttab'
  | 'custom';

export type HalalStatus = 'halal' | 'haram' | 'mushbooh' | 'unknown';

export interface FoodSearchParams {
  query: string;
  sources?: DataSource[];
  foodGroups?: string[];
  halalOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface FoodSearchResult {
  id: string;
  source: DataSource;
  sourceId: string;
  description: string;
  descriptionAr?: string;
  foodGroup?: string;
  nutrition: IngredientNutrition;
  allergens: string[];
  halalStatus?: HalalStatus;
  sourceAttribution: string;
  score?: number;
}

export interface FoodStats {
  totalFoods: number;
  bySource: Record<string, number>;
  foodGroups: Array<{ name: string; count: number }>;
}

// Source attributions
const SOURCE_ATTRIBUTIONS: Record<DataSource, string> = {
  usda_sr: 'USDA FoodData Central - Standard Reference Legacy',
  usda_foundation: 'USDA FoodData Central - Foundation Foods',
  usda_fndds: 'USDA FoodData Central - FNDDS',
  uk_cofid: 'UK Composition of Foods Integrated Dataset (CoFID)',
  canada_cnf: 'Canadian Nutrient File - Health Canada',
  india_ifct: 'Indian Food Composition Tables - NIN',
  fao_infoods: 'FAO/INFOODS International Food Composition Database',
  anz_nuttab: 'Australian Food Composition Database - FSANZ',
  custom: 'Custom User Entry',
};

/**
 * Create Supabase client for browser/server
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Convert database row to FoodSearchResult
 */
function toFoodSearchResult(row: Record<string, unknown>): FoodSearchResult {
  const source = row.source_db as DataSource;
  
  return {
    id: row.id as string,
    source,
    sourceId: row.source_id as string,
    description: row.description_en as string,
    descriptionAr: row.description_ar as string | undefined,
    foodGroup: row.food_group as string | undefined,
    nutrition: {
      calories: Number(row.energy_kcal) || 0,
      totalFat: Number(row.total_fat_g) || 0,
      saturatedFat: Number(row.saturated_fat_g) || 0,
      transFat: Number(row.trans_fat_g) || 0,
      cholesterol: Number(row.cholesterol_mg) || 0,
      sodium: Number(row.sodium_mg) || 0,
      totalCarbohydrates: Number(row.carbohydrate_g) || 0,
      dietaryFiber: Number(row.dietary_fiber_g) || 0,
      totalSugars: Number(row.total_sugars_g) || 0,
      addedSugars: Number(row.added_sugars_g) || 0,
      protein: Number(row.protein_g) || 0,
      // Optional vitamins/minerals
      vitaminA: row.vitamin_a_mcg_rae ? Number(row.vitamin_a_mcg_rae) : undefined,
      vitaminC: row.vitamin_c_mg ? Number(row.vitamin_c_mg) : undefined,
      vitaminD: row.vitamin_d_mcg ? Number(row.vitamin_d_mcg) : undefined,
      vitaminE: row.vitamin_e_mg ? Number(row.vitamin_e_mg) : undefined,
      vitaminK: row.vitamin_k_mcg ? Number(row.vitamin_k_mcg) : undefined,
      calcium: row.calcium_mg ? Number(row.calcium_mg) : undefined,
      iron: row.iron_mg ? Number(row.iron_mg) : undefined,
      potassium: row.potassium_mg ? Number(row.potassium_mg) : undefined,
      magnesium: row.magnesium_mg ? Number(row.magnesium_mg) : undefined,
      zinc: row.zinc_mg ? Number(row.zinc_mg) : undefined,
    },
    allergens: (row.common_allergens as string[]) || [],
    halalStatus: row.halal_status as HalalStatus | undefined,
    sourceAttribution: SOURCE_ATTRIBUTIONS[source] || source,
    score: row.rank ? Number(row.rank) : undefined,
  };
}

/**
 * Search foundation foods with full-text search
 */
export async function searchFoods(params: FoodSearchParams): Promise<FoodSearchResult[]> {
  const { 
    query, 
    sources, 
    foodGroups, 
    halalOnly = false, 
    limit = 50, 
    offset = 0 
  } = params;

  const supabase = getSupabaseClient();

  // Use the RPC function for full-text search with ranking
  const { data, error } = await supabase.rpc('search_foundation_foods', {
    search_query: query,
    source_filter: sources || null,
    food_group_filter: foodGroups || null,
    halal_only: halalOnly,
    result_limit: limit,
    result_offset: offset,
  });

  if (error) {
    console.error('Search error:', error);
    throw new Error(`Search failed: ${error.message}`);
  }

  // If RPC doesn't exist yet, fall back to regular query
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return fallbackSearch(params);
  }

  return (data as Record<string, unknown>[]).map(toFoodSearchResult);
}

/**
 * Fallback search using regular Supabase query
 * Used when the RPC function isn't available
 */
async function fallbackSearch(params: FoodSearchParams): Promise<FoodSearchResult[]> {
  const { 
    query, 
    sources, 
    foodGroups, 
    halalOnly = false, 
    limit = 50, 
    offset = 0 
  } = params;

  const supabase = getSupabaseClient();

  let queryBuilder = supabase
    .from('foundation_foods')
    .select('*')
    .ilike('description_en', `%${query}%`)
    .order('description_en')
    .range(offset, offset + limit - 1);

  if (sources && sources.length > 0) {
    queryBuilder = queryBuilder.in('source_db', sources);
  }

  if (foodGroups && foodGroups.length > 0) {
    queryBuilder = queryBuilder.in('food_group', foodGroups);
  }

  if (halalOnly) {
    queryBuilder = queryBuilder.eq('halal_status', 'halal');
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Fallback search error:', error);
    throw new Error(`Search failed: ${error.message}`);
  }

  return (data || []).map(toFoodSearchResult);
}

/**
 * Get a single food by ID
 */
export async function getFoodById(id: string): Promise<FoodSearchResult | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('foundation_foods')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get food: ${error.message}`);
  }

  return toFoodSearchResult(data);
}

/**
 * Get foods by food group
 */
export async function getFoodsByGroup(
  foodGroup: string, 
  limit = 100
): Promise<FoodSearchResult[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('foundation_foods')
    .select('*')
    .eq('food_group', foodGroup)
    .order('description_en')
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get foods by group: ${error.message}`);
  }

  return (data || []).map(toFoodSearchResult);
}

/**
 * Get available food groups
 */
export async function getFoodGroups(): Promise<Array<{ name: string; count: number }>> {
  const supabase = getSupabaseClient();

  // Try RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_food_groups');
  
  if (!rpcError && rpcData) {
    return (rpcData as Array<{ food_group: string; count: number }>).map(row => ({
      name: row.food_group,
      count: Number(row.count),
    }));
  }

  // Fallback to manual query
  const { data, error } = await supabase
    .from('foundation_foods')
    .select('food_group')
    .not('food_group', 'is', null);

  if (error) {
    throw new Error(`Failed to get food groups: ${error.message}`);
  }

  // Count manually
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const group = row.food_group as string;
    counts[group] = (counts[group] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get database statistics
 */
export async function getStats(): Promise<FoodStats> {
  const supabase = getSupabaseClient();

  // Get total count
  const { count: totalFoods, error: countError } = await supabase
    .from('foundation_foods')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error(`Failed to get stats: ${countError.message}`);
  }

  // Get counts by source
  const { data: sourceData, error: sourceError } = await supabase
    .from('foundation_foods')
    .select('source_db');

  if (sourceError) {
    throw new Error(`Failed to get source stats: ${sourceError.message}`);
  }

  const bySource: Record<string, number> = {};
  for (const row of sourceData || []) {
    const source = row.source_db as string;
    bySource[source] = (bySource[source] || 0) + 1;
  }

  // Get food groups
  const foodGroups = await getFoodGroups();

  return {
    totalFoods: totalFoods || 0,
    bySource,
    foodGroups: foodGroups.slice(0, 20), // Top 20 groups
  };
}

/**
 * Quick search for autocomplete (lightweight)
 */
export async function quickSearch(
  query: string, 
  limit = 10
): Promise<Array<{ id: string; description: string; source: string }>> {
  if (!query || query.length < 2) {
    return [];
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('foundation_foods')
    .select('id, description_en, source_db')
    .ilike('description_en', `%${query}%`)
    .order('description_en')
    .limit(limit);

  if (error) {
    console.error('Quick search error:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    description: row.description_en,
    source: row.source_db,
  }));
}

/**
 * Convert FoodSearchResult to RecipeIngredient nutrition format
 */
export function toIngredientNutrition(food: FoodSearchResult): IngredientNutrition {
  return food.nutrition;
}

