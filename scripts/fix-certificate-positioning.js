import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCertificateTemplates() {
  try {
    console.log('🔄 Updating certificate templates with correct positioning for 2000x1414...');

    // Get templates first
    const arabicTemplate = await prisma.certificateTemplate.findFirst({
      where: { 
        name: 'شهادة إتمام الدورة - عربي',
        language: 'ar'
      }
    });

    const englishTemplate = await prisma.certificateTemplate.findFirst({
      where: { 
        name: 'Certificate of Completion - English',
        language: 'en'
      }
    });

    if (!arabicTemplate || !englishTemplate) {
      console.error('❌ Templates not found');
      return;
    }

    // Update Arabic template with corrected positioning
    await prisma.certificateTemplate.update({
      where: { id: arabicTemplate.id },
      data: {
        fields: [
          {
            id: 'studentName',
            type: 'STUDENT_NAME',
            x: 1000, // Center horizontally (2000/2 = 1000)
            y: 650,  // Adjusted for 1414 height
            fontSize: 48,
            fontFamily: 'Kufi',
            color: '#1a365d',
            textAlign: 'center',
            maxWidth: 800,
            fontWeight: 'bold'
          },
          {
            id: 'courseTitle',
            type: 'COURSE_TITLE',
            x: 1000,
            y: 550,  // Above student name
            fontSize: 36,
            fontFamily: 'Kufi',
            color: '#2d3748',
            textAlign: 'center',
            maxWidth: 1200,
            fontWeight: 'bold'
          },
          {
            id: 'completionDate',
            type: 'COMPLETION_DATE',
            x: 1000,
            y: 750,  // Below student name
            fontSize: 24,
            fontFamily: 'Kufi',
            color: '#4a5568',
            textAlign: 'center'
          },
          {
            id: 'instructor',
            type: 'INSTRUCTOR',
            x: 1500, // Right side for instructor signature
            y: 1100,
            fontSize: 20,
            fontFamily: 'Kufi',
            color: '#718096',
            textAlign: 'center'
          },
          {
            id: 'certificateId',
            type: 'CERTIFICATE_ID',
            x: 100,  // Bottom left
            y: 1350,
            fontSize: 14,
            fontFamily: 'Kufi',
            color: '#a0aec0',
            textAlign: 'left'
          },
          {
            id: 'qrCode',
            type: 'QR_CODE',
            x: 150,  // Left side, properly positioned
            y: 300,
            width: 180,
            height: 180
          }
        ]
      }
    });

    // Update English template with corrected positioning
    await prisma.certificateTemplate.update({
      where: { id: englishTemplate.id },
      data: {
        fields: [
          {
            id: 'studentName',
            type: 'STUDENT_NAME',
            x: 1000, // Center horizontally
            y: 650,  // Adjusted for 1414 height
            fontSize: 48,
            fontFamily: 'Kufi',
            color: '#1a365d',
            textAlign: 'center',
            maxWidth: 800,
            fontWeight: 'bold'
          },
          {
            id: 'courseTitle',
            type: 'COURSE_TITLE',
            x: 1000,
            y: 550,  // Above student name
            fontSize: 36,
            fontFamily: 'Kufi',
            color: '#2d3748',
            textAlign: 'center',
            maxWidth: 1200,
            fontWeight: 'bold'
          },
          {
            id: 'completionDate',
            type: 'COMPLETION_DATE',
            x: 1000,
            y: 750,  // Below student name
            fontSize: 24,
            fontFamily: 'Kufi',
            color: '#4a5568',
            textAlign: 'center'
          },
          {
            id: 'instructor',
            type: 'INSTRUCTOR',
            x: 1500, // Right side for instructor signature
            y: 1100,
            fontSize: 20,
            fontFamily: 'Kufi',
            color: '#718096',
            textAlign: 'center'
          },
          {
            id: 'certificateId',
            type: 'CERTIFICATE_ID',
            x: 100,  // Bottom left
            y: 1350,
            fontSize: 14,
            fontFamily: 'Kufi',
            color: '#a0aec0',
            textAlign: 'left'
          },
          {
            id: 'qrCode',
            type: 'QR_CODE',
            x: 150,  // Left side, properly positioned
            y: 300,
            width: 180,
            height: 180
          }
        ]
      }
    });

    console.log('✅ Updated Arabic template:', arabicTemplate.id);
    console.log('✅ Updated English template:', englishTemplate.id);
    console.log('\n📐 New positioning optimized for 2000x1414 certificate dimensions');

  } catch (error) {
    console.error('❌ Error updating templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCertificateTemplates();