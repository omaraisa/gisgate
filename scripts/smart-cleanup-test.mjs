#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function smartCleanWordPressContent() {
  try {
    console.log('🎯 Smart WordPress content cleanup...\n');

    // Test on one article first
    const testArticle = await prisma.article.findFirst({
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

    if (!testArticle) {
      console.log('❌ Test article not found.');
      return;
    }

    console.log(`🧪 Testing on: ${testArticle.title}`);
    console.log(`📏 Original length: ${testArticle.content.length} characters`);

    const cleanedContent = extractArticleContent(testArticle.content);
    
    console.log(`📏 Cleaned length: ${cleanedContent.length} characters`);
    console.log(`📊 Reduction: ${((testArticle.content.length - cleanedContent.length) / testArticle.content.length * 100).toFixed(1)}%\n`);

    // Show preview of cleaned content
    console.log('✨ CLEANED CONTENT PREVIEW (first 1000 chars):');
    console.log('='.repeat(60));
    console.log(cleanedContent.substring(0, 1000));
    console.log('...\n');

    console.log('🔍 CLEANED CONTENT END (last 500 chars):');
    console.log('='.repeat(50));
    console.log(cleanedContent.substring(cleanedContent.length - 500));
    console.log('\n');

    // Ask for confirmation
    if (cleanedContent.length > 1000 && cleanedContent.length < testArticle.content.length * 0.8) {
      console.log('✅ Cleanup looks good!');
      console.log('\n❓ Do you want to apply this cleanup to ALL 44 articles?');
      console.log('   To proceed, run: node scripts/apply-final-cleanup.mjs');
      
      // Save the test result
      await prisma.article.update({
        where: { id: testArticle.id },
        data: { content: cleanedContent }
      });
      
      console.log('✅ Applied cleanup to test article. Check it at:');
      console.log(`   http://localhost:3000/articles/${testArticle.slug}`);
      
    } else {
      console.log('❌ Cleanup needs adjustment - content too short or too long');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function extractArticleContent(rawContent) {
  // Find the start of actual article content
  const startMarkers = [
    /في ظل التطور السريع/,
    /مقدمة[\s\S]*?في ظل/,
    /يتيح تكامل/,
    /تعد الطائرات بدون طيار/,
    /أصبح التكامل/
  ];

  let contentStart = -1;
  for (const marker of startMarkers) {
    const match = rawContent.search(marker);
    if (match !== -1) {
      contentStart = match;
      break;
    }
  }

  // Find the end of article content (before footer)
  const endMarkers = [
    /مشاركة المقالة/,
    /كل الدروس/,
    /اقرأ مقالة/
  ];

  let contentEnd = rawContent.length;
  for (const marker of endMarkers) {
    const match = rawContent.search(marker);
    if (match !== -1 && match < contentEnd) {
      contentEnd = match;
    }
  }

  // Extract the content section
  let articleContent = '';
  if (contentStart !== -1) {
    articleContent = rawContent.substring(contentStart, contentEnd);
  } else {
    // Fallback - just remove footer
    articleContent = rawContent.substring(0, contentEnd);
  }

  // Clean up the extracted content
  articleContent = cleanExtractedContent(articleContent);

  return articleContent;
}

function cleanExtractedContent(content) {
  let cleaned = content;

  // Remove Elementor wrapper classes while keeping content
  cleaned = cleaned.replace(/<div[^>]*elementor[^>]*>/gi, '<div>');
  cleaned = cleaned.replace(/<section[^>]*elementor[^>]*>/gi, '<section>');
  
  // Remove data attributes
  cleaned = cleaned.replace(/data-[^=]*="[^"]*"/gi, '');
  
  // Clean up extra spaces and empty attributes
  cleaned = cleaned.replace(/\s+>/g, '>');
  cleaned = cleaned.replace(/<(\w+)\s+>/g, '<$1>');
  
  // Remove empty wrapper divs that don't contain meaningful content
  cleaned = cleaned.replace(/<div>\s*<\/div>/gi, '');
  cleaned = cleaned.replace(/<section>\s*<\/section>/gi, '');
  
  // Keep headings and paragraphs, clean up the rest
  cleaned = cleaned.replace(/<div[^>]*>\s*(<h[1-6][^>]*>)/gi, '$1');
  cleaned = cleaned.replace(/(<\/h[1-6]>)\s*<\/div>/gi, '$1');
  
  cleaned = cleaned.replace(/<div[^>]*>\s*(<p[^>]*>)/gi, '$1');
  cleaned = cleaned.replace(/(<\/p>)\s*<\/div>/gi, '$1');

  // Clean up multiple spaces and line breaks
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/>\s+</g, '><');
  
  return cleaned.trim();
}

// Run the smart cleanup test
smartCleanWordPressContent();