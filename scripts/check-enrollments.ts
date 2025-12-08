import { prisma } from '../lib/prisma';

async function checkEnrollments() {
  const enrollments = await prisma.courseEnrollment.findMany({
    select: {
      id: true,
      userId: true,
      courseId: true,
      isCompleted: true,
      completedAt: true,
      progress: true,
      user: { select: { wordpressId: true, email: true } }
    },
    take: 20
  });

  console.log('Sample enrollments from migration:');
  enrollments.forEach(e => {
    console.log(`User ${e.user.wordpressId} (${e.user.email}): Course ${e.courseId}, isCompleted: ${e.isCompleted}, progress: ${e.progress}%`);
  });

  const totalEnrollments = await prisma.courseEnrollment.count();
  const completedEnrollments = await prisma.courseEnrollment.count({
    where: { isCompleted: true }
  });

  console.log(`\nTotal enrollments: ${totalEnrollments}`);
  console.log(`Completed enrollments: ${completedEnrollments}`);

  await prisma.$disconnect();
}

checkEnrollments().catch(console.error);
