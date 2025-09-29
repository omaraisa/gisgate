import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCertificates() {
  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        template: true,
        enrollment: {
          include: {
            course: true
          }
        }
      }
    });

    console.log('📜 الشهادات الموجودة:', certificates.length);
    certificates.forEach(cert => {
      console.log(`\n🎓 ${cert.certificateId}`);
      console.log(`   اللغة: ${cert.template.language}`);
      console.log(`   الدورة: ${cert.enrollment.course.title}`);
      console.log(`   الطالب: ${cert.enrollment.userId}`);
      console.log(`   البيانات:`, JSON.parse(JSON.stringify(cert.data)));
    });

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCertificates();