#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkArticles() {
  try {
    console.log('🔍 Checking migrated articles...\n');

    // Get article count
    const totalCount = await prisma.article.count();
    console.log(`📊 Total articles: ${totalCount}`);

    // Get published articles count
    const publishedCount = await prisma.article.count({
      where: { status: 'PUBLISHED' }
    });
    console.log(`✅ Published articles: ${publishedCount}`);

    // Get recent articles
    const recentArticles = await prisma.article.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        category: true,
        author: true,
        featuredImage: true,
        publishedAt: true,
        createdAt: true
      }
    });

    console.log('\n📝 Recent articles:');
    console.log('==================');
    
    recentArticles.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title}`);
      console.log(`   Slug: ${article.slug}`);
      console.log(`   Status: ${article.status}`);
      console.log(`   Category: ${article.category || 'No category'}`);
      console.log(`   Author: ${article.author || 'No author'}`);
      console.log(`   Featured Image: ${article.featuredImage ? 'Yes' : 'No'}`);
      console.log(`   Published: ${article.publishedAt ? article.publishedAt.toISOString().split('T')[0] : 'Not published'}`);
      console.log(`   URL: http://localhost:3000/articles/${article.slug}`);
    });

    // Check for articles with images
    const articlesWithImages = await prisma.articleImage.findMany({
      take: 5,
      include: {
        article: {
          select: {
            title: true,
            slug: true
          }
        }
      }
    });

    if (articlesWithImages.length > 0) {
      console.log('\n📷 Articles with images:');
      console.log('=======================');
      
      articlesWithImages.forEach((image, index) => {
        console.log(`\n${index + 1}. Article: ${image.article.title}`);
        console.log(`   Image URL: ${image.url}`);
        console.log(`   Alt: ${image.alt || 'No alt text'}`);
        console.log(`   Caption: ${image.caption || 'No caption'}`);
      });
    }

    console.log('\n✅ Article check completed!');
    console.log('\n🌐 You can view articles at:');
    console.log('   - All articles: http://localhost:3000/articles');
    if (recentArticles.length > 0) {
      console.log(`   - Latest article: http://localhost:3000/articles/${recentArticles[0].slug}`);
    }

  } catch (error) {
    console.error('❌ Error checking articles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticles();