/**
 * USDA API Enricher
 * 
 * Fetches complete nutrient profiles from USDA FoodData Central API
 * for incomplete Foundation Foods
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const USDA_FDC_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const API_KEY = process.env.USDA_FDC_API_KEY;
const RATE_LIMIT_DELAY = 4000; // 4 seconds between requests (900 requests/hour)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Nutrient ID mappings
const NUTRIENT_MAP: Record<number, string> = {
  1008: 'energy_kcal',
  1003: 'protein_g',
  1004: 'total_fat_g',
  1258: 'saturated_fat_g',
  1292: 'monounsaturated_fat_g',
  1293: 'polyunsaturated_fat_g',
  1257: 'trans_fat_g',
  1253: 'cholesterol_mg',
  1005: 'carbohydrate_g',
  1079: 'dietary_fiber_g',
  2000: 'total_sugars_g',
  1235: 'added_sugars_g',
  1093: 'sodium_mg',
  1087: 'calcium_mg',
  1089: 'iron_mg',
  1090: 'magnesium_mg',
  1091: 'phosphorus_mg',
  1092: 'potassium_mg',
  1095: 'zinc_mg',
  1106: 'vitamin_a_mcg_rae',
  1162: 'vitamin_c_mg',
  1114: 'vitamin_d_mcg',
  1109: 'vitamin_e_mg',
  1185: 'vitamin_k_mcg',
};

interface USDAFoodResponse {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrient: { id: number; name: string };
    amount: number;
  }>;
}

/**
 * Fetch food details from USDA API
 */
async function fetchUSDAFood(fdcId: string): Promise<Record<string, number | null>> {
  if (!API_KEY) {
    throw new Error('USDA_FDC_API_KEY not configured');
  }

  const response = await fetch(
    `${USDA_FDC_BASE_URL}/food/${fdcId}?api_key=${API_KEY}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    throw new Error(`API error: ${response.status}`);
  }

  const food: USDAFoodResponse = await response.json();
  
  // Map nutrients to our schema
  const nutrients: Record<string, number | null> = {};
  
  for (const nutrient of food.foodNutrients || []) {
    const fieldName = NUTRIENT_MAP[nutrient.nutrient.id];
    if (fieldName && nutrient.amount !== undefined && nutrient.amount !== null) {
      nutrients[fieldName] = nutrient.amount;
    }
  }

  return nutrients;
}

/**
 * Enrich incomplete Foundation Foods using USDA API
 */
export async function enrichFromUSDAAPI(
  maxFoods: number = 10000,
  prioritizePopular: boolean = true
): Promise<{
  attempted: number;
  enriched: number;
  failed: number;
  rateLimited: boolean;
}> {
  console.log('\n🌐 Step 2: Enriching from USDA FoodData Central API\n');
  console.log('=' .repeat(70));
  console.log(`  Max foods to enrich: ${maxFoods}`);
  console.log(`  Rate limit: 1 request every ${RATE_LIMIT_DELAY/1000}s (~${3600/(RATE_LIMIT_DELAY/1000)} requests/hour)`);
  console.log(`  Estimated time: ~${Math.round(maxFoods * RATE_LIMIT_DELAY / 1000 / 60)} minutes\n`);

  // Get incomplete Foundation Foods
  let query = supabase
    .from('foundation_foods')
    .select('id, source_id, description_en, source_db')
    .eq('source_db', 'usda_foundation')
    .is('energy_kcal', null)
    .limit(maxFoods);

  // Optionally prioritize by food type (common ingredients first)
  if (prioritizePopular) {
    // Prioritize common foods: oils, meats, vegetables, fruits, dairy
    query = query.or(
      'description_en.ilike.%oil%,' +
      'description_en.ilike.%chicken%,' +
      'description_en.ilike.%beef%,' +
      'description_en.ilike.%pork%,' +
      'description_en.ilike.%fish%,' +
      'description_en.ilike.%milk%,' +
      'description_en.ilike.%cheese%,' +
      'description_en.ilike.%egg%,' +
      'description_en.ilike.%bread%,' +
      'description_en.ilike.%rice%'
    );
  }

  const { data: incompleteFoods, error: fetchError } = await query;

  if (fetchError) {
    console.error('Error fetching incomplete foods:', fetchError);
    return { attempted: 0, enriched: 0, failed: 0, rateLimited: false };
  }

  console.log(`✓ Found ${incompleteFoods?.length || 0} incomplete Foundation Foods\n`);

  if (!incompleteFoods || incompleteFoods.length === 0) {
    console.log('No foods to enrich!');
    return { attempted: 0, enriched: 0, failed: 0, rateLimited: false };
  }

  let attempted = 0;
  let enriched = 0;
  let failed = 0;
  let rateLimited = false;

  console.log('Starting enrichment (this will take a while)...\n');

  for (const food of incompleteFoods) {
    attempted++;
    
    try {
      // Rate limiting
      if (attempted > 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }

      // Fetch nutrients from API
      const nutrients = await fetchUSDAFood(food.source_id);

      // Check if we got core nutrients
      if (nutrients.energy_kcal !== undefined && nutrients.energy_kcal !== null) {
        // Update database
        const { error: updateError } = await supabase
          .from('foundation_foods')
          .update(nutrients)
          .eq('id', food.id);

        if (updateError) {
          console.error(`  ✗ Failed to update ${food.description_en.substring(0, 40)}`);
          failed++;
        } else {
          enriched++;
          if (enriched % 10 === 0) {
            const elapsed = attempted * RATE_LIMIT_DELAY / 1000;
            const remaining = (incompleteFoods.length - attempted) * RATE_LIMIT_DELAY / 1000 / 60;
            process.stdout.write(
              `\r  Progress: ${enriched} enriched, ${failed} failed | ` +
              `${attempted}/${incompleteFoods.length} | ` +
              `~${Math.round(remaining)}min remaining`
            );
          }
        }
      } else {
        // API returned data but no core nutrients (specialized lab sample)
        failed++;
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMIT') {
        console.log('\n\n⚠️  Rate limit reached! Please wait and run again later.');
        rateLimited = true;
        break;
      }
      
      failed++;
      if (failed <= 5) {
        console.error(`  ✗ Error enriching ${food.description_en.substring(0, 40)}:`, error);
      }
    }
  }

  console.log(`\n\n${'=' .repeat(70)}`);
  console.log(`✅ API Enrichment Complete`);
  console.log(`   Attempted: ${attempted}`);
  console.log(`   Enriched:  ${enriched}`);
  console.log(`   Failed:    ${failed}`);
  if (rateLimited) {
    console.log(`   ⚠️  Rate limited - ${incompleteFoods.length - attempted} foods remaining`);
  }
  console.log('');

  return { attempted, enriched, failed, rateLimited };
}
















