/**
 * USDA Foundation Foods Parser
 * 
 * Parses the USDA Foundation Foods CSV dataset (~700 foods)
 * These are high-quality nutrient profiles with detailed analysis metadata
 * Download from: https://fdc.nal.usda.gov/download-datasets
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { UnifiedFoundationFood, ParserResult, DataSource } from '../types.js';
import { USDA_NUTRIENT_MAP, parseNutrientValue, standardizeFoodGroup } from '../normalizers/nutrient-mapper.js';

const SOURCE: DataSource = 'usda_foundation';
const SOURCE_VERSION = 'April 2025';
const ATTRIBUTION = 'USDA FoodData Central - Foundation Foods';

/**
 * Parse USDA Foundation Foods from CSV directory
 */
export async function parseUSDAFoundation(dataDir: string): Promise<ParserResult> {
  const warnings: string[] = [];
  const foods: UnifiedFoundationFood[] = [];
  let errors = 0;

  console.log('📊 Parsing USDA Foundation Foods dataset...');

  const foodFile = path.join(dataDir, 'food.csv');
  const nutrientFile = path.join(dataDir, 'food_nutrient.csv');
  const categoryFile = path.join(dataDir, 'food_category.csv');

  if (!fs.existsSync(foodFile)) {
    throw new Error(`Food file not found: ${foodFile}`);
  }

  // Parse food categories
  const categoryMap = new Map<string, string>();
  if (fs.existsSync(categoryFile)) {
    console.log('  Loading food categories...');
    const categoryData = fs.readFileSync(categoryFile, 'utf-8');
    const categories = parse(categoryData, { columns: true, skip_empty_lines: true });
    for (const cat of categories) {
      categoryMap.set(cat.id, cat.description);
    }
  }

  // Build nutrient map
  const nutrientMap = new Map<string, Map<number, number>>();
  if (fs.existsSync(nutrientFile)) {
    console.log('  Loading nutrient values...');
    const nutrientData = fs.readFileSync(nutrientFile, 'utf-8');
    const foodNutrients = parse(nutrientData, { columns: true, skip_empty_lines: true });
    
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
  const foodEntries = parse(foodData, { columns: true, skip_empty_lines: true });

  for (const food of foodEntries) {
    try {
      const nutrients = nutrientMap.get(food.fdc_id) || new Map();
      const rawNutrients: Record<string, number | null> = {};
      
      nutrients.forEach((value, nutrientId) => {
        rawNutrients[`nutrient_${nutrientId}`] = value;
      });

      const unifiedFood: UnifiedFoundationFood = {
        source_db: SOURCE,
        source_id: food.fdc_id,
        source_version: SOURCE_VERSION,
        food_code: food.ndb_number,
        description_en: food.description,
        food_group: standardizeFoodGroup(categoryMap.get(food.food_category_id)),
        raw_nutrients: rawNutrients,
        raw_metadata: {
          data_type: food.data_type,
          publication_date: food.publication_date,
        },
        halal_status: 'unknown',
        common_allergens: [],
      };

      // Map nutrients
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

  console.log(`✅ Parsed ${foods.length} foods from USDA Foundation Foods`);

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
 * Parse USDA Foundation Foods from JSON format
 */
export async function parseUSDAFoundationJSON(jsonFile: string): Promise<ParserResult> {
  const warnings: string[] = [];
  const foods: UnifiedFoundationFood[] = [];
  let errors = 0;

  console.log('📊 Parsing USDA Foundation Foods JSON...');

  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  const foundationFoods = data.FoundationFoods || data;

  if (!Array.isArray(foundationFoods)) {
    throw new Error('Invalid JSON structure');
  }

  console.log(`  Processing ${foundationFoods.length} food entries...`);

  for (const food of foundationFoods) {
    try {
      const rawNutrients: Record<string, number | null> = {};
      
      const unifiedFood: UnifiedFoundationFood = {
        source_db: SOURCE,
        source_id: String(food.fdcId),
        source_version: SOURCE_VERSION,
        food_code: food.ndbNumber,
        description_en: food.description,
        scientific_name: food.scientificName,
        food_group: standardizeFoodGroup(food.foodCategory?.description),
        raw_nutrients: rawNutrients,
        raw_metadata: {
          dataType: food.dataType,
          publicationDate: food.publicationDate,
          foodClass: food.foodClass,
        },
        halal_status: 'unknown',
        common_allergens: [],
      };

      // Process nutrients
      const nutrients = food.foodNutrients || [];
      for (const nutrient of nutrients) {
        const nutrientId = nutrient.nutrient?.id;
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

  console.log(`✅ Parsed ${foods.length} foods from USDA Foundation Foods JSON`);

  return {
    foods,
    stats: {
      totalParsed: foundationFoods.length,
      successfullyNormalized: foods.length,
      errors,
      warnings,
    },
  };
}

export { SOURCE, SOURCE_VERSION, ATTRIBUTION };

