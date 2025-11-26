/**
 * UK CoFID (Composition of Foods Integrated Dataset) Parser
 * 
 * Parses the UK food composition data (~3,100 foods)
 * Download from: https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid
 * 
 * File format: Excel (.xlsx)
 */

import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { UnifiedFoundationFood, ParserResult, DataSource } from '../types.js';
import { UK_COFID_NUTRIENT_MAP, parseNutrientValue, standardizeFoodGroup } from '../normalizers/nutrient-mapper.js';

const SOURCE: DataSource = 'uk_cofid';
const SOURCE_VERSION = 'CoFID 2021';
const ATTRIBUTION = 'UK Composition of Foods Integrated Dataset (CoFID) - Public Health England';

/**
 * Parse UK CoFID Excel file
 */
export async function parseUKCoFID(filePath: string): Promise<ParserResult> {
  const warnings: string[] = [];
  const foods: UnifiedFoundationFood[] = [];
  let errors = 0;

  console.log('📊 Parsing UK CoFID dataset...');

  if (!fs.existsSync(filePath)) {
    throw new Error(`CoFID file not found: ${filePath}`);
  }

  // Read Excel file
  const workbook = XLSX.readFile(filePath);
  
  // CoFID typically has multiple sheets - find the main data sheet
  const sheetNames = workbook.SheetNames;
  console.log(`  Found sheets: ${sheetNames.join(', ')}`);

  // Try to find the main nutrient data sheet
  let dataSheet = workbook.Sheets['Proximates, vitamins and minerals'] 
    || workbook.Sheets['All data']
    || workbook.Sheets[sheetNames[0]];

  if (!dataSheet) {
    throw new Error('Could not find data sheet in CoFID file');
  }

  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json(dataSheet, { defval: null });
  console.log(`  Found ${rows.length} rows`);

  // Identify column names
  if (rows.length === 0) {
    throw new Error('No data found in CoFID file');
  }

  const firstRow = rows[0] as Record<string, unknown>;
  const columns = Object.keys(firstRow);
  console.log(`  Columns found: ${columns.length}`);

  // Find key columns
  const foodCodeCol = columns.find(c => 
    c.toLowerCase().includes('food code') || 
    c.toLowerCase().includes('foodcode')
  );
  const foodNameCol = columns.find(c => 
    c.toLowerCase().includes('food name') || 
    c.toLowerCase().includes('foodname') ||
    c.toLowerCase().includes('description')
  );
  const groupCol = columns.find(c => 
    c.toLowerCase().includes('group') || 
    c.toLowerCase().includes('category')
  );

  if (!foodNameCol) {
    warnings.push('Could not identify food name column');
  }

  console.log(`  Processing ${rows.length} food entries...`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, unknown>;
    
    try {
      // Get food identification
      const foodCode = foodCodeCol ? String(row[foodCodeCol] || '') : String(i + 1);
      const description = foodNameCol ? String(row[foodNameCol] || '') : '';
      const foodGroup = groupCol ? String(row[groupCol] || '') : undefined;

      if (!description || description === 'null') {
        continue; // Skip rows without food name
      }

      // Build raw nutrients
      const rawNutrients: Record<string, number | string | null> = {};
      
      // Map all columns to raw nutrients
      for (const col of columns) {
        rawNutrients[col] = row[col] as number | string | null;
      }

      // Create unified food entry
      const unifiedFood: UnifiedFoundationFood = {
        source_db: SOURCE,
        source_id: foodCode,
        source_version: SOURCE_VERSION,
        food_code: foodCode,
        description_en: description,
        food_group: standardizeFoodGroup(foodGroup),
        raw_nutrients: rawNutrients,
        raw_metadata: {
          rowIndex: i,
        },
        halal_status: 'unknown',
        common_allergens: [],
      };

      // Map nutrients using UK CoFID mappings
      for (const [colName, mapping] of Object.entries(UK_COFID_NUTRIENT_MAP)) {
        // Try exact match first
        let value = row[colName];
        
        // If not found, try partial match
        if (value === undefined) {
          const matchingCol = columns.find(c => 
            c.includes(colName.replace(/\s*\([^)]*\)\s*/g, '').trim())
          );
          if (matchingCol) {
            value = row[matchingCol];
          }
        }

        if (value !== undefined) {
          const numValue = parseNutrientValue(value);
          if (numValue !== null) {
            (unifiedFood as Record<string, unknown>)[mapping.target] = numValue;
          }
        }
      }

      foods.push(unifiedFood);
    } catch (err) {
      errors++;
      if (errors <= 10) {
        warnings.push(`Error processing row ${i}: ${err}`);
      }
    }
  }

  console.log(`✅ Parsed ${foods.length} foods from UK CoFID`);

  return {
    foods,
    stats: {
      totalParsed: rows.length,
      successfullyNormalized: foods.length,
      errors,
      warnings,
    },
  };
}

/**
 * Alternative parser for CSV export of CoFID
 */
export async function parseUKCoFIDCSV(filePath: string): Promise<ParserResult> {
  const warnings: string[] = [];
  const foods: UnifiedFoundationFood[] = [];
  let errors = 0;

  console.log('📊 Parsing UK CoFID CSV...');

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { parse } = await import('csv-parse/sync');
  const rows = parse(fileContent, { columns: true, skip_empty_lines: true });

  console.log(`  Found ${rows.length} rows`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    try {
      const foodCode = row['Food Code'] || row['FoodCode'] || String(i + 1);
      const description = row['Food Name'] || row['Description'] || '';
      
      if (!description) continue;

      const rawNutrients: Record<string, number | string | null> = { ...row };

      const unifiedFood: UnifiedFoundationFood = {
        source_db: SOURCE,
        source_id: foodCode,
        source_version: SOURCE_VERSION,
        food_code: foodCode,
        description_en: description,
        food_group: standardizeFoodGroup(row['Group'] || row['Food Group']),
        raw_nutrients: rawNutrients,
        halal_status: 'unknown',
        common_allergens: [],
      };

      // Map nutrients
      for (const [colName, mapping] of Object.entries(UK_COFID_NUTRIENT_MAP)) {
        const value = row[colName];
        if (value !== undefined) {
          const numValue = parseNutrientValue(value);
          if (numValue !== null) {
            (unifiedFood as Record<string, unknown>)[mapping.target] = numValue;
          }
        }
      }

      foods.push(unifiedFood);
    } catch (err) {
      errors++;
      if (errors <= 10) {
        warnings.push(`Error processing row ${i}: ${err}`);
      }
    }
  }

  console.log(`✅ Parsed ${foods.length} foods from UK CoFID CSV`);

  return {
    foods,
    stats: {
      totalParsed: rows.length,
      successfullyNormalized: foods.length,
      errors,
      warnings,
    },
  };
}

export { SOURCE, SOURCE_VERSION, ATTRIBUTION };

