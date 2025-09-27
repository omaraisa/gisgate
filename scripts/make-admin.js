import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeUserAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Usage: node scripts/make-admin.js <email>');
    console.error('Example: node scripts/make-admin.js user@example.com');
    process.exit(1);
  }

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      process.exit(1);
    }

    if (user.role === 'ADMIN') {
      console.log(`✅ User "${email}" is already an ADMIN.`);
      process.exit(0);
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Successfully made "${email}" an ADMIN!`);
    console.log(`User ID: ${updatedUser.id}`);
    console.log(`Previous role: ${user.role}`);
    console.log(`New role: ${updatedUser.role}`);
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeUserAdmin();