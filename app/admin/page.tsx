'use client'

import { useState, useEffect, useCallback } from 'react'
import { Article, ArticleStatus, CourseLevel } from '@prisma/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import Link from 'next/link'

// Components
import AdminHeader from './components/AdminHeader'
import StatsOverview from './components/StatsOverview'
import FilterBar from './components/FilterBar'
import ContentTable from './components/ContentTable'
import BulkActionPanel from './components/BulkActionPanel'

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

interface UserStats {
  users: {
    total: number;
    active: number;
    newLast30Days: number;
    activeLast7Days: number;
  };
  enrollments: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
    enrollmentsLast30Days: number;
    avgProgress: number;
  };
  certificates: {
    total: number;
    issuedLast30Days: number;
  };
  downloads: {
    total: number;
    last30Days: number;
  };
  revenue: {
    total: number;
    last30Days: number;
  };
  lessons: {
    totalProgress: number;
    completed: number;
  };
  popularCourses: Array<{
    id: string;
    title: string;
    enrollments: number;
  }>;
  charts: {
    userActivity: Array<{ date: Date; count: number }>;
    enrollmentActivity: Array<{ date: Date; count: number }>;
    completionActivity: Array<{ date: Date; count: number }>;
  };
}

type ContentType = 'articles' | 'lessons' | 'courses'
type ViewMode = 'dashboard' | 'content'

export default function AdminPage() {
  const { token } = useAuthStore()
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [contentType, setContentType] = useState<ContentType>('articles')
  const setContentTypeAndClear = (type: ContentType) => {
    setContentType(type)
    setSelectedItems(new Set())
  }

  const [articles, setArticles] = useState<ArticleWithStats[]>([])
  const [lessons, setLessons] = useState<LessonWithStats[]>([])
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Keep track of content stats for navigation links (not displayed in dashboard anymore)
  // const stats = {
  //   articlesCount: articles.length,
  //   lessonsCount: lessons.length,
  //   coursesCount: courses.length,
  //   publishedCount: [...articles, ...lessons, ...courses].filter(i => i.status === 'PUBLISHED').length,
  //   draftCount: [...articles, ...lessons, ...courses].filter(i => i.status === 'DRAFT').length,
  // }

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }, [token])

  const fetchUserStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const response = await fetch('/api/admin/stats', { 
        headers: getAuthHeaders() 
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      } else {
        console.error('Failed to fetch user stats');
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('فشل تحميل إحصائيات المستخدمين');
    } finally {
      setStatsLoading(false);
    }
  }, [token, getAuthHeaders]);

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
    fetchUserStats();
  }, [fetchAllData, fetchUserStats]);

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

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 font-sans" dir="rtl">
        <h3 className="font-bold mb-2 text-right">تأكيد الحذف الجماعي</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-right">
          هل أنت متأكد من حذف {selectedItems.size} عنصر؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
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
              await performBulkDelete();
            }}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            حذف ({selectedItems.size})
          </button>
        </div>
      </div>
    ));
  }

  const performBulkDelete = async () => {
    const ids = Array.from(selectedItems);
    const endpoint = contentType === 'articles' ? 'articles' : contentType === 'lessons' ? 'lessons' : 'courses';
    
    try {
      const response = await fetch(`/api/admin/${endpoint}/bulk`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids })
      })

      if (response.ok) {
        toast.success(`تم حذف ${ids.length} عنصر بنجاح`);
        if (contentType === 'articles') {
          setArticles(prev => prev.filter(item => !selectedItems.has(item.id)));
        } else if (contentType === 'lessons') {
          setLessons(prev => prev.filter(item => !selectedItems.has(item.id)));
        } else {
          setCourses(prev => prev.filter(item => !selectedItems.has(item.id)));
        }
        setSelectedItems(new Set());
      } else {
        throw new Error('Failed to bulk delete');
      }
    } catch (error) {
      toast.error("فشل الحذف الجماعي");
      console.error(error);
    }
  }

  const handleBulkStatusChange = async (status: ArticleStatus) => {
    const ids = Array.from(selectedItems);
    const endpoint = contentType === 'articles' ? 'articles' : contentType === 'lessons' ? 'lessons' : 'courses';
    
    try {
      const response = await fetch(`/api/admin/${endpoint}/bulk`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids, status })
      })

      if (response.ok) {
        toast.success(`تم تحديث حالة ${ids.length} عنصر بنجاح`);
        if (contentType === 'articles') {
          setArticles(prev => prev.map(item => selectedItems.has(item.id) ? { ...item, status } : item));
        } else if (contentType === 'lessons') {
          setLessons(prev => prev.map(item => selectedItems.has(item.id) ? { ...item, status } : item));
        } else {
          setCourses(prev => prev.map(item => selectedItems.has(item.id) ? { ...item, status } : item));
        }
        setSelectedItems(new Set());
      } else {
        throw new Error('Failed to bulk update status');
      }
    } catch (error) {
      toast.error("فشل التحديث الجماعي");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950 px-4 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <AdminHeader
          title={viewMode === 'dashboard' ? 'لوحة القيادة' : 'إدارة المحتوى'}
          subtitle="نظرة عامة على أداء المنصة والمحتوى"
        />

        {/* Admin Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Link
            href="/admin"
            className="flex flex-col items-center gap-2 p-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/60 dark:hover:bg-black/30 transition-all hover:scale-105"
          >
            <i className="fas fa-newspaper text-2xl text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">إدارة المقالات</span>
            <span className="text-xs text-gray-500">({articles.length})</span>
          </Link>

          <Link
            href="/admin"
            className="flex flex-col items-center gap-2 p-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/60 dark:hover:bg-black/30 transition-all hover:scale-105"
          >
            <i className="fas fa-book-open text-2xl text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium">إدارة الدروس</span>
            <span className="text-xs text-gray-500">({lessons.length})</span>
          </Link>

          <Link
            href="/admin"
            className="flex flex-col items-center gap-2 p-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/60 dark:hover:bg-black/30 transition-all hover:scale-105"
          >
            <i className="fas fa-graduation-cap text-2xl text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium">إدارة الكورسات</span>
            <span className="text-xs text-gray-500">({courses.length})</span>
          </Link>

          <Link
            href="/admin/users"
            className="flex flex-col items-center gap-2 p-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/60 dark:hover:bg-black/30 transition-all hover:scale-105"
          >
            <i className="fas fa-users text-2xl text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium">إدارة المستخدمين</span>
          </Link>

          <Link
            href="/admin/marketplace"
            className="flex flex-col items-center gap-2 p-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/60 dark:hover:bg-black/30 transition-all hover:scale-105"
          >
            <i className="fas fa-store text-2xl text-pink-600 dark:text-pink-400" />
            <span className="text-sm font-medium">إدارة المتجر</span>
          </Link>

          <Link
            href="/admin/certificates"
            className="flex flex-col items-center gap-2 p-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/60 dark:hover:bg-black/30 transition-all hover:scale-105"
          >
            <i className="fas fa-certificate text-2xl text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium">إدارة الشهادات</span>
          </Link>

          <Link
            href="/admin/resumes"
            className="flex flex-col items-center gap-2 p-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/60 dark:hover:bg-black/30 transition-all hover:scale-105"
          >
            <i className="fas fa-file-alt text-2xl text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium">رفع السيرة الذاتية</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-2">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`pb-2 px-4 text-lg font-medium transition-colors relative ${viewMode === 'dashboard' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            لوحة القيادة
            {viewMode === 'dashboard' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />}
          </button>
          <button
            onClick={() => setViewMode('content')}
            className={`pb-2 px-4 text-lg font-medium transition-colors relative ${viewMode === 'content' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            المحتوى
            {viewMode === 'content' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />}
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
              <StatsOverview userStats={userStats} loading={statsLoading} />
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
                <button onClick={() => setContentTypeAndClear('articles')} className={`px-4 py-2 rounded-lg transition-colors ${contentType === 'articles' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>المقالات</button>
                <button onClick={() => setContentTypeAndClear('lessons')} className={`px-4 py-2 rounded-lg transition-colors ${contentType === 'lessons' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>الدروس</button>
                <button onClick={() => setContentTypeAndClear('courses')} className={`px-4 py-2 rounded-lg transition-colors ${contentType === 'courses' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>الكورسات</button>
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

        <BulkActionPanel
          selectedCount={selectedItems.size}
          onDelete={handleBulkDelete}
          onStatusChange={handleBulkStatusChange}
          onClearSelection={() => setSelectedItems(new Set())}
        />
      </div>
    </div>
  )
}