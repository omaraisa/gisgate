'use client'

import { useState, useEffect, useCallback } from 'react'
import { Article, ArticleStatus, CourseLevel } from '@prisma/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'

// Components
import AdminHeader from './components/AdminHeader'
import StatsOverview from './components/StatsOverview'
import FilterBar from './components/FilterBar'
import ContentTable from './components/ContentTable'

// Interfaces
interface ArticleWithStats extends Article {
  imageCount?: number
}

interface LessonWithStats {
  id: string
  title: string
  slug: string
  status: ArticleStatus
  publishedAt?: Date | null
  updatedAt: Date
  imageCount?: number
  authorName?: string
}

interface CourseWithStats {
  id: string
  title: string
  slug: string
  description?: string | null
  status: ArticleStatus
  publishedAt?: Date | null
  updatedAt: Date
  price?: number | null
  currency?: string | null
  isFree: boolean
  level: CourseLevel
  language?: string | null
  lessonCount?: number
  enrollmentCount?: number
}

type ContentType = 'articles' | 'lessons' | 'courses'
type ViewMode = 'dashboard' | 'content'

export default function AdminPage() {
  const { token } = useAuthStore()
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [contentType, setContentType] = useState<ContentType>('articles')

  const [articles, setArticles] = useState<ArticleWithStats[]>([])
  const [lessons, setLessons] = useState<LessonWithStats[]>([])
  const [courses, setCourses] = useState<CourseWithStats[]>([])

  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Calculate Stats
  const stats = {
    articlesCount: articles.length,
    lessonsCount: lessons.length,
    coursesCount: courses.length,
    publishedCount: [...articles, ...lessons, ...courses].filter(i => i.status === 'PUBLISHED').length,
    draftCount: [...articles, ...lessons, ...courses].filter(i => i.status === 'DRAFT').length,
  }

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }, [token])

  const fetchAllData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [articlesRes, lessonsRes, coursesRes] = await Promise.all([
        fetch('/api/admin/articles', { headers: getAuthHeaders() }),
        fetch('/api/admin/lessons', { headers: getAuthHeaders() }),
        fetch('/api/admin/courses', { headers: getAuthHeaders() })
      ]);

      if (articlesRes.ok) setArticles(await articlesRes.json());
      if (lessonsRes.ok) setLessons(await lessonsRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [token, getAuthHeaders]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handlers
  const handleStatusChange = async (id: string, status: ArticleStatus) => {
    const endpoint = contentType === 'articles' ? 'articles' : contentType === 'lessons' ? 'lessons' : 'courses';
    try {
      const response = await fetch(`/api/admin/${endpoint}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, status })
      })

      if (response.ok) {
        toast.success("تم تحديث الحالة بنجاح");
        if (contentType === 'articles') {
          setArticles(prev => prev.map(item => item.id === id ? { ...item, status } : item));
        } else if (contentType === 'lessons') {
          setLessons(prev => prev.map(item => item.id === id ? { ...item, status } : item));
        } else {
          setCourses(prev => prev.map(item => item.id === id ? { ...item, status } : item));
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast.error("فشل تحديث الحالة");
      console.error(error);
    }
  }

  const handleDelete = async (id: string) => {
    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold mb-2">تأكيد الحذف</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
          >
            إلغاء
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              await performDelete(id);
            }}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            حذف
          </button>
        </div>
      </div>
    ));
  }

  const performDelete = async (id: string) => {
    const endpoint = contentType === 'articles' ? 'articles' : contentType === 'lessons' ? 'lessons' : 'courses';
    try {
      const response = await fetch(`/api/admin/${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        toast.success("تم الحذف بنجاح");
        if (contentType === 'articles') {
          setArticles(prev => prev.filter(item => item.id !== id));
        } else if (contentType === 'lessons') {
          setLessons(prev => prev.filter(item => item.id !== id));
        } else {
          setCourses(prev => prev.filter(item => item.id !== id));
        }
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast.error("فشل الحذف");
      console.error(error);
    }
  }

  const toggleSelectAll = () => {
    const currentItems = getCurrentItems();
    if (selectedItems.size === currentItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(currentItems.map(item => item.id)))
    }
  }

  const toggleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (checked) newSet.add(id)
      else newSet.delete(id)
      return newSet
    })
  }

  const getCurrentItems = () => {
    const items = contentType === 'articles' ? articles : contentType === 'lessons' ? lessons : courses;
    return items.filter(item => {
      const matchesFilter = filter === 'all' || item.status === filter
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contentType === 'courses' && (item as CourseWithStats).description?.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesFilter && matchesSearch
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <AdminHeader
          title={viewMode === 'dashboard' ? 'لوحة القيادة' : 'إدارة المحتوى'}
          subtitle="نظرة عامة على أداء المنصة والمحتوى"
        />

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-2">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`pb-2 px-4 text-lg font-medium transition-colors relative ${viewMode === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
          >
            لوحة القيادة
            {viewMode === 'dashboard' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
          <button
            onClick={() => setViewMode('content')}
            className={`pb-2 px-4 text-lg font-medium transition-colors relative ${viewMode === 'content' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
          >
            المحتوى
            {viewMode === 'content' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StatsOverview stats={stats} />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Content Type Selectors */}
              <div className="flex gap-4 mb-6">
                <button onClick={() => setContentType('articles')} className={`px-4 py-2 rounded-lg transition-colors ${contentType === 'articles' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}>المقالات</button>
                <button onClick={() => setContentType('lessons')} className={`px-4 py-2 rounded-lg transition-colors ${contentType === 'lessons' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}>الدروس</button>
                <button onClick={() => setContentType('courses')} className={`px-4 py-2 rounded-lg transition-colors ${contentType === 'courses' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}>الكورسات</button>
              </div>

              <FilterBar
                contentType={contentType}
                filter={filter}
                setFilter={setFilter}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />

              <ContentTable
                items={getCurrentItems()}
                contentType={contentType}
                selectedItems={selectedItems}
                toggleSelectAll={toggleSelectAll}
                toggleSelectItem={toggleSelectItem}
                handleStatusChange={handleStatusChange}
                handleDelete={handleDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}