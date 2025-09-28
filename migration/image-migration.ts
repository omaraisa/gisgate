import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

// Configuration
const MINIO_CONFIG = {
  endPoint: '13.61.185.194',
  port: 9000,
  useSSL: false,
  accessKey: 'miniomar',
  secretKey: '123wasd#@!WDSA'
};

const BUCKET_NAME = 'images';
const LOCAL_IMAGES_PATH = 'C:\\Users\\GIS_J\\Downloads\\images';
const NEW_DOMAIN = 'http://13.61.185.194:9000';
const OLD_URL_PATTERN = 'http://13.61.185.194/static/image/';

const minioClient = new Minio.Client(MINIO_CONFIG);
const prisma = new PrismaClient();

/**
 * IMAGE MIGRATION SCRIPT
 *
 * This script handles the complete migration of images from local storage to MinIO
 * and updates all database references.
 *
 * Usage:
 * - npm run migrate:images  (full migration)
 * - npm run migrate:images -- --dry-run  (preview only)
 * - npm run migrate:images -- --upload-only  (upload only)
 * - npm run migrate:images -- --update-only  (database update only)
 */

class ImageMigration {
  private dryRun = false;
  private uploadOnly = false;
  private updateOnly = false;

  constructor() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    this.dryRun = args.includes('--dry-run');
    this.uploadOnly = args.includes('--upload-only');
    this.updateOnly = args.includes('--update-only');
  }

  async run(): Promise<void> {
    try {
      console.log('🚀 Starting Image Migration');
      console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}`);
      console.log('');

      if (!this.updateOnly) {
        await this.uploadImages();
      }

      if (!this.uploadOnly) {
        await this.updateDatabaseUrls();
      }

      console.log('✅ Migration completed successfully!');

    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  private async uploadImages(): Promise<void> {
    console.log('📤 Phase 1: Uploading images to MinIO');

    if (!this.dryRun) {
      // Check if bucket exists
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
      if (!bucketExists) {
        await minioClient.makeBucket(BUCKET_NAME);
        console.log(`📦 Created bucket: ${BUCKET_NAME}`);
      }

      // Set public read policy
      const policy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { 'AWS': '*' },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        }]
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`🔓 Set public read policy on bucket: ${BUCKET_NAME}`);
    } else {
      console.log(`📦 Would check/create bucket: ${BUCKET_NAME}`);
      console.log(`🔓 Would set public read policy on bucket: ${BUCKET_NAME}`);
    }

    // Get all files
    const files = this.getAllFiles(LOCAL_IMAGES_PATH);
    console.log(`📁 Found ${files.length} files to upload`);

    if (this.dryRun) {
      console.log('📋 Would upload files:');
      files.slice(0, 5).forEach(file => {
        const relativePath = path.relative(LOCAL_IMAGES_PATH, file).replace(/\\/g, '/');
        console.log(`  ${relativePath}`);
      });
      if (files.length > 5) console.log(`  ... and ${files.length - 5} more`);
      return;
    }

    // Upload files
    let uploaded = 0;
    for (const file of files) {
      await this.uploadFile(file);
      uploaded++;
      if (uploaded % 50 === 0) {
        console.log(`📤 Uploaded ${uploaded}/${files.length} files`);
      }
    }

    console.log(`✅ Successfully uploaded ${uploaded} files`);
    console.log('');
  }

  private async updateDatabaseUrls(): Promise<void> {
    console.log('🔄 Phase 2: Updating database URLs');

    // Find articles with old URLs
    const articles = await prisma.article.findMany({
      where: { content: { contains: OLD_URL_PATTERN } },
      select: { id: true, title: true, content: true }
    });

    console.log(`📄 Found ${articles.length} articles with old image URLs`);

    if (this.dryRun) {
      console.log('📋 Would update articles:');
      articles.slice(0, 3).forEach(article => {
        const matches = article.content.match(new RegExp(`${OLD_URL_PATTERN}[^"\\s]+`, 'g')) || [];
        console.log(`  ${article.title}: ${matches.length} images`);
      });
      if (articles.length > 3) console.log(`  ... and ${articles.length - 3} more articles`);
      return;
    }

    // Update articles
    let updated = 0;
    for (const article of articles) {
      const newContent = article.content.replace(
        new RegExp(OLD_URL_PATTERN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        `${NEW_DOMAIN}/images/`
      );

      if (newContent !== article.content) {
        await prisma.article.update({
          where: { id: article.id },
          data: { content: newContent }
        });
        updated++;
        console.log(`✅ Updated: ${article.title}`);
      }
    }

    console.log(`✅ Successfully updated ${updated} articles`);
    console.log('');
  }

  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async uploadFile(filePath: string): Promise<void> {
    const relativePath = path.relative(LOCAL_IMAGES_PATH, filePath);
    const objectKey = relativePath.replace(/\\/g, '/');

    await minioClient.fPutObject(BUCKET_NAME, objectKey, filePath);
  }
}

// Utility functions for validation and maintenance
export class ImageMigrationUtils {
  static async findImageUrls(): Promise<void> {
    const articles = await prisma.article.findMany({
      select: { id: true, title: true, content: true }
    });

    console.log('🔍 Searching for image references...\n');

    let articlesWithImages = 0;
    let totalMatches = 0;

    for (const article of articles) {
      const hasImages = article.content.includes('/images/') ||
                       article.content.includes('gis-gate.com') ||
                       article.content.includes('localhost:3000');

      if (hasImages) {
        articlesWithImages++;
        console.log(`📄 ${article.title} (ID: ${article.id})`);

        const imageMatches = article.content.match(/\/images\/[^"'\s]+/g) || [];
        const domainMatches = article.content.match(/https?:\/\/[^\/\s]*gis-gate\.com[^"'\s]*/g) || [];
        const localhostMatches = article.content.match(/http:\/\/localhost:3000[^"'\s]*/g) || [];

        [...imageMatches, ...domainMatches, ...localhostMatches].forEach(match => {
          console.log(`    ${match}`);
          totalMatches++;
        });
        console.log('');
      }
    }

    console.log(`📊 Summary: ${articlesWithImages} articles with ${totalMatches} image references`);
  }

  static async validateMigration(): Promise<void> {
    console.log('🔍 Validating migration...\n');

    const articles = await prisma.article.findMany({
      select: { id: true, title: true, content: true }
    });

    let validArticles = 0;
    let invalidArticles = 0;
    let brokenUrls: string[] = [];

    for (const article of articles) {
      const urls = article.content.match(/http:\/\/13\.61\.185\.194:9000\/images\/[^"'\s]+/g) || [];
      let articleValid = true;

      for (const url of urls) {
        // Basic validation - check if URL structure looks correct
        if (!url.includes('/images/')) {
          articleValid = false;
          brokenUrls.push(url);
        }
      }

      if (articleValid && urls.length > 0) {
        validArticles++;
      } else if (urls.length > 0) {
        invalidArticles++;
      }
    }

    console.log(`✅ Valid articles: ${validArticles}`);
    console.log(`❌ Articles with issues: ${invalidArticles}`);

    if (brokenUrls.length > 0) {
      console.log('\n🚨 Broken URLs found:');
      brokenUrls.slice(0, 5).forEach(url => console.log(`  ${url}`));
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new ImageMigration();
  migration.run();
}