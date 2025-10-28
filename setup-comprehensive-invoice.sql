-- Set up Comprehensive Invoice Template with Domain Restrictions
-- Run this in Supabase SQL Editor

-- Step 1: First, get a user ID that has @bytebeam.co or @mhaddad.com.jo domain
-- (This will be the owner of the template)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find an admin user with allowed domain
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE split_part(email, '@', 2) IN ('bytebeam.co', 'mhaddad.com.jo')
  LIMIT 1;

  -- If no admin user exists, create a template anyway (you'll assign it to a user later)
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'No user found with @bytebeam.co or @mhaddad.com.jo domain';
    RAISE NOTICE 'Creating template without owner. You can update it later.';
  END IF;

  -- Step 2: Check if template already exists
  IF EXISTS (
    SELECT 1 FROM schema_templates 
    WHERE name = 'Comprehensive Invoice Schema'
  ) THEN
    RAISE NOTICE 'Template already exists. Updating it...';
    
    -- Update existing template
    UPDATE schema_templates
    SET 
      allowed_domains = ARRAY['bytebeam.co', 'mhaddad.com.jo'],
      description = 'Unified schema for all invoice/document types - Restricted Access',
      updated_at = NOW()
    WHERE name = 'Comprehensive Invoice Schema';
    
    RAISE NOTICE '✅ Template updated successfully';
  ELSE
    -- Step 3: Create the comprehensive invoice template
    INSERT INTO schema_templates (
      id,
      user_id,
      name,
      description,
      agent_type,
      fields,
      allowed_domains,
      created_at,
      updated_at
    ) VALUES (
      'shared-comprehensive-invoice-' || gen_random_uuid(),
      COALESCE(admin_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
      'Comprehensive Invoice Schema',
      'Unified schema for all invoice/document types - Restricted Access',
      'standard',
      '[]'::jsonb,
      ARRAY['bytebeam.co', 'mhaddad.com.jo'],
      NOW(),
      NOW()
    );
    
    IF admin_user_id IS NOT NULL THEN
      RAISE NOTICE '✅ Template created successfully for user: %', admin_user_id;
    ELSE
      RAISE NOTICE '⚠️  Template created but needs owner assignment';
      RAISE NOTICE 'Run this after creating a user:';
      RAISE NOTICE 'UPDATE schema_templates SET user_id = ''YOUR_USER_ID'' WHERE name = ''Comprehensive Invoice Schema'';';
    END IF;
  END IF;
END $$;

-- Verify the setup
SELECT 
  id,
  name,
  user_id,
  allowed_domains,
  description,
  created_at
FROM schema_templates
WHERE name = 'Comprehensive Invoice Schema';

-- Show current users with allowed domains
SELECT 
  id,
  email,
  split_part(email, '@', 2) as domain,
  created_at
FROM auth.users
WHERE split_part(email, '@', 2) IN ('bytebeam.co', 'mhaddad.com.jo');

