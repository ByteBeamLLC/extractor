# Admin Setup Guide - Domain-Restricted Templates

This guide explains how to set up domain-restricted schema templates and invite users for the comprehensive invoice schema.

## Prerequisites

1. Access to Supabase Dashboard
2. Admin API key configured in environment variables
3. Service role key for Supabase

## Environment Variables

Add these to your `.env.local`:

```bash
# Admin API key for invitation endpoints
ADMIN_API_KEY=your-secure-admin-key-here

# Supabase service role key (from Supabase Dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site URL for redirect
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Step 1: Run Database Migration

Execute the migration SQL in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard > SQL Editor
# Copy and run: supabase_migration_restricted_templates.sql
```

This will:
- Add `allowed_domains` column to `schema_templates` table
- Update RLS policies to check domain access
- Allow domain-restricted template sharing

## Step 2: Invite Users

Use the admin API to send invitations to authorized email addresses.

### Using cURL:

```bash
curl -X POST http://localhost:3000/api/admin/invite-user \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: your-admin-api-key" \
  -d '{"email": "user@bytebeam.co"}'
```

### Using JavaScript/Node:

```javascript
const response = await fetch('https://your-domain.com/api/admin/invite-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-api-key': process.env.ADMIN_API_KEY
  },
  body: JSON.stringify({
    email: 'user@bytebeam.co'
  })
});

const result = await response.json();
console.log(result);
```

### Response:

```json
{
  "success": true,
  "message": "Invitation sent to user@bytebeam.co",
  "data": {
    "email": "user@bytebeam.co",
    "invited_at": "2025-01-15T10:30:00.000Z"
  }
}
```

## Step 3: Create Shared Template

Create the comprehensive invoice template with domain restrictions.

### Option A: Using the API

```bash
curl -X POST http://localhost:3000/api/admin/create-shared-template \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: your-admin-api-key" \
  -d '{
    "templateId": "comprehensive-invoice",
    "userId": "uuid-of-authorized-user",
    "allowedDomains": ["bytebeam.co", "mhaddad.com.jo"]
  }'
```

### Option B: Directly in Supabase SQL Editor

```sql
-- First, get a user ID from one of the authorized domains
SELECT id, email FROM auth.users 
WHERE email LIKE '%@bytebeam.co' OR email LIKE '%@mhaddad.com.jo'
LIMIT 1;

-- Then insert the template (replace USER_ID with actual UUID)
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
  'USER_ID',
  'Comprehensive Invoice Schema (MHaddad & ByteBeam)',
  'Unified schema for all invoice/document types - Restricted Access',
  'standard',
  '[]'::jsonb, -- Fields will be populated from static template
  ARRAY['bytebeam.co', 'mhaddad.com.jo'],
  NOW(),
  NOW()
);
```

## Step 4: User Invitation Flow

When a user receives an invitation:

1. **Email Received**: User gets invitation email from Supabase
2. **Click Link**: User clicks "Accept Invitation" link in email
3. **Set Password**: User is redirected to set their password
4. **Email Confirmed**: Email is automatically confirmed
5. **Access Granted**: User can now log in and access domain-restricted templates

## Step 5: Verify Access

### Test Template Access:

1. Log in as user from authorized domain (@bytebeam.co or @mhaddad.com.jo)
2. Navigate to template selector
3. Verify "Comprehensive Invoice Schema" appears
4. Log in as user from different domain
5. Verify template does NOT appear

### SQL Query to Check:

```sql
-- View all templates with their access restrictions
SELECT 
  st.id,
  st.name,
  st.allowed_domains,
  u.email as owner_email
FROM schema_templates st
JOIN auth.users u ON st.user_id = u.id
ORDER BY st.created_at DESC;
```

## Allowed Email Domains

Currently configured domains:
- `bytebeam.co`
- `mhaddad.com.jo`

To add more domains, update the `allowed_domains` array in the database or when creating templates.

## Security Notes

1. **Admin API Key**: Keep this secret and rotate regularly
2. **Service Role Key**: Never expose in client-side code
3. **RLS Policies**: Database-level security ensures domain restrictions
4. **Invitation Expiry**: Supabase invitations expire after 24 hours by default
5. **Rate Limiting**: Consider adding rate limiting to invitation endpoint

## Troubleshooting

### User can't see shared template:

```sql
-- Check user's email domain
SELECT email, split_part(email, '@', 2) as domain
FROM auth.users
WHERE id = 'USER_ID';

-- Check template's allowed domains
SELECT name, allowed_domains
FROM schema_templates
WHERE id = 'TEMPLATE_ID';
```

### Invitation not received:

1. Check spam folder
2. Verify email in Supabase Auth > Users
3. Check Supabase logs for SMTP errors
4. Resend invitation using the API

### RLS Policy Issues:

```sql
-- Test policy manually
SET request.jwt.claims.sub = 'USER_ID';
SELECT * FROM schema_templates; -- Should only see allowed templates
```

## Updating Allowed Domains

To change which domains can access a template:

```sql
UPDATE schema_templates
SET allowed_domains = ARRAY['new-domain.com', 'another-domain.com']
WHERE id = 'TEMPLATE_ID';
```

## Removing Domain Restrictions

To make a template available to all users:

```sql
UPDATE schema_templates
SET allowed_domains = NULL
WHERE id = 'TEMPLATE_ID';
```

