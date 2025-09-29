import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDuplicateCertificates() {
  try {
    console.log('🧹 تنظيف الشهادات المكررة...');

    // Find all certificates
    const allCertificates = await prisma.certificate.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 إجمالي الشهادات: ${allCertificates.length}`);

    // Group by userId and enrollmentId
    const grouped = {};
    allCertificates.forEach(cert => {
      const key = `${cert.userId}-${cert.enrollmentId}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(cert);
    });

    let duplicatesRemoved = 0;

    for (const [key, certs] of Object.entries(grouped)) {
      if (certs.length > 1) {
        console.log(`🔍 مكررة للمستخدم ${certs[0].userId}: ${certs.length} شهادة`);

        // Keep the most recent one, delete the rest
        const toKeep = certs[certs.length - 1]; // Last one (most recent)
        const toDelete = certs.slice(0, -1); // All except the last one

        for (const cert of toDelete) {
          await prisma.certificate.delete({
            where: { id: cert.id }
          });
          duplicatesRemoved++;
          console.log(`  ❌ حذف الشهادة: ${cert.certificateId}`);
        }

        console.log(`  ✅ الاحتفاظ بالشهادة: ${toKeep.certificateId}`);
      }
    }

    console.log(`\n✅ تم تنظيف ${duplicatesRemoved} شهادة مكررة`);

    // Now add the unique constraint
    console.log('🔧 إضافة القيد الفريد...');
    await prisma.$executeRaw`ALTER TABLE certificates ADD CONSTRAINT certificates_userId_enrollmentId_key UNIQUE ("userId", "enrollmentId")`;

    console.log('✅ تم إضافة القيد الفريد بنجاح');

  } catch (error) {
    console.error('❌ خطأ في تنظيف الشهادات:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicateCertificates();