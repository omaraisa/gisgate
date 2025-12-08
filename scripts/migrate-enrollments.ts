import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Mapping from WP course_id to new course_id
const courseMapping: { [key: string]: string } = {
  '6480': '54dc3ecd-050f-4ad1-ae05-74192755f5b8', // Power BI for GIS
  '5058': '615b33a6-baa4-4d81-b5c1-41bd6c71385d', // GIS Fundamentals
  '4691': 'eb9882cf-a4ea-4d42-91e6-2d906410f449', // Essential GIS Skills
  '4608': 'aeabed2c-b29a-456d-bfb7-1dfd1f422615', // ArcGIS API for JavaScript Fundamentals
  '4586': '58c3a3be-ef5a-46ac-8e53-9c5fefb44ee8', // GIS Research Preparation
  '5676': '6757ede5-f975-4d74-954a-c1af8c606395', // AI-Assisted Python Scripting for ArcGIS Pro
};

async function migrateEnrollments() {
  const csvPath = path.join(process.cwd(), 'courses investigation data', 'wp_enrollments.csv');
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvData.split('\n').slice(1); // Skip header

  let migrated = 0;
  let skipped = 0;
  let userNotFound = 0;
  let courseNotMapped = 0;
  let alreadyExists = 0;
  let nonCompleted = 0;

  console.log(`Starting migration of ${lines.length} enrollment records...`);
  console.log(`Mapped courses:`, Object.keys(courseMapping));

  for (const line of lines) {
    if (!line.trim()) continue;
    const [post_id, user_id, course_id, enrolled_at, status] = line.split(',').map(s => s?.trim());

    // Debug first few records
    if (migrated + skipped < 5) {
      console.log(`Processing: user_id=${user_id}, course_id=${course_id}, status=${status}`);
    }

    if (status !== 'completed') {
      nonCompleted++;
      skipped++;
      continue;
    }

    const newCourseId = courseMapping[course_id];
    if (!newCourseId) {
      courseNotMapped++;
      skipped++;
      continue;
    }

    try {
      // Find user by wordpressId
      const user = await prisma.user.findUnique({
        where: { wordpressId: parseInt(user_id) },
      });

      if (!user) {
        userNotFound++;
        skipped++;
        continue;
      }

      // Check if enrollment already exists
      const existing = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: newCourseId,
          },
        },
      });

      if (existing) {
        alreadyExists++;
        skipped++;
        continue;
      }

      // Create enrollment
      await prisma.courseEnrollment.create({
        data: {
          userId: user.id,
          courseId: newCourseId,
          enrolledAt: new Date(enrolled_at),
          completedAt: new Date(enrolled_at),
          progress: 100,
          isCompleted: true,
        },
      });

      migrated++;
      if (migrated <= 10) {
        console.log(`✓ Migrated enrollment for user ${user_id} (wpId) to course ${course_id}`);
      }
    } catch (error) {
      console.error(`Error migrating enrollment: ${error}`);
      skipped++;
    }
  }

  console.log(`\n=== Migration Summary ===`);
  console.log(`Total processed: ${lines.length}`);
  console.log(`Successfully migrated: ${migrated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`  - Non-completed status: ${nonCompleted}`);
  console.log(`  - Course not mapped: ${courseNotMapped}`);
  console.log(`  - User not found: ${userNotFound}`);
  console.log(`  - Already exists: ${alreadyExists}`);
}

migrateEnrollments()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
