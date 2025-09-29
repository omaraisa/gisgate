const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding certificate templates...');

  // Clear existing templates first
  await prisma.certificateTemplate.deleteMany({});

  // Create advanced Arabic certificate template
  const arabicTemplate = await prisma.certificateTemplate.create({
    data: {
      name: 'شهادة إتمام الدورة - عربي',
      language: 'ar',
      backgroundImage: '/certificate_templates/Certificate Template - Ar.png',
      isDefault: true,
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

  // Create advanced English certificate template
  const englishTemplate = await prisma.certificateTemplate.create({
    data: {
      name: 'Certificate of Completion - English',
      language: 'en',
      backgroundImage: '/certificate_templates/Certificate Template - En.png',
      isDefault: true,
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

  // Create additional Arabic template for variety
  const arabicTemplate2 = await prisma.certificateTemplate.create({
    data: {
      name: 'شهادة إنجاز - عربي (بديل)',
      language: 'ar',
      backgroundImage: '/certificate_templates/Certificate Template - Ar.png',
      fields: [
        {
          id: 'studentName',
          type: 'STUDENT_NAME',
          x: 400,
          y: 300,
          fontSize: 32,
          fontFamily: 'Kufi',
          color: '#000000',
          textAlign: 'center',
          maxWidth: 600,
          fontWeight: 'bold'
        },
        {
          id: 'courseTitle',
          type: 'COURSE_TITLE',
          x: 400,
          y: 220,
          fontSize: 24,
          fontFamily: 'Kufi',
          color: '#000000',
          textAlign: 'center',
          maxWidth: 800,
          fontWeight: 'normal'
        },
        {
          id: 'completionDate',
          type: 'COMPLETION_DATE',
          x: 400,
          y: 380,
          fontSize: 16,
          fontFamily: 'Kufi',
          color: '#666666',
          textAlign: 'center'
        },
        {
          id: 'duration',
          type: 'DURATION',
          x: 400,
          y: 410,
          fontSize: 14,
          fontFamily: 'Kufi',
          color: '#666666',
          textAlign: 'center'
        },
        {
          id: 'certificateId',
          type: 'CERTIFICATE_ID',
          x: 100,
          y: 500,
          fontSize: 10,
          fontFamily: 'Kufi',
          color: '#999999',
          textAlign: 'left'
        },
        {
          id: 'qrCode',
          type: 'QR_CODE',
          x: 600,
          y: 450,
          width: 100,
          height: 100
        }
      ]
    }
  });

  // Create additional English template for variety
  const englishTemplate2 = await prisma.certificateTemplate.create({
    data: {
      name: 'Achievement Certificate - English (Alternative)',
      language: 'en',
      backgroundImage: '/certificate_templates/Certificate Template - En.png',
      fields: [
        {
          id: 'studentName',
          type: 'STUDENT_NAME',
          x: 400,
          y: 300,
          fontSize: 32,
          fontFamily: 'Kufi',
          color: '#000000',
          textAlign: 'center',
          maxWidth: 600,
          fontWeight: 'bold'
        },
        {
          id: 'courseTitle',
          type: 'COURSE_TITLE',
          x: 400,
          y: 220,
          fontSize: 24,
          fontFamily: 'Kufi',
          color: '#000000',
          textAlign: 'center',
          maxWidth: 800,
          fontWeight: 'normal'
        },
        {
          id: 'completionDate',
          type: 'COMPLETION_DATE',
          x: 400,
          y: 380,
          fontSize: 16,
          fontFamily: 'Kufi',
          color: '#666666',
          textAlign: 'center'
        },
        {
          id: 'duration',
          type: 'DURATION',
          x: 400,
          y: 410,
          fontSize: 14,
          fontFamily: 'Kufi',
          color: '#666666',
          textAlign: 'center'
        },
        {
          id: 'certificateId',
          type: 'CERTIFICATE_ID',
          x: 100,
          y: 500,
          fontSize: 10,
          fontFamily: 'Kufi',
          color: '#999999',
          textAlign: 'left'
        },
        {
          id: 'qrCode',
          type: 'QR_CODE',
          x: 600,
          y: 450,
          width: 100,
          height: 100
        }
      ]
    }
  });

  console.log('✅ Created certificate templates:');
  console.log('Arabic Default:', arabicTemplate.id);
  console.log('English Default:', englishTemplate.id);
  console.log('Arabic Alternative:', arabicTemplate2.id);
  console.log('English Alternative:', englishTemplate2.id);
  console.log('\n📝 Templates restored with advanced features:');
  console.log('- QR codes for verification');
  console.log('- Proper Arabic font support (Kufi)');
  console.log('- Multiple field types (student name, course title, dates, etc.)');
  console.log('- Configurable positioning and styling');
  console.log('- Default templates marked');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding certificate templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });