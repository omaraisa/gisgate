#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🧹 Clearing existing articles and images...\n');

    // Delete article images first (due to foreign key constraint)
    const deletedImages = await prisma.articleImage.deleteMany({});
    console.log(`🗑️  Deleted ${deletedImages.count} article images`);

    // Delete articles
    const deletedArticles = await prisma.article.deleteMany({});
    console.log(`🗑️  Deleted ${deletedArticles.count} articles`);

    console.log('\n✅ Database cleared successfully!');
    console.log('🚀 Ready for fresh migration');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearDatabase();