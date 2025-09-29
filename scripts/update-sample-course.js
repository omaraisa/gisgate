import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSampleCourse() {
  try {
    console.log('🔄 تحديث الدورة التجريبية بالعنوان الإنجليزي...\n');

    // Update the sample course with English title
    const updatedCourse = await prisma.course.update({
      where: { slug: 'introduction-to-gis' },
      data: {
        titleEnglish: 'Introduction to Geographic Information Systems'
      }
    });

    console.log('✅ تم تحديث الدورة:');
    console.log('📚 العنوان العربي:', updatedCourse.title);
    console.log('📚 العنوان الإنجليزي:', updatedCourse.titleEnglish);

    // Update admin user with proper English name if missing
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (adminUser && !adminUser.fullNameEnglish) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          fullNameEnglish: 'Omar Elhadi Adam Elhag'
        }
      });
      console.log('👤 تم تحديث اسم المستخدم الإنجليزي: Omar Elhadi Adam Elhag');
    }

    console.log('\n🎯 الآن يمكنك تجربة تحميل الشهادات بالعربية والإنجليزية!');

  } catch (error) {
    console.error('❌ خطأ في تحديث الدورة:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateSampleCourse();