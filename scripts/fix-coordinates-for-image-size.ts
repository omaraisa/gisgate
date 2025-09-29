import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCoordinatesForActualImageSize() {
  try {
    console.log('🔧 تعديل الإحداثيات لأبعاد الصورة الفعلية (2000×1414)...\n');

    // Fix Arabic template coordinates for 2000x1414 image
    await prisma.certificateTemplate.update({
      where: {
        id: 'd00e834a-688f-4ce1-9abc-a01f20a879ab'
      },
      data: {
        fields: [
          {
            id: 'studentName',
            type: 'STUDENT_NAME',
            x: 1000,  // Center of 2000px width
            y: 350,   // Top third of page
            fontSize: 48,
            fontFamily: 'Kufi',
            color: '#1a365d',
            textAlign: 'center',
            maxWidth: 1200,
            fontWeight: 'bold'
          },
          {
            id: 'courseTitle',
            type: 'COURSE_TITLE',
            x: 1000,  // Center
            y: 450,   // Below student name
            fontSize: 36,
            fontFamily: 'Kufi',
            color: '#2d3748',
            textAlign: 'center',
            maxWidth: 1400,
            fontWeight: 'bold'
          },
          {
            id: 'completionDate',
            type: 'COMPLETION_DATE',
            x: 1000,  // Center
            y: 750,   // Middle of page
            fontSize: 24,
            fontFamily: 'Kufi',
            color: '#4a5568',
            textAlign: 'center'
          },
          {
            id: 'instructor',
            type: 'INSTRUCTOR',
            x: 1000,  // Center
            y: 820,   // Below completion date
            fontSize: 20,
            fontFamily: 'Kufi',
            color: '#718096',
            textAlign: 'center'
          },
          {
            id: 'certificateId',
            type: 'CERTIFICATE_ID',
            x: 200,   // Left side
            y: 1300,  // Bottom of page
            fontSize: 16,
            fontFamily: 'Kufi',
            color: '#a0aec0',
            textAlign: 'left'
          },
          {
            id: 'qrCode',
            type: 'QR_CODE',
            x: 1600,  // Right side
            y: 1150,  // Bottom right
            width: 150,
            height: 150
          }
        ]
      }
    });

    // Fix English template coordinates for 2000x1414 image
    await prisma.certificateTemplate.update({
      where: {
        id: '6abc3a59-7955-4b26-b10e-10e6d7016ba4'
      },
      data: {
        fields: [
          {
            id: 'studentName',
            type: 'STUDENT_NAME',
            x: 1000,  // Center of 2000px width
            y: 350,   // Top third of page
            fontSize: 48,
            fontFamily: 'Arial',
            color: '#1a365d',
            textAlign: 'center',
            maxWidth: 1200,
            fontWeight: 'bold'
          },
          {
            id: 'courseTitle',
            type: 'COURSE_TITLE',
            x: 1000,  // Center
            y: 450,   // Below student name
            fontSize: 36,
            fontFamily: 'Arial',
            color: '#2d3748',
            textAlign: 'center',
            maxWidth: 1400,
            fontWeight: 'bold'
          },
          {
            id: 'completionDate',
            type: 'COMPLETION_DATE',
            x: 1000,  // Center
            y: 750,   // Middle of page
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#4a5568',
            textAlign: 'center'
          },
          {
            id: 'instructor',
            type: 'INSTRUCTOR',
            x: 1000,  // Center
            y: 820,   // Below completion date
            fontSize: 20,
            fontFamily: 'Arial',
            color: '#718096',
            textAlign: 'center'
          },
          {
            id: 'certificateId',
            type: 'CERTIFICATE_ID',
            x: 200,   // Left side
            y: 1300,  // Bottom of page
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#a0aec0',
            textAlign: 'left'
          },
          {
            id: 'qrCode',
            type: 'QR_CODE',
            x: 1600,  // Right side
            y: 1150,  // Bottom right
            width: 150,
            height: 150
          }
        ]
      }
    });

    console.log('✅ تم تعديل الإحداثيات لأبعاد الصورة الفعلية');
    console.log('📐 أبعاد الصورة: 2000×1414 بكسل');
    console.log('📍 مركز الصفحة: x=1000');
    console.log('📱 QR Code: x=1600, y=1150 (150×150)');
    console.log('🔤 حجم الخط: مُكبر ليتناسب مع الصورة الكبيرة');

  } catch (error) {
    console.error('❌ خطأ في تعديل الإحداثيات:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixCoordinatesForActualImageSize();