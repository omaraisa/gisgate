#!/usr/bin/env node

// Test script for WordPress migration system
import { WordPressMigrator } from '../app/lib/wordpress-migrator.js';

async function testMigrationSystem() {
  console.log('🧪 Testing WordPress Migration System...\n');

  // Test with a popular WordPress site that has REST API enabled
  const testSites = [
    'https://techcrunch.com',
    'https://wordpress.org/news',
    'https://make.wordpress.org/core'
  ];

  for (const siteUrl of testSites) {
    console.log(`🔍 Testing: ${siteUrl}`);
    
    try {
      const migrator = new WordPressMigrator({ wordpressUrl: siteUrl });
      
      // Test connection
      const isConnected = await migrator.testConnection();
      if (isConnected) {
        console.log('✅ Connection successful');
        
        // Get site info
        const siteInfo = await migrator.getSiteInfo();
        if (siteInfo && siteInfo.name) {
          console.log(`📊 Site: ${siteInfo.name}`);
        }
        
        // Test fetching posts preview
        try {
          const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts?per_page=3`);
          if (response.ok) {
            const posts = await response.json();
            console.log(`📄 Found ${posts.length} sample posts`);
            
            posts.forEach((post, index) => {
              console.log(`  ${index + 1}. ${post.title.rendered} (${post.status})`);
            });
          }
        } catch (error) {
          console.log('⚠️  Could not fetch posts preview');
        }
        
        console.log('✅ Test passed for this site\n');
      } else {
        console.log('❌ Connection failed\n');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('🎉 Migration system tests completed!');
  console.log('\n📝 To use the system:');
  console.log('1. Web UI: http://localhost:3000/migrate');
  console.log('2. CLI: npm run migrate:test -- -u https://your-site.com');
  console.log('3. API: POST /api/wordpress-migrate');
}

// Run the test
testMigrationSystem().catch(console.error);