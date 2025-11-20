const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking users in database...');
    
    // Count total users
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      // Get first few users (without sensitive data)
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          email: true,
          username: true,
          fullNameArabic: true,
          fullNameEnglish: true,
          role: true,
          emailVerified: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('\nRecent users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name (AR): ${user.fullNameArabic || 'N/A'}`);
        console.log(`   Name (EN): ${user.fullNameEnglish || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Verified: ${user.emailVerified}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();