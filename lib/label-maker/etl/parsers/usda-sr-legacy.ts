/**
 * USDA Standard Reference Legacy Parser
 * 
 * Parses the USDA SR Legacy CSV dataset (~8,700 foods)
 * Download from: https://fdc.nal.usda.gov/download-datasets
 * 
 * File structure (after unzipping):
 * - food.csv - Main food entries
 * - food_nutrient.csv - Nutrient values per food
 * - nutrient.csv - Nutrient definitions
 * - food_category.csv - Food categories
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { UnifiedFoundationFood, ParserResult, DataSource } from '../types.js';
import { USDA_NUTRIENT_MAP, parseNutrientValue, standardizeFoodGroup } from '../normalizers/nutrient-mapper.js';

const SOURCE: DataSource = 'usda_sr';
const SOURCE_VERSION = 'April 2018 (Final Release)';
const ATTRIBUTION = 'USDA FoodData Central - Standard Reference Legacy';

interface USDAFood {
  fdc_id: string;
  data_type: string;
  description: string;
  food_category_id: string;
  publication_date: string;
}

interface USDAFoodNutrient {
  id: string;
  fdc_id: string;
  nutrient_id: string;
  amount: string;
}

interface USDANutrient {
  id: string;
  name: string;
  unit_name: string;
}

interface USDAFoodCategory {
  id: string;
  code: string;
  description: string;
}

/**
 * Parse USDA SR Legacy CSV files
 */
export async function parseUSDA_SRLegacy(dataDir: string): Promise<ParserResult> {
  const warnings: string[] = [];
  const foods: UnifiedFoundationFood[] = [];
  let errors = 0;

  console.log('📊 Parsing USDA SR Legacy dataset...');

  // Check for required files
  const foodFile = path.join(dataDir, 'food.csv');
  const nutrientFile = path.join(dataDir, 'food_nutrient.csv');
  const nutrientDefsFile = path.join(dataDir, 'nutrient.csv');
  const categoryFile = path.join(dataDir, 'food_category.csv');

  if (!fs.existsSync(foodFile)) {
    throw new Error(`Food file not found: ${foodFile}`);
  }

  // Parse food categories
  const categoryMap = new Map<string, string>();
  if (fs.existsSync(categoryFile)) {
    console.log('  Loading food categories...');
    const categoryData = fs.readFileSync(categoryFile, 'utf-8');
    const categories = parse(categoryData, { columns: true, skip_empty_lines: true }) as USDAFoodCategory[];
    for (const cat of categories) {
      categoryMap.set(cat.id, cat.description);
    }
    console.log(`  Found ${categoryMap.size} categories`);
  }

  // Parse nutrient definitions (for reference)
  const nutrientDefsMap = new Map<string, USDANutrient>();
  if (fs.existsSync(nutrientDefsFile)) {
    console.log('  Loading nutrient definitions...');
    const nutrientDefsData = fs.readFileSync(nutrientDefsFile, 'utf-8');
    const nutrientDefs = parse(nutrientDefsData, { columns: true, skip_empty_lines: true }) as USDANutrient[];
    for (const nut of nutrientDefs) {
      nutrientDefsMap.set(nut.id, nut);
    }
    console.log(`  Found ${nutrientDefsMap.size} nutrient definitions`);
  }

  // Parse food_nutrient.csv and build a map
  console.log('  Loading nutrient values (this may take a moment)...');
  const nutrientMap = new Map<string, Map<number, number>>();
  
  if (fs.existsSync(nutrientFile)) {
    const nutrientData = fs.readFileSync(nutrientFile, 'utf-8');
    const foodNutrients = parse(nutrientData, { columns: true, skip_empty_lines: true }) as USDAFoodNutrient[];
    
    console.log(`  Processing ${foodNutrients.length} nutrient records...`);
    
    for (const fn of foodNutrients) {
      const fdcId = fn.fdc_id;
      const nutrientId = parseInt(fn.nutrient_id);
      const amount = parseNutrientValue(fn.amount);
      
      if (amount !== null && !isNaN(nutrientId)) {
        if (!nutrientMap.has(fdcId)) {
          nutrientMap.set(fdcId, new Map());
        }
        nutrientMap.get(fdcId)!.set(nutrientId, amount);
      }
    }
    console.log(`  Loaded nutrients for ${nutrientMap.size} foods`);
  }

  // Parse main food file
  console.log('  Loading food entries...');
  const foodData = fs.readFileSync(foodFile, 'utf-8');
  const foodEntries = parse(foodData, { columns: true, skip_empty_lines: true }) as USDAFood[];
  
  console.log(`  Processing ${foodEntries.length} food entries...`);

  for (const food of foodEntries) {
    try {
      // Get nutrients for this food
      const nutrients = nutrientMap.get(food.fdc_id) || new Map();
      
      // Build raw nutrients object
      const rawNutrients: Record<string, number | null> = {};
      nutrients.forEach((value, nutrientId) => {
        rawNutrients[`nutrient_${nutrientId}`] = value;
      });

      // Map to unified format
      const unifiedFood: UnifiedFoundationFood = {
        source_db: SOURCE,
        source_id: food.fdc_id,
        source_version: SOURCE_VERSION,
        description_en: food.description,
        food_group: standardizeFoodGroup(categoryMap.get(food.food_category_id)),
        raw_nutrients: rawNutrients,
        raw_metadata: {
          data_type: food.data_type,
          publication_date: food.publication_date,
          food_category_id: food.food_category_id,
        },
        halal_status: 'unknown',
        common_allergens: [],
      };

      // Map nutrients to unified fields
      for (const [nutrientId, amount] of nutrients) {
        const mapping = USDA_NUTRIENT_MAP[nutrientId];
        if (mapping) {
          (unifiedFood as Record<string, unknown>)[mapping.target] = amount;
        }
      }

      foods.push(unifiedFood);
    } catch (err) {
      errors++;
      if (errors <= 10) {
        warnings.push(`Error processing food ${food.fdc_id}: ${err}`);
      }
    }
  }

  console.log(`✅ Parsed ${foods.length} foods from USDA SR Legacy`);

  return {
    foods,
    stats: {
      totalParsed: foodEntries.length,
      successfullyNormalized: foods.length,
      errors,
      warnings,
    },
  };
}

/**
 * Parse USDA SR Legacy from JSON format
 * Alternative parser for the JSON download option
 */
export async function parseUSDA_SRLegacyJSON(jsonFile: string): Promise<ParserResult> {
  const warnings: string[] = [];
  const foods: UnifiedFoundationFood[] = [];
  let errors = 0;

  console.log('📊 Parsing USDA SR Legacy JSON...');

  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  const srFoods = data.SRLegacyFoods || data.FoundationFoods || data;

  if (!Array.isArray(srFoods)) {
    throw new Error('Invalid JSON structure - expected array of foods');
  }

  console.log(`  Processing ${srFoods.length} food entries...`);

  for (const food of srFoods) {
    try {
      const rawNutrients: Record<string, number | null> = {};
      
      // Build unified food entry
      const unifiedFood: UnifiedFoundationFood = {
        source_db: SOURCE,
        source_id: String(food.fdcId),
        source_version: SOURCE_VERSION,
        description_en: food.description,
        scientific_name: food.scientificName,
        food_group: standardizeFoodGroup(food.foodCategory?.description),
        raw_nutrients: rawNutrients,
        raw_metadata: {
          dataType: food.dataType,
          publicationDate: food.publicationDate,
          ndbNumber: food.ndbNumber,
        },
        halal_status: 'unknown',
        common_allergens: [],
      };

      // Process nutrients
      const nutrients = food.foodNutrients || [];
      for (const nutrient of nutrients) {
        const nutrientId = nutrient.nutrient?.id || nutrient.nutrientId;
        const amount = parseNutrientValue(nutrient.amount);
        
        if (nutrientId && amount !== null) {
          rawNutrients[`nutrient_${nutrientId}`] = amount;
          
          const mapping = USDA_NUTRIENT_MAP[nutrientId];
          if (mapping) {
            (unifiedFood as Record<string, unknown>)[mapping.target] = amount;
          }
        }
      }

      foods.push(unifiedFood);
    } catch (err) {
      errors++;
      if (errors <= 10) {
        warnings.push(`Error processing food ${food.fdcId}: ${err}`);
      }
    }
  }

  console.log(`✅ Parsed ${foods.length} foods from USDA SR Legacy JSON`);

  return {
    foods,
    stats: {
      totalParsed: srFoods.length,
      successfullyNormalized: foods.length,
      errors,
      warnings,
    },
  };
}

export { SOURCE, SOURCE_VERSION, ATTRIBUTION };

