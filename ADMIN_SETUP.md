# Admin Setup Guide - Domain and Email-Restricted Templates

This guide explains how to set up domain-restricted and email-restricted schema templates and invite users for restricted access.

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
- Add `allowed_emails` column to `schema_templates` table
- Update RLS policies to check domain and email access
- Allow domain-restricted and email-restricted template sharing

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

Create templates with domain or email restrictions.

### Option A: Using the API with Domain Restrictions

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

### Option B: Using the API with Email Restrictions

```bash
curl -X POST http://localhost:3000/api/admin/create-shared-template \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: your-admin-api-key" \
  -d '{
    "templateId": "fmcg-localization",
    "userId": "uuid-of-authorized-user",
    "allowedEmails": ["bazerbachi.8@gmail.com"]
  }'
```

### Option C: Using Both Domain and Email Restrictions

```bash
curl -X POST http://localhost:3000/api/admin/create-shared-template \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: your-admin-api-key" \
  -d '{
    "templateId": "comprehensive-invoice",
    "userId": "uuid-of-authorized-user",
    "allowedDomains": ["bytebeam.co"],
    "allowedEmails": ["special.user@example.com"]
  }'
```

### Option D: Directly in Supabase SQL Editor

```sql
-- First, get a user ID from one of the authorized domains or emails
SELECT id, email FROM auth.users 
WHERE email LIKE '%@bytebeam.co' OR email = 'bazerbachi.8@gmail.com'
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
  allowed_emails,
  created_at,
  updated_at
) VALUES (
  'shared-comprehensive-invoice-' || gen_random_uuid(),
  'USER_ID',
  'Comprehensive Invoice Schema (MHaddad & ByteBeam)',
  'Unified schema for all invoice/document types - Restricted Access',
  'standard',
  '[]'::jsonb, -- Fields will be populated from static template
  ARRAY['bytebeam.co', 'mhaddad.com.jo'], -- Domain restrictions
  NULL, -- No email restrictions
  NOW(),
  NOW()
);
```

## Restriction Types

### Domain-Based Restrictions
- Use `allowedDomains` to restrict access to users from specific email domains
- Example: `["bytebeam.co", "mhaddad.com.jo"]` allows anyone with `@bytebeam.co` or `@mhaddad.com.jo` email
- Good for: Organization-wide access

### Email-Based Restrictions
- Use `allowedEmails` to restrict access to specific email addresses
- Example: `["bazerbachi.8@gmail.com"]` allows only that specific email
- Good for: Individual user access, single-user templates

### Combined Restrictions
- Use both `allowedDomains` AND `allowedEmails` together
- Users matching EITHER restriction will have access (OR logic)
- Good for: Organization access with specific exceptions

## Allowed Email Domains

Currently configured domains:
- `bytebeam.co`
- `mhaddad.com.jo`

## Allowed Specific Emails

Currently configured emails:
- `bazerbachi.8@gmail.com` (FMCG Localization template)

To add more domains or emails, update the arrays when creating templates.

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

