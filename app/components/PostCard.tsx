import Image from 'next/image';
import Link from 'next/link';

interface PostCardProps {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt?: Date | null;
  featuredImage?: string | null;
  authorName?: string | null;
  category?: string | null;
  type?: 'article' | 'video';
}

export default function PostCard({
  title,
  excerpt,
  slug,
  publishedAt,
  featuredImage,
  authorName,
  category,
  type = 'article'
}: PostCardProps) {
  const link = type === 'video' ? `/lessons/${slug}` : `/articles/${slug}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
      {featuredImage && (
        <Image
          src={featuredImage}
          alt={title}
          width={400}
          height={192}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          {category && (
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {category}
            </span>
          )}
          {type === 'video' && (
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
              🎥 فيديو
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          <Link href={link} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
            {title}
          </Link>
        </h3>

        {excerpt && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
            {excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          {authorName && <span>بواسطة {authorName}</span>}
          {publishedAt && (
            <span>
              {new Date(publishedAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
