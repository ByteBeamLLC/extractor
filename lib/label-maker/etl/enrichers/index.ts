/**
 * Hybrid Enrichment Pipeline
 * 
 * Orchestrates the enrichment of incomplete Foundation Foods data:
 * 1. Re-import deleted Foundation Foods
 * 2. Link to SR Legacy via ndb_number
 * 3. Enrich via USDA API
 * 4. Clean up remaining incomplete records
 * 5. Generate final report
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { parseUSDAFoundation } from '../parsers/usda-foundation.js';
import { bulkInsertFoods } from '../loaders/bulk-insert.js';
import { enrichFromSRLegacy } from './sr-legacy-linker.js';
import { enrichFromUSDAAPI } from './usda-api-enricher.js';
import * as path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Step 1: Re-import Foundation Foods (that were previously deleted)
 */
async function reimportFoundationFoods(): Promise<number> {
  console.log('\n📥 Step 0: Re-importing Foundation Foods\n');
  console.log('=' .repeat(70));

  const dataDir = path.join(process.cwd(), 'data', 'nutrition-datasets', 'usda_foundation');
  
  console.log('  Parsing Foundation Foods dataset...');
  const result = await parseUSDAFoundation(dataDir);
  
  console.log(`  Parsed: ${result.foods.length} foods`);
  console.log('  Inserting into database...\n');

  const insertResult = await bulkInsertFoods(result.foods, {
    upsert: true,
    onProgress: ({ current, total }) => {
      const percent = Math.round((current / total) * 100);
      process.stdout.write(`\r  Progress: ${percent}% (${current}/${total})`);
    },
  });

  console.log(`\n\n  ✅ Inserted: ${insertResult.inserted}, Errors: ${insertResult.errors}\n`);
  
  return insertResult.inserted;
}

/**
 * Step 4: Clean up remaining incomplete records
 */
async function cleanupIncomplete(): Promise<number> {
  console.log('\n🧹 Step 3: Cleaning up incomplete records\n');
  console.log('=' .repeat(70));

  // Delete records still missing core nutrients
  const { count: before } = await supabase
    .from('foundation_foods')
    .select('*', { count: 'exact', head: true })
    .is('energy_kcal', null);

  console.log(`  Foods still missing energy: ${before}`);

  if (before === 0) {
    console.log('  ✓ No cleanup needed!\n');
    return 0;
  }

  console.log('  Removing incomplete records...');

  let deletedTotal = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: incomplete } = await supabase
      .from('foundation_foods')
      .select('id')
      .is('energy_kcal', null)
      .limit(1000);

    if (!incomplete || incomplete.length === 0) {
      hasMore = false;
      break;
    }

    const ids = incomplete.map(r => r.id);
    const { error } = await supabase
      .from('foundation_foods')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('  Error deleting batch:', error);
      break;
    }

    deletedTotal += incomplete.length;
    process.stdout.write(`\r  Deleted: ${deletedTotal} records...`);

    if (incomplete.length < 1000) {
      hasMore = false;
    }
  }

  console.log(`\n  ✅ Cleanup complete: ${deletedTotal} incomplete records removed\n`);
  
  return deletedTotal;
}

/**
 * Generate final report
 */
async function generateFinalReport() {
  console.log('\n' + '='.repeat(70));
  console.log('              ENRICHMENT PIPELINE - FINAL REPORT');
  console.log('='.repeat(70) + '\n');

  // Total count
  const { count: total } = await supabase
    .from('foundation_foods')
    .select('*', { count: 'exact', head: true });

  // By source
  const { count: srCount } = await supabase
    .from('foundation_foods')
    .select('*', { count: 'exact', head: true })
    .eq('source_db', 'usda_sr');

  const { count: foundationCount } = await supabase
    .from('foundation_foods')
    .select('*', { count: 'exact', head: true })
    .eq('source_db', 'usda_foundation');

  // Data completeness
  const { count: completeEnergy } = await supabase
    .from('foundation_foods')
    .select('*', { count: 'exact', head: true })
    .not('energy_kcal', 'is', null);

  const { count: completeProtein } = await supabase
    .from('foundation_foods')
    .select('*', { count: 'exact', head: true })
    .not('protein_g', 'is', null);

  const { count: completeFat } = await supabase
    .from('foundation_foods')
    .select('*', { count: 'exact', head: true })
    .not('total_fat_g', 'is', null);

  const { count: completeCarbs } = await supabase
    .from('foundation_foods')
    .select('*', { count: 'exact', head: true })
    .not('carbohydrate_g', 'is', null);

  console.log('📊 FINAL DATABASE STATUS');
  console.log('-'.repeat(70));
  console.log(`  Total Foods:              ${total}`);
  console.log(`    - USDA SR Legacy:       ${srCount}`);
  console.log(`    - USDA Foundation:      ${foundationCount}`);
  console.log('');
  console.log('✅ DATA COMPLETENESS');
  console.log('-'.repeat(70));
  console.log(`  Energy (Calories):        ${completeEnergy}/${total} (${((completeEnergy/total)*100).toFixed(1)}%)`);
  console.log(`  Protein:                  ${completeProtein}/${total} (${((completeProtein/total)*100).toFixed(1)}%)`);
  console.log(`  Total Fat:                ${completeFat}/${total} (${((completeFat/total)*100).toFixed(1)}%)`);
  console.log(`  Carbohydrates:            ${completeCarbs}/${total} (${((completeCarbs/total)*100).toFixed(1)}%)`);
  console.log('');
  console.log('='.repeat(70));
  
  const allComplete = completeEnergy === total && completeProtein === total && 
                      completeFat === total && completeCarbs === total;
  
  if (allComplete) {
    console.log('✅ SUCCESS: All foods have complete nutrition data!');
  } else {
    console.log(`⚠️  ${total - completeEnergy} foods still incomplete`);
  }
  console.log('='.repeat(70) + '\n');
}

/**
 * Main enrichment pipeline
 */
async function runEnrichmentPipeline(options: {
  skipReimport?: boolean;
  maxAPIEnrichments?: number;
  prioritizePopular?: boolean;
} = {}) {
  const {
    skipReimport = false,
    maxAPIEnrichments = 5000,
    prioritizePopular = true,
  } = options;

  console.log('\n🚀 HYBRID ENRICHMENT PIPELINE');
  console.log('='.repeat(70));
  console.log('This will:');
  console.log('  1. Re-import Foundation Foods (if not skipped)');
  console.log('  2. Link to SR Legacy via ndb_number (fast)');
  console.log('  3. Enrich via USDA API (slow, rate-limited)');
  console.log('  4. Clean up incomplete records');
  console.log('  5. Generate final report');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 0: Re-import Foundation Foods
    if (!skipReimport) {
      await reimportFoundationFoods();
    } else {
      console.log('\n⏭️  Skipping re-import (--skip-reimport flag)\n');
    }

    // Step 1: Link to SR Legacy
    const srResult = await enrichFromSRLegacy();

    // Step 2: Enrich via API
    const apiResult = await enrichFromUSDAAPI(maxAPIEnrichments, prioritizePopular);

    // Step 3: Cleanup incomplete
    const cleaned = await cleanupIncomplete();

    // Step 4: Final report
    await generateFinalReport();

    console.log('🎉 Enrichment pipeline complete!\n');

  } catch (error) {
    console.error('\n❌ Pipeline error:', error);
    process.exit(1);
  }
}

// CLI
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('index.ts');
if (isMainModule) {
  const args = process.argv.slice(2);
  
  const options = {
    skipReimport: args.includes('--skip-reimport'),
    maxAPIEnrichments: parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '5000'),
    prioritizePopular: !args.includes('--no-prioritize'),
  };

  if (args.includes('--help')) {
    console.log(`
Hybrid Enrichment Pipeline

Usage:
  npx tsx lib/label-maker/etl/enrichers/index.ts [options]

Options:
  --skip-reimport      Skip re-importing Foundation Foods
  --max=N              Max foods to enrich via API (default: 5000)
  --no-prioritize      Don't prioritize common foods for API enrichment
  --help               Show this help

Examples:
  # Full pipeline (slow)
  npx tsx lib/label-maker/etl/enrichers/index.ts

  # Skip re-import if already done
  npx tsx lib/label-maker/etl/enrichers/index.ts --skip-reimport

  # Limit API enrichment to 1000 foods
  npx tsx lib/label-maker/etl/enrichers/index.ts --max=1000
`);
    process.exit(0);
  }

  runEnrichmentPipeline(options);
}

export { runEnrichmentPipeline, reimportFoundationFoods, enrichFromSRLegacy, enrichFromUSDAAPI };
















