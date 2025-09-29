const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create default Arabic certificate template
  const arabicTemplate = await prisma.certificateTemplate.create({
    data: {
      name: 'شهادة إتمام عربية',
      language: 'ar',
      backgroundImage: '/certificate-bg-arabic.png',
      fields: {
        studentName: {
          x: 400,
          y: 300,
          fontSize: 32,
          fontFamily: 'Kufi',
          color: '#000000',
          textAlign: 'center'
        },
        courseName: {
          x: 400,
          y: 200,
          fontSize: 28,
          fontFamily: 'Kufi',
          color: '#000000',
          textAlign: 'center'
        },
        completionDate: {
          x: 400,
          y: 400,
          fontSize: 18,
          fontFamily: 'Kufi',
          color: '#666666',
          textAlign: 'center'
        },
        certificateId: {
          x: 100,
          y: 500,
          fontSize: 12,
          fontFamily: 'Kufi',
          color: '#999999',
          textAlign: 'left'
        }
      }
    }
  });

  // Create default English certificate template
  const englishTemplate = await prisma.certificateTemplate.create({
    data: {
      name: 'Certificate of Completion English',
      language: 'en',
      backgroundImage: '/certificate-bg-english.png',
      fields: {
        studentName: {
          x: 400,
          y: 300,
          fontSize: 32,
          fontFamily: 'Kufi',
          color: '#000000',
          textAlign: 'center'
        },
        courseName: {
          x: 400,
          y: 200,
          fontSize: 28,
          fontFamily: 'Kufi',
          color: '#000000',
          textAlign: 'center'
        },
        completionDate: {
          x: 400,
          y: 400,
          fontSize: 18,
          fontFamily: 'Kufi',
          color: '#666666',
          textAlign: 'center'
        },
        certificateId: {
          x: 100,
          y: 500,
          fontSize: 12,
          fontFamily: 'Kufi',
          color: '#999999',
          textAlign: 'left'
        }
      }
    }
  });

  console.log('Created certificate templates:');
  console.log('Arabic template:', arabicTemplate.id);
  console.log('English template:', englishTemplate.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });