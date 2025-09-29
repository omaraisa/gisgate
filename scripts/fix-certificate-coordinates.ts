import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCertificateCoordinates() {
  try {
    console.log('🔧 إصلاح إحداثيات قوالب الشهادات...\n');

    // Fix Arabic template coordinates
    await prisma.certificateTemplate.update({
      where: {
        id: 'd00e834a-688f-4ce1-9abc-a01f20a879ab'
      },
      data: {
        fields: [
          {
            id: 'studentName',
            type: 'STUDENT_NAME',
            x: 561,  // Center of 1123px width
            y: 250,  // Top third of page
            fontSize: 36,
            fontFamily: 'Kufi',
            color: '#1a365d',
            textAlign: 'center',
            maxWidth: 800,
            fontWeight: 'bold'
          },
          {
            id: 'courseTitle',
            type: 'COURSE_TITLE',
            x: 561,  // Center
            y: 320,  // Below student name
            fontSize: 28,
            fontFamily: 'Kufi',
            color: '#2d3748',
            textAlign: 'center',
            maxWidth: 900,
            fontWeight: 'bold'
          },
          {
            id: 'completionDate',
            type: 'COMPLETION_DATE',
            x: 561,  // Center
            y: 450,  // Middle of page
            fontSize: 18,
            fontFamily: 'Kufi',
            color: '#4a5568',
            textAlign: 'center'
          },
          {
            id: 'instructor',
            type: 'INSTRUCTOR',
            x: 561,  // Center
            y: 490,  // Below completion date
            fontSize: 16,
            fontFamily: 'Kufi',
            color: '#718096',
            textAlign: 'center'
          },
          {
            id: 'certificateId',
            type: 'CERTIFICATE_ID',
            x: 100,  // Left side
            y: 700,  // Bottom of page
            fontSize: 12,
            fontFamily: 'Kufi',
            color: '#a0aec0',
            textAlign: 'left'
          },
          {
            id: 'qrCode',
            type: 'QR_CODE',
            x: 900,  // Right side
            y: 600,  // Bottom right
            width: 120,
            height: 120
          }
        ]
      }
    });

    // Fix English template coordinates
    await prisma.certificateTemplate.update({
      where: {
        id: '6abc3a59-7955-4b26-b10e-10e6d7016ba4'
      },
      data: {
        fields: [
          {
            id: 'studentName',
            type: 'STUDENT_NAME',
            x: 561,  // Center of 1123px width
            y: 250,  // Top third of page
            fontSize: 36,
            fontFamily: 'Arial',
            color: '#1a365d',
            textAlign: 'center',
            maxWidth: 800,
            fontWeight: 'bold'
          },
          {
            id: 'courseTitle',
            type: 'COURSE_TITLE',
            x: 561,  // Center
            y: 320,  // Below student name
            fontSize: 28,
            fontFamily: 'Arial',
            color: '#2d3748',
            textAlign: 'center',
            maxWidth: 900,
            fontWeight: 'bold'
          },
          {
            id: 'completionDate',
            type: 'COMPLETION_DATE',
            x: 561,  // Center
            y: 450,  // Middle of page
            fontSize: 18,
            fontFamily: 'Arial',
            color: '#4a5568',
            textAlign: 'center'
          },
          {
            id: 'instructor',
            type: 'INSTRUCTOR',
            x: 561,  // Center
            y: 490,  // Below completion date
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#718096',
            textAlign: 'center'
          },
          {
            id: 'certificateId',
            type: 'CERTIFICATE_ID',
            x: 100,  // Left side
            y: 700,  // Bottom of page
            fontSize: 12,
            fontFamily: 'Arial',
            color: '#a0aec0',
            textAlign: 'left'
          },
          {
            id: 'qrCode',
            type: 'QR_CODE',
            x: 900,  // Right side
            y: 600,  // Bottom right
            width: 120,
            height: 120
          }
        ]
      }
    });

    console.log('✅ تم إصلاح إحداثيات قوالب الشهادات');
    console.log('📍 العربية والإنجليزية: إحداثيات محسنة لتغطية الصفحة كاملة');
    console.log('📐 مركز الصفحة: x=561, y=250-700');
    console.log('📱 QR Code: x=900, y=600');

  } catch (error) {
    console.error('❌ خطأ في إصلاح الإحداثيات:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixCertificateCoordinates();