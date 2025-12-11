/**
 * SR Legacy Cross-Reference Enricher
 * 
 * Links Foundation Foods to SR Legacy via ndb_number to copy complete nutrient profiles
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NutrientProfile {
  energy_kcal: number | null;
  protein_g: number | null;
  total_fat_g: number | null;
  saturated_fat_g: number | null;
  monounsaturated_fat_g: number | null;
  polyunsaturated_fat_g: number | null;
  trans_fat_g: number | null;
  cholesterol_mg: number | null;
  carbohydrate_g: number | null;
  dietary_fiber_g: number | null;
  total_sugars_g: number | null;
  sodium_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  potassium_mg: number | null;
  vitamin_a_mcg_rae: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
}

/**
 * Link Foundation Foods to SR Legacy via ndb_number
 */
export async function enrichFromSRLegacy(): Promise<{
  checked: number;
  linked: number;
  enriched: number;
  failed: number;
}> {
  console.log('🔗 Step 1: Linking Foundation Foods to SR Legacy via ndb_number\n');
  console.log('=' .repeat(70));

  // Get all Foundation Foods with ndb_number (food_code)
  const { data: foundationFoods, error: fetchError } = await supabase
    .from('foundation_foods')
    .select('id, source_id, food_code, description_en')
    .eq('source_db', 'usda_foundation')
    .not('food_code', 'is', null);

  if (fetchError) {
    console.error('Error fetching Foundation Foods:', fetchError);
    return { checked: 0, linked: 0, enriched: 0, failed: 0 };
  }

  console.log(`\n✓ Found ${foundationFoods?.length || 0} Foundation Foods with ndb_number\n`);

  let checked = 0;
  let linked = 0;
  let enriched = 0;
  let failed = 0;

  for (const foundation of foundationFoods || []) {
    checked++;
    
    try {
      // Find matching SR Legacy food by ndb_number
      const { data: srFood, error: srError } = await supabase
        .from('foundation_foods')
        .select(`
          energy_kcal, protein_g, total_fat_g, saturated_fat_g,
          monounsaturated_fat_g, polyunsaturated_fat_g, trans_fat_g,
          cholesterol_mg, carbohydrate_g, dietary_fiber_g, total_sugars_g,
          sodium_mg, calcium_mg, iron_mg, potassium_mg,
          vitamin_a_mcg_rae, vitamin_c_mg, vitamin_d_mcg
        `)
        .eq('source_db', 'usda_sr')
        .eq('food_code', foundation.food_code)
        .not('energy_kcal', 'is', null)
        .single();

      if (srError || !srFood) {
        continue;
      }

      linked++;

      // Update Foundation Food with SR Legacy nutrients
      const { error: updateError } = await supabase
        .from('foundation_foods')
        .update(srFood as NutrientProfile)
        .eq('id', foundation.id);

      if (updateError) {
        console.error(`  ✗ Failed to update ${foundation.description_en.substring(0, 40)}:`, updateError.message);
        failed++;
      } else {
        enriched++;
        if (enriched % 50 === 0) {
          process.stdout.write(`\r  Progress: ${enriched} enriched, ${linked - enriched} failed (${checked}/${foundationFoods.length} checked)`);
        }
      }
    } catch (error) {
      failed++;
      if (failed <= 5) {
        console.error(`  ✗ Error processing ${foundation.description_en.substring(0, 40)}:`, error);
      }
    }
  }

  console.log(`\r  Progress: ${enriched} enriched, ${failed} failed (${checked}/${foundationFoods.length} checked)\n`);
  console.log('=' .repeat(70));
  console.log(`\n✅ SR Legacy Linking Complete`);
  console.log(`   Checked:  ${checked} Foundation Foods with ndb_number`);
  console.log(`   Linked:   ${linked} matched to SR Legacy`);
  console.log(`   Enriched: ${enriched} successfully updated`);
  console.log(`   Failed:   ${failed}\n`);

  return { checked, linked, enriched, failed };
}






