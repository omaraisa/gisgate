const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCertificateData() {
  try {
    const certificate = await prisma.certificate.findFirst({
      include: {
        template: true
      }
    });

    if (certificate) {
      console.log('Certificate Data:');
      console.log(JSON.stringify(certificate.data, null, 2));
      console.log('\nTemplate Fields:');
      console.log(JSON.stringify(certificate.template.fields, null, 2));
      console.log('\nFields Type:', typeof certificate.template.fields);
      console.log('Is Array:', Array.isArray(certificate.template.fields));
    } else {
      console.log('No certificates found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCertificateData();