const { PrismaClient } = require('@prisma/client');

async function examineVideoContent() {
  const prisma = new PrismaClient();

  try {
    // Get videos that contain YouTube content
    const videos = await prisma.video.findMany({
      select: {
        title: true,
        content: true
      },
      where: {
        content: {
          contains: 'youtube'
        }
      },
      take: 3
    });

    console.log(`Found ${videos.length} videos with YouTube content:\n`);

    videos.forEach((video, i) => {
      console.log(`Video ${i + 1}: ${video.title}`);

      // Show full content to see the structure
      console.log('Full content:');
      console.log(video.content);
      console.log('\n---\n');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

examineVideoContent();