/**
 * ETL Pipeline Orchestrator
 * 
 * Main entry point for processing nutrition datasets
 * Run with: npx tsx lib/label-maker/etl/index.ts
 */

import 'dotenv/config';  // Load .env file
import * as fs from 'fs';
import * as path from 'path';
import { UnifiedFoundationFood, ParserResult, DataSource } from './types.js';
import { parseUSDA_SRLegacy, parseUSDA_SRLegacyJSON } from './parsers/usda-sr-legacy.js';
import { parseUSDAFoundation, parseUSDAFoundationJSON } from './parsers/usda-foundation.js';
import { parseUKCoFID, parseUKCoFIDCSV } from './parsers/uk-cofid.js';
import { parseCanadaCNF, parseCanadaCNFJSON } from './parsers/canada-cnf.js';
import { bulkInsertFoods, getCountBySource, getTotalCount } from './loaders/bulk-insert.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'nutrition-datasets');

interface ETLResult {
  source: DataSource;
  parsed: number;
  inserted: number;
  errors: number;
  warnings: string[];
}

/**
 * Detect and parse all available datasets
 */
async function parseAllDatasets(): Promise<Map<DataSource, UnifiedFoundationFood[]>> {
  const allFoods = new Map<DataSource, UnifiedFoundationFood[]>();
  const results: ETLResult[] = [];

  console.log('\n🔄 ETL Pipeline - Processing Nutrition Datasets');
  console.log('================================================\n');
  console.log(`📁 Data directory: ${DATA_DIR}\n`);

  // Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.log('⚠️  Data directory not found. Creating it...');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('\n💡 Please download datasets first:');
    console.log('   npx ts-node lib/label-maker/etl/download-datasets.ts\n');
    return allFoods;
  }

  // List available files
  const files = fs.readdirSync(DATA_DIR);
  console.log(`Found ${files.length} items in data directory\n`);

  // --- USDA SR Legacy ---
  const srLegacyDir = path.join(DATA_DIR, 'usda_sr_legacy');
  const srLegacyJson = files.find(f => f.includes('sr_legacy') && f.endsWith('.json'));
  
  if (fs.existsSync(srLegacyDir) && fs.existsSync(path.join(srLegacyDir, 'food.csv'))) {
    try {
      const result = await parseUSDA_SRLegacy(srLegacyDir);
      allFoods.set('usda_sr', result.foods);
      results.push({
        source: 'usda_sr',
        parsed: result.stats.totalParsed,
        inserted: 0,
        errors: result.stats.errors,
        warnings: result.stats.warnings,
      });
    } catch (err) {
      console.error(`❌ Error parsing USDA SR Legacy: ${err}`);
    }
  } else if (srLegacyJson) {
    try {
      const result = await parseUSDA_SRLegacyJSON(path.join(DATA_DIR, srLegacyJson));
      allFoods.set('usda_sr', result.foods);
      results.push({
        source: 'usda_sr',
        parsed: result.stats.totalParsed,
        inserted: 0,
        errors: result.stats.errors,
        warnings: result.stats.warnings,
      });
    } catch (err) {
      console.error(`❌ Error parsing USDA SR Legacy JSON: ${err}`);
    }
  } else {
    console.log('⏭️  USDA SR Legacy: Not found (extract to usda_sr_legacy/ folder)');
  }

  // --- USDA Foundation Foods ---
  const foundationDir = path.join(DATA_DIR, 'usda_foundation');
  const foundationJson = files.find(f => f.includes('foundation') && f.endsWith('.json'));
  
  if (fs.existsSync(foundationDir) && fs.existsSync(path.join(foundationDir, 'food.csv'))) {
    try {
      const result = await parseUSDAFoundation(foundationDir);
      allFoods.set('usda_foundation', result.foods);
      results.push({
        source: 'usda_foundation',
        parsed: result.stats.totalParsed,
        inserted: 0,
        errors: result.stats.errors,
        warnings: result.stats.warnings,
      });
    } catch (err) {
      console.error(`❌ Error parsing USDA Foundation: ${err}`);
    }
  } else if (foundationJson) {
    try {
      const result = await parseUSDAFoundationJSON(path.join(DATA_DIR, foundationJson));
      allFoods.set('usda_foundation', result.foods);
      results.push({
        source: 'usda_foundation',
        parsed: result.stats.totalParsed,
        inserted: 0,
        errors: result.stats.errors,
        warnings: result.stats.warnings,
      });
    } catch (err) {
      console.error(`❌ Error parsing USDA Foundation JSON: ${err}`);
    }
  } else {
    console.log('⏭️  USDA Foundation Foods: Not found');
  }

  // --- UK CoFID ---
  const cofidFile = files.find(f => 
    (f.includes('cofid') || f.includes('CoFID')) && 
    (f.endsWith('.xlsx') || f.endsWith('.csv'))
  );
  
  if (cofidFile) {
    try {
      const filePath = path.join(DATA_DIR, cofidFile);
      const result = cofidFile.endsWith('.csv') 
        ? await parseUKCoFIDCSV(filePath)
        : await parseUKCoFID(filePath);
      
      allFoods.set('uk_cofid', result.foods);
      results.push({
        source: 'uk_cofid',
        parsed: result.stats.totalParsed,
        inserted: 0,
        errors: result.stats.errors,
        warnings: result.stats.warnings,
      });
    } catch (err) {
      console.error(`❌ Error parsing UK CoFID: ${err}`);
    }
  } else {
    console.log('⏭️  UK CoFID: Not found (download from gov.uk)');
  }

  // --- Canadian Nutrient File ---
  const cnfDir = path.join(DATA_DIR, 'canada_cnf');
  const cnfJson = files.find(f => f.includes('canada') && f.endsWith('.json'));
  
  if (fs.existsSync(cnfDir)) {
    try {
      const result = await parseCanadaCNF(cnfDir);
      allFoods.set('canada_cnf', result.foods);
      results.push({
        source: 'canada_cnf',
        parsed: result.stats.totalParsed,
        inserted: 0,
        errors: result.stats.errors,
        warnings: result.stats.warnings,
      });
    } catch (err) {
      console.error(`❌ Error parsing Canadian Nutrient File: ${err}`);
    }
  } else if (cnfJson) {
    try {
      const result = await parseCanadaCNFJSON(path.join(DATA_DIR, cnfJson));
      allFoods.set('canada_cnf', result.foods);
      results.push({
        source: 'canada_cnf',
        parsed: result.stats.totalParsed,
        inserted: 0,
        errors: result.stats.errors,
        warnings: result.stats.warnings,
      });
    } catch (err) {
      console.error(`❌ Error parsing Canadian Nutrient File JSON: ${err}`);
    }
  } else {
    console.log('⏭️  Canadian Nutrient File: Not found');
  }

  // Print summary
  console.log('\n📊 Parsing Summary');
  console.log('------------------');
  let totalFoods = 0;
  for (const [source, foods] of allFoods) {
    console.log(`  ${source}: ${foods.length} foods`);
    totalFoods += foods.length;
  }
  console.log(`  Total: ${totalFoods} foods\n`);

  return allFoods;
}

/**
 * Run the full ETL pipeline
 */
async function runETL(options: {
  parseOnly?: boolean;
  sources?: DataSource[];
} = {}): Promise<void> {
  const { parseOnly = false, sources } = options;

  try {
    // Parse all datasets
    const allFoods = await parseAllDatasets();

    if (parseOnly) {
      console.log('📝 Parse-only mode - skipping database insert');
      
      // Export to JSON for inspection
      const exportPath = path.join(DATA_DIR, 'parsed_foods.json');
      const exportData: Record<string, number> = {};
      
      for (const [source, foods] of allFoods) {
        exportData[source] = foods.length;
      }
      
      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
      console.log(`📄 Summary exported to: ${exportPath}`);
      return;
    }

    // Insert into database
    console.log('\n📤 Inserting into database...\n');
    
    for (const [source, foods] of allFoods) {
      if (sources && !sources.includes(source)) {
        console.log(`⏭️  Skipping ${source} (not in source filter)`);
        continue;
      }

      if (foods.length === 0) {
        console.log(`⏭️  Skipping ${source} (no foods to insert)`);
        continue;
      }

      console.log(`\n🔄 Inserting ${foods.length} foods from ${source}...`);
      
      const result = await bulkInsertFoods(foods, {
        upsert: true,
        onProgress: ({ current, total }) => {
          const percent = Math.round((current / total) * 100);
          process.stdout.write(`\r  Progress: ${percent}% (${current}/${total})`);
        },
      });

      console.log(`\n  ✅ Inserted: ${result.inserted}, Errors: ${result.errors}`);
      
      if (result.errorMessages.length > 0) {
        console.log('  ⚠️  Errors:');
        for (const msg of result.errorMessages.slice(0, 5)) {
          console.log(`     ${msg}`);
        }
      }
    }

    // Print final stats
    console.log('\n📊 Database Status');
    console.log('------------------');
    const counts = await getCountBySource();
    for (const [source, count] of Object.entries(counts)) {
      console.log(`  ${source}: ${count}`);
    }
    const total = await getTotalCount();
    console.log(`  Total: ${total}\n`);

  } catch (error) {
    console.error('❌ ETL Pipeline Error:', error);
    process.exit(1);
  }
}

/**
 * Export parsed data to JSON (for debugging/inspection)
 */
async function exportToJSON(outputPath?: string): Promise<void> {
  const allFoods = await parseAllDatasets();
  
  const output: Record<string, UnifiedFoundationFood[]> = {};
  for (const [source, foods] of allFoods) {
    output[source] = foods;
  }

  const filePath = outputPath || path.join(DATA_DIR, 'all_foods_export.json');
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(`📄 Exported to: ${filePath}`);
}

// CLI interface
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('index.ts');
if (isMainModule) {
  const args = process.argv.slice(2);
  
  if (args.includes('--parse-only')) {
    runETL({ parseOnly: true });
  } else if (args.includes('--export')) {
    exportToJSON();
  } else if (args.includes('--help')) {
    console.log(`
ETL Pipeline for Nutrition Datasets

Usage:
  npx ts-node lib/label-maker/etl/index.ts [options]

Options:
  --parse-only    Parse datasets without inserting into database
  --export        Export parsed data to JSON file
  --help          Show this help message

Before running, download datasets using:
  npx ts-node lib/label-maker/etl/download-datasets.ts
`);
  } else {
    runETL();
  }
}

export { parseAllDatasets, runETL, exportToJSON };

