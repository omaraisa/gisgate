import { prisma } from '../lib/prisma';
import { CertificateService } from '../lib/certificate-service';

async function generateCertificatesForMigratedEnrollments() {
  console.log('Generating certificates for migrated enrollments...');

  // Find all migrated enrollments (those with wordpressId users) that are completed
  const migratedEnrollments = await prisma.courseEnrollment.findMany({
    where: {
      isCompleted: true,
      user: {
        wordpressId: { not: null }
      },
      certificates: {
        none: {} // Only enrollments without certificates
      }
    },
    include: {
      user: { select: { wordpressId: true, email: true } },
      course: { select: { title: true } }
    }
  });

  console.log(`Found ${migratedEnrollments.length} completed migrated enrollments without certificates`);

  let successCount = 0;
  let errorCount = 0;

  for (const enrollment of migratedEnrollments) {
    try {
      console.log(`Generating certificate for user ${enrollment.user.wordpressId} (${enrollment.user.email}) - course: ${enrollment.course.title}`);
      await CertificateService.generateCertificate(enrollment.id);
      successCount++;
    } catch (error) {
      console.error(`Failed to generate certificate for enrollment ${enrollment.id}:`, error);
      errorCount++;
    }
  }

  console.log(`\nCertificate generation complete:`);
  console.log(`- Success: ${successCount}`);
  console.log(`- Errors: ${errorCount}`);

  await prisma.$disconnect();
}

generateCertificatesForMigratedEnrollments().catch(console.error);
