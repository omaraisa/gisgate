import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleCourse() {
  try {
    console.log('🛠️  إنشاء دورة تجريبية مع إكمالها...\n');

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.error('❌ لم يتم العثور على مستخدم إداري');
      process.exit(1);
    }

    console.log('👤 المستخدم الإداري:', adminUser.email);

    // Create sample course
    const course = await prisma.course.create({
      data: {
        title: 'مقدمة في نظم المعلومات الجغرافية',
        slug: 'introduction-to-gis',
        description: 'دورة شاملة في أساسيات نظم المعلومات الجغرافية وتطبيقاتها',
        excerpt: 'تعلم أساسيات GIS والخرائط الرقمية',
        featuredImage: '/course-gis.jpg',
        category: 'تكنولوجيا',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        price: 0,
        isFree: true,
        authorId: adminUser.id,
        authorName: adminUser.fullNameArabic || `${adminUser.firstName} ${adminUser.lastName}`,
        totalLessons: 3,
        duration: '2 ساعات',
        level: 'BEGINNER',
        language: 'ar'
      }
    });

    console.log('📚 تم إنشاء الدورة:', course.title);

    // Create lessons (videos)
    const lessons = await Promise.all([
      prisma.video.create({
        data: {
          title: 'ما هي نظم المعلومات الجغرافية؟',
          slug: 'what-is-gis',
          excerpt: 'مقدمة في مفهوم GIS',
          content: 'محتوى الدرس الأول...',
          videoUrl: '/videos/gis-intro.mp4',
          duration: '15 دقيقة',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          courseId: course.id,
          order: 1
        }
      }),
      prisma.video.create({
        data: {
          title: 'أنواع البيانات الجغرافية',
          slug: 'geographic-data-types',
          excerpt: 'تعرف على أنواع البيانات المستخدمة في GIS',
          content: 'محتوى الدرس الثاني...',
          videoUrl: '/videos/gis-data.mp4',
          duration: '20 دقيقة',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          courseId: course.id,
          order: 2
        }
      }),
      prisma.video.create({
        data: {
          title: 'إنشاء خريطة بسيطة',
          slug: 'creating-simple-map',
          excerpt: 'خطوات إنشاء خريطة GIS أساسية',
          content: 'محتوى الدرس الثالث...',
          videoUrl: '/videos/gis-map.mp4',
          duration: '25 دقيقة',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          courseId: course.id,
          order: 3
        }
      })
    ]);

    console.log('📹 تم إنشاء الدروس:', lessons.length);

    // Enroll admin user in the course
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: adminUser.id,
        courseId: course.id,
        progress: 100,
        isCompleted: true,
        completedAt: new Date()
      }
    });

    console.log('📝 تم تسجيل المستخدم في الدورة');

    // Mark all lessons as completed
    await Promise.all(lessons.map(lesson =>
      prisma.lessonProgress.create({
        data: {
          userId: adminUser.id,
          lessonId: lesson.id,
          enrollmentId: enrollment.id,
          watchedTime: 900, // 15 minutes in seconds
          isCompleted: true,
          completedAt: new Date()
        }
      })
    ));

    console.log('✅ تم إكمال جميع الدروس');

    // Generate certificate
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get default Arabic template
    const template = await prisma.certificateTemplate.findFirst({
      where: {
        language: 'ar',
        isDefault: true,
        isActive: true
      }
    });

    if (template) {
      const certificateData = {
        studentName: adminUser.fullNameArabic || `${adminUser.firstName} ${adminUser.lastName}`,
        courseTitle: course.title,
        completionDate: new Date().toLocaleDateString('ar-SA'),
        duration: course.duration,
        instructor: course.authorName,
        certificateId,
        language: 'ar'
      };

      await prisma.certificate.create({
        data: {
          templateId: template.id,
          userId: adminUser.id,
          enrollmentId: enrollment.id,
          certificateId,
          data: certificateData
        }
      });

      console.log('🎓 تم إنشاء الشهادة:', certificateId);
    }

    console.log('\n✅ تم إنشاء الدورة التجريبية بنجاح!');
    console.log('📚 الدورة:', course.title);
    console.log('🔗 الرابط:', `/courses/${course.slug}`);
    console.log('📊 التقدم: 100% مكتمل');
    console.log('🎓 الشهادة: متاحة للتحميل');

  } catch (error) {
    console.error('❌ خطأ في إنشاء الدورة التجريبية:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleCourse();