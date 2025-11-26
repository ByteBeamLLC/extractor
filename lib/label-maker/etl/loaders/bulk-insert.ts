/**
 * Bulk Insert Loader
 * 
 * Efficiently inserts large amounts of food data into Supabase
 * Uses batch operations and handles conflicts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UnifiedFoundationFood, FoundationFoodInsert } from '../types.js';

const BATCH_SIZE = 500;  // Number of records per batch
const TABLE_NAME = 'foundation_foods';

interface BulkInsertResult {
  inserted: number;
  updated: number;
  errors: number;
  errorMessages: string[];
}

/**
 * Create Supabase client for server-side operations
 */
function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Convert UnifiedFoundationFood to database insert format
 */
function toInsertFormat(food: UnifiedFoundationFood): FoundationFoodInsert {
  return {
    ...food,
    raw_nutrients: food.raw_nutrients || {},
    raw_metadata: food.raw_metadata || {},
    common_allergens: food.common_allergens || [],
  };
}

/**
 * Bulk insert foods into Supabase
 */
export async function bulkInsertFoods(
  foods: UnifiedFoundationFood[],
  options: {
    upsert?: boolean;
    onProgress?: (progress: { current: number; total: number }) => void;
  } = {}
): Promise<BulkInsertResult> {
  const { upsert = true, onProgress } = options;
  
  const result: BulkInsertResult = {
    inserted: 0,
    updated: 0,
    errors: 0,
    errorMessages: [],
  };

  if (foods.length === 0) {
    return result;
  }

  console.log(`📤 Starting bulk insert of ${foods.length} foods...`);

  const supabase = createSupabaseClient();
  const totalBatches = Math.ceil(foods.length / BATCH_SIZE);

  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = foods.slice(i, i + BATCH_SIZE);
    const insertData = batch.map(toInsertFormat);

    try {
      if (upsert) {
        // Upsert: insert or update on conflict
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .upsert(insertData, {
            onConflict: 'source_db,source_id',
            ignoreDuplicates: false,
          });

        if (error) {
          throw error;
        }

        result.inserted += batch.length;  // Upsert doesn't distinguish insert vs update
      } else {
        // Insert only (will error on duplicates)
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert(insertData);

        if (error) {
          throw error;
        }

        result.inserted += batch.length;
      }

      console.log(`  Batch ${batchNum}/${totalBatches}: ${batch.length} records`);
    } catch (error) {
      result.errors += batch.length;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errorMessages.push(`Batch ${batchNum}: ${errorMessage}`);
      console.error(`  Batch ${batchNum} failed: ${errorMessage}`);
    }

    if (onProgress) {
      onProgress({ current: Math.min(i + BATCH_SIZE, foods.length), total: foods.length });
    }
  }

  console.log(`✅ Bulk insert complete: ${result.inserted} inserted, ${result.errors} errors`);

  return result;
}

/**
 * Delete all foods from a specific source
 */
export async function deleteBySource(sourceDb: string): Promise<number> {
  console.log(`🗑️  Deleting all foods from source: ${sourceDb}`);

  const supabase = createSupabaseClient();

  const { data, error, count } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('source_db', sourceDb)
    .select('*', { count: 'exact' });

  if (error) {
    throw error;
  }

  console.log(`  Deleted ${count} records`);
  return count || 0;
}

/**
 * Get count of foods by source
 */
export async function getCountBySource(): Promise<Record<string, number>> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('source_db')
    .order('source_db');

  if (error) {
    throw error;
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.source_db] = (counts[row.source_db] || 0) + 1;
  }

  return counts;
}

/**
 * Get total food count
 */
export async function getTotalCount(): Promise<number> {
  const supabase = createSupabaseClient();

  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * Verify data integrity after import
 */
export async function verifyImport(expectedCount: number): Promise<{
  success: boolean;
  actualCount: number;
  missingFields: string[];
}> {
  const supabase = createSupabaseClient();

  // Get total count
  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw error;
  }

  // Check for records missing critical fields
  const { data: missingData, error: missingError } = await supabase
    .from(TABLE_NAME)
    .select('id, description_en, energy_kcal, protein_g')
    .or('description_en.is.null,energy_kcal.is.null')
    .limit(10);

  const missingFields: string[] = [];
  if (missingData && missingData.length > 0) {
    for (const record of missingData) {
      if (!record.description_en) missingFields.push(`${record.id}: missing description`);
      if (!record.energy_kcal) missingFields.push(`${record.id}: missing energy_kcal`);
    }
  }

  return {
    success: count === expectedCount && missingFields.length === 0,
    actualCount: count || 0,
    missingFields,
  };
}

export { BATCH_SIZE, TABLE_NAME };

