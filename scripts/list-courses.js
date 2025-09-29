import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listCourses() {
  try {
    const courses = await prisma.course.findMany();

    console.log('📚 الدورات الموجودة:', courses.length);
    courses.forEach(course => {
      console.log(`\n📖 ${course.title}`);
      console.log(`   Slug: ${course.slug}`);
      console.log(`   العنوان الإنجليزي: ${course.titleEnglish || 'غير محدد'}`);
      console.log(`   المؤلف: ${course.authorName}`);
      console.log(`   المؤلف الإنجليزي: ${course.authorNameEnglish || 'غير محدد'}`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listCourses();