/**
 * Allergen Standardizer
 * 
 * Standardizes allergen declarations across different data sources
 * to Codex Alimentarius standards used in GCC regulations.
 */

import { StandardAllergen, STANDARD_ALLERGENS } from '../types';

/**
 * Keywords that indicate specific allergens
 */
const ALLERGEN_KEYWORDS: Record<StandardAllergen, string[]> = {
  gluten: [
    'wheat', 'barley', 'rye', 'oat', 'oats', 'spelt', 'kamut', 'triticale',
    'gluten', 'bread', 'flour', 'pasta', 'noodle', 'couscous', 'bulgur',
    'semolina', 'durum', 'farina', 'seitan'
  ],
  crustaceans: [
    'shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'crawfish', 'krill',
    'crustacean', 'shellfish'
  ],
  eggs: [
    'egg', 'eggs', 'albumin', 'globulin', 'lysozyme', 'mayonnaise',
    'meringue', 'ovalbumin', 'ovomucin', 'ovomucoid', 'ovovitellin'
  ],
  fish: [
    'fish', 'salmon', 'tuna', 'cod', 'bass', 'anchovy', 'sardine', 'herring',
    'mackerel', 'trout', 'haddock', 'halibut', 'tilapia', 'catfish',
    'fish sauce', 'fish oil'
  ],
  peanuts: [
    'peanut', 'peanuts', 'groundnut', 'groundnuts', 'arachis',
    'monkey nut', 'earth nut'
  ],
  soybeans: [
    'soy', 'soya', 'soybean', 'soybeans', 'edamame', 'tofu', 'tempeh',
    'miso', 'natto', 'soy sauce', 'soy milk', 'soy protein', 'soy lecithin'
  ],
  milk: [
    'milk', 'dairy', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt',
    'whey', 'casein', 'caseinate', 'lactose', 'lactalbumin', 'lactoglobulin',
    'ghee', 'custard', 'ice cream', 'kefir', 'paneer'
  ],
  tree_nuts: [
    'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'macadamia',
    'brazil nut', 'hazelnut', 'chestnut', 'pine nut', 'praline',
    'marzipan', 'nougat', 'gianduja'
  ],
  celery: [
    'celery', 'celeriac', 'celery seed', 'celery salt'
  ],
  mustard: [
    'mustard', 'mustard seed', 'mustard oil', 'mustard powder'
  ],
  sesame: [
    'sesame', 'sesame seed', 'sesame oil', 'tahini', 'halvah', 'hummus'
  ],
  sulphites: [
    'sulphite', 'sulfite', 'sulphur dioxide', 'sulfur dioxide',
    'sodium metabisulphite', 'potassium metabisulphite', 'e220', 'e221',
    'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228'
  ],
  lupin: [
    'lupin', 'lupine', 'lupini'
  ],
  molluscs: [
    'mollusc', 'mollusk', 'squid', 'octopus', 'clam', 'mussel', 'oyster',
    'scallop', 'snail', 'escargot', 'abalone', 'calamari', 'cuttlefish'
  ],
};

/**
 * Detect allergens from food description or ingredients list
 */
export function detectAllergens(text: string): StandardAllergen[] {
  if (!text) return [];
  
  const detected: StandardAllergen[] = [];
  const lowerText = text.toLowerCase();
  
  for (const allergen of STANDARD_ALLERGENS) {
    const keywords = ALLERGEN_KEYWORDS[allergen];
    
    for (const keyword of keywords) {
      // Use word boundary matching
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerText)) {
        detected.push(allergen);
        break; // Found this allergen, move to next
      }
    }
  }
  
  return detected;
}

/**
 * Detect allergens from food category/group
 */
export function detectAllergensFromCategory(category: string): StandardAllergen[] {
  if (!category) return [];
  
  const categoryLower = category.toLowerCase();
  const detected: StandardAllergen[] = [];
  
  // Common category patterns
  if (categoryLower.includes('dairy') || categoryLower.includes('milk')) {
    detected.push('milk');
  }
  if (categoryLower.includes('egg')) {
    detected.push('eggs');
  }
  if (categoryLower.includes('fish') || categoryLower.includes('seafood')) {
    detected.push('fish');
  }
  if (categoryLower.includes('shellfish') || categoryLower.includes('crustacean')) {
    detected.push('crustaceans');
  }
  if (categoryLower.includes('nut') && !categoryLower.includes('coconut')) {
    detected.push('tree_nuts');
  }
  if (categoryLower.includes('legume') || categoryLower.includes('soy')) {
    detected.push('soybeans');
  }
  if (categoryLower.includes('cereal') || categoryLower.includes('grain') || categoryLower.includes('bread')) {
    detected.push('gluten');
  }
  
  return detected;
}

/**
 * Standardize allergen name to our standard format
 */
export function standardizeAllergenName(name: string): StandardAllergen | null {
  const lowerName = name.toLowerCase().trim();
  
  // Direct matches
  for (const allergen of STANDARD_ALLERGENS) {
    if (lowerName === allergen) return allergen;
  }
  
  // Common variations
  const variations: Record<string, StandardAllergen> = {
    'wheat': 'gluten',
    'gluten-containing cereals': 'gluten',
    'shrimp': 'crustaceans',
    'prawn': 'crustaceans',
    'crab': 'crustaceans',
    'lobster': 'crustaceans',
    'egg': 'eggs',
    'soy': 'soybeans',
    'soya': 'soybeans',
    'nuts': 'tree_nuts',
    'tree nuts': 'tree_nuts',
    'cow milk': 'milk',
    "cow's milk": 'milk',
    'dairy': 'milk',
    'sulfites': 'sulphites',
    'sulfite': 'sulphites',
    'so2': 'sulphites',
    'shellfish': 'crustaceans',
    'squid': 'molluscs',
    'octopus': 'molluscs',
    'clam': 'molluscs',
    'mussel': 'molluscs',
    'oyster': 'molluscs',
  };
  
  if (variations[lowerName]) {
    return variations[lowerName];
  }
  
  // Keyword search
  for (const [allergen, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return allergen as StandardAllergen;
      }
    }
  }
  
  return null;
}

/**
 * Get allergen display name (for labels)
 */
export function getAllergenDisplayName(allergen: StandardAllergen): string {
  const displayNames: Record<StandardAllergen, string> = {
    gluten: 'Cereals containing Gluten',
    crustaceans: 'Crustaceans',
    eggs: 'Eggs',
    fish: 'Fish',
    peanuts: 'Peanuts',
    soybeans: 'Soybeans',
    milk: 'Milk',
    tree_nuts: 'Tree Nuts',
    celery: 'Celery',
    mustard: 'Mustard',
    sesame: 'Sesame Seeds',
    sulphites: 'Sulphur Dioxide and Sulphites',
    lupin: 'Lupin',
    molluscs: 'Molluscs',
  };
  
  return displayNames[allergen] || allergen;
}

/**
 * Get allergen display name in Arabic (for GCC labels)
 */
export function getAllergenArabicName(allergen: StandardAllergen): string {
  const arabicNames: Record<StandardAllergen, string> = {
    gluten: 'الحبوب المحتوية على الغلوتين',
    crustaceans: 'القشريات',
    eggs: 'البيض',
    fish: 'الأسماك',
    peanuts: 'الفول السوداني',
    soybeans: 'فول الصويا',
    milk: 'الحليب',
    tree_nuts: 'المكسرات',
    celery: 'الكرفس',
    mustard: 'الخردل',
    sesame: 'السمسم',
    sulphites: 'ثاني أكسيد الكبريت والكبريتات',
    lupin: 'الترمس',
    molluscs: 'الرخويات',
  };
  
  return arabicNames[allergen] || allergen;
}

export { ALLERGEN_KEYWORDS, STANDARD_ALLERGENS };

