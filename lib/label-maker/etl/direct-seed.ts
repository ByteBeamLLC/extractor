/**
 * Direct Database Seeder
 * 
 * This script parses the downloaded USDA/Canada datasets and inserts
 * directly into Supabase using the REST API.
 * 
 * Run: SUPABASE_URL=xxx SUPABASE_KEY=xxx npx tsx lib/label-maker/etl/direct-seed.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const DATA_DIR = path.join(process.cwd(), 'data', 'nutrition-datasets');
const BATCH_SIZE = 500;

// Get Supabase credentials from environment or prompt
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// USDA Nutrient ID mappings
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
};

async function insertBatch(records: any[]): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/foundation_foods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(records),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Insert error: ${error}`);
    return 0;
  }

  return records.length;
}

async function seedUSDA_SR(): Promise<number> {
  console.log('\n📊 Loading USDA SR Legacy...');
  
  const foodFile = path.join(DATA_DIR, 'usda_sr_legacy', 'food.csv');
  const nutrientFile = path.join(DATA_DIR, 'usda_sr_legacy', 'food_nutrient.csv');
  const categoryFile = path.join(DATA_DIR, 'usda_sr_legacy', 'food_category.csv');

  if (!fs.existsSync(foodFile)) {
    console.log('  ⏭️ Not found');
    return 0;
  }

  // Load categories
  const categoryMap = new Map<string, string>();
  if (fs.existsSync(categoryFile)) {
    const cats = parse(fs.readFileSync(categoryFile, 'utf-8'), { columns: true });
    for (const cat of cats) {
      categoryMap.set(cat.id, cat.description);
    }
  }

  // Load nutrients into map
  console.log('  Loading nutrients...');
  const nutrientMap = new Map<string, Map<number, number>>();
  if (fs.existsSync(nutrientFile)) {
    const nutrients = parse(fs.readFileSync(nutrientFile, 'utf-8'), { columns: true });
    for (const n of nutrients) {
      if (!nutrientMap.has(n.fdc_id)) {
        nutrientMap.set(n.fdc_id, new Map());
      }
      const val = parseFloat(n.amount);
      if (!isNaN(val)) {
        nutrientMap.get(n.fdc_id)!.set(parseInt(n.nutrient_id), val);
      }
    }
  }

  // Process foods
  console.log('  Processing foods...');
  const foods = parse(fs.readFileSync(foodFile, 'utf-8'), { columns: true });
  
  let inserted = 0;
  let batch: any[] = [];

  for (const food of foods) {
    const nutrients = nutrientMap.get(food.fdc_id) || new Map();
    
    const record: any = {
      source_db: 'usda_sr',
      source_id: food.fdc_id,
      source_version: 'April 2018',
      description_en: food.description,
      food_group: categoryMap.get(food.food_category_id) || null,
      halal_status: 'unknown',
    };

    // Map nutrients
    for (const [nutrientId, value] of nutrients) {
      const field = NUTRIENT_MAP[nutrientId];
      if (field) {
        record[field] = Math.round(value * 1000) / 1000;
      }
    }

    batch.push(record);

    if (batch.length >= BATCH_SIZE) {
      const count = await insertBatch(batch);
      inserted += count;
      process.stdout.write(`\r  Inserted: ${inserted}`);
      batch = [];
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    inserted += await insertBatch(batch);
  }

  console.log(`\n  ✅ Inserted ${inserted} foods`);
  return inserted;
}

async function seedCanadaCNF(): Promise<number> {
  console.log('\n📊 Loading Canadian Nutrient File...');
  
  const jsonFile = path.join(DATA_DIR, 'canada_cnf.json');
  if (!fs.existsSync(jsonFile)) {
    console.log('  ⏭️ Not found');
    return 0;
  }

  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  const foods = Array.isArray(data) ? data : [];
  
  console.log(`  Found ${foods.length} foods`);
  
  let inserted = 0;
  let batch: any[] = [];

  for (const food of foods) {
    const record: any = {
      source_db: 'canada_cnf',
      source_id: String(food.food_code || food.id),
      source_version: 'CNF 2015',
      description_en: food.food_description || food.description || food.name,
      food_group: food.food_group_name || food.food_group || null,
      halal_status: 'unknown',
    };

    // Map common nutrients if available
    if (food.energy) record.energy_kcal = food.energy;
    if (food.protein) record.protein_g = food.protein;
    if (food.fat) record.total_fat_g = food.fat;
    if (food.carbohydrate) record.carbohydrate_g = food.carbohydrate;

    batch.push(record);

    if (batch.length >= BATCH_SIZE) {
      const count = await insertBatch(batch);
      inserted += count;
      process.stdout.write(`\r  Inserted: ${inserted}`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    inserted += await insertBatch(batch);
  }

  console.log(`\n  ✅ Inserted ${inserted} foods`);
  return inserted;
}

async function main() {
  console.log('🍎 Direct Database Seeder');
  console.log('=========================\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('❌ Missing Supabase credentials!');
    console.log('   Set environment variables:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)\n');
    console.log('Example:');
    console.log('   SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=xxx npx tsx lib/label-maker/etl/direct-seed.ts');
    process.exit(1);
  }

  console.log('📡 Supabase URL:', SUPABASE_URL);

  let total = 0;

  // Seed each source
  total += await seedUSDA_SR();
  total += await seedCanadaCNF();

  console.log(`\n✅ Total inserted: ${total} foods`);

  // Verify
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_source_stats`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (response.ok) {
    const stats = await response.json();
    console.log('\n📊 Database stats:');
    for (const stat of stats) {
      console.log(`   ${stat.source_db}: ${stat.count} foods`);
    }
  }
}

main().catch(console.error);

