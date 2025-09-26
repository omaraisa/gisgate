#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function advancedCleanArticleContent() {
  try {
    console.log('🔧 Starting advanced article content cleanup...\n');

    // Get all articles
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        content: true
      }
    });

    console.log(`📊 Found ${articles.length} articles to clean`);

    let cleanedCount = 0;
    let skippedCount = 0;

    for (const article of articles) {
      try {
        const originalContent = article.content;
        
        // Advanced cleaning
        let cleanedContent = advancedCleanContent(originalContent, article.title);
        
        // Only update if content actually changed
        if (cleanedContent !== originalContent && cleanedContent.length > 100) {
          await prisma.article.update({
            where: { id: article.id },
            data: { content: cleanedContent }
          });
          
          cleanedCount++;
          console.log(`✅ Advanced cleaned: ${article.title}`);
          console.log(`   Original length: ${originalContent.length} chars`);
          console.log(`   Cleaned length: ${cleanedContent.length} chars`);
        } else {
          skippedCount++;
          console.log(`⏭️  Skipped: ${article.title} (no significant changes)`);
        }

      } catch (error) {
        console.error(`❌ Error cleaning article ${article.title}:`, error);
      }
    }

    console.log('\n🎉 Advanced cleanup completed!');
    console.log(`📈 Results:`);
    console.log(`   - Cleaned: ${cleanedCount} articles`);
    console.log(`   - Skipped: ${skippedCount} articles`);
    console.log(`   - Total: ${articles.length} articles`);

  } catch (error) {
    console.error('❌ Error during advanced cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function advancedCleanContent(content, articleTitle) {
  if (!content) return content;

  let cleaned = content;

  // Step 1: Find where the actual article content starts
  // Look for common article starting patterns
  const startPatterns = [
    /(?:مقدمة|المقدمة|في\s+ظل|يعد|تعد|تعتبر|يعتبر|أصبح|أصبحت)/i,
    /<h[1-6][^>]*>/i,
    /<p[^>]*>[\u0600-\u06FF]/i
  ];

  let contentStart = -1;
  for (const pattern of startPatterns) {
    const match = cleaned.search(pattern);
    if (match !== -1) {
      contentStart = match;
      break;
    }
  }

  // If we found a content start, remove everything before it
  if (contentStart > 0) {
    cleaned = cleaned.substring(contentStart);
  }

  // Step 2: Remove the ending sections starting from "مشاركة المقالة"
  const endPatterns = [
    /(مشاركة\s*المقالة|مشاركة\s*المقال)/i,
    /(كل\s*الدروس)/i,
    /(اقرأ\s*مقالة)/i,
    /(Edit\s*Template)/i,
    /(اشترك\s*معنا)/i
  ];

  for (const pattern of endPatterns) {
    const match = cleaned.search(pattern);
    if (match !== -1) {
      cleaned = cleaned.substring(0, match);
      break;
    }
  }

  // Step 3: Remove WordPress/Elementor specific elements
  const removePatterns = [
    // Remove elementor sections
    /<section[^>]*elementor[^>]*[\s\S]*?<\/section>/gi,
    /<div[^>]*elementor[^>]*[\s\S]*?<\/div>/gi,
    
    // Remove navigation and blog elements
    /<div[^>]*class="[^"]*blog[^"]*"[\s\S]*?<\/div>/gi,
    /<nav[^>]*[\s\S]*?<\/nav>/gi,
    
    // Remove edit buttons and admin elements
    /<span[^>]*wpr-template-edit-btn[\s\S]*?<\/span>/gi,
    /<a[^>]*Edit\s*Template[\s\S]*?<\/a>/gi,
    
    // Remove duplicate titles at the beginning
    new RegExp(`<h[1-6][^>]*>${escapeRegex(articleTitle)}<\/h[1-6]>`, 'gi'),
    
    // Remove date/view/share elements
    /<[^>]*>\s*\d+\s*(فبراير|يناير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s*\d+\s*<[^>]*>/gi,
    /<[^>]*>\s*\d+\s*مشاهدة\s*<[^>]*>/gi,
    /<[^>]*>\s*مشاركة\s*<[^>]*>/gi,
    
    // Remove logo images
    /<img[^>]*logo[^>]*>/gi,
    
    // Remove empty elements
    /<p[^>]*>\s*<\/p>/gi,
    /<div[^>]*>\s*<\/div>/gi,
    /<span[^>]*>\s*<\/span>/gi
  ];

  // Apply all removal patterns
  for (const pattern of removePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Step 4: Clean up whitespace and formatting
  cleaned = cleaned
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove multiple line breaks
    .replace(/\n\s*\n+/g, '\n\n')
    // Remove empty lines at the beginning
    .replace(/^\s+/, '')
    // Remove empty lines at the end
    .replace(/\s+$/, '')
    // Clean up broken HTML tags
    .replace(/<\/?\w+[^>]*>/g, (match) => {
      // Keep only valid, complete HTML tags
      if (match.includes('<') && match.includes('>') && !match.includes('undefined')) {
        return match;
      }
      return '';
    });

  return cleaned.trim();
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Run the advanced cleanup
advancedCleanArticleContent();