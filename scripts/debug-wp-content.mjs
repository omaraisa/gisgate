#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugArticleStructure() {
  try {
    console.log('🔍 Analyzing article structure...\n');

    // Get the test article
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
      console.log('❌ Test article not found.');
      return;
    }

    console.log(`📄 Article: ${article.title}`);
    console.log(`📏 Content length: ${article.content.length} characters\n`);

    // Look for the actual article content patterns
    const content = article.content;

    // Find where the actual article text begins (looking for Arabic content)
    const arabicContentMatches = content.match(/[\u0600-\u06FF]{20,}/g);
    
    console.log('🔍 Found Arabic content blocks:');
    console.log('================================');
    
    if (arabicContentMatches) {
      arabicContentMatches.slice(0, 5).forEach((match, index) => {
        console.log(`${index + 1}. "${match.substring(0, 100)}..."`);
      });
    }

    // Look for common article starting phrases
    const startPhrases = [
      'مقدمة',
      'في ظل التطور',
      'يتيح تكامل',
      'تعد الطائرات',
      'أصبح التكامل'
    ];

    console.log('\n🎯 Looking for article start phrases:');
    console.log('===================================');
    
    startPhrases.forEach(phrase => {
      const index = content.indexOf(phrase);
      if (index !== -1) {
        const context = content.substring(Math.max(0, index - 50), index + 150);
        console.log(`Found "${phrase}" at position ${index}:`);
        console.log(`"...${context}..."\n`);
      }
    });

    // Look for footer patterns
    const footerPhrases = [
      'مشاركة المقالة',
      'كل الدروس',
      'اقرأ مقالة',
      'اشترك معنا'
    ];

    console.log('🏁 Looking for footer phrases:');
    console.log('=============================');
    
    footerPhrases.forEach(phrase => {
      const index = content.indexOf(phrase);
      if (index !== -1) {
        const context = content.substring(Math.max(0, index - 50), index + 150);
        console.log(`Found "${phrase}" at position ${index}:`);
        console.log(`"...${context}..."\n`);
      }
    });

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
debugArticleStructure();