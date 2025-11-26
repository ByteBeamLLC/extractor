/**
 * Canadian Nutrient File (CNF) Parser
 * 
 * Parses the Health Canada nutrient database (~5,800 foods)
 * Download from: https://food-nutrition.canada.ca/cnf-fce/index-eng.jsp
 * 
 * Supports both CSV export and JSON API response formats
 */

import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { UnifiedFoundationFood, ParserResult, DataSource } from '../types.js';
import { CANADA_CNF_NUTRIENT_MAP, parseNutrientValue, standardizeFoodGroup } from '../normalizers/nutrient-mapper.js';

const SOURCE: DataSource = 'canada_cnf';
const SOURCE_VERSION = 'CNF 2015';
const ATTRIBUTION = 'Canadian Nutrient File - Health Canada';

interface CNFFood {
  FoodID: string;
  FoodCode: string;
  FoodGroupID: string;
  FoodSourceID: string;
  FoodDescription: string;
  FoodDescriptionF?: string;  // French description
  CountryCode?: string;
  ScientificName?: string;
}

interface CNFNutrientAmount {
  FoodID: string;
  NutrientID: string;
  NutrientValue: string;
  NutrientName?: string;
  NutrientUnit?: string;
}

interface CNFFoodGroup {
  FoodGroupID: string;
  FoodGroupName: string;
  FoodGroupNameF?: string;
}

/**
 * Parse CNF from CSV files
 */
export async function parseCanadaCNF(dataDir: string): Promise<ParserResult> {
  const warnings: string[] = [];
  const foods: UnifiedFoundationFood[] = [];
  let errors = 0;

  console.log('📊 Parsing Canadian Nutrient File...');

  // Look for required files
  const foodFile = findFile(dataDir, ['food', 'foods', 'food_name']);
  const nutrientFile = findFile(dataDir, ['nutrient_amount', 'nutrient_amounts', 'nutrients']);
  const groupFile = findFile(dataDir, ['food_group', 'food_groups', 'groups']);

  if (!foodFile) {
    throw new Error(`Food file not found in ${dataDir}`);
  }

  // Parse food groups
  const groupMap = new Map<string, string>();
  if (groupFile) {
    console.log('  Loading food groups...');
    const groupData = fs.readFileSync(groupFile, 'utf-8');
    const groups = parse(groupData, { columns: true, skip_empty_lines: true }) as CNFFoodGroup[];
    for (const group of groups) {
      groupMap.set(group.FoodGroupID, group.FoodGroupName);
    }
    console.log(`  Found ${groupMap.size} food groups`);
  }

  // Parse nutrient amounts
  const nutrientMap = new Map<string, Map<string, number>>();
  if (nutrientFile) {
    console.log('  Loading nutrient values...');
    const nutrientData = fs.readFileSync(nutrientFile, 'utf-8');
    const amounts = parse(nutrientData, { columns: true, skip_empty_lines: true }) as CNFNutrientAmount[];
    
    for (const amount of amounts) {
      const foodId = amount.FoodID;
      const nutrientName = amount.NutrientName || amount.NutrientID;
      const value = parseNutrientValue(amount.NutrientValue);
      
      if (value !== null && nutrientName) {
        if (!nutrientMap.has(foodId)) {
          nutrientMap.set(foodId, new Map());
        }
        nutrientMap.get(foodId)!.set(nutrientName.toUpperCase(), value);
      }
    }
    console.log(`  Loaded nutrients for ${nutrientMap.size} foods`);
  }

  // Parse main food file
  console.log('  Loading food entries...');
  const foodData = fs.readFileSync(foodFile, 'utf-8');
  const foodEntries = parse(foodData, { columns: true, skip_empty_lines: true }) as CNFFood[];

  console.log(`  Processing ${foodEntries.length} food entries...`);

  for (const food of foodEntries) {
    try {
      const nutrients = nutrientMap.get(food.FoodID) || new Map();
      
      // Build raw nutrients
      const rawNutrients: Record<string, number | null> = {};
      nutrients.forEach((value, name) => {
        rawNutrients[name] = value;
      });

      const unifiedFood: UnifiedFoundationFood = {
        source_db: SOURCE,
        source_id: food.FoodID,
        source_version: SOURCE_VERSION,
        food_code: food.FoodCode,
        description_en: food.FoodDescription,
        scientific_name: food.ScientificName,
        food_group: standardizeFoodGroup(groupMap.get(food.FoodGroupID)),
        raw_nutrients: rawNutrients,
        raw_metadata: {
          foodSourceId: food.FoodSourceID,
          countryCode: food.CountryCode,
          frenchDescription: food.FoodDescriptionF,
        },
        halal_status: 'unknown',
        common_allergens: [],
      };

      // Map nutrients using CNF mappings
      for (const [nutrientName, mapping] of Object.entries(CANADA_CNF_NUTRIENT_MAP)) {
        const value = nutrients.get(nutrientName);
        if (value !== undefined) {
          (unifiedFood as Record<string, unknown>)[mapping.target] = value;
        }
      }

      foods.push(unifiedFood);
    } catch (err) {
      errors++;
      if (errors <= 10) {
        warnings.push(`Error processing food ${food.FoodID}: ${err}`);
      }
    }
  }

  console.log(`✅ Parsed ${foods.length} foods from Canadian Nutrient File`);

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
 * Parse CNF from JSON API response
 */
export async function parseCanadaCNFJSON(jsonFile: string): Promise<ParserResult> {
  const warnings: string[] = [];
  const foods: UnifiedFoundationFood[] = [];
  let errors = 0;

  console.log('📊 Parsing Canadian Nutrient File JSON...');

  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  
  // API response might be wrapped in different structures
  const cnfFoods = Array.isArray(data) ? data : data.foods || data.data || [];

  if (!Array.isArray(cnfFoods)) {
    throw new Error('Invalid JSON structure');
  }

  console.log(`  Processing ${cnfFoods.length} food entries...`);

  for (const food of cnfFoods) {
    try {
      const rawNutrients: Record<string, number | null> = {};

      const unifiedFood: UnifiedFoundationFood = {
        source_db: SOURCE,
        source_id: String(food.food_id || food.id),
        source_version: SOURCE_VERSION,
        food_code: food.food_code,
        description_en: food.food_description || food.description || food.name,
        scientific_name: food.scientific_name,
        food_group: standardizeFoodGroup(food.food_group || food.group),
        raw_nutrients: rawNutrients,
        raw_metadata: food,
        halal_status: 'unknown',
        common_allergens: [],
      };

      // Process nutrients (if included in response)
      const nutrients = food.nutrients || food.nutrient_amounts || [];
      if (Array.isArray(nutrients)) {
        for (const nutrient of nutrients) {
          const name = nutrient.nutrient_name || nutrient.name;
          const value = parseNutrientValue(nutrient.value || nutrient.amount);
          
          if (name && value !== null) {
            rawNutrients[name.toUpperCase()] = value;
            
            const mapping = CANADA_CNF_NUTRIENT_MAP[name.toUpperCase()];
            if (mapping) {
              (unifiedFood as Record<string, unknown>)[mapping.target] = value;
            }
          }
        }
      }

      foods.push(unifiedFood);
    } catch (err) {
      errors++;
      if (errors <= 10) {
        warnings.push(`Error processing food: ${err}`);
      }
    }
  }

  console.log(`✅ Parsed ${foods.length} foods from Canadian Nutrient File JSON`);

  return {
    foods,
    stats: {
      totalParsed: cnfFoods.length,
      successfullyNormalized: foods.length,
      errors,
      warnings,
    },
  };
}

/**
 * Helper to find file with multiple possible names
 */
function findFile(dir: string, possibleNames: string[]): string | null {
  const files = fs.readdirSync(dir);
  
  for (const name of possibleNames) {
    const found = files.find(f => 
      f.toLowerCase().includes(name.toLowerCase()) && 
      (f.endsWith('.csv') || f.endsWith('.CSV'))
    );
    if (found) {
      return `${dir}/${found}`;
    }
  }
  
  return null;
}

export { SOURCE, SOURCE_VERSION, ATTRIBUTION };

