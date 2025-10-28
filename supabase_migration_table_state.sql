-- Migration: Add table_state column to schemas table
-- This stores per-schema table configurations for sorting, filtering, column order, pinning, etc.

-- Add table_state column
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS table_state JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN schemas.table_state IS 'Stores table UI state including sorting, filters, column order, pinning, visibility, and sizes';

-- Create index for faster JSON queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_schemas_table_state ON schemas USING gin (table_state);

