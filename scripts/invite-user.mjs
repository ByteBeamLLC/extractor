#!/usr/bin/env node

/**
 * Script to invite a user to the platform
 * Usage: node scripts/invite-user.mjs user@bytebeam.co
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

async function inviteUser(email) {
  if (!email) {
    console.error('❌ Error: Email address is required');
    console.log('Usage: node scripts/invite-user.mjs user@domain.com');
    process.exit(1);
  }

  console.log(`📧 Sending invitation to: ${email}`);
  console.log(`🔗 API URL: ${API_URL}/api/admin/invite-user`);
  console.log('');

  try {
    const response = await fetch(`${API_URL}/api/admin/invite-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-api-key': ADMIN_API_KEY,
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to send invitation:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${result.error || 'Unknown error'}`);
      process.exit(1);
    }

    console.log('✅ Invitation sent successfully!');
    console.log('');
    console.log('Details:');
    console.log(`   Email: ${result.data?.email || email}`);
    console.log(`   Invited At: ${result.data?.invited_at || 'N/A'}`);
    console.log('');
    console.log('📬 User will receive an email with setup instructions.');
    
  } catch (error) {
    console.error('❌ Error sending invitation:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];
inviteUser(email);

