#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeExcerptSections() {
  try {
    console.log('🧹 Removing "Excerpt للمقالة" sections from articles...\n');

    // Get all articles
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        content: true
      }
    });

    console.log(`📊 Found ${articles.length} articles to check`);

    let cleanedCount = 0;
    let skippedCount = 0;

    for (const article of articles) {
      try {
        const originalContent = article.content;
        let cleanedContent = originalContent;

        // Remove excerpt sections with various patterns
        const excerptPatterns = [
          /\*\*Excerpt للمقالة \(WordPress\):\*\*[^]*?(?=\n\n|\n\d+|\n[^\n]*\d{4})/gi,
          /Excerpt للمقالة \(WordPress\):[^]*?(?=\n\n|\n\d+|\n[^\n]*\d{4})/gi,
          /\*\*Excerpt[^]*?\*\*[^]*?(?=\n\n|\n\d+)/gi,
          /Excerpt[^]*?(?=\n\d+|\n[^\n]*\d{4})/gi
        ];

        let hasChanges = false;
        for (const pattern of excerptPatterns) {
          const newContent = cleanedContent.replace(pattern, '');
          if (newContent !== cleanedContent) {
            cleanedContent = newContent;
            hasChanges = true;
          }
        }

        // Also remove any standalone lines that might be leftover excerpts
        cleanedContent = cleanedContent.replace(/^.*Excerpt.*$/gm, '');
        
        // Clean up extra whitespace
        cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
        cleanedContent = cleanedContent.trim();

        if (cleanedContent !== originalContent) {
          await prisma.article.update({
            where: { id: article.id },
            data: { content: cleanedContent }
          });
          
          cleanedCount++;
          console.log(`✅ Removed excerpt from: ${article.title}`);
        } else {
          skippedCount++;
          console.log(`⏭️  No excerpt found in: ${article.title}`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${article.title}:`, error);
      }
    }

    console.log('\n🎉 Excerpt cleanup completed!');
    console.log(`📈 Results:`);
    console.log(`   - Articles with excerpts removed: ${cleanedCount}`);
    console.log(`   - Articles without excerpts: ${skippedCount}`);
    console.log(`   - Total processed: ${articles.length}`);

    console.log('\n🌐 Check your articles at: http://localhost:3000/articles');

  } catch (error) {
    console.error('❌ Error during excerpt cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
removeExcerptSections();