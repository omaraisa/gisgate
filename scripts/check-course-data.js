import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCourse() {
  try {
    const course = await prisma.course.findFirst();
    console.log('Course data:');
    console.log('- Title (AR):', course?.title);
    console.log('- Title (EN):', course?.titleEnglish);
    console.log('- Author (AR):', course?.authorName);
    console.log('- Author (EN):', course?.authorNameEnglish);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourse();