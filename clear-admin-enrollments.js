const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAdminEnrollments() {
  try {
    console.log('Finding admin user...');

    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    console.log(`Found admin user: ${adminUser.email} (${adminUser.id})`);

    // Find all enrollments for the admin user
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: adminUser.id },
      include: {
        course: {
          select: { title: true }
        }
      }
    });

    console.log(`Found ${enrollments.length} enrollments:`);
    enrollments.forEach(enrollment => {
      console.log(`- ${enrollment.course.title} (${enrollment.id})`);
    });

    // Delete all enrollments
    const deleteResult = await prisma.courseEnrollment.deleteMany({
      where: { userId: adminUser.id }
    });

    console.log(`Deleted ${deleteResult.count} enrollments`);

    // Also delete any pending payment orders for the admin
    const paymentOrders = await prisma.paymentOrder.deleteMany({
      where: { userId: adminUser.id }
    });

    console.log(`Deleted ${paymentOrders.count} pending payment orders`);

    console.log('Admin enrollments cleared successfully!');

  } catch (error) {
    console.error('Error clearing admin enrollments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAdminEnrollments();