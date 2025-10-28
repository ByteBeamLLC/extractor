#!/usr/bin/env node

/**
 * Script to create a shared template with domain restrictions
 * Usage: node scripts/create-shared-template.mjs <templateId> <userId>
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key-change-in-production';
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ALLOWED_DOMAINS = ['bytebeam.co', 'mhaddad.com.jo'];

async function createSharedTemplate(templateId, userId) {
  if (!templateId || !userId) {
    console.error('❌ Error: templateId and userId are required');
    console.log('');
    console.log('Usage: node scripts/create-shared-template.mjs <templateId> <userId>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/create-shared-template.mjs comprehensive-invoice 123e4567-e89b-12d3-a456-426614174000');
    console.log('');
    console.log('Available template IDs:');
    console.log('  - comprehensive-invoice');
    console.log('  - invoice-nested');
    console.log('  - po-simple');
    process.exit(1);
  }

  console.log(`📋 Creating shared template...`);
  console.log(`   Template ID: ${templateId}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Allowed Domains: ${ALLOWED_DOMAINS.join(', ')}`);
  console.log('');

  try {
    const response = await fetch(`${API_URL}/api/admin/create-shared-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-api-key': ADMIN_API_KEY,
      },
      body: JSON.stringify({
        templateId,
        userId,
        allowedDomains: ALLOWED_DOMAINS,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to create shared template:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${result.error || 'Unknown error'}`);
      if (result.existing) {
        console.log('');
        console.log('   Existing template found:');
        console.log(`   ID: ${result.existing.id}`);
        console.log(`   Name: ${result.existing.name}`);
      }
      process.exit(1);
    }

    console.log('✅ Shared template created successfully!');
    console.log('');
    console.log('Details:');
    console.log(`   ID: ${result.data?.id || 'N/A'}`);
    console.log(`   Name: ${result.data?.name || 'N/A'}`);
    console.log(`   Allowed Domains: ${result.data?.allowed_domains?.join(', ') || 'N/A'}`);
    console.log(`   Created At: ${result.data?.created_at || 'N/A'}`);
    console.log('');
    console.log('🎉 Users with emails from allowed domains can now access this template!');
    
  } catch (error) {
    console.error('❌ Error creating shared template:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// Get arguments from command line
const templateId = process.argv[2];
const userId = process.argv[3];
createSharedTemplate(templateId, userId);

