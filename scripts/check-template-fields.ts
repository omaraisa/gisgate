import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTemplateFields() {
  try {
    console.log('🔍 فحص تفاصيل حقول القوالب...\n');

    const templates = await prisma.certificateTemplate.findMany({
      select: {
        id: true,
        name: true,
        language: true,
        isDefault: true,
        fields: true
      }
    });

    templates.forEach((template, index) => {
      console.log(`--- قالب ${index + 1}: ${template.name} (${template.language}) ---`);
      console.log(`ID: ${template.id}`);
      console.log(`افتراضي: ${template.isDefault}`);

      if (Array.isArray(template.fields)) {
        template.fields.forEach((field: any, fieldIndex: number) => {
          console.log(`  حقل ${fieldIndex + 1}: ${field.id} (${field.type})`);
          console.log(`    الموضع: x=${field.x}, y=${field.y}`);
          console.log(`    الخط: ${field.fontFamily}, الحجم: ${field.fontSize}px`);
          console.log(`    اللون: ${field.color}, المحاذاة: ${field.textAlign}`);
          if (field.maxWidth) console.log(`    العرض الأقصى: ${field.maxWidth}px`);
          if (field.width) console.log(`    العرض: ${field.width}px`);
          if (field.height) console.log(`    الارتفاع: ${field.height}px`);
          console.log('');
        });
      }
      console.log('---\n');
    });

  } catch (error) {
    console.error('❌ خطأ في فحص الحقول:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplateFields();