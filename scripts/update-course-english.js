import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCourseWithEnglishFields() {
  try {
    console.log('🔄 Adding English titles and author names to existing course...');

    // Update the sample course with English fields
    const updatedCourse = await prisma.course.update({
      where: { slug: 'introduction-to-gis' },
      data: {
        titleEnglish: 'Introduction to Geographic Information Systems',
        authorNameEnglish: 'Omar Elhadi'
      }
    });

    console.log('✅ Course updated successfully:');
    console.log('Arabic Title:', updatedCourse.title);
    console.log('English Title:', updatedCourse.titleEnglish);
    console.log('Arabic Author:', updatedCourse.authorName);
    console.log('English Author:', updatedCourse.authorNameEnglish);

  } catch (error) {
    console.error('❌ Error updating course:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCourseWithEnglishFields();