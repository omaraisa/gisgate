'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Play, ShoppingCart } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  type: 'article' | 'course' | 'lesson' | 'marketplace';
  excerpt?: string;
  url: string;
  category?: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      // Simulate search - in real implementation, call API
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'مقدمة في نظم المعلومات الجغرافية',
          type: 'course',
          excerpt: 'دورة شاملة تغطي أساسيات GIS',
          url: '/courses/intro-gis',
          category: 'GIS'
        },
        {
          id: '2',
          title: 'استخدام QGIS للمبتدئين',
          type: 'lesson',
          excerpt: 'درس تفاعلي عن برنامج QGIS',
          url: '/lessons/qgis-basics',
          category: 'QGIS'
        },
        {
          id: '3',
          title: 'خرائط GIS المتقدمة',
          type: 'marketplace',
          excerpt: 'حلول خرائط جاهزة للاستخدام',
          url: '/marketplace/advanced-maps',
          category: 'خرائط'
        }
      ].filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.excerpt?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(mockResults);
    }
    setLoading(false);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-5 h-5" />;
      case 'lesson': return <Play className="w-5 h-5" />;
      case 'marketplace': return <ShoppingCart className="w-5 h-5" />;
      default: return <Search className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'course': return 'دورة';
      case 'lesson': return 'درس';
      case 'marketplace': return 'منتج';
      default: return 'محتوى';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري البحث...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            نتائج البحث
          </h1>
          <p className="text-gray-600">
            تم العثور على {results.length} نتيجة للبحث عن: <span className="font-medium">&quot;{query}&quot;</span>
          </p>
        </div>

        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {getIcon(result.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {getTypeLabel(result.type)}
                      </span>
                      {result.category && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {result.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <Link href={result.url} className="hover:text-blue-600 transition-colors">
                        {result.title}
                      </Link>
                    </h3>
                    {result.excerpt && (
                      <p className="text-gray-600 text-sm">{result.excerpt}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              لم يتم العثور على نتائج
            </h3>
            <p className="text-gray-600 mb-6">
              جرب كلمات بحث مختلفة أو تحقق من الإملاء
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              العودة للرئيسية
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}