/**
 * Nutrient Mapper
 * 
 * Maps nutrients from various data sources to our unified schema.
 * Handles different naming conventions, units, and nutrient IDs across sources.
 */

import { NutrientMapping, SourceConfig, DataSource, UnifiedFoundationFood } from '../types';

/**
 * USDA Nutrient ID mappings
 * Source: https://fdc.nal.usda.gov/portal-data/external/dataDictionary
 */
export const USDA_NUTRIENT_MAP: Record<number, { target: keyof UnifiedFoundationFood; unit: string }> = {
  // Energy
  1008: { target: 'energy_kcal', unit: 'kcal' },
  2047: { target: 'energy_kcal', unit: 'kcal' },  // Energy (Atwater General Factors)
  2048: { target: 'energy_kcal', unit: 'kcal' },  // Energy (Atwater Specific Factors)
  1062: { target: 'energy_kj', unit: 'kJ' },
  
  // Macronutrients
  1003: { target: 'protein_g', unit: 'g' },
  1004: { target: 'total_fat_g', unit: 'g' },
  1005: { target: 'carbohydrate_g', unit: 'g' },
  
  // Fats breakdown
  1258: { target: 'saturated_fat_g', unit: 'g' },
  1292: { target: 'monounsaturated_fat_g', unit: 'g' },
  1293: { target: 'polyunsaturated_fat_g', unit: 'g' },
  1257: { target: 'trans_fat_g', unit: 'g' },
  1253: { target: 'cholesterol_mg', unit: 'mg' },
  
  // Carbohydrates breakdown
  1079: { target: 'dietary_fiber_g', unit: 'g' },
  2000: { target: 'total_sugars_g', unit: 'g' },
  1235: { target: 'added_sugars_g', unit: 'g' },
  
  // Minerals
  1093: { target: 'sodium_mg', unit: 'mg' },
  1087: { target: 'calcium_mg', unit: 'mg' },
  1089: { target: 'iron_mg', unit: 'mg' },
  1090: { target: 'magnesium_mg', unit: 'mg' },
  1091: { target: 'phosphorus_mg', unit: 'mg' },
  1092: { target: 'potassium_mg', unit: 'mg' },
  1095: { target: 'zinc_mg', unit: 'mg' },
  1098: { target: 'copper_mg', unit: 'mg' },
  1101: { target: 'manganese_mg', unit: 'mg' },
  1103: { target: 'selenium_mcg', unit: 'µg' },
  
  // Vitamins
  1106: { target: 'vitamin_a_mcg_rae', unit: 'µg' },
  1162: { target: 'vitamin_c_mg', unit: 'mg' },
  1114: { target: 'vitamin_d_mcg', unit: 'µg' },
  1109: { target: 'vitamin_e_mg', unit: 'mg' },
  1185: { target: 'vitamin_k_mcg', unit: 'µg' },
  1165: { target: 'thiamin_mg', unit: 'mg' },
  1166: { target: 'riboflavin_mg', unit: 'mg' },
  1167: { target: 'niacin_mg', unit: 'mg' },
  1175: { target: 'vitamin_b6_mg', unit: 'mg' },
  1177: { target: 'folate_mcg_dfe', unit: 'µg' },
  1178: { target: 'vitamin_b12_mcg', unit: 'µg' },
  
  // Other
  1051: { target: 'water_g', unit: 'g' },
  1007: { target: 'ash_g', unit: 'g' },
  1018: { target: 'alcohol_g', unit: 'g' },
  1057: { target: 'caffeine_mg', unit: 'mg' },
};

/**
 * UK CoFID column name mappings
 */
export const UK_COFID_NUTRIENT_MAP: Record<string, { target: keyof UnifiedFoundationFood; unit: string }> = {
  'Energy (kcal) (kcal)': { target: 'energy_kcal', unit: 'kcal' },
  'Energy (kJ) (kJ)': { target: 'energy_kj', unit: 'kJ' },
  'Protein (g)': { target: 'protein_g', unit: 'g' },
  'Fat (g)': { target: 'total_fat_g', unit: 'g' },
  'Saturates (g)': { target: 'saturated_fat_g', unit: 'g' },
  'Monounsaturates (g)': { target: 'monounsaturated_fat_g', unit: 'g' },
  'Polyunsaturates (g)': { target: 'polyunsaturated_fat_g', unit: 'g' },
  'Trans fatty acids (g)': { target: 'trans_fat_g', unit: 'g' },
  'Cholesterol (mg)': { target: 'cholesterol_mg', unit: 'mg' },
  'Carbohydrate (g)': { target: 'carbohydrate_g', unit: 'g' },
  'Englyst fibre (g)': { target: 'dietary_fiber_g', unit: 'g' },
  'AOAC fibre (g)': { target: 'dietary_fiber_g', unit: 'g' },
  'Total sugars (g)': { target: 'total_sugars_g', unit: 'g' },
  'Sodium (mg)': { target: 'sodium_mg', unit: 'mg' },
  'Calcium (mg)': { target: 'calcium_mg', unit: 'mg' },
  'Iron (mg)': { target: 'iron_mg', unit: 'mg' },
  'Magnesium (mg)': { target: 'magnesium_mg', unit: 'mg' },
  'Phosphorus (mg)': { target: 'phosphorus_mg', unit: 'mg' },
  'Potassium (mg)': { target: 'potassium_mg', unit: 'mg' },
  'Zinc (mg)': { target: 'zinc_mg', unit: 'mg' },
  'Copper (mg)': { target: 'copper_mg', unit: 'mg' },
  'Selenium (µg)': { target: 'selenium_mcg', unit: 'µg' },
  'Retinol (µg)': { target: 'vitamin_a_mcg_rae', unit: 'µg' },
  'Vitamin C (mg)': { target: 'vitamin_c_mg', unit: 'mg' },
  'Vitamin D (µg)': { target: 'vitamin_d_mcg', unit: 'µg' },
  'Vitamin E (mg)': { target: 'vitamin_e_mg', unit: 'mg' },
  'Vitamin K1 (µg)': { target: 'vitamin_k_mcg', unit: 'µg' },
  'Thiamin (mg)': { target: 'thiamin_mg', unit: 'mg' },
  'Riboflavin (mg)': { target: 'riboflavin_mg', unit: 'mg' },
  'Niacin (mg)': { target: 'niacin_mg', unit: 'mg' },
  'Vitamin B6 (mg)': { target: 'vitamin_b6_mg', unit: 'mg' },
  'Folate (µg)': { target: 'folate_mcg_dfe', unit: 'µg' },
  'Vitamin B12 (µg)': { target: 'vitamin_b12_mcg', unit: 'µg' },
  'Water (g)': { target: 'water_g', unit: 'g' },
  'Alcohol (g)': { target: 'alcohol_g', unit: 'g' },
};

/**
 * Canadian Nutrient File mappings
 */
export const CANADA_CNF_NUTRIENT_MAP: Record<string, { target: keyof UnifiedFoundationFood; unit: string }> = {
  'ENERGY (KILOCALORIES)': { target: 'energy_kcal', unit: 'kcal' },
  'ENERGY (KILOJOULES)': { target: 'energy_kj', unit: 'kJ' },
  'PROTEIN': { target: 'protein_g', unit: 'g' },
  'TOTAL FAT': { target: 'total_fat_g', unit: 'g' },
  'TOTAL SATURATED FATTY ACIDS': { target: 'saturated_fat_g', unit: 'g' },
  'TOTAL MONOUNSATURATED FATTY ACIDS': { target: 'monounsaturated_fat_g', unit: 'g' },
  'TOTAL POLYUNSATURATED FATTY ACIDS': { target: 'polyunsaturated_fat_g', unit: 'g' },
  'TOTAL TRANS FATTY ACIDS': { target: 'trans_fat_g', unit: 'g' },
  'CHOLESTEROL': { target: 'cholesterol_mg', unit: 'mg' },
  'CARBOHYDRATE, TOTAL (BY DIFFERENCE)': { target: 'carbohydrate_g', unit: 'g' },
  'FIBRE, TOTAL DIETARY': { target: 'dietary_fiber_g', unit: 'g' },
  'SUGARS, TOTAL': { target: 'total_sugars_g', unit: 'g' },
  'SODIUM': { target: 'sodium_mg', unit: 'mg' },
  'CALCIUM': { target: 'calcium_mg', unit: 'mg' },
  'IRON': { target: 'iron_mg', unit: 'mg' },
  'MAGNESIUM': { target: 'magnesium_mg', unit: 'mg' },
  'PHOSPHORUS': { target: 'phosphorus_mg', unit: 'mg' },
  'POTASSIUM': { target: 'potassium_mg', unit: 'mg' },
  'ZINC': { target: 'zinc_mg', unit: 'mg' },
  'COPPER': { target: 'copper_mg', unit: 'mg' },
  'SELENIUM': { target: 'selenium_mcg', unit: 'µg' },
  'VITAMIN A, RAE': { target: 'vitamin_a_mcg_rae', unit: 'µg' },
  'VITAMIN C': { target: 'vitamin_c_mg', unit: 'mg' },
  'VITAMIN D': { target: 'vitamin_d_mcg', unit: 'µg' },
  'VITAMIN E': { target: 'vitamin_e_mg', unit: 'mg' },
  'VITAMIN K': { target: 'vitamin_k_mcg', unit: 'µg' },
  'THIAMIN': { target: 'thiamin_mg', unit: 'mg' },
  'RIBOFLAVIN': { target: 'riboflavin_mg', unit: 'mg' },
  'NIACIN': { target: 'niacin_mg', unit: 'mg' },
  'VITAMIN B-6': { target: 'vitamin_b6_mg', unit: 'mg' },
  'FOLATE, DFE': { target: 'folate_mcg_dfe', unit: 'µg' },
  'VITAMIN B-12': { target: 'vitamin_b12_mcg', unit: 'µg' },
  'WATER': { target: 'water_g', unit: 'g' },
  'ALCOHOL': { target: 'alcohol_g', unit: 'g' },
};

/**
 * Unit conversion factors
 */
const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  // To grams
  'mg_to_g': { factor: 0.001 },
  'µg_to_g': { factor: 0.000001 },
  'mcg_to_g': { factor: 0.000001 },
  
  // To milligrams
  'g_to_mg': { factor: 1000 },
  'µg_to_mg': { factor: 0.001 },
  'mcg_to_mg': { factor: 0.001 },
  
  // To micrograms
  'g_to_mcg': { factor: 1000000 },
  'mg_to_mcg': { factor: 1000 },
  'µg_to_mcg': { factor: 1 },
  
  // Energy
  'kj_to_kcal': { factor: 0.239006 },
  'kcal_to_kj': { factor: 4.184 },
};

/**
 * Parse a numeric value from various formats
 */
export function parseNutrientValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (value === '' || value === '-' || value === 'N' || value === 'Tr' || value === 'trace') return null;
  
  // Handle trace amounts
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'tr' || lower === 'trace' || lower === 't') return 0;
    if (lower === 'n' || lower === 'n/a' || lower === '') return null;
    
    // Remove any non-numeric characters except decimal point and minus
    const cleaned = value.replace(/[^\d.\-]/g, '');
    if (cleaned === '') return null;
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  return null;
}

/**
 * Convert a value from one unit to another
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;
  
  const conversionKey = `${fromUnit.toLowerCase()}_to_${toUnit.toLowerCase()}`;
  const conversion = UNIT_CONVERSIONS[conversionKey];
  
  if (conversion) {
    return value * conversion.factor;
  }
  
  // If no conversion found, return original value
  console.warn(`No conversion found for ${fromUnit} to ${toUnit}`);
  return value;
}

/**
 * Map USDA nutrients to unified schema
 */
export function mapUSDANutrients(
  nutrients: Array<{ nutrient: { id: number }; amount: number }>,
  rawNutrients: Record<string, number | null> = {}
): Partial<UnifiedFoundationFood> {
  const result: Partial<UnifiedFoundationFood> = {};
  
  for (const nutrient of nutrients) {
    const mapping = USDA_NUTRIENT_MAP[nutrient.nutrient.id];
    if (mapping && nutrient.amount !== undefined) {
      const value = parseNutrientValue(nutrient.amount);
      if (value !== null) {
        (result as Record<string, number>)[mapping.target] = value;
      }
    }
    
    // Store in raw nutrients
    rawNutrients[`usda_${nutrient.nutrient.id}`] = nutrient.amount;
  }
  
  result.raw_nutrients = rawNutrients;
  return result;
}

/**
 * Map UK CoFID nutrients to unified schema
 */
export function mapUKCoFIDNutrients(
  row: Record<string, unknown>
): Partial<UnifiedFoundationFood> {
  const result: Partial<UnifiedFoundationFood> = {};
  const rawNutrients: Record<string, number | string | null> = {};
  
  for (const [columnName, value] of Object.entries(row)) {
    const mapping = UK_COFID_NUTRIENT_MAP[columnName];
    if (mapping) {
      const numValue = parseNutrientValue(value);
      if (numValue !== null) {
        (result as Record<string, number>)[mapping.target] = numValue;
      }
    }
    
    // Store all values in raw
    rawNutrients[columnName] = value as number | string | null;
  }
  
  result.raw_nutrients = rawNutrients;
  return result;
}

/**
 * Map Canadian CNF nutrients to unified schema
 */
export function mapCanadaCNFNutrients(
  nutrients: Record<string, unknown>
): Partial<UnifiedFoundationFood> {
  const result: Partial<UnifiedFoundationFood> = {};
  const rawNutrients: Record<string, number | string | null> = {};
  
  for (const [nutrientName, value] of Object.entries(nutrients)) {
    const upperName = nutrientName.toUpperCase();
    const mapping = CANADA_CNF_NUTRIENT_MAP[upperName];
    
    if (mapping) {
      const numValue = parseNutrientValue(value);
      if (numValue !== null) {
        (result as Record<string, number>)[mapping.target] = numValue;
      }
    }
    
    rawNutrients[nutrientName] = value as number | string | null;
  }
  
  result.raw_nutrients = rawNutrients;
  return result;
}

/**
 * Standardize food group names across sources
 */
export const FOOD_GROUP_STANDARDIZATION: Record<string, string> = {
  // USDA groups
  'Dairy and Egg Products': 'Dairy & Eggs',
  'Spices and Herbs': 'Spices & Herbs',
  'Baby Foods': 'Baby Foods',
  'Fats and Oils': 'Fats & Oils',
  'Poultry Products': 'Poultry',
  'Soups, Sauces, and Gravies': 'Soups & Sauces',
  'Sausages and Luncheon Meats': 'Processed Meats',
  'Breakfast Cereals': 'Cereals & Grains',
  'Fruits and Fruit Juices': 'Fruits',
  'Pork Products': 'Pork',
  'Vegetables and Vegetable Products': 'Vegetables',
  'Nut and Seed Products': 'Nuts & Seeds',
  'Beef Products': 'Beef',
  'Beverages': 'Beverages',
  'Finfish and Shellfish Products': 'Seafood',
  'Legumes and Legume Products': 'Legumes',
  'Lamb, Veal, and Game Products': 'Lamb & Game',
  'Baked Products': 'Baked Goods',
  'Snacks': 'Snacks',
  'Sweets': 'Sweets & Desserts',
  'Cereal Grains and Pasta': 'Cereals & Grains',
  'Fast Foods': 'Fast Food',
  'Meals, Entrees, and Side Dishes': 'Prepared Meals',
  'Restaurant Foods': 'Restaurant Foods',
  
  // UK groups
  'Cereals and cereal products': 'Cereals & Grains',
  'Milk and milk products': 'Dairy & Eggs',
  'Eggs': 'Dairy & Eggs',
  'Fats and oils': 'Fats & Oils',
  'Meat and meat products': 'Meat',
  'Fish and fish products': 'Seafood',
  'Vegetables': 'Vegetables',
  'Fruit': 'Fruits',
  'Nuts and seeds': 'Nuts & Seeds',
  'Sugars, preserves and snacks': 'Sweets & Desserts',
  'Beverages': 'Beverages',
  'Alcoholic beverages': 'Beverages',
  'Soups, sauces and miscellaneous foods': 'Soups & Sauces',
};

export function standardizeFoodGroup(group: string | undefined): string | undefined {
  if (!group) return undefined;
  return FOOD_GROUP_STANDARDIZATION[group] || group;
}

/**
 * Export all mappings for reference
 */
export const ALL_NUTRIENT_MAPS = {
  usda: USDA_NUTRIENT_MAP,
  uk_cofid: UK_COFID_NUTRIENT_MAP,
  canada_cnf: CANADA_CNF_NUTRIENT_MAP,
};

