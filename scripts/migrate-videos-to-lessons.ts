import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateVideosToLessons() {
  console.log('Starting video migration to lessons...');

  // Categories that contain video content
  const videoCategories = [
    'ArcGIS Online',
    'دروس',
    'عروض بوربوينت',
    'ارك ماب',
    'أسئلة',
    'مواضيع عامة'
  ];

  // Get all articles from video categories
  const videoArticles = await prisma.article.findMany({
    where: {
      category: {
        in: videoCategories
      }
    },
    include: {
      images: true
    }
  });

  console.log(`Found ${videoArticles.length} articles to migrate`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const article of videoArticles) {
    try {
      // Extract YouTube URL from content if present
      const youtubeMatch = article.content.match(/youtube\.com\/(?:embed\/|watch\?v=|v\/)([a-zA-Z0-9_-]{11})/);
      const videoUrl = youtubeMatch ? `https://www.youtube.com/watch?v=${youtubeMatch[1]}` : null;

      // Create video record
      const video = await prisma.video.create({
        data: {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          videoUrl: videoUrl,
          featuredImage: article.featuredImage,
          status: article.status,
          publishedAt: article.publishedAt,
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          aiGenerated: article.aiGenerated,
          aiPrompt: article.aiPrompt,
          viewCount: article.viewCount,
          category: 'دروس', // All videos go under "دروس" category
          tags: article.tags,
          authorId: article.authorId,
          authorName: article.authorName,
          authorSlug: article.authorSlug,
        }
      });

      // Migrate images
      if (article.images && article.images.length > 0) {
        await prisma.videoImage.createMany({
          data: article.images.map(img => ({
            url: img.url,
            alt: img.alt,
            caption: img.caption,
            videoId: video.id
          }))
        });
      }

      // Delete the original article
      await prisma.article.delete({
        where: { id: article.id }
      });

      migratedCount++;
      console.log(`Migrated: ${article.title}`);

    } catch (error) {
      console.error(`Error migrating article ${article.title}:`, error);
      skippedCount++;
    }
  }

  console.log(`Migration completed:`);
  console.log(`- Migrated: ${migratedCount} articles`);
  console.log(`- Skipped: ${skippedCount} articles`);
  console.log(`- Total processed: ${migratedCount + skippedCount}`);
}

migrateVideosToLessons()
  .catch(console.error)
  .finally(() => prisma.$disconnect());