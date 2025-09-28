const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleCourse() {
  try {
    // Create a sample course
    const course = await prisma.course.create({
      data: {
        title: 'مقدمة في نظم المعلومات الجغرافية',
        slug: 'introduction-to-gis',
        description: '<p>دورة شاملة تعريفية في نظم المعلومات الجغرافية تغطي المفاهيم الأساسية والتطبيقات العملية.</p>',
        excerpt: 'تعلم أساسيات نظم المعلومات الجغرافية وتطبيقاتها في الحياة اليومية',
        category: 'GIS',
        level: 'BEGINNER',
        language: 'ar',
        isFree: true,
        totalLessons: 5,
        duration: '3 ساعات',
        status: 'PUBLISHED'
      }
    });

    console.log('Course created:', course.id);

    // Create sample lessons
    const lessons = [
      { title: 'ما هي نظم المعلومات الجغرافية؟', slug: 'what-is-gis', order: 1 },
      { title: 'مكونات نظام GIS', slug: 'gis-components', order: 2 },
      { title: 'أنواع البيانات الجغرافية', slug: 'geographic-data-types', order: 3 },
      { title: 'أدوات GIS الأساسية', slug: 'basic-gis-tools', order: 4 },
      { title: 'تطبيقات GIS في الحياة اليومية', slug: 'gis-applications', order: 5 }
    ];

    for (const lesson of lessons) {
      const createdLesson = await prisma.video.create({
        data: {
          title: lesson.title,
          slug: lesson.slug,
          content: '<p>محتوى الدرس...</p>',
          excerpt: 'ملخص الدرس',
          courseId: course.id,
          order: lesson.order,
          status: 'PUBLISHED'
        }
      });
      console.log('Lesson created:', createdLesson.id);
    }

    console.log('Sample course and lessons created successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleCourse();