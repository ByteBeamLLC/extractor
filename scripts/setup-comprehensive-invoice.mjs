#!/usr/bin/env node

/**
 * Complete setup script for comprehensive invoice template
 * This creates the template in the database with domain restrictions
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { STATIC_SCHEMA_TEMPLATES } from '../lib/schema-templates.js';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ALLOWED_DOMAINS = ['bytebeam.co', 'mhaddad.com.jo'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase configuration');
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

async function setupComprehensiveInvoiceTemplate() {
  console.log('🎯 Setting up Comprehensive Invoice Template with Domain Restrictions\n');

  // Create Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Find the comprehensive invoice template
  const template = STATIC_SCHEMA_TEMPLATES.find((t) => t.id === 'comprehensive-invoice');
  if (!template) {
    console.error('❌ Error: Comprehensive invoice template not found in static templates');
    process.exit(1);
  }

  console.log('✅ Template found in code');
  console.log(`   Name: ${template.name}`);
  console.log(`   Fields: ${template.fields.length}`);
  console.log('');

  // Get admin user (first user with @bytebeam.co or @mhaddad.com.jo domain)
  console.log('🔍 Finding admin user...');
  const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    process.exit(1);
  }

  const adminUser = users?.users.find((user) => {
    const domain = user.email?.split('@')[1]?.toLowerCase();
    return domain && ALLOWED_DOMAINS.includes(domain);
  });

  if (!adminUser) {
    console.error('❌ No admin user found with allowed domain');
    console.error('   Please invite a user with @bytebeam.co or @mhaddad.com.jo domain first');
    console.error('   Run: node scripts/invite-user.mjs user@bytebeam.co');
    process.exit(1);
  }

  console.log(`✅ Admin user found: ${adminUser.email}`);
  console.log('');

  // Check if template already exists
  console.log('🔍 Checking if template already exists...');
  const { data: existingTemplates } = await supabaseAdmin
    .from('schema_templates')
    .select('id, name, allowed_domains')
    .eq('name', template.name)
    .maybeSingle();

  if (existingTemplates) {
    console.log('⚠️  Template already exists!');
    console.log(`   ID: ${existingTemplates.id}`);
    console.log(`   Allowed Domains: ${existingTemplates.allowed_domains?.join(', ') || 'None'}`);
    console.log('');
    console.log('Updating with current configuration...');
    
    const { error: updateError } = await supabaseAdmin
      .from('schema_templates')
      .update({
        fields: template.fields,
        allowed_domains: ALLOWED_DOMAINS,
        description: template.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingTemplates.id);

    if (updateError) {
      console.error('❌ Error updating template:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Template updated successfully!');
    console.log('');
    console.log('The comprehensive invoice template is now restricted to:');
    ALLOWED_DOMAINS.forEach(domain => console.log(`   - @${domain}`));
    console.log('');
    console.log('📝 Users from these domains will see this template when they log in.');
    return;
  }

  // Create new template
  console.log('📝 Creating new template in database...');
  const now = new Date().toISOString();
  const payload = {
    id: `shared-comprehensive-invoice-${Date.now()}`,
    user_id: adminUser.id,
    name: template.name,
    description: template.description,
    agent_type: template.agentType,
    fields: template.fields,
    allowed_domains: ALLOWED_DOMAINS,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from('schema_templates')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating template:', error.message);
    process.exit(1);
  }

  console.log('✅ Template created successfully!');
  console.log('');
  console.log('Template Details:');
  console.log(`   ID: ${data.id}`);
  console.log(`   Name: ${data.name}`);
  console.log(`   Owner: ${adminUser.email}`);
  console.log(`   Allowed Domains: ${data.allowed_domains.join(', ')}`);
  console.log('');
  console.log('🎉 The comprehensive invoice template is now:');
  console.log('   ✅ Restricted to users from @bytebeam.co and @mhaddad.com.jo');
  console.log('   ✅ Automatically visible to authorized users');
  console.log('   ✅ Hidden from all other users');
  console.log('');
  console.log('Test it by logging in as a user from one of these domains!');
}

setupComprehensiveInvoiceTemplate().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

