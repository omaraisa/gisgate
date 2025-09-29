import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCourse() {
  try {
    const course = await prisma.course.findFirst({
      where: { slug: 'gis-intro' }
    });

    if (course) {
      console.log('📚 بيانات الدورة:');
      console.log(`العنوان العربي: ${course.title}`);
      console.log(`العنوان الإنجليزي: ${course.titleEnglish}`);
      console.log(`المؤلف العربي: ${course.authorName}`);
      console.log(`المؤلف الإنجليزي: ${course.authorNameEnglish}`);
    } else {
      console.log('❌ الدورة غير موجودة');
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourse();