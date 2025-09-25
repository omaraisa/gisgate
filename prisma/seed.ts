import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Seed Articles
  await prisma.article.upsert({
    where: { slug: 'digital-twin' },
    update: {},
    create: {
      title: 'التوأم الرقمي Digital Twin',
      slug: 'digital-twin',
      excerpt: 'مفهوم التوأم الرقمي وكيفية استخدامه في نظم المعلومات الجغرافية.',
      content: '<p>هذا المقال يشرح بالتفصيل مفهوم التوأم الرقمي وتطبيقاته المختلفة.</p>',
      featuredImage: 'https://images.unsplash.com/photo-1620712943543-2858200e944a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      category: 'تقنية',
      tags: '["التوأم الرقمي", "GIS", "مدن ذكية"]',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  // Seed Tutorials
  await prisma.tutorial.upsert({
    where: { slug: 'intro-to-arcgis-online' },
    update: {},
    create: {
      title: 'مقدمة في ArcGIS Online',
      slug: 'intro-to-arcgis-online',
      description: 'تعرف على أساسيات منصة ArcGIS Online وكيفية إنشاء الخرائط التفاعلية ومشاركتها.',
      videoUrl: 'https://www.youtube.com/watch?v=lTMLz_4i2P4',
      category: 'ArcGIS',
      tags: '["ArcGIS Online", "خرائط ويب", "تحليل مكاني"]',
      publishedAt: new Date(),
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });