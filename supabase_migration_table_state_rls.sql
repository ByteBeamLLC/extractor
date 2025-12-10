-- Migration: Update RLS policies for table_state column access
-- This ensures users can access table_state for schemas they own
-- and prevents 406 errors in production

-- The existing "Schemas are user-scoped" policy should already handle table_state access
-- This migration serves to document and verify the expected behavior

-- Verify RLS is enabled on schemas table (should already be enabled)
ALTER TABLE schemas ENABLE ROW LEVEL SECURITY;

-- The existing policy should look like this:
-- CREATE POLICY "Schemas are user-scoped"
--   ON schemas FOR ALL
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- If you need to support public/shared schemas in the future, you can add:
-- CREATE POLICY "Public schemas are readable"
--   ON schemas FOR SELECT
--   USING (is_public = true);
-- (Note: You would need to add an is_public boolean column first)

-- Verify the table_state column exists with proper defaults
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schemas' AND column_name = 'table_state'
  ) THEN
    ALTER TABLE schemas ADD COLUMN table_state JSONB DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN schemas.table_state IS 'Stores table UI state including sorting, filters, column order, pinning, visibility, and sizes';
  END IF;
END $$;

-- Ensure the GIN index exists for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_schemas_table_state ON schemas USING gin (table_state);

-- Grant necessary permissions (if using service role keys in some contexts)
-- This ensures the anon role can attempt to read (will be filtered by RLS)
GRANT SELECT ON schemas TO anon;
GRANT SELECT ON schemas TO authenticated;

-- For authenticated users who own schemas, allow updates
GRANT UPDATE (table_state) ON schemas TO authenticated;

COMMENT ON TABLE schemas IS 'User schemas with RLS enabled. Users can only access schemas they own (user_id = auth.uid())';

