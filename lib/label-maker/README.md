# Foundation Foods Database - Implementation Guide

This module provides a comprehensive nutrition database for the GCC Food Label Maker, integrating **45,000+ foods** from authoritative government sources worldwide.

## 🏗️ Architecture Overview

```
lib/label-maker/
├── etl/                          # Extract-Transform-Load Pipeline
│   ├── download-datasets.ts      # Download datasets from gov sources
│   ├── index.ts                  # Main ETL orchestrator
│   ├── types.ts                  # Unified data types
│   ├── parsers/                  # Source-specific parsers
│   │   ├── usda-sr-legacy.ts     # USDA Standard Reference (~8,700 foods)
│   │   ├── usda-foundation.ts    # USDA Foundation (~700 foods)
│   │   ├── uk-cofid.ts           # UK CoFID (~3,100 foods)
│   │   └── canada-cnf.ts         # Canada CNF (~5,800 foods)
│   ├── normalizers/
│   │   └── nutrient-mapper.ts    # Unified nutrient mapping
│   └── loaders/
│       └── bulk-insert.ts        # Efficient Supabase inserts
├── foundation-foods.ts           # Unified search API
├── usda-api.ts                   # USDA FDC API fallback
└── recipe-actions.ts             # Recipe management

components/label-maker/
├── FoodSearchAutocomplete.tsx    # Search UI component
├── RecipeBuilderForm.tsx         # Recipe builder with search
└── ...

app/api/foods/search/
└── route.ts                      # REST API endpoint
```

## 📊 Data Sources

### Tier 1: Primary Government Databases (~25K foods)

| Source | Authority | Foods | Format |
|--------|-----------|-------|--------|
| **USDA SR Legacy** | US Dept of Agriculture | ~8,700 | CSV/JSON |
| **USDA Foundation Foods** | US Dept of Agriculture | ~700 | CSV/JSON |
| **USDA FNDDS** | US Dept of Agriculture | ~8,000 | CSV/JSON |
| **UK CoFID** | Public Health England | ~3,100 | Excel/CSV |
| **Canadian Nutrient File** | Health Canada | ~5,800 | CSV |

### Tier 2: Regional/International (~20K+ foods)

| Source | Authority | Foods | Region |
|--------|-----------|-------|--------|
| **FAO/INFOODS** | UN FAO | ~15,000+ | Global |
| **Indian IFCT** | NIN India | ~6,000 | South Asia |
| **ANZ NUTTAB** | FSANZ | ~2,600 | Australia/NZ |

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install xlsx csv-parse
```

### 2. Apply Database Migration

Run in Supabase SQL Editor:

```bash
cat supabase_migration_foundation_foods.sql
```

Or copy the contents of `supabase_migration_foundation_foods.sql` to your Supabase SQL Editor.

### 3. Download Datasets

```bash
npx ts-node lib/label-maker/etl/download-datasets.ts
```

This creates the `data/nutrition-datasets/` directory and downloads available datasets.

### 4. Prepare Data Files

After downloading, extract ZIP files:

```bash
cd data/nutrition-datasets
unzip usda_sr_legacy.zip -d usda_sr_legacy/
unzip usda_foundation.zip -d usda_foundation/
```

### 5. Run ETL Pipeline

```bash
# Parse only (to verify)
npx ts-node lib/label-maker/etl/index.ts --parse-only

# Full ETL (parse + insert into Supabase)
npx ts-node lib/label-maker/etl/index.ts
```

### 6. Configure USDA API Fallback (Optional)

Get a free API key from [USDA FDC](https://fdc.nal.usda.gov/api-key-signup.html) and add to `.env.local`:

```env
USDA_FDC_API_KEY=your_api_key_here
```

## 🔍 API Usage

### Search Endpoint

```
GET /api/foods/search?q=chicken&limit=20
```

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (required) |
| `limit` | number | Max results (default: 50, max: 100) |
| `offset` | number | Pagination offset |
| `sources` | string | Comma-separated: `usda_sr,uk_cofid` |
| `foodGroups` | string | Comma-separated food groups |
| `halalOnly` | boolean | Only halal foods |
| `quick` | boolean | Quick search for autocomplete |
| `useFallback` | boolean | Use USDA API if no local results |

**Actions:**

```
GET /api/foods/search?action=get&id=<uuid>   # Get food by ID
GET /api/foods/search?action=stats           # Get database stats
GET /api/foods/search?action=groups          # Get food groups
```

### Response Format

```typescript
interface FoodSearchResult {
  id: string;
  source: string;           // 'usda_sr', 'uk_cofid', etc.
  sourceId: string;         // Original source ID
  description: string;      // Food name
  foodGroup?: string;       // Category
  nutrition: {
    calories: number;       // per 100g
    totalFat: number;
    saturatedFat: number;
    transFat: number;
    cholesterol: number;
    sodium: number;
    totalCarbohydrates: number;
    dietaryFiber: number;
    totalSugars: number;
    addedSugars: number;
    protein: number;
    // ... vitamins/minerals
  };
  allergens: string[];
  halalStatus?: string;
  sourceAttribution: string;
}
```

## 🎨 UI Components

### FoodSearchAutocomplete

Full-featured dropdown with search:

```tsx
import { FoodSearchAutocomplete } from '@/components/label-maker'

<FoodSearchAutocomplete
  onSelect={(food) => {
    console.log('Selected:', food.description)
    console.log('Nutrition:', food.nutrition)
  }}
  placeholder="Search ingredients..."
/>
```

### InlineFoodSearch

Compact inline search for forms:

```tsx
import { InlineFoodSearch } from '@/components/label-maker'

<InlineFoodSearch
  onSelect={(food) => setSelectedFood(food)}
/>
```

## 🗃️ Database Schema

Key fields in `foundation_foods` table:

```sql
-- Source tracking
source_db VARCHAR(30)         -- 'usda_sr', 'uk_cofid', etc.
source_id VARCHAR(100)        -- Original ID
source_version VARCHAR(50)    -- Dataset version

-- Identification
description_en TEXT           -- English name
description_ar TEXT           -- Arabic name (GCC)
food_group VARCHAR(100)       -- Standardized category

-- Core Nutrients (per 100g)
energy_kcal DECIMAL(10,2)
protein_g DECIMAL(10,3)
total_fat_g DECIMAL(10,3)
carbohydrate_g DECIMAL(10,3)
sodium_mg DECIMAL(10,3)
-- ... 30+ nutrient fields

-- Raw Data
raw_nutrients JSONB           -- All original values
raw_metadata JSONB            -- Source metadata

-- GCC-Specific
halal_status VARCHAR(20)      -- 'halal', 'haram', etc.
common_allergens TEXT[]       -- Allergen codes

-- Search
search_vector TSVECTOR        -- Full-text search
```

## 🔄 Adding New Data Sources

1. Create parser in `lib/label-maker/etl/parsers/`
2. Add nutrient mappings to `nutrient-mapper.ts`
3. Register in `etl/index.ts`
4. Run ETL pipeline

Example parser structure:

```typescript
export async function parseMySource(dataDir: string): Promise<ParserResult> {
  // Read source files
  // Map to UnifiedFoundationFood format
  // Return parsed foods with stats
}
```

## 📈 Performance

- **Full-text search**: PostgreSQL `tsvector` with weighted ranking
- **Trigram index**: Fuzzy matching for typos
- **Batch inserts**: 500 records per batch
- **Query time**: <100ms for typical searches

## 🛠️ Troubleshooting

### "No foods found"

1. Check if database is populated: `/api/foods/search?action=stats`
2. Run ETL pipeline if empty
3. Check USDA API key for fallback

### ETL Errors

1. Verify file paths in `data/nutrition-datasets/`
2. Check CSV/Excel format matches expected structure
3. Review parser logs for specific errors

### Search Performance

1. Verify indexes exist in Supabase
2. Check `search_vector` column is populated
3. Consider adding composite indexes for common queries

## 📚 References

- [USDA FoodData Central](https://fdc.nal.usda.gov/)
- [UK CoFID](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid)
- [Canadian Nutrient File](https://food-nutrition.canada.ca/cnf-fce/)
- [FAO/INFOODS](https://www.fao.org/infoods/)

