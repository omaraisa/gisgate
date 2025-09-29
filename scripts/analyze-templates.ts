import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeTemplates() {
  try {
    console.log('🔍 تحليل قوالب الشهادات...\n');

    const templates = await prisma.certificateTemplate.findMany({
      select: {
        id: true,
        name: true,
        language: true,
        backgroundImage: true,
        fields: true
      }
    });

    console.log('📋 معلومات القوالب:\n');

    templates.forEach((template, index) => {
      console.log(`--- قالب ${index + 1}: ${template.name} ---`);
      console.log(`الخلفية: ${template.backgroundImage}`);
      console.log(`اللغة: ${template.language}`);

      // Analyze coordinate ranges
      if (Array.isArray(template.fields)) {
        const xCoords = template.fields.map((f: any) => f.x).filter(x => typeof x === 'number');
        const yCoords = template.fields.map((f: any) => f.y).filter(y => typeof y === 'number');

        if (xCoords.length > 0) {
          console.log(`نطاق X: ${Math.min(...xCoords)} - ${Math.max(...xCoords)}`);
        }
        if (yCoords.length > 0) {
          console.log(`نطاق Y: ${Math.min(...yCoords)} - ${Math.max(...yCoords)}`);
        }
      }
      console.log('');
    });

    // A4 Landscape dimensions at 96 DPI: 1123px x 794px
    console.log('📐 أبعاد PDF A4 Landscape عند 96 DPI:');
    console.log('العرض: 1123px');
    console.log('الارتفاع: 794px');
    console.log('');
    console.log('💡 الإحداثيات يجب أن تكون ضمن هذه الأبعاد');

  } catch (error) {
    console.error('❌ خطأ في التحليل:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeTemplates();