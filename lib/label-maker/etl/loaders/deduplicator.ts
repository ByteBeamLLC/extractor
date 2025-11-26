/**
 * Food Deduplicator
 * 
 * Handles deduplication of foods across multiple data sources.
 * Uses fuzzy matching and nutrient similarity to identify duplicates.
 */

import { UnifiedFoundationFood, DataSource } from '../types';

/**
 * Deduplication configuration
 */
interface DedupeConfig {
  // Similarity threshold for description matching (0-1)
  descriptionThreshold: number;
  // Tolerance for nutrient comparison (percentage difference)
  nutrientTolerance: number;
  // Priority order for data sources (higher priority kept when duplicate found)
  sourcePriority: DataSource[];
}

const DEFAULT_CONFIG: DedupeConfig = {
  descriptionThreshold: 0.85,
  nutrientTolerance: 0.15, // 15% difference allowed
  sourcePriority: [
    'usda_foundation',  // Most detailed
    'usda_sr',          // Well-established
    'usda_fndds',       // Survey data
    'canada_cnf',       // Good quality
    'uk_cofid',         // UK specific
    'india_ifct',       // Regional
    'fao_infoods',      // Compilation
    'anz_nuttab',       // Regional
    'custom',           // User entered
  ],
};

/**
 * Result of deduplication process
 */
interface DedupeResult {
  unique: UnifiedFoundationFood[];
  duplicatesRemoved: number;
  mergedRecords: number;
  duplicatePairs: Array<{
    kept: { source: string; description: string };
    removed: { source: string; description: string };
    similarity: number;
  }>;
}

/**
 * Normalize food description for comparison
 */
function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim()
    .replace(/\b(raw|cooked|fresh|frozen|canned|dried)\b/g, '') // Remove prep methods
    .replace(/\b(with|without|and|or)\b/g, '')
    .trim();
}

/**
 * Calculate Jaccard similarity between two strings
 */
function jaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(' '));
  const set2 = new Set(str2.split(' '));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Calculate Levenshtein distance based similarity
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0 || len2 === 0) return 0;
  
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  return 1 - distance / Math.max(len1, len2);
}

/**
 * Combined similarity score
 */
function calculateSimilarity(desc1: string, desc2: string): number {
  const norm1 = normalizeDescription(desc1);
  const norm2 = normalizeDescription(desc2);
  
  // Exact match after normalization
  if (norm1 === norm2) return 1.0;
  
  // Combined score
  const jaccard = jaccardSimilarity(norm1, norm2);
  const levenshtein = levenshteinSimilarity(norm1, norm2);
  
  // Weight Jaccard higher for food names (word-based matching matters more)
  return jaccard * 0.6 + levenshtein * 0.4;
}

/**
 * Check if two foods have similar nutrients
 */
function nutrientsSimilar(
  food1: UnifiedFoundationFood,
  food2: UnifiedFoundationFood,
  tolerance: number
): boolean {
  const compareKeys = ['energy_kcal', 'protein_g', 'total_fat_g', 'carbohydrate_g'];
  
  for (const key of compareKeys) {
    const val1 = (food1 as Record<string, unknown>)[key] as number | undefined;
    const val2 = (food2 as Record<string, unknown>)[key] as number | undefined;
    
    if (val1 === undefined || val2 === undefined) continue;
    if (val1 === 0 && val2 === 0) continue;
    
    const maxVal = Math.max(val1, val2);
    if (maxVal === 0) continue;
    
    const diff = Math.abs(val1 - val2) / maxVal;
    if (diff > tolerance) return false;
  }
  
  return true;
}

/**
 * Get source priority rank
 */
function getSourcePriority(source: DataSource, config: DedupeConfig): number {
  const index = config.sourcePriority.indexOf(source);
  return index === -1 ? config.sourcePriority.length : index;
}

/**
 * Deduplicate foods from multiple sources
 */
export function deduplicateFoods(
  foods: UnifiedFoundationFood[],
  config: Partial<DedupeConfig> = {}
): DedupeResult {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const result: DedupeResult = {
    unique: [],
    duplicatesRemoved: 0,
    mergedRecords: 0,
    duplicatePairs: [],
  };
  
  if (foods.length === 0) return result;
  
  console.log(`🔍 Deduplicating ${foods.length} foods...`);
  
  // Build index by normalized description
  const descriptionIndex = new Map<string, UnifiedFoundationFood[]>();
  
  for (const food of foods) {
    const normDesc = normalizeDescription(food.description_en);
    const firstWord = normDesc.split(' ')[0];
    
    if (!descriptionIndex.has(firstWord)) {
      descriptionIndex.set(firstWord, []);
    }
    descriptionIndex.get(firstWord)!.push(food);
  }
  
  // Track which foods we've already processed
  const processed = new Set<string>();
  
  for (const food of foods) {
    const foodKey = `${food.source_db}_${food.source_id}`;
    
    if (processed.has(foodKey)) continue;
    processed.add(foodKey);
    
    // Look for potential duplicates
    const normDesc = normalizeDescription(food.description_en);
    const firstWord = normDesc.split(' ')[0];
    const candidates = descriptionIndex.get(firstWord) || [];
    
    let isDuplicate = false;
    
    for (const candidate of candidates) {
      const candidateKey = `${candidate.source_db}_${candidate.source_id}`;
      
      if (candidateKey === foodKey) continue;
      if (processed.has(candidateKey)) continue;
      
      const similarity = calculateSimilarity(food.description_en, candidate.description_en);
      
      if (similarity >= mergedConfig.descriptionThreshold) {
        // Check if nutrients are also similar
        if (nutrientsSimilar(food, candidate, mergedConfig.nutrientTolerance)) {
          // Found a duplicate - keep the one with higher priority
          const foodPriority = getSourcePriority(food.source_db, mergedConfig);
          const candidatePriority = getSourcePriority(candidate.source_db, mergedConfig);
          
          if (foodPriority <= candidatePriority) {
            // Keep current food, mark candidate as processed
            processed.add(candidateKey);
            result.duplicatePairs.push({
              kept: { source: food.source_db, description: food.description_en },
              removed: { source: candidate.source_db, description: candidate.description_en },
              similarity,
            });
            result.duplicatesRemoved++;
          } else {
            // Keep candidate, mark current as duplicate
            isDuplicate = true;
            result.duplicatePairs.push({
              kept: { source: candidate.source_db, description: candidate.description_en },
              removed: { source: food.source_db, description: food.description_en },
              similarity,
            });
            result.duplicatesRemoved++;
            break;
          }
        }
      }
    }
    
    if (!isDuplicate) {
      result.unique.push(food);
    }
  }
  
  console.log(`✅ Deduplication complete: ${result.unique.length} unique, ${result.duplicatesRemoved} removed`);
  
  return result;
}

/**
 * Find potential duplicates without removing them (for review)
 */
export function findPotentialDuplicates(
  foods: UnifiedFoundationFood[],
  threshold = 0.8
): Array<{
  food1: { source: string; description: string };
  food2: { source: string; description: string };
  similarity: number;
}> {
  const duplicates: Array<{
    food1: { source: string; description: string };
    food2: { source: string; description: string };
    similarity: number;
  }> = [];
  
  // Only check across different sources
  for (let i = 0; i < foods.length; i++) {
    for (let j = i + 1; j < foods.length; j++) {
      if (foods[i].source_db === foods[j].source_db) continue;
      
      const similarity = calculateSimilarity(
        foods[i].description_en,
        foods[j].description_en
      );
      
      if (similarity >= threshold) {
        duplicates.push({
          food1: { source: foods[i].source_db, description: foods[i].description_en },
          food2: { source: foods[j].source_db, description: foods[j].description_en },
          similarity,
        });
      }
    }
  }
  
  return duplicates.sort((a, b) => b.similarity - a.similarity);
}

export { DEFAULT_CONFIG as DEDUPE_CONFIG };
export type { DedupeConfig, DedupeResult };

