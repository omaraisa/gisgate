import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🛠️  إنشاء مستخدم إداري جديد...');

    // Admin user details (hardcoded for easy recovery)
    const adminData = {
      email: 'omar-elhadi@live.com',
      username: 'omar-elhadi',
      password: '123qwe!@#QWE',
      firstName: 'عمر',
      lastName: 'الهادي',
      fullNameArabic: 'عمر الهادي آدم الحاج',
      fullNameEnglish: 'Omar Elhadi Adam Elhag'
    };

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email.toLowerCase() }
    });

    if (existingUser) {
      console.error('❌ مستخدم بهذا البريد الإلكتروني موجود بالفعل');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminData.email.toLowerCase(),
        username: adminData.username,
        password: hashedPassword,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        fullNameArabic: adminData.fullNameArabic,
        fullNameEnglish: adminData.fullNameEnglish,
        role: 'ADMIN',
        emailVerified: true, // Auto-verify admin accounts
        isActive: true
      }
    });

    console.log('\n✅ تم إنشاء المستخدم الإداري بنجاح!');
    console.log('📧 البريد الإلكتروني:', adminUser.email);
    console.log('👤 الاسم:', `${adminUser.firstName} ${adminUser.lastName || ''}`.trim());
    console.log('🔐 الدور: ADMIN');
    console.log('🆔 معرف المستخدم:', adminUser.id);
    console.log('\n💡 يمكنك الآن تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور');

  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدم الإداري:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();