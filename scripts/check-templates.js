import { PrismaClient } from '@prisma/client';

async function checkTemplates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 فحص قوالب الشهادات الموجودة...');
    
    const templates = await prisma.certificateTemplate.findMany({
      select: {
        id: true,
        name: true,
        language: true,
        isDefault: true,
        isActive: true,
        fields: true
      }
    });
    
    console.log(`\n📋 العدد الإجمالي للقوالب: ${templates.length}`);
    
    templates.forEach((template, index) => {
      console.log(`\n--- قالب ${index + 1} ---`);
      console.log(`ID: ${template.id}`);
      console.log(`الاسم: ${template.name}`);
      console.log(`اللغة: ${template.language}`);
      console.log(`افتراضي: ${template.isDefault}`);
      console.log(`نشط: ${template.isActive}`);
      console.log(`عدد الحقول: ${Array.isArray(template.fields) ? template.fields.length : 0}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في فحص القوالب:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();