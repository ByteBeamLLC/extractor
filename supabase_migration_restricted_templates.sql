-- Migration: Add domain-restricted template access
-- This allows sharing templates with users from specific email domains

-- Add allowed_domains column to schema_templates table
ALTER TABLE schema_templates 
ADD COLUMN IF NOT EXISTS allowed_domains text[];

-- Drop existing RLS policy
DROP POLICY IF EXISTS "Templates are user-scoped" ON schema_templates;

-- Create new policy for SELECT operations that includes domain checking
CREATE POLICY "Templates are accessible"
  ON schema_templates FOR SELECT
  USING (
    -- User owns the template
    auth.uid() = user_id 
    OR 
    -- Template has no domain restrictions (available to all)
    allowed_domains IS NULL 
    OR
    allowed_domains = '{}'
    OR 
    -- User's email domain matches one of the allowed domains
    (
      SELECT split_part(email, '@', 2) 
      FROM auth.users 
      WHERE id = auth.uid()
    ) = ANY(allowed_domains)
  );

-- Users can still create/update/delete only their own templates
CREATE POLICY "Templates are user-owned for modifications"
  ON schema_templates FOR INSERT
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Templates are user-owned for updates"
  ON schema_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Templates are user-owned for deletion"
  ON schema_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON COLUMN schema_templates.allowed_domains IS 
  'Array of email domains that can access this template. NULL or empty array means available to all users.';

