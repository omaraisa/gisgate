#!/usr/bin/env node

import { program } from 'commander';
import { WordPressMigrator } from '../app/lib/wordpress-migrator.js';

program
  .name('wp-migrator')
  .description('Migrate WordPress articles to PostgreSQL database')
  .version('1.0.0');

program
  .command('migrate')
  .description('Migrate articles from WordPress site')
  .requiredOption('-u, --url <url>', 'WordPress site URL')
  .option('-b, --batch-size <number>', 'Number of posts per batch', '10')
  .option('-d, --delay <number>', 'Delay between requests in ms', '1000')
  .option('--no-images', 'Skip image migration')
  .option('--overwrite', 'Overwrite existing articles')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    console.log('🚀 Starting WordPress migration...');
    console.log(`URL: ${options.url}`);
    console.log(`Batch size: ${options.batchSize}`);
    console.log(`Delay: ${options.delay}ms`);
    console.log(`Include images: ${options.images}`);
    console.log(`Overwrite existing: ${options.overwrite}`);
    
    try {
      const migrator = new WordPressMigrator({
        wordpressUrl: options.url,
        batchSize: parseInt(options.batchSize),
        delayBetweenRequests: parseInt(options.delay),
        includeImages: options.images,
        overwriteExisting: options.overwrite
      });

      // Test connection first
      const isConnected = await migrator.testConnection();
      if (!isConnected) {
        console.error('❌ Cannot connect to WordPress site');
        process.exit(1);
      }

      console.log('✅ Connection successful');

      // Start migration
      const stats = await migrator.migrate();
      
      console.log('\n📊 Migration Statistics:');
      console.log(`Total posts: ${stats.totalPosts}`);
      console.log(`Successful imports: ${stats.successfulImports}`);
      console.log(`Failed imports: ${stats.failedImports}`);
      console.log(`Skipped posts: ${stats.skippedPosts}`);
      
      if (stats.errors.length > 0) {
        console.log('\n❌ Errors:');
        stats.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      const duration = stats.endTime 
        ? new Date(stats.endTime).getTime() - new Date(stats.startTime).getTime()
        : 0;
      console.log(`\n⏱️ Duration: ${Math.round(duration / 1000)}s`);
      
      if (stats.failedImports > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test connection to WordPress site')
  .requiredOption('-u, --url <url>', 'WordPress site URL')
  .action(async (options) => {
    try {
      const migrator = new WordPressMigrator({ wordpressUrl: options.url });
      
      console.log(`🔄 Testing connection to: ${options.url}`);
      
      const isConnected = await migrator.testConnection();
      if (isConnected) {
        console.log('✅ Connection successful');
        
        const siteInfo = await migrator.getSiteInfo();
        if (siteInfo) {
          console.log('\n📊 Site Information:');
          if (siteInfo.name) console.log(`Name: ${siteInfo.name}`);
          if (siteInfo.description) console.log(`Description: ${siteInfo.description}`);
          if (siteInfo.url) console.log(`URL: ${siteInfo.url}`);
        }
      } else {
        console.error('❌ Connection failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Test failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('preview')
  .description('Preview posts that would be migrated')
  .requiredOption('-u, --url <url>', 'WordPress site URL')
  .option('-n, --number <number>', 'Number of posts to preview', '5')
  .action(async (options) => {
    try {
      const response = await fetch(`${options.url}/wp-json/wp/v2/posts?per_page=${options.number}&status=publish,draft&_embed`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
      }
      
      const posts = await response.json();
      
      console.log(`📋 Preview of ${posts.length} posts from ${options.url}:\n`);
      
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title.rendered}`);
        console.log(`   Slug: ${post.slug}`);
        console.log(`   Status: ${post.status}`);
        console.log(`   Date: ${new Date(post.date).toLocaleDateString()}`);
        console.log(`   Excerpt: ${post.excerpt.rendered?.replace(/<[^>]*>/g, '').substring(0, 100)}...`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Preview failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();