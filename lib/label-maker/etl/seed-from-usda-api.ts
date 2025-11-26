/**
 * Seed Foundation Foods from USDA FDC API
 * 
 * This script fetches foods directly from USDA FoodData Central API
 * and inserts them into Supabase. This is a quick way to populate
 * the database without downloading large CSV files.
 * 
 * Run with: npx ts-node lib/label-maker/etl/seed-from-usda-api.ts
 * 
 * Requires: USDA_FDC_API_KEY environment variable (get free key from fdc.nal.usda.gov)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const USDA_FDC_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const BATCH_SIZE = 200; // USDA API max page size

// Nutrient ID mappings
const NUTRIENT_MAP: Record<number, string> = {
  1008: 'energy_kcal',
  1003: 'protein_g',
  1004: 'total_fat_g',
  1005: 'carbohydrate_g',
  1079: 'dietary_fiber_g',
  2000: 'total_sugars_g',
  1235: 'added_sugars_g',
  1258: 'saturated_fat_g',
  1292: 'monounsaturated_fat_g',
  1293: 'polyunsaturated_fat_g',
  1257: 'trans_fat_g',
  1253: 'cholesterol_mg',
  1093: 'sodium_mg',
  1087: 'calcium_mg',
  1089: 'iron_mg',
  1090: 'magnesium_mg',
  1091: 'phosphorus_mg',
  1092: 'potassium_mg',
  1095: 'zinc_mg',
  1098: 'copper_mg',
  1103: 'selenium_mcg',
  1106: 'vitamin_a_mcg_rae',
  1162: 'vitamin_c_mg',
  1114: 'vitamin_d_mcg',
  1109: 'vitamin_e_mg',
  1185: 'vitamin_k_mcg',
  1165: 'thiamin_mg',
  1166: 'riboflavin_mg',
  1167: 'niacin_mg',
  1175: 'vitamin_b6_mg',
  1177: 'folate_mcg_dfe',
  1178: 'vitamin_b12_mcg',
  1051: 'water_g',
};

interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: { description: string };
  foodNutrients: Array<{
    nutrient: { id: number; name: string };
    amount: number;
  }>;
  scientificName?: string;
  ndbNumber?: string;
}

interface USDASearchResponse {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, key);
}

async function fetchUSDAFoods(
  apiKey: string,
  dataType: string,
  pageNumber: number
): Promise<USDASearchResponse> {
  const response = await fetch(`${USDA_FDC_BASE_URL}/foods/list?api_key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataType: [dataType],
      pageSize: BATCH_SIZE,
      pageNumber,
      sortBy: 'fdcId',
      sortOrder: 'asc',
    }),
  });

  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`);
  }

  const foods = await response.json();
  return {
    foods,
    totalHits: foods.length,
    currentPage: pageNumber,
    totalPages: 1, // List endpoint doesn't provide this
  };
}

async function fetchFoodDetails(apiKey: string, fdcIds: number[]): Promise<USDAFood[]> {
  const response = await fetch(`${USDA_FDC_BASE_URL}/foods?api_key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fdcIds,
      format: 'full',
      nutrients: Object.keys(NUTRIENT_MAP).map(Number),
    }),
  });

  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`);
  }

  return response.json();
}

function transformUSDAFood(food: USDAFood, sourceDb: string): Record<string, unknown> {
  const nutrients: Record<string, number | null> = {};
  const rawNutrients: Record<string, number> = {};

  // Map nutrients
  for (const fn of food.foodNutrients || []) {
    const nutrientId = fn.nutrient?.id;
    const amount = fn.amount;
    
    if (nutrientId && amount !== undefined) {
      rawNutrients[`nutrient_${nutrientId}`] = amount;
      
      const fieldName = NUTRIENT_MAP[nutrientId];
      if (fieldName) {
        nutrients[fieldName] = Math.round(amount * 1000) / 1000;
      }
    }
  }

  return {
    source_db: sourceDb,
    source_id: String(food.fdcId),
    source_version: 'November 2025',
    food_code: food.ndbNumber || null,
    description_en: food.description,
    scientific_name: food.scientificName || null,
    food_group: food.foodCategory?.description || null,
    ...nutrients,
    raw_nutrients: rawNutrients,
    raw_metadata: {
      dataType: food.dataType,
      fdcId: food.fdcId,
    },
    halal_status: 'unknown',
    common_allergens: [],
  };
}

async function seedFromUSDA() {
  console.log('🍎 USDA FoodData Central Seeder');
  console.log('================================\n');

  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) {
    console.log('❌ USDA_FDC_API_KEY not set in environment');
    console.log('   Get a free API key from: https://fdc.nal.usda.gov/api-key-signup.html');
    console.log('   Add to .env.local: USDA_FDC_API_KEY=your_key_here\n');
    
    // Fall back to sample data
    console.log('📝 Inserting sample data instead...\n');
    await insertSampleData();
    return;
  }

  const supabase = getSupabaseClient();
  
  // Data types to fetch
  const dataTypes = [
    { type: 'Foundation', source: 'usda_foundation', target: 500 },
    { type: 'SR Legacy', source: 'usda_sr', target: 2000 },
  ];

  let totalInserted = 0;

  for (const { type, source, target } of dataTypes) {
    console.log(`\n📥 Fetching ${type} foods (target: ${target})...`);
    
    let page = 1;
    let fetched = 0;
    
    while (fetched < target) {
      try {
        // Fetch list of food IDs
        const listResponse = await fetchUSDAFoods(apiKey, type, page);
        
        if (listResponse.foods.length === 0) {
          console.log(`   No more ${type} foods available`);
          break;
        }

        const fdcIds = listResponse.foods.map((f: { fdcId: number }) => f.fdcId);
        
        // Fetch full details
        console.log(`   Fetching details for ${fdcIds.length} foods...`);
        const foods = await fetchFoodDetails(apiKey, fdcIds);
        
        // Transform and insert
        const records = foods.map(f => transformUSDAFood(f, source));
        
        const { error } = await supabase
          .from('foundation_foods')
          .upsert(records, { onConflict: 'source_db,source_id' });

        if (error) {
          console.error(`   ❌ Insert error: ${error.message}`);
        } else {
          fetched += records.length;
          totalInserted += records.length;
          console.log(`   ✓ Inserted ${records.length} (total: ${fetched}/${target})`);
        }

        page++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        console.error(`   ❌ Error: ${err}`);
        break;
      }
    }
  }

  console.log(`\n✅ Seeding complete! Total inserted: ${totalInserted} foods`);
  
  // Show stats
  const { data: stats } = await supabase.rpc('get_source_stats');
  console.log('\n📊 Database stats:');
  for (const stat of stats || []) {
    console.log(`   ${stat.source_db}: ${stat.count} foods`);
  }
}

async function insertSampleData() {
  const supabase = getSupabaseClient();
  
  // Sample foods with real USDA data
  const sampleFoods = [
    {
      source_db: 'usda_sr',
      source_id: '171287',
      description_en: 'Chicken, broilers or fryers, breast, meat only, raw',
      food_group: 'Poultry',
      energy_kcal: 120,
      protein_g: 22.5,
      total_fat_g: 2.62,
      carbohydrate_g: 0,
      saturated_fat_g: 0.563,
      cholesterol_mg: 64,
      sodium_mg: 116,
      potassium_mg: 370,
      calcium_mg: 5,
      iron_mg: 0.41,
      vitamin_c_mg: 0,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170000',
      description_en: 'Beef, ground, 80% lean meat / 20% fat, raw',
      food_group: 'Beef',
      energy_kcal: 254,
      protein_g: 17.17,
      total_fat_g: 20,
      carbohydrate_g: 0,
      saturated_fat_g: 7.63,
      cholesterol_mg: 78,
      sodium_mg: 75,
      potassium_mg: 289,
      calcium_mg: 18,
      iron_mg: 2.35,
      halal_status: 'unknown',
    },
    {
      source_db: 'usda_sr',
      source_id: '168917',
      description_en: 'Rice, white, long-grain, regular, raw, enriched',
      food_group: 'Cereals & Grains',
      energy_kcal: 365,
      protein_g: 7.13,
      total_fat_g: 0.66,
      carbohydrate_g: 79.95,
      dietary_fiber_g: 1.3,
      total_sugars_g: 0.12,
      sodium_mg: 5,
      potassium_mg: 115,
      calcium_mg: 28,
      iron_mg: 4.31,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170567',
      description_en: 'Salmon, Atlantic, wild, raw',
      food_group: 'Seafood',
      energy_kcal: 142,
      protein_g: 19.84,
      total_fat_g: 6.34,
      carbohydrate_g: 0,
      saturated_fat_g: 0.981,
      cholesterol_mg: 55,
      sodium_mg: 44,
      potassium_mg: 628,
      calcium_mg: 12,
      iron_mg: 0.8,
      vitamin_d_mcg: 11,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170393',
      description_en: 'Egg, whole, raw, fresh',
      food_group: 'Dairy & Eggs',
      energy_kcal: 143,
      protein_g: 12.56,
      total_fat_g: 9.51,
      carbohydrate_g: 0.72,
      saturated_fat_g: 3.126,
      cholesterol_mg: 372,
      sodium_mg: 142,
      potassium_mg: 138,
      calcium_mg: 56,
      iron_mg: 1.75,
      vitamin_a_mcg_rae: 160,
      vitamin_d_mcg: 2,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '171411',
      description_en: 'Milk, whole, 3.25% milkfat, with added vitamin D',
      food_group: 'Dairy & Eggs',
      energy_kcal: 61,
      protein_g: 3.15,
      total_fat_g: 3.27,
      carbohydrate_g: 4.78,
      saturated_fat_g: 1.865,
      cholesterol_mg: 10,
      sodium_mg: 43,
      potassium_mg: 132,
      calcium_mg: 113,
      vitamin_d_mcg: 1.3,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '168483',
      description_en: 'Apple, raw, with skin',
      food_group: 'Fruits',
      energy_kcal: 52,
      protein_g: 0.26,
      total_fat_g: 0.17,
      carbohydrate_g: 13.81,
      dietary_fiber_g: 2.4,
      total_sugars_g: 10.39,
      sodium_mg: 1,
      potassium_mg: 107,
      calcium_mg: 6,
      vitamin_c_mg: 4.6,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170050',
      description_en: 'Banana, raw',
      food_group: 'Fruits',
      energy_kcal: 89,
      protein_g: 1.09,
      total_fat_g: 0.33,
      carbohydrate_g: 22.84,
      dietary_fiber_g: 2.6,
      total_sugars_g: 12.23,
      sodium_mg: 1,
      potassium_mg: 358,
      calcium_mg: 5,
      vitamin_c_mg: 8.7,
      vitamin_b6_mg: 0.367,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170457',
      description_en: 'Broccoli, raw',
      food_group: 'Vegetables',
      energy_kcal: 34,
      protein_g: 2.82,
      total_fat_g: 0.37,
      carbohydrate_g: 6.64,
      dietary_fiber_g: 2.6,
      total_sugars_g: 1.7,
      sodium_mg: 33,
      potassium_mg: 316,
      calcium_mg: 47,
      iron_mg: 0.73,
      vitamin_c_mg: 89.2,
      vitamin_k_mcg: 101.6,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170106',
      description_en: 'Carrot, raw',
      food_group: 'Vegetables',
      energy_kcal: 41,
      protein_g: 0.93,
      total_fat_g: 0.24,
      carbohydrate_g: 9.58,
      dietary_fiber_g: 2.8,
      total_sugars_g: 4.74,
      sodium_mg: 69,
      potassium_mg: 320,
      calcium_mg: 33,
      vitamin_a_mcg_rae: 835,
      vitamin_c_mg: 5.9,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170186',
      description_en: 'Potato, flesh and skin, raw',
      food_group: 'Vegetables',
      energy_kcal: 77,
      protein_g: 2.05,
      total_fat_g: 0.09,
      carbohydrate_g: 17.49,
      dietary_fiber_g: 2.1,
      total_sugars_g: 0.82,
      sodium_mg: 6,
      potassium_mg: 425,
      calcium_mg: 12,
      iron_mg: 0.81,
      vitamin_c_mg: 19.7,
      vitamin_b6_mg: 0.298,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '168875',
      description_en: 'Bread, white, commercially prepared',
      food_group: 'Baked Goods',
      energy_kcal: 266,
      protein_g: 8.85,
      total_fat_g: 3.29,
      carbohydrate_g: 49.2,
      dietary_fiber_g: 2.3,
      total_sugars_g: 4.31,
      sodium_mg: 477,
      potassium_mg: 100,
      calcium_mg: 144,
      iron_mg: 3.25,
      halal_status: 'unknown',
    },
    {
      source_db: 'usda_sr',
      source_id: '173430',
      description_en: 'Olive oil, salad or cooking',
      food_group: 'Fats & Oils',
      energy_kcal: 884,
      protein_g: 0,
      total_fat_g: 100,
      carbohydrate_g: 0,
      saturated_fat_g: 13.808,
      monounsaturated_fat_g: 72.961,
      polyunsaturated_fat_g: 10.523,
      cholesterol_mg: 0,
      sodium_mg: 2,
      vitamin_e_mg: 14.35,
      vitamin_k_mcg: 60.2,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '172336',
      description_en: 'Sugar, granulated',
      food_group: 'Sweets & Desserts',
      energy_kcal: 387,
      protein_g: 0,
      total_fat_g: 0,
      carbohydrate_g: 99.98,
      total_sugars_g: 99.91,
      sodium_mg: 1,
      potassium_mg: 2,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '173944',
      description_en: 'Salt, table',
      food_group: 'Spices & Herbs',
      energy_kcal: 0,
      protein_g: 0,
      total_fat_g: 0,
      carbohydrate_g: 0,
      sodium_mg: 38758,
      potassium_mg: 8,
      calcium_mg: 24,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170931',
      description_en: 'Onion, raw',
      food_group: 'Vegetables',
      energy_kcal: 40,
      protein_g: 1.1,
      total_fat_g: 0.1,
      carbohydrate_g: 9.34,
      dietary_fiber_g: 1.7,
      total_sugars_g: 4.24,
      sodium_mg: 4,
      potassium_mg: 146,
      calcium_mg: 23,
      vitamin_c_mg: 7.4,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '169230',
      description_en: 'Garlic, raw',
      food_group: 'Vegetables',
      energy_kcal: 149,
      protein_g: 6.36,
      total_fat_g: 0.5,
      carbohydrate_g: 33.06,
      dietary_fiber_g: 2.1,
      total_sugars_g: 1,
      sodium_mg: 17,
      potassium_mg: 401,
      calcium_mg: 181,
      vitamin_c_mg: 31.2,
      vitamin_b6_mg: 1.235,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '171702',
      description_en: 'Tomato, red, ripe, raw',
      food_group: 'Vegetables',
      energy_kcal: 18,
      protein_g: 0.88,
      total_fat_g: 0.2,
      carbohydrate_g: 3.89,
      dietary_fiber_g: 1.2,
      total_sugars_g: 2.63,
      sodium_mg: 5,
      potassium_mg: 237,
      calcium_mg: 10,
      vitamin_c_mg: 13.7,
      vitamin_a_mcg_rae: 42,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '173420',
      description_en: 'Butter, salted',
      food_group: 'Dairy & Eggs',
      energy_kcal: 717,
      protein_g: 0.85,
      total_fat_g: 81.11,
      carbohydrate_g: 0.06,
      saturated_fat_g: 51.368,
      cholesterol_mg: 215,
      sodium_mg: 643,
      potassium_mg: 24,
      calcium_mg: 24,
      vitamin_a_mcg_rae: 684,
      vitamin_d_mcg: 1.5,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '168880',
      description_en: 'Pasta, dry, enriched',
      food_group: 'Cereals & Grains',
      energy_kcal: 371,
      protein_g: 13.04,
      total_fat_g: 1.51,
      carbohydrate_g: 74.67,
      dietary_fiber_g: 3.2,
      total_sugars_g: 2.67,
      sodium_mg: 6,
      potassium_mg: 223,
      calcium_mg: 21,
      iron_mg: 3.3,
      halal_status: 'halal',
    },
    // Additional foods for variety
    {
      source_db: 'usda_sr',
      source_id: '168411',
      description_en: 'Avocado, raw',
      food_group: 'Fruits',
      energy_kcal: 160,
      protein_g: 2,
      total_fat_g: 14.66,
      carbohydrate_g: 8.53,
      dietary_fiber_g: 6.7,
      total_sugars_g: 0.66,
      sodium_mg: 7,
      potassium_mg: 485,
      calcium_mg: 12,
      vitamin_c_mg: 10,
      vitamin_e_mg: 2.07,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '169655',
      description_en: 'Spinach, raw',
      food_group: 'Vegetables',
      energy_kcal: 23,
      protein_g: 2.86,
      total_fat_g: 0.39,
      carbohydrate_g: 3.63,
      dietary_fiber_g: 2.2,
      sodium_mg: 79,
      potassium_mg: 558,
      calcium_mg: 99,
      iron_mg: 2.71,
      vitamin_a_mcg_rae: 469,
      vitamin_c_mg: 28.1,
      vitamin_k_mcg: 482.9,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170090',
      description_en: 'Orange, raw',
      food_group: 'Fruits',
      energy_kcal: 47,
      protein_g: 0.94,
      total_fat_g: 0.12,
      carbohydrate_g: 11.75,
      dietary_fiber_g: 2.4,
      total_sugars_g: 9.35,
      sodium_mg: 0,
      potassium_mg: 181,
      calcium_mg: 40,
      vitamin_c_mg: 53.2,
      folate_mcg_dfe: 30,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170178',
      description_en: 'Lemon, raw, without peel',
      food_group: 'Fruits',
      energy_kcal: 29,
      protein_g: 1.1,
      total_fat_g: 0.3,
      carbohydrate_g: 9.32,
      dietary_fiber_g: 2.8,
      total_sugars_g: 2.5,
      sodium_mg: 2,
      potassium_mg: 138,
      calcium_mg: 26,
      vitamin_c_mg: 53,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '174270',
      description_en: 'Honey',
      food_group: 'Sweets & Desserts',
      energy_kcal: 304,
      protein_g: 0.3,
      total_fat_g: 0,
      carbohydrate_g: 82.4,
      total_sugars_g: 82.12,
      sodium_mg: 4,
      potassium_mg: 52,
      calcium_mg: 6,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '173757',
      description_en: 'Yogurt, plain, whole milk',
      food_group: 'Dairy & Eggs',
      energy_kcal: 61,
      protein_g: 3.47,
      total_fat_g: 3.25,
      carbohydrate_g: 4.66,
      total_sugars_g: 4.66,
      saturated_fat_g: 2.096,
      cholesterol_mg: 13,
      sodium_mg: 46,
      potassium_mg: 155,
      calcium_mg: 121,
      vitamin_d_mcg: 0.1,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr', 
      source_id: '172430',
      description_en: 'Cheese, cheddar',
      food_group: 'Dairy & Eggs',
      energy_kcal: 403,
      protein_g: 22.87,
      total_fat_g: 33.31,
      carbohydrate_g: 3.09,
      saturated_fat_g: 18.867,
      cholesterol_mg: 99,
      sodium_mg: 653,
      potassium_mg: 76,
      calcium_mg: 710,
      vitamin_a_mcg_rae: 337,
      halal_status: 'unknown',
    },
    {
      source_db: 'usda_sr',
      source_id: '170148',
      description_en: 'Cucumber, with peel, raw',
      food_group: 'Vegetables',
      energy_kcal: 15,
      protein_g: 0.65,
      total_fat_g: 0.11,
      carbohydrate_g: 3.63,
      dietary_fiber_g: 0.5,
      total_sugars_g: 1.67,
      sodium_mg: 2,
      potassium_mg: 147,
      calcium_mg: 16,
      vitamin_c_mg: 2.8,
      vitamin_k_mcg: 16.4,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '169967',
      description_en: 'Lettuce, iceberg, raw',
      food_group: 'Vegetables',
      energy_kcal: 14,
      protein_g: 0.9,
      total_fat_g: 0.14,
      carbohydrate_g: 2.97,
      dietary_fiber_g: 1.2,
      sodium_mg: 10,
      potassium_mg: 141,
      calcium_mg: 18,
      vitamin_a_mcg_rae: 25,
      vitamin_k_mcg: 24.1,
      halal_status: 'halal',
    },
    {
      source_db: 'usda_sr',
      source_id: '170187',
      description_en: 'Sweet potato, raw',
      food_group: 'Vegetables',
      energy_kcal: 86,
      protein_g: 1.57,
      total_fat_g: 0.05,
      carbohydrate_g: 20.12,
      dietary_fiber_g: 3,
      total_sugars_g: 4.18,
      sodium_mg: 55,
      potassium_mg: 337,
      calcium_mg: 30,
      vitamin_a_mcg_rae: 709,
      vitamin_c_mg: 2.4,
      halal_status: 'halal',
    },
  ];

  console.log(`📥 Inserting ${sampleFoods.length} sample foods...\n`);

  const { data, error } = await supabase
    .from('foundation_foods')
    .upsert(sampleFoods, { onConflict: 'source_db,source_id' })
    .select('id');

  if (error) {
    console.error('❌ Insert error:', error.message);
    return;
  }

  console.log(`✅ Successfully inserted ${data?.length || sampleFoods.length} foods!\n`);

  // Show stats
  const { data: stats } = await supabase.rpc('get_source_stats');
  console.log('📊 Database stats:');
  for (const stat of stats || []) {
    console.log(`   ${stat.source_db}: ${stat.count} foods`);
  }

  // Show food groups
  const { data: groups } = await supabase.rpc('get_food_groups');
  console.log('\n📁 Food groups:');
  for (const group of (groups || []).slice(0, 10)) {
    console.log(`   ${group.food_group}: ${group.count} foods`);
  }
}

// Run
seedFromUSDA().catch(console.error);

