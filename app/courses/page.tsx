import { Suspense } from 'react';
import CoursesPageClient from './CoursesPageClient';
import { prisma } from '@/lib/prisma';
import { Course } from '@/lib/stores/course-store';

export const dynamic = 'force-dynamic';

interface CoursesResponse {
  courses: Course[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

async function getCourses(page: number = 1, limit: number = 20): Promise<CoursesResponse> {
  const skip = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.course.count({
      where: {
        status: 'PUBLISHED',
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const mappedCourses: Course[] = courses.map(course => ({
    ...course,
    titleEnglish: course.titleEnglish ?? undefined,
    description: course.description ?? undefined,
    excerpt: course.excerpt ?? undefined,
    featuredImage: course.featuredImage ?? undefined,
    category: course.category ?? undefined,
    price: course.price ?? undefined,
    currency: course.currency ?? undefined,
    authorId: course.authorId ?? undefined,
    authorName: course.authorName ?? undefined,
    authorNameEnglish: course.authorNameEnglish ?? undefined,
    durationValue: course.durationValue ?? undefined,
    durationUnit: course.durationUnit ?? undefined,
    language: course.language ?? undefined,
    publishedAt: course.publishedAt?.toISOString() ?? undefined,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    status: course.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  }));

  return {
    courses: mappedCourses,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export default async function CoursesPage() {
  const initialData = await getCourses(1, 20);

  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-secondary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CoursesPageClient initialData={initialData} />
    </Suspense>
  );
}
