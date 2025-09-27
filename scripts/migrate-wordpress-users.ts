#!/usr/bin/env node

/**
 * WordPress User Migration Script
 *
 * This script helps migrate users from a WordPress database to the GIS Gate system.
 *
 * Usage:
 * 1. Export WordPress users from your WordPress database
 * 2. Run this script with the exported data
 * 3. The script will migrate users to the new system
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { WordPressUserMigrator } from '../lib/wordpress-user-migrator';

interface WordPressUserExport {
  ID: string;
  user_login: string;
  user_email: string;
  user_pass: string;
  user_registered: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  user_url?: string;
  description?: string;
  user_meta?: Record<string, any>;
}

async function migrateFromWordPressJSON(jsonFilePath: string) {
  console.log('🚀 Starting WordPress user migration...');

  try {
    // Read and parse JSON file
    const fs = require('fs');
    const data = fs.readFileSync(jsonFilePath, 'utf8');
    const wpUsers: WordPressUserExport[] = JSON.parse(data);

    console.log(`📊 Found ${wpUsers.length} users to migrate`);

    // Transform to our format
    const transformedUsers = wpUsers.map(user => ({
      id: parseInt(user.ID),
      user_login: user.user_login,
      user_email: user.user_email,
      user_pass: user.user_pass,
      user_registered: user.user_registered,
      display_name: user.display_name,
      first_name: user.first_name,
      last_name: user.last_name,
      user_url: user.user_url,
      description: user.description,
      user_meta: user.user_meta,
    }));

    // Check for unmigrated users
    console.log('🔍 Checking for unmigrated users...');
    const unmigratedUsers = await WordPressUserMigrator.getUnmigratedWordPressUsers(transformedUsers);

    if (unmigratedUsers.length === 0) {
      console.log('✅ All users have already been migrated!');
      return;
    }

    console.log(`📝 Migrating ${unmigratedUsers.length} users...`);

    // Migrate users
    const result = await WordPressUserMigrator.migrateUsers(unmigratedUsers);

    console.log('📈 Migration Results:');
    console.log(`✅ Migrated: ${result.migrated}`);
    console.log(`⏭️  Skipped: ${result.skipped}`);
    console.log(`❌ Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n🚨 Errors:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Get final stats
    const stats = await WordPressUserMigrator.getMigrationStats();
    console.log('\n📊 Final Statistics:');
    console.log(`Total Users: ${stats.totalUsers}`);
    console.log(`WordPress Migrated: ${stats.wordpressUsers}`);
    console.log(`Migration Rate: ${((stats.wordpressUsers / stats.totalUsers) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function migrateFromDatabase(connectionString: string) {
  console.log('🗄️  Direct database migration not implemented yet.');
  console.log('Please export your WordPress users to JSON format and use migrateFromWordPressJSON instead.');
  console.log('\nExample SQL query to export users:');
  console.log(`
SELECT
  u.ID,
  u.user_login,
  u.user_email,
  u.user_pass,
  u.user_registered,
  u.display_name,
  umfn.meta_value as first_name,
  umln.meta_value as last_name,
  umurl.meta_value as user_url,
  umdesc.meta_value as description
FROM wp_users u
LEFT JOIN wp_usermeta umfn ON u.ID = umfn.user_id AND umfn.meta_key = 'first_name'
LEFT JOIN wp_usermeta umln ON u.ID = umln.user_id AND umln.meta_key = 'last_name'
LEFT JOIN wp_usermeta umurl ON u.ID = umurl.user_id AND umurl.meta_key = 'user_url'
LEFT JOIN wp_usermeta umdesc ON u.ID = umdesc.user_id AND umdesc.meta_key = 'description'
  `);
}

// CLI interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('WordPress User Migration Tool');
  console.log('==============================');
  console.log('');
  console.log('Usage:');
  console.log('  npm run migrate-users <json-file>');
  console.log('  node scripts/migrate-wordpress-users.js <json-file>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/migrate-wordpress-users.js wordpress-users.json');
  console.log('');
  console.log('The JSON file should contain an array of WordPress user objects with:');
  console.log('  - ID, user_login, user_email, user_pass, user_registered');
  console.log('  - display_name, first_name, last_name, user_url, description');
  console.log('  - user_meta (optional)');
  process.exit(1);
}

const jsonFilePath = args[0];

if (!jsonFilePath.endsWith('.json')) {
  console.error('❌ Please provide a JSON file path');
  process.exit(1);
}

migrateFromWordPressJSON(jsonFilePath);