const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullNameArabic: true,
        fullNameEnglish: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('📭 No users found in the database.');
      return;
    }

    console.log(`📋 Found ${users.length} user(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Full Name (Arabic): ${user.fullNameArabic || 'N/A'}`);
      console.log(`   Full Name (English): ${user.fullNameEnglish || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log(`   ID: ${user.id}`);
      console.log('   ---');
    });

    console.log('\n💡 To make a user admin, run:');
    console.log('   node scripts/make-admin.js <email>');
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();