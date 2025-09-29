import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCertificateTemplates() {
  try {
    console.log('🔧 تحديث قوالب الشهادات بالمواضع المحددة...\n');

    // Update Arabic template with fixed positions (using ID)
    await prisma.certificateTemplate.update({
      where: { 
        id: 'd00e834a-688f-4ce1-9abc-a01f20a879ab'
      },
      data: {
        fields: [
          {
            id: 'studentName',
            type: 'STUDENT_NAME',
            x: 400,
            y: 280,
            fontSize: 36,
            fontFamily: 'Kufi',
            color: '#1a365d',
            textAlign: 'center',
            maxWidth: 500,
            fontWeight: 'bold'
          },
          {
            id: 'courseTitle',
            type: 'COURSE_TITLE',
            x: 400,
            y: 200,
            fontSize: 28,
            fontFamily: 'Kufi',
            color: '#2d3748',
            textAlign: 'center',
            maxWidth: 700,
            fontWeight: 'bold'
          },
          {
            id: 'completionDate',
            type: 'COMPLETION_DATE',
            x: 400,
            y: 380,
            fontSize: 18,
            fontFamily: 'Kufi',
            color: '#4a5568',
            textAlign: 'center'
          },
          {
            id: 'instructor',
            type: 'INSTRUCTOR',
            x: 400,
            y: 420,
            fontSize: 16,
            fontFamily: 'Kufi',
            color: '#718096',
            textAlign: 'center'
          },
          {
            id: 'certificateId',
            type: 'CERTIFICATE_ID',
            x: 50,
            y: 520,
            fontSize: 12,
            fontFamily: 'Kufi',
            color: '#a0aec0',
            textAlign: 'left'
          },
          {
            id: 'qrCode',
            type: 'QR_CODE',
            x: 650,
            y: 450,
            width: 120,
            height: 120
          }
        ]
      }
    });

    // Update English template with fixed positions (using ID)
    await prisma.certificateTemplate.update({
      where: {
        id: '6abc3a59-7955-4b26-b10e-10e6d7016ba4'
      },
      data: {
        fields: [
          {
            id: 'studentName',
            type: 'STUDENT_NAME',
            x: 400,
            y: 280,
            fontSize: 36,
            fontFamily: 'Arial',
            color: '#1a365d',
            textAlign: 'center',
            maxWidth: 500,
            fontWeight: 'bold'
          },
          {
            id: 'courseTitle',
            type: 'COURSE_TITLE',
            x: 400,
            y: 200,
            fontSize: 28,
            fontFamily: 'Arial',
            color: '#2d3748',
            textAlign: 'center',
            maxWidth: 700,
            fontWeight: 'bold'
          },
          {
            id: 'completionDate',
            type: 'COMPLETION_DATE',
            x: 400,
            y: 380,
            fontSize: 18,
            fontFamily: 'Arial',
            color: '#4a5568',
            textAlign: 'center'
          },
          {
            id: 'instructor',
            type: 'INSTRUCTOR',
            x: 400,
            y: 420,
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#718096',
            textAlign: 'center'
          },
          {
            id: 'certificateId',
            type: 'CERTIFICATE_ID',
            x: 50,
            y: 520,
            fontSize: 12,
            fontFamily: 'Arial',
            color: '#a0aec0',
            textAlign: 'left'
          },
          {
            id: 'qrCode',
            type: 'QR_CODE',
            x: 650,
            y: 450,
            width: 120,
            height: 120
          }
        ]
      }
    });

    console.log('✅ تم تحديث قوالب الشهادات بمواضع محددة');
    console.log('📝 العربية: مواضع محسنة بخط Kufi');
    console.log('📝 الإنجليزية: مواضع محسنة بخط Arial');

  } catch (error) {
    console.error('❌ خطأ في تحديث القوالب:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateCertificateTemplates();