/**
 * Download Script for Nutrition Datasets
 * 
 * This script downloads authoritative nutrition databases from government sources:
 * - USDA FoodData Central (SR Legacy, Foundation Foods, FNDDS)
 * - UK CoFID (Composition of Foods Integrated Dataset)
 * - Canadian Nutrient File
 * 
 * Run with: npx ts-node lib/label-maker/etl/download-datasets.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const DATA_DIR = path.join(process.cwd(), 'data', 'nutrition-datasets');

// Dataset download URLs
const DATASETS = {
  // USDA FoodData Central - April 2025 Release
  usda_sr_legacy: {
    name: 'USDA SR Legacy',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip',
    filename: 'usda_sr_legacy.zip',
    description: '~8,700 foods - Historical USDA Standard Reference database'
  },
  usda_foundation: {
    name: 'USDA Foundation Foods',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2025-04-24.zip',
    filename: 'usda_foundation.zip',
    description: '~700 foods - Detailed nutrient profiles for basic foods'
  },
  usda_fndds: {
    name: 'USDA FNDDS',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_csv_2024-10-31.zip',
    filename: 'usda_fndds.zip',
    description: '~8,000 foods - Food and Nutrient Database for Dietary Studies'
  },
  // UK CoFID - Note: Requires manual download from gov.uk
  uk_cofid: {
    name: 'UK CoFID',
    url: 'https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1107260/CoFID_2021.xlsx',
    filename: 'uk_cofid.xlsx',
    description: '~3,100 foods - UK Composition of Foods Integrated Dataset'
  },
  // Canadian Nutrient File - Note: API-based, we'll create a fetcher
  canada_cnf: {
    name: 'Canadian Nutrient File',
    url: 'https://food-nutrition.canada.ca/api/canadian-nutrient-file/food/?lang=en&type=json',
    filename: 'canada_cnf.json',
    description: '~5,800 foods - Health Canada nutrient database'
  }
};

// Tier 2 Datasets (additional sources)
const TIER2_DATASETS = {
  // FAO/INFOODS - Various regional tables
  fao_infoods: {
    name: 'FAO/INFOODS',
    url: 'https://www.fao.org/infoods/infoods/tables-and-databases/en/',
    filename: 'fao_infoods_reference.txt',
    description: '~15,000+ foods - UN FAO International tables (manual download required)',
    manual: true
  },
  // Australia/New Zealand NUTTAB
  anz_nuttab: {
    name: 'ANZ NUTTAB',
    url: 'https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/downloadableexcelfiles.aspx',
    filename: 'anz_nuttab_reference.txt',
    description: '~2,600 foods - Food Standards Australia NZ (manual download required)',
    manual: true
  }
};

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(dest);
          downloadFile(redirectUrl, dest).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize > 0) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r  Progress: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(1)} MB)`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(' ✓');
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function ensureDataDir(): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function downloadDatasets(): Promise<void> {
  console.log('🍎 Nutrition Database Download Script');
  console.log('=====================================\n');
  
  await ensureDataDir();
  
  console.log('📁 Data directory:', DATA_DIR);
  console.log('\n--- Tier 1: Primary Government Databases ---\n');
  
  for (const [key, dataset] of Object.entries(DATASETS)) {
    const destPath = path.join(DATA_DIR, dataset.filename);
    
    if (fs.existsSync(destPath)) {
      console.log(`⏭️  ${dataset.name}: Already downloaded`);
      continue;
    }
    
    console.log(`📥 ${dataset.name}`);
    console.log(`   ${dataset.description}`);
    console.log(`   URL: ${dataset.url}`);
    
    try {
      await downloadFile(dataset.url, destPath);
      console.log(`   Saved to: ${destPath}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`   💡 Try manual download from: ${dataset.url}`);
    }
    console.log('');
  }
  
  console.log('\n--- Tier 2: Regional/International Databases ---\n');
  
  for (const [key, dataset] of Object.entries(TIER2_DATASETS)) {
    const destPath = path.join(DATA_DIR, dataset.filename);
    
    console.log(`📋 ${dataset.name}`);
    console.log(`   ${dataset.description}`);
    console.log(`   ⚠️  Manual download required from: ${dataset.url}`);
    
    // Create reference file with download instructions
    const instructions = `
${dataset.name}
${'='.repeat(dataset.name.length)}

Description: ${dataset.description}

Download URL: ${dataset.url}

Instructions:
1. Visit the URL above
2. Download the dataset files
3. Place them in this directory: ${DATA_DIR}

Expected files:
- For FAO/INFOODS: Multiple regional CSV/Excel files
- For ANZ NUTTAB: Excel files from the download page

After downloading, run the ETL scripts to process the data.
`;
    
    fs.writeFileSync(destPath, instructions);
    console.log(`   Created reference file: ${destPath}`);
    console.log('');
  }
  
  console.log('\n✅ Download process complete!');
  console.log('\nNext steps:');
  console.log('1. Unzip downloaded files in the data directory');
  console.log('2. Download any manual datasets listed above');
  console.log('3. Run: npx ts-node lib/label-maker/etl/index.ts');
}

// Export for programmatic use
export { DATASETS, TIER2_DATASETS, DATA_DIR, downloadFile, downloadDatasets };

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('download-datasets.ts');
if (isMainModule) {
  downloadDatasets().catch(console.error);
}

