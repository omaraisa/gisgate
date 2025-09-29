import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser() {
  try {
    const result = await prisma.user.deleteMany({
      where: { email: 'omar-elhadi@live.com' }
    });

    console.log(`✅ Deleted ${result.count} user(s)`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();