const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();

  try {
    console.log('Creating admin user...\n');

    // Delete existing admin users first
    console.log('🗑️  Deleting existing admin users...');
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'admin@gisgate.com' },
          { email: 'omar.elhadi.adam@gmail.com' }
        ]
      }
    });
    console.log('✅ Existing users deleted');

    // Hash the new password
    const hashedPassword = await bcrypt.hash('tKG(%&*N!neB@MBJ9_Th@4ktKG(BusH_177', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'omar.elhadi.adam@gmail.com',
        firstName: 'عمر',
        lastName: 'الهادي',
        fullNameEnglish: 'Omar Elhadi Adam Elhag',
        fullNameArabic: 'عمر الهادي آدم الحاج',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: omar.elhadi.adam@gmail.com');
    console.log('   Password: tKG(%&*N!neB@MBJ9_Th@4ktKG(BusH_177');
    console.log('\n👤 User Details:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Created: ${admin.createdAt}`);

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