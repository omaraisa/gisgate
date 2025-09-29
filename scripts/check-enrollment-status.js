const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEnrollments() {
  try {
    const enrollments = await prisma.courseEnrollment.findMany({
      include: {
        user: {
          select: {
            email: true,
            fullNameArabic: true,
            fullNameEnglish: true
          }
        },
        course: {
          select: {
            title: true,
            slug: true
          }
        }
      }
    });

    console.log('Course Enrollments:');
    enrollments.forEach(enrollment => {
      console.log(`- User: ${enrollment.user.email}`);
      console.log(`  Course: ${enrollment.course.title}`);
      console.log(`  Progress: ${enrollment.progress}%`);
      console.log(`  Completed: ${enrollment.isCompleted ? 'Yes' : 'No'}`);
      console.log(`  Completed At: ${enrollment.completedAt || 'Not completed'}`);
      console.log('---');
    });

    // Check certificates
    const certificates = await prisma.certificate.findMany({
      include: {
        user: { select: { email: true } },
        enrollment: { include: { course: { select: { title: true } } } }
      }
    });

    console.log('\nCertificates:');
    certificates.forEach(cert => {
      console.log(`- Certificate ID: ${cert.certificateId}`);
      console.log(`  User: ${cert.user.email}`);
      console.log(`  Course: ${cert.enrollment.course.title}`);
      console.log(`  Created: ${cert.createdAt}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnrollments();