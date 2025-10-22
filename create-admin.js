const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();

  try {
    console.log('Creating admin user...\n');

    // Hash a default password
    const hashedPassword = await bcrypt.hash('123qwe!@#QWE', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@gisgate.com',
        firstName: 'Omar',
        lastName: 'Elhadi',
        fullNameEnglish: 'Omar Elhadi Adam Elhag',
        fullNameArabic: 'عمر الهادي آدم الحاج',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true
      }
    });

    console.log('✓ Admin user created successfully!\n');
    console.log('Login credentials:');
    console.log('  Email: admin@gisgate.com');
    console.log('  Password: admin123\n');
    console.log('User Details:');
    console.log(`  ID: ${admin.id}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Created: ${admin.createdAt}`);

  } catch (error) {
    if (error.code === 'P2002') {
      console.error('✗ Error: Admin user already exists');
    } else {
      console.error('✗ Error creating admin user:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();