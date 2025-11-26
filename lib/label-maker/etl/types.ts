/**
 * Unified Types for Foundation Foods Database
 * 
 * These types define the normalized schema used across all data sources.
 */

// Data source identifiers
export type DataSource = 
  | 'usda_sr'        // USDA Standard Reference Legacy
  | 'usda_foundation' // USDA Foundation Foods
  | 'usda_fndds'      // USDA FNDDS (Survey Foods)
  | 'uk_cofid'        // UK Composition of Foods
  | 'canada_cnf'      // Canadian Nutrient File
  | 'india_ifct'      // Indian Food Composition Tables
  | 'fao_infoods'     // FAO/INFOODS International
  | 'anz_nuttab'      // Australia/New Zealand NUTTAB
  | 'custom';         // User-created entries

// Halal status options
export type HalalStatus = 'halal' | 'haram' | 'mushbooh' | 'unknown';

// Standard allergen list (Codex Alimentarius)
export const STANDARD_ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soybeans',
  'milk',
  'tree_nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs'
] as const;

export type StandardAllergen = typeof STANDARD_ALLERGENS[number];

/**
 * Unified Foundation Food - The normalized schema for all food entries
 */
export interface UnifiedFoundationFood {
  // Source tracking
  source_db: DataSource;
  source_id: string;
  source_version?: string;
  
  // Core identification
  food_code?: string;
  description_en: string;
  description_ar?: string;
  scientific_name?: string;
  food_group?: string;
  food_subgroup?: string;
  
  // CORE NUTRIENTS (per 100g) - Common across all sources
  energy_kcal?: number;
  energy_kj?: number;
  protein_g?: number;
  total_fat_g?: number;
  saturated_fat_g?: number;
  monounsaturated_fat_g?: number;
  polyunsaturated_fat_g?: number;
  trans_fat_g?: number;
  cholesterol_mg?: number;
  carbohydrate_g?: number;
  dietary_fiber_g?: number;
  total_sugars_g?: number;
  added_sugars_g?: number;
  sodium_mg?: number;
  
  // EXTENDED NUTRIENTS (per 100g) - Not all sources have these
  // Vitamins
  vitamin_a_mcg_rae?: number;
  vitamin_c_mg?: number;
  vitamin_d_mcg?: number;
  vitamin_e_mg?: number;
  vitamin_k_mcg?: number;
  thiamin_mg?: number;
  riboflavin_mg?: number;
  niacin_mg?: number;
  vitamin_b6_mg?: number;
  folate_mcg_dfe?: number;
  vitamin_b12_mcg?: number;
  
  // Minerals
  calcium_mg?: number;
  iron_mg?: number;
  magnesium_mg?: number;
  phosphorus_mg?: number;
  potassium_mg?: number;
  zinc_mg?: number;
  copper_mg?: number;
  manganese_mg?: number;
  selenium_mcg?: number;
  
  // Additional nutrients
  water_g?: number;
  ash_g?: number;
  alcohol_g?: number;
  caffeine_mg?: number;
  
  // Source-specific raw data (preserved as JSON)
  raw_nutrients?: Record<string, number | string | null>;
  raw_metadata?: Record<string, unknown>;
  
  // GCC-specific fields
  halal_status?: HalalStatus;
  common_allergens?: StandardAllergen[];
}

/**
 * Raw parsed food entry before normalization
 */
export interface RawFoodEntry {
  source: DataSource;
  sourceId: string;
  description: string;
  foodGroup?: string;
  nutrients: Record<string, number | string | null>;
  metadata?: Record<string, unknown>;
}

/**
 * Parser result with statistics
 */
export interface ParserResult {
  foods: UnifiedFoundationFood[];
  stats: {
    totalParsed: number;
    successfullyNormalized: number;
    errors: number;
    warnings: string[];
  };
}

/**
 * Nutrient mapping configuration for a data source
 */
export interface NutrientMapping {
  sourceKey: string | number;  // Key in source data (column name or nutrient ID)
  targetKey: keyof UnifiedFoundationFood;  // Our unified field name
  unit: string;  // Expected unit in source
  conversionFactor?: number;  // Multiply source value by this (for unit conversion)
}

/**
 * Source-specific configuration
 */
export interface SourceConfig {
  name: string;
  source: DataSource;
  version: string;
  nutrientMappings: NutrientMapping[];
  foodGroupMapping?: Record<string, string>;  // Source group -> Standardized group
  attribution: string;
}

/**
 * Database insert format (matches Supabase table)
 */
export interface FoundationFoodInsert extends UnifiedFoundationFood {
  id?: string;  // UUID, auto-generated if not provided
  created_at?: string;
  updated_at?: string;
}

/**
 * Search result format returned by API
 */
export interface FoodSearchResult {
  id: string;
  source: DataSource;
  sourceId: string;
  description: string;
  descriptionAr?: string;
  foodGroup?: string;
  
  // Normalized nutrition matching IngredientNutrition interface
  nutrition: {
    calories: number;
    totalFat: number;
    saturatedFat: number | null;
    transFat: number | null;
    cholesterol: number | null;
    sodium: number;
    totalCarbohydrates: number;
    dietaryFiber: number | null;
    totalSugars: number | null;
    addedSugars: number | null;
    protein: number;
    
    // Optional vitamins/minerals
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    calcium?: number;
    iron?: number;
    potassium?: number;
    magnesium?: number;
    zinc?: number;
  };
  
  allergens: string[];
  halalStatus?: HalalStatus;
  sourceAttribution: string;
  
  // Search relevance
  score?: number;
}

/**
 * Food search parameters
 */
export interface FoodSearchParams {
  query: string;
  sources?: DataSource[];
  foodGroups?: string[];
  halalOnly?: boolean;
  limit?: number;
  offset?: number;
}

