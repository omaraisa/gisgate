#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCleanupOnOneArticle() {
  try {
    console.log('🧪 Testing cleanup on ONE article first...\n');

    // Get one specific article to test
    const article = await prisma.article.findFirst({
      where: {
        slug: 'تكامل-gis-مع-الطائرات-بدون-طيار-الدرونز'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true
      }
    });

    if (!article) {
      console.log('❌ Test article not found. Please run migration first.');
      return;
    }

    console.log(`📄 Testing article: ${article.title}`);
    console.log(`📏 Original content length: ${article.content.length} characters\n`);

    // Show first 500 characters of original content
    console.log('🔍 ORIGINAL CONTENT (first 500 chars):');
    console.log('='.repeat(50));
    console.log(article.content.substring(0, 500) + '...\n');

    // Apply smart cleanup
    const cleanedContent = smartCleanContent(article.content);
    
    console.log(`📏 Cleaned content length: ${cleanedContent.length} characters\n`);
    
    // Show first 500 characters of cleaned content
    console.log('✨ CLEANED CONTENT (first 500 chars):');
    console.log('=' .repeat(50));
    console.log(cleanedContent.substring(0, 500) + '...\n');

    // Show what was removed
    const removedLength = article.content.length - cleanedContent.length;
    console.log(`📊 Summary:`);
    console.log(`   - Removed: ${removedLength} characters`);
    console.log(`   - Kept: ${cleanedContent.length} characters`);
    console.log(`   - Reduction: ${((removedLength / article.content.length) * 100).toFixed(1)}%`);

    if (removedLength > article.content.length * 0.8) {
      console.log('\n⚠️  WARNING: More than 80% of content would be removed!');
      console.log('⚠️  This suggests the cleanup is too aggressive.');
    } else if (cleanedContent.length > 200) {
      console.log('\n✅ Cleanup looks reasonable. Content is preserved.');
      console.log('\n🔄 To apply this cleanup to ALL articles, run:');
      console.log('   node scripts/apply-smart-cleanup.mjs');
    } else {
      console.log('\n❌ Cleanup removed too much content. Need to adjust the algorithm.');
    }

  } catch (error) {
    console.error('❌ Error during test cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function smartCleanContent(content) {
  if (!content) return content;

  let cleaned = content;

  // CONSERVATIVE cleanup - only remove obvious WordPress elements
  
  // 1. Remove duplicate title at the very beginning (if it's repeated)
  cleaned = cleaned.replace(/^[^<]*(?:مقالات|غير مصنف|ArcGIS Online)[^<]*/, '');
  
  // 2. Remove date/view/share lines that appear before content
  cleaned = cleaned.replace(/^\d+\s*(فبراير|يناير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s*\d+/m, '');
  cleaned = cleaned.replace(/^\d+\s*مشاهدة/m, '');
  cleaned = cleaned.replace(/^مشاركة$/m, '');
  
  // 3. Remove content AFTER "مشاركة المقالة" (keep everything before it)
  const shareIndex = cleaned.search(/مشاركة\s*المقالة/i);
  if (shareIndex > 200) { // Only if there's substantial content before it
    cleaned = cleaned.substring(0, shareIndex);
  }
  
  // 4. Remove WordPress footer elements at the end
  cleaned = cleaned.replace(/(كل\s*الدروس|اقرأ\s*مقالة|Edit\s*Template|اشترك\s*معنا)[\s\S]*$/gi, '');
  
  // 5. Remove empty paragraphs and extra whitespace
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned.trim();
}

// Run the test
testCleanupOnOneArticle();