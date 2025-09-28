import { prisma } from '../lib/prisma';
import PostCard from '../components/PostCard';

export const metadata = {
  title: 'الدروس - بوابة نظم المعلومات الجغرافية',
  description: 'مجموعة شاملة من الدروس التعليمية في نظم المعلومات الجغرافية',
};

interface Lesson {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  featuredImage: string | null;
  authorName: string | null;
  category: string | null;
}

export default async function LessonsPage() {
  const lessons: Lesson[] = await prisma.video.findMany({
    where: {
      status: 'PUBLISHED'
    },
    orderBy: {
      publishedAt: 'desc'
    },
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      featuredImage: true,
      authorName: true,
      category: true,
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            الدروس
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            مجموعة شاملة من الدروس التعليمية في نظم المعلومات الجغرافية
          </p>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد دروس متاحة حالياً
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              سيتم إضافة المزيد من الدروس قريباً
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <PostCard
                key={lesson.id}
                title={lesson.title}
                excerpt={lesson.excerpt || ''}
                slug={lesson.slug}
                publishedAt={lesson.publishedAt}
                featuredImage={lesson.featuredImage}
                authorName={lesson.authorName}
                category={lesson.category}
                type="video"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}