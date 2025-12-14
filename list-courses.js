const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      isPrivate: true,
    },
    orderBy: {
      title: 'asc',
    },
  });
  console.log('Current courses:');
  courses.forEach(course => {
    console.log(`${course.id}: ${course.title} (${course.status}, Private: ${course.isPrivate})`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });