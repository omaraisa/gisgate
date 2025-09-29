import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        enrollments: {
          include: {
            user: true,
            certificates: true
          }
        },
        lessons: true
      }
    });

    console.log('📚 الدورات الموجودة:', courses.length);
    courses.forEach(course => {
      console.log(`\n📖 ${course.title}`);
      console.log(`   الرابط: /courses/${course.slug}`);
      console.log(`   الدروس: ${course.lessons.length}`);
      console.log(`   التسجيلات: ${course.enrollments.length}`);

      course.enrollments.forEach(enrollment => {
        console.log(`   👤 ${enrollment.user.email}: ${enrollment.progress}% ${enrollment.isCompleted ? '✅ مكتمل' : '⏳ جاري'}`);
        if (enrollment.certificates.length > 0) {
          console.log(`      🎓 الشهادة: ${enrollment.certificates[0].certificateId}`);
        }
      });
    });

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();