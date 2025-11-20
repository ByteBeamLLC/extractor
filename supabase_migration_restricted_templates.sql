-- Migration: Add domain-restricted and email-restricted template access
-- This allows sharing templates with users from specific email domains or specific email addresses

-- Add allowed_domains column to schema_templates table
ALTER TABLE schema_templates 
ADD COLUMN IF NOT EXISTS allowed_domains text[];

-- Add allowed_emails column to schema_templates table
ALTER TABLE schema_templates 
ADD COLUMN IF NOT EXISTS allowed_emails text[];

-- Create helper function to get user email (security definer to access auth.users)
CREATE OR REPLACE FUNCTION get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT LOWER(email::text) FROM auth.users WHERE id = user_uuid;
$$;

-- Drop ALL existing RLS policies to ensure clean slate
DROP POLICY IF EXISTS "Templates are user-scoped" ON schema_templates;
DROP POLICY IF EXISTS "Templates are accessible" ON schema_templates;
DROP POLICY IF EXISTS "Templates are user-owned for modifications" ON schema_templates;
DROP POLICY IF EXISTS "Templates are user-owned for updates" ON schema_templates;
DROP POLICY IF EXISTS "Templates are user-owned for deletion" ON schema_templates;

-- Create new policy for SELECT operations that includes domain and email checking
CREATE POLICY "Templates are accessible"
  ON schema_templates FOR SELECT
  USING (
    -- User must be logged in (auth.uid() IS NOT NULL)
    auth.uid() IS NOT NULL
    AND (
      -- User owns the template
      auth.uid() = user_id 
      OR 
      -- Template has no restrictions (available to all logged-in users)
      (
        (allowed_domains IS NULL OR allowed_domains = '{}')
        AND
        (allowed_emails IS NULL OR allowed_emails = '{}')
      )
      OR 
      -- User's email domain matches one of the allowed domains
      (
        allowed_domains IS NOT NULL 
        AND allowed_domains != '{}'
        AND EXISTS (
          SELECT 1 
          FROM unnest(allowed_domains) AS domain
          WHERE LOWER(domain) = LOWER(split_part(get_user_email(auth.uid()), '@', 2))
        )
      )
      OR
      -- User's email matches one of the allowed emails
      (
        allowed_emails IS NOT NULL 
        AND allowed_emails != '{}'
        AND EXISTS (
          SELECT 1 
          FROM unnest(allowed_emails) AS email
          WHERE LOWER(email) = get_user_email(auth.uid())
        )
      )
    )
  );

-- Users can still create/update/delete only their own templates
CREATE POLICY "Templates are user-owned for modifications"
  ON schema_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Templates are user-owned for updates"
  ON schema_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Templates are user-owned for deletion"
  ON schema_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON COLUMN schema_templates.allowed_domains IS 
  'Array of email domains that can access this template. NULL or empty array means no domain restriction.';

COMMENT ON COLUMN schema_templates.allowed_emails IS 
  'Array of specific email addresses that can access this template. NULL or empty array means no email restriction.';

