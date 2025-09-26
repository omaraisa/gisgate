#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyFinalCleanup() {
  try {
    console.log('🚀 Applying final cleanup to ALL articles...\n');

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

    let processedCount = 0;
    let cleanedCount = 0;
    let skippedCount = 0;

    for (const article of articles) {
      try {
        const originalLength = article.content.length;
        const cleanedContent = extractArticleContent(article.content);
        
        // Only update if we successfully extracted content and it's reasonable length
        if (cleanedContent.length > 200 && cleanedContent.length < originalLength * 0.9) {
          await prisma.article.update({
            where: { id: article.id },
            data: { content: cleanedContent }
          });
          
          cleanedCount++;
          console.log(`✅ Cleaned: ${article.title} (${originalLength} → ${cleanedContent.length} chars)`);
        } else {
          skippedCount++;
          console.log(`⏭️  Skipped: ${article.title} (content too short or already clean)`);
        }
        
        processedCount++;
        
        // Progress indicator
        if (processedCount % 10 === 0) {
          console.log(`📊 Progress: ${processedCount}/${articles.length} articles processed`);
        }

      } catch (error) {
        console.error(`❌ Error cleaning ${article.title}:`, error);
      }
    }

    console.log('\n🎉 Final cleanup completed!');
    console.log(`📈 Results:`);
    console.log(`   - Processed: ${processedCount} articles`);
    console.log(`   - Successfully cleaned: ${cleanedCount} articles`);
    console.log(`   - Skipped: ${skippedCount} articles`);
    
    console.log('\n🌐 Your articles are now clean and ready!');
    console.log('   View them at: http://localhost:3000/articles');

  } catch (error) {
    console.error('❌ Error during final cleanup:', error);
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
    /أصبح التكامل/,
    /يعد تكامل/,
    /تعتبر/,
    /يعتبر/,
    /أصبح/,
    /أصبحت/,
    /مقدمة/
  ];

  let contentStart = -1;
  for (const marker of startMarkers) {
    const match = rawContent.search(marker);
    if (match !== -1) {
      // Look a bit before the marker to include any heading
      const contextStart = Math.max(0, match - 100);
      const context = rawContent.substring(contextStart, match + 50);
      
      // If there's an h3 or h2 before this text, include it
      const headingMatch = context.match(/<h[2-6][^>]*>([^<]*)<\/h[2-6]>/);
      if (headingMatch) {
        contentStart = contextStart + context.indexOf('<h');
      } else {
        contentStart = match;
      }
      break;
    }
  }

  // Find the end of article content (before footer)
  const endMarkers = [
    /مشاركة المقالة/,
    /كل الدروس/,
    /اقرأ مقالة/,
    /اشترك معنا/,
    /Edit Template/
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

  // Remove Elementor wrapper classes while keeping content structure
  cleaned = cleaned.replace(/<div[^>]*elementor[^>]*>/gi, '<div>');
  cleaned = cleaned.replace(/<section[^>]*elementor[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/section>/gi, '');
  
  // Remove data attributes but keep classes that might be useful
  cleaned = cleaned.replace(/data-[^=]*="[^"]*"\s*/gi, '');
  
  // Remove empty wrapper divs
  cleaned = cleaned.replace(/<div>\s*<\/div>/gi, '');
  cleaned = cleaned.replace(/<div>\s*(<div>)/gi, '$1');
  cleaned = cleaned.replace(/(<\/div>)\s*<\/div>/gi, '$1');
  
  // Clean up widget containers and other WordPress elements
  cleaned = cleaned.replace(/<div[^>]*widget-container[^>]*>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*elementor-[^>]*>/gi, '');
  
  // Remove specific WordPress classes
  cleaned = cleaned.replace(/class="[^"]*elementor[^"]*"/gi, '');
  cleaned = cleaned.replace(/class="[^"]*widget[^"]*"/gi, '');
  
  // Clean up empty class attributes
  cleaned = cleaned.replace(/class=""\s*/gi, '');
  cleaned = cleaned.replace(/\s+class=""/gi, '');
  
  // Clean up spacing and empty tags
  cleaned = cleaned.replace(/\s+>/g, '>');
  cleaned = cleaned.replace(/<(\w+)\s+>/g, '<$1>');
  cleaned = cleaned.replace(/>\s+</g, '><');
  
  // Remove multiple consecutive empty divs
  cleaned = cleaned.replace(/(<div><\/div>\s*){2,}/g, '');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  
  return cleaned.trim();
}

// Run the final cleanup
applyFinalCleanup();