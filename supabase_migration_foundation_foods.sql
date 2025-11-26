-- Migration: Foundation Foods Database
-- This creates the unified schema for storing nutrition data from multiple sources
-- Run this migration in Supabase SQL Editor

-- ============================================
-- DROP EXISTING (if re-running migration)
-- ============================================
-- Uncomment these lines to reset the table:
-- DROP TRIGGER IF EXISTS foundation_foods_search_update ON foundation_foods;
-- DROP FUNCTION IF EXISTS update_foundation_foods_search_vector();
-- DROP TABLE IF EXISTS foundation_foods;

-- ============================================
-- MAIN TABLE: foundation_foods
-- ============================================
CREATE TABLE IF NOT EXISTS foundation_foods (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source tracking
  source_db VARCHAR(30) NOT NULL,      -- 'usda_sr', 'usda_fndds', 'uk_cofid', 'canada_cnf', etc.
  source_id VARCHAR(100) NOT NULL,     -- Original ID from source
  source_version VARCHAR(50),          -- e.g., 'April 2025', 'Release 28'
  
  -- Core identification
  food_code VARCHAR(50),               -- Standardized food code if available
  description_en TEXT NOT NULL,        -- English description
  description_ar TEXT,                 -- Arabic description (for GCC)
  scientific_name TEXT,                -- Botanical/scientific name
  food_group VARCHAR(100),             -- Standardized category
  food_subgroup VARCHAR(100),
  
  -- ============================================
  -- NORMALIZED CORE NUTRIENTS (per 100g)
  -- Common across ALL sources
  -- ============================================
  
  -- Energy
  energy_kcal DECIMAL(10,2),
  energy_kj DECIMAL(10,2),
  
  -- Macronutrients
  protein_g DECIMAL(10,3),
  total_fat_g DECIMAL(10,3),
  carbohydrate_g DECIMAL(10,3),
  
  -- Fat breakdown
  saturated_fat_g DECIMAL(10,3),
  monounsaturated_fat_g DECIMAL(10,3),
  polyunsaturated_fat_g DECIMAL(10,3),
  trans_fat_g DECIMAL(10,3),
  cholesterol_mg DECIMAL(10,3),
  
  -- Carbohydrate breakdown
  dietary_fiber_g DECIMAL(10,3),
  total_sugars_g DECIMAL(10,3),
  added_sugars_g DECIMAL(10,3),
  
  -- Key minerals
  sodium_mg DECIMAL(10,3),
  
  -- ============================================
  -- EXTENDED NUTRIENTS (per 100g)
  -- Not all sources have these - nulls allowed
  -- ============================================
  
  -- Vitamins - Fat soluble
  vitamin_a_mcg_rae DECIMAL(10,3),
  vitamin_d_mcg DECIMAL(10,3),
  vitamin_e_mg DECIMAL(10,3),
  vitamin_k_mcg DECIMAL(10,3),
  
  -- Vitamins - Water soluble
  vitamin_c_mg DECIMAL(10,3),
  thiamin_mg DECIMAL(10,3),
  riboflavin_mg DECIMAL(10,3),
  niacin_mg DECIMAL(10,3),
  vitamin_b6_mg DECIMAL(10,3),
  folate_mcg_dfe DECIMAL(10,3),
  vitamin_b12_mcg DECIMAL(10,3),
  
  -- Minerals
  calcium_mg DECIMAL(10,3),
  iron_mg DECIMAL(10,3),
  magnesium_mg DECIMAL(10,3),
  phosphorus_mg DECIMAL(10,3),
  potassium_mg DECIMAL(10,3),
  zinc_mg DECIMAL(10,3),
  copper_mg DECIMAL(10,3),
  manganese_mg DECIMAL(10,3),
  selenium_mcg DECIMAL(10,3),
  
  -- Other components
  water_g DECIMAL(10,3),
  ash_g DECIMAL(10,3),
  alcohol_g DECIMAL(10,3),
  caffeine_mg DECIMAL(10,3),
  
  -- ============================================
  -- SOURCE-SPECIFIC RAW DATA
  -- Preserved as JSONB for advanced queries
  -- ============================================
  raw_nutrients JSONB DEFAULT '{}'::jsonb,    -- All original nutrient values
  raw_metadata JSONB DEFAULT '{}'::jsonb,     -- Source-specific metadata
  
  -- ============================================
  -- GCC-SPECIFIC FIELDS
  -- ============================================
  halal_status VARCHAR(20) DEFAULT 'unknown', -- 'halal', 'haram', 'mushbooh', 'unknown'
  common_allergens TEXT[] DEFAULT '{}',       -- Array of allergen codes
  
  -- ============================================
  -- SEARCH OPTIMIZATION
  -- ============================================
  search_vector TSVECTOR,
  
  -- ============================================
  -- AUDIT
  -- ============================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one entry per source + source_id
  UNIQUE(source_db, source_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_ff_search ON foundation_foods USING GIN(search_vector);

-- Common query filters
CREATE INDEX IF NOT EXISTS idx_ff_food_group ON foundation_foods(food_group);
CREATE INDEX IF NOT EXISTS idx_ff_source ON foundation_foods(source_db);
CREATE INDEX IF NOT EXISTS idx_ff_halal ON foundation_foods(halal_status);

-- Description search (partial match)
CREATE INDEX IF NOT EXISTS idx_ff_description ON foundation_foods USING GIN(description_en gin_trgm_ops);

-- Food code lookup
CREATE INDEX IF NOT EXISTS idx_ff_food_code ON foundation_foods(food_code) WHERE food_code IS NOT NULL;

-- Composite index for common searches
CREATE INDEX IF NOT EXISTS idx_ff_source_group ON foundation_foods(source_db, food_group);

-- ============================================
-- FULL-TEXT SEARCH TRIGGER
-- ============================================

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_foundation_foods_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.description_en, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.food_group, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.food_subgroup, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.scientific_name, '')), 'D');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert/update
DROP TRIGGER IF EXISTS foundation_foods_search_update ON foundation_foods;
CREATE TRIGGER foundation_foods_search_update
  BEFORE INSERT OR UPDATE ON foundation_foods
  FOR EACH ROW EXECUTE FUNCTION update_foundation_foods_search_vector();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE foundation_foods ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read foundation foods (public data)
CREATE POLICY "Foundation foods are viewable by everyone"
  ON foundation_foods
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert (for admin use)
CREATE POLICY "Authenticated users can insert foundation foods"
  ON foundation_foods
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can update
CREATE POLICY "Authenticated users can update foundation foods"
  ON foundation_foods
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to search foods with ranking
CREATE OR REPLACE FUNCTION search_foundation_foods(
  search_query TEXT,
  source_filter TEXT[] DEFAULT NULL,
  food_group_filter TEXT[] DEFAULT NULL,
  halal_only BOOLEAN DEFAULT FALSE,
  result_limit INTEGER DEFAULT 50,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  source_db VARCHAR,
  source_id VARCHAR,
  description_en TEXT,
  food_group VARCHAR,
  energy_kcal DECIMAL,
  protein_g DECIMAL,
  total_fat_g DECIMAL,
  carbohydrate_g DECIMAL,
  sodium_mg DECIMAL,
  halal_status VARCHAR,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ff.id,
    ff.source_db,
    ff.source_id,
    ff.description_en,
    ff.food_group,
    ff.energy_kcal,
    ff.protein_g,
    ff.total_fat_g,
    ff.carbohydrate_g,
    ff.sodium_mg,
    ff.halal_status,
    ts_rank(ff.search_vector, websearch_to_tsquery('english', search_query)) as rank
  FROM foundation_foods ff
  WHERE 
    (search_query IS NULL OR ff.search_vector @@ websearch_to_tsquery('english', search_query))
    AND (source_filter IS NULL OR ff.source_db = ANY(source_filter))
    AND (food_group_filter IS NULL OR ff.food_group = ANY(food_group_filter))
    AND (NOT halal_only OR ff.halal_status = 'halal')
  ORDER BY rank DESC, ff.description_en
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get food by ID with full nutrition
CREATE OR REPLACE FUNCTION get_foundation_food(food_id UUID)
RETURNS foundation_foods AS $$
  SELECT * FROM foundation_foods WHERE id = food_id;
$$ LANGUAGE sql;

-- Function to get available food groups
CREATE OR REPLACE FUNCTION get_food_groups()
RETURNS TABLE (food_group VARCHAR, count BIGINT) AS $$
  SELECT food_group, COUNT(*) as count
  FROM foundation_foods
  WHERE food_group IS NOT NULL
  GROUP BY food_group
  ORDER BY count DESC;
$$ LANGUAGE sql;

-- Function to get source statistics
CREATE OR REPLACE FUNCTION get_source_stats()
RETURNS TABLE (source_db VARCHAR, count BIGINT, source_version VARCHAR) AS $$
  SELECT source_db, COUNT(*) as count, MAX(source_version) as source_version
  FROM foundation_foods
  GROUP BY source_db
  ORDER BY count DESC;
$$ LANGUAGE sql;

-- ============================================
-- INITIAL DATA: Add common food groups
-- ============================================

-- This is just for reference - actual data comes from ETL
COMMENT ON TABLE foundation_foods IS 'Unified nutrition database containing foods from multiple authoritative sources (USDA, UK CoFID, Canadian CNF, etc.)';

-- ============================================
-- ENABLE EXTENSIONS (if not already enabled)
-- ============================================

-- For fuzzy text search (trigram matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- For UUID generation (usually already enabled)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant read access to anon and authenticated roles
GRANT SELECT ON foundation_foods TO anon;
GRANT SELECT ON foundation_foods TO authenticated;
GRANT INSERT, UPDATE ON foundation_foods TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION search_foundation_foods TO anon;
GRANT EXECUTE ON FUNCTION search_foundation_foods TO authenticated;
GRANT EXECUTE ON FUNCTION get_foundation_food TO anon;
GRANT EXECUTE ON FUNCTION get_foundation_food TO authenticated;
GRANT EXECUTE ON FUNCTION get_food_groups TO anon;
GRANT EXECUTE ON FUNCTION get_food_groups TO authenticated;
GRANT EXECUTE ON FUNCTION get_source_stats TO anon;
GRANT EXECUTE ON FUNCTION get_source_stats TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the migration:
-- SELECT COUNT(*) FROM foundation_foods;
-- SELECT * FROM get_source_stats();
-- SELECT * FROM get_food_groups() LIMIT 20;
-- SELECT * FROM search_foundation_foods('chicken breast', NULL, NULL, FALSE, 10, 0);

