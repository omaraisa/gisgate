#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanArticleContent() {
  try {
    console.log('🧹 Starting article content cleanup...\n');

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
        
        // Clean the content
        let cleanedContent = cleanContent(originalContent);
        
        // Only update if content actually changed
        if (cleanedContent !== originalContent) {
          await prisma.article.update({
            where: { id: article.id },
            data: { content: cleanedContent }
          });
          
          cleanedCount++;
          console.log(`✅ Cleaned: ${article.title}`);
        } else {
          skippedCount++;
          console.log(`⏭️  Skipped: ${article.title} (already clean)`);
        }

      } catch (error) {
        console.error(`❌ Error cleaning article ${article.title}:`, error);
      }
    }

    console.log('\n🎉 Cleanup completed!');
    console.log(`📈 Results:`);
    console.log(`   - Cleaned: ${cleanedCount} articles`);
    console.log(`   - Skipped: ${skippedCount} articles`);
    console.log(`   - Total: ${articles.length} articles`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function cleanContent(content) {
  if (!content) return content;

  let cleaned = content;

  // Remove everything before the main content starts
  // Look for patterns that indicate the start of actual article content
  
  // Pattern 1: Remove header sections with title repetition, dates, views, etc.
  // This removes content from start until we find the actual article beginning
  cleaned = cleaned.replace(/^[\s\S]*?(?=<h[1-6][^>]*>|<p[^>]*>[\u0600-\u06FF]|<div[^>]*>[\u0600-\u06FF])/i, '');
  
  // Pattern 2: Remove specific WordPress header elements
  cleaned = cleaned.replace(/^[\s\S]*?(?=مقدمة|المقدمة)/i, '');
  
  // Pattern 3: Remove sections that contain metadata like dates, views, shares
  cleaned = cleaned.replace(/<[^>]*>\s*\d+\s*(فبراير|يناير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s*\d+\s*<[^>]*>/gi, '');
  cleaned = cleaned.replace(/<[^>]*>\s*\d+\s*مشاهدة\s*<[^>]*>/gi, '');
  cleaned = cleaned.replace(/<[^>]*>\s*مشاركة\s*<[^>]*>/gi, '');
  
  // Remove sections from "مشاركة المقالة" to the end
  const shareIndex = cleaned.search(/(مشاركة\s*المقالة|مشاركة\s*المقال)/i);
  if (shareIndex !== -1) {
    cleaned = cleaned.substring(0, shareIndex);
  }
  
  // Remove footer sections like "كل الدروس", "اقرأ مقالة", etc.
  cleaned = cleaned.replace(/(كل\s*الدروس|اقرأ\s*مقالة|Edit\s*Template)[\s\S]*$/gi, '');
  
  // Remove navigation elements and related articles sections
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*blog[^"]*"[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<section[^>]*elementor[^>]*[\s\S]*?<\/section>/gi, '');
  
  // Remove specific WordPress/Elementor elements
  cleaned = cleaned.replace(/<div[^>]*elementor[^>]*[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<span[^>]*wpr-template-edit-btn[\s\S]*?<\/span>/gi, '');
  
  // Remove logo images that appear in content
  cleaned = cleaned.replace(/<img[^>]*logo[^>]*>/gi, '');
  
  // Remove empty paragraphs and excessive whitespace
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\n\s*\n/g, '\n');
  
  // Remove duplicate titles at the beginning
  const titlePattern = new RegExp(`^[\\s\\S]*?(?=<h[1-6]|<p)`, 'i');
  cleaned = cleaned.replace(titlePattern, '');
  
  // Trim and clean final result
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Run the cleanup
cleanArticleContent();