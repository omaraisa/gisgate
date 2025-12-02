import fs from 'fs';
import path from 'path';

interface LessonData {
  title: string;
  videoUrl: string;
  order: number;
}

// Read and parse CSV
function parseCSV(filePath: string): LessonData[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  return lines.map((line, index) => {
    const [videoUrl, title] = line.split(',');
    return {
      title: title.trim(),
      videoUrl: videoUrl.trim(),
      order: index + 1 // Start from 1
    };
  });
}

// Create lessons via API
async function createLessons(courseId: string, lessons: LessonData[]) {
  const apiUrl = `http://localhost:3000/api/admin/lessons/create`;

  for (const lesson of lessons) {
    try {
      console.log(`Creating lesson: ${lesson.title}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: lesson.title,
          content: '', // Empty content for now
          videoUrl: lesson.videoUrl,
          duration: null,
          courseId: courseId,
          order: lesson.order,
          status: 'DRAFT'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Failed to create lesson "${lesson.title}":`, error);
      } else {
        const result = await response.json();
        console.log(`✓ Created lesson: ${result.title} (ID: ${result.id})`);
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error creating lesson "${lesson.title}":`, error);
    }
  }
}

// Main function
async function main() {
  const courseId = 'eb9882cf-a4ea-4d42-91e6-2d906410f449';
  const csvPath = path.join(process.cwd(), 'app', 'Essential GIS Skills.csv');

  console.log('Reading CSV file...');
  const lessons = parseCSV(csvPath);
  console.log(`Found ${lessons.length} lessons to create`);

  console.log('Starting lesson creation...');
  await createLessons(courseId, lessons);
  console.log('Finished!');
}

// Run the script
main().catch(console.error);