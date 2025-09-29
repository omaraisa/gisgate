'use client'

import { useState, useEffect } from 'react'
import { Article, ArticleStatus, CourseLevel } from '@prisma/client'
import Link from 'next/link'
import { motion } from 'framer-motion'

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

type ContentType = 'articles' | 'lessons' | 'courses' | 'courses'

export default function AdminPage() {
  const [contentType, setContentType] = useState<ContentType>('articles')
  const [articles, setArticles] = useState<ArticleWithStats[]>([])
  const [lessons, setLessons] = useState<LessonWithStats[]>([])
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')

  useEffect(() => {
    fetchArticles()
    fetchLessons()
    fetchCourses()
  }, [])

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/admin/articles')
      const data = await response.json()
      setArticles(data)
    } catch (error) {
      console.error('Error fetching articles:', error)
    }
  }

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/admin/lessons')
      const data = await response.json()
      setLessons(data)
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      const data = await response.json()
      setCourses(data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleStatusChange = async (id: string, status: ArticleStatus) => {
    try {
      const response = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (response.ok) {
        setArticles(prev => 
          prev.map(article => 
            article.id === id ? { ...article, status } : article
          )
        )
      }
    } catch (error) {
      console.error('Error updating article status:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return

    try {
      const response = await fetch('/api/admin/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        setArticles(prev => prev.filter(article => article.id !== id))
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  const handleLessonStatusChange = async (id: string, status: ArticleStatus) => {
    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (response.ok) {
        setLessons(prev => 
          prev.map(lesson => 
            lesson.id === id ? { ...lesson, status } : lesson
          )
        )
      }
    } catch (error) {
      console.error('Error updating lesson status:', error)
    }
  }

  const handleLessonDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return

    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        setLessons(prev => prev.filter(lesson => lesson.id !== id))
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
    }
  }

  const handleCourseStatusChange = async (id: string, status: ArticleStatus) => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (response.ok) {
        setCourses(prev => 
          prev.map(course => 
            course.id === id ? { ...course, status } : course
          )
        )
      }
    } catch (error) {
      console.error('Error updating course status:', error)
    }
  }

  const handleCourseDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكورس؟')) return

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        setCourses(prev => prev.filter(course => course.id !== id))
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.size === 0) return

    const itemIds = Array.from(selectedItems)
    
    try {
      const apiEndpoint = contentType === 'articles' ? '/api/admin/articles/bulk' : contentType === 'lessons' ? '/api/admin/lessons/bulk' : '/api/admin/courses/bulk'
      
      if (bulkAction === 'delete') {
        const itemType = contentType === 'articles' ? 'مقال' : contentType === 'lessons' ? 'درس' : 'كورس'
        if (!confirm(`هل أنت متأكد من حذف ${itemIds.length} ${itemType}؟`)) return
        
        const response = await fetch(apiEndpoint, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: itemIds })
        })

        if (response.ok) {
          if (contentType === 'articles') {
            setArticles(prev => prev.filter(item => !selectedItems.has(item.id)))
          } else if (contentType === 'lessons') {
            setLessons(prev => prev.filter(item => !selectedItems.has(item.id)))
          } else {
            setCourses(prev => prev.filter(item => !selectedItems.has(item.id)))
          }
          setSelectedItems(new Set())
        }
      } else {
        // Bulk status change
        const response = await fetch(apiEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: itemIds, status: bulkAction })
        })

        if (response.ok) {
          if (contentType === 'articles') {
            setArticles(prev => 
              prev.map(item => 
                selectedItems.has(item.id) 
                  ? { ...item, status: bulkAction as ArticleStatus }
                  : item
              )
            )
          } else if (contentType === 'lessons') {
            setLessons(prev => 
              prev.map(item => 
                selectedItems.has(item.id) 
                  ? { ...item, status: bulkAction as ArticleStatus }
                  : item
              )
            )
          } else {
            setCourses(prev => 
              prev.map(item => 
                selectedItems.has(item.id) 
                  ? { ...item, status: bulkAction as ArticleStatus }
                  : item
              )
            )
          }
          setSelectedItems(new Set())
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }

    setBulkAction('')
  }

  const toggleSelectAll = () => {
    const currentItems = contentType === 'articles' ? filteredArticles : contentType === 'lessons' ? filteredLessons : filteredCourses
    if (selectedItems.size === currentItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(currentItems.map(item => item.id)))
    }
  }

  const filteredArticles = articles.filter(article => {
    const matchesFilter = filter === 'all' || article.status === filter
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const filteredLessons = lessons.filter(lesson => {
    const matchesFilter = filter === 'all' || lesson.status === filter
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const filteredCourses = courses.filter(course => {
    const matchesFilter = filter === 'all' || course.status === filter
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المقالات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            إدارة {contentType === 'articles' ? 'المقالات' : 'الدروس'}
          </h1>
          <p className="text-gray-600">
            إجمالي {contentType === 'articles' ? 'المقالات' : contentType === 'lessons' ? 'الدروس' : 'الكورسات'}: {contentType === 'articles' ? articles.length : contentType === 'lessons' ? lessons.length : courses.length} | 
            المنشور: {(contentType === 'articles' ? articles : contentType === 'lessons' ? lessons : courses).filter(item => item.status === ArticleStatus.PUBLISHED).length} | 
            المسودة: {(contentType === 'articles' ? articles : contentType === 'lessons' ? lessons : courses).filter(item => item.status === ArticleStatus.DRAFT).length}
          </p>
        </div>

        {/* Content Type Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => {
                setContentType('articles')
                setSelectedItems(new Set())
                setBulkAction('')
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                contentType === 'articles'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              إدارة المقالات ({articles.length})
            </button>
            <button
              onClick={() => {
                setContentType('lessons')
                setSelectedItems(new Set())
                setBulkAction('')
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                contentType === 'lessons'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              إدارة الدروس ({lessons.length})
            </button>
            <button
              onClick={() => {
                setContentType('courses')
                setSelectedItems(new Set())
                setBulkAction('')
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                contentType === 'courses'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              إدارة الكورسات ({courses.length})
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder={`البحث في ${contentType === 'articles' ? 'المقالات' : contentType === 'lessons' ? 'الدروس' : 'الكورسات'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {(['all', 'PUBLISHED', 'DRAFT'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'الكل' : status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                </button>
              ))}
            </div>

            {/* Add New */}
            <Link
              href={contentType === 'articles' ? '/admin/articles/new' : contentType === 'lessons' ? '/admin/lessons/new' : '/admin/courses/new'}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              إضافة {contentType === 'articles' ? 'مقال' : contentType === 'lessons' ? 'درس' : 'كورس'} جديد
            </Link>
          </div>

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  تم اختيار {selectedItems.size} {contentType === 'articles' ? 'مقال' : contentType === 'lessons' ? 'درس' : 'كورس'}
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-3 py-1 border border-blue-300 rounded-md text-sm"
                >
                  <option value="">اختر إجراء</option>
                  <option value="PUBLISHED">نشر</option>
                  <option value="DRAFT">تحويل لمسودة</option>
                  <option value="delete">حذف</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="px-4 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  تطبيق
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-right">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === (contentType === 'articles' ? filteredArticles.length : contentType === 'lessons' ? filteredLessons.length : filteredCourses.length) && (contentType === 'articles' ? filteredArticles.length : contentType === 'lessons' ? filteredLessons.length : filteredCourses.length) > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-4 text-right font-medium text-gray-900">العنوان</th>
                  {contentType === 'courses' && (
                    <>
                      <th className="p-4 text-right font-medium text-gray-900">المستوى</th>
                      <th className="p-4 text-right font-medium text-gray-900">السعر</th>
                    </>
                  )}
                  <th className="p-4 text-right font-medium text-gray-900">تاريخ النشر</th>
                  <th className="p-4 text-right font-medium text-gray-900">الحالة</th>
                  {contentType === 'articles' && <th className="p-4 text-right font-medium text-gray-900">الصور</th>}
                  {contentType === 'courses' && (
                    <>
                      <th className="p-4 text-right font-medium text-gray-900">الدروس</th>
                      <th className="p-4 text-right font-medium text-gray-900">المسجلين</th>
                    </>
                  )}
                  <th className="p-4 text-right font-medium text-gray-900">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {(contentType === 'articles' ? filteredArticles : contentType === 'lessons' ? filteredLessons : filteredCourses).map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedItems)
                          if (e.target.checked) {
                            newSet.add(item.id)
                          } else {
                            newSet.delete(item.id)
                          }
                          setSelectedItems(newSet)
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/admin/${contentType}/${item.id}/edit`}
                          className="font-medium text-blue-600 hover:text-blue-800 line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">
                          <Link
                            href={`/${contentType}/${item.slug}`}
                            target="_blank"
                            className="hover:text-blue-600"
                          >
                            عرض {contentType === 'articles' ? 'المقال' : contentType === 'lessons' ? 'الدرس' : 'الكورس'} ↗
                          </Link>
                        </div>
                      </div>
                    </td>
                    {contentType === 'courses' && (
                      <>
                        <td className="p-4 text-gray-600">
                          {(item as CourseWithStats).level === 'BEGINNER' ? 'مبتدئ' :
                           (item as CourseWithStats).level === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
                        </td>
                        <td className="p-4 text-gray-600">
                          {(item as CourseWithStats).isFree ? 'مجاني' : `${(item as CourseWithStats).price} ${(item as CourseWithStats).currency || 'USD'}`}
                        </td>
                      </>
                    )}
                    <td className="p-4 text-gray-600">
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('en-US') : 'غير منشور'}
                    </td>
                    <td className="p-4">
                      <select
                        value={item.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as ArticleStatus
                          if (contentType === 'articles') {
                            handleStatusChange(item.id, newStatus)
                          } else if (contentType === 'lessons') {
                            handleLessonStatusChange(item.id, newStatus)
                          } else {
                            handleCourseStatusChange(item.id, newStatus)
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          item.status === ArticleStatus.PUBLISHED
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value={ArticleStatus.PUBLISHED}>منشور</option>
                        <option value={ArticleStatus.DRAFT}>مسودة</option>
                      </select>
                    </td>
                    {contentType === 'articles' && (
                      <td className="p-4 text-gray-600 text-center">
                        {(item as ArticleWithStats).imageCount || 0}
                      </td>
                    )}
                    {contentType === 'courses' && (
                      <>
                        <td className="p-4 text-gray-600 text-center">
                          {(item as CourseWithStats).lessonCount || 0}
                        </td>
                        <td className="p-4 text-gray-600 text-center">
                          {(item as CourseWithStats).enrollmentCount || 0}
                        </td>
                      </>
                    )}
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/${contentType}/${item.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          تحرير
                        </Link>
                        <button
                          onClick={() => {
                            if (contentType === 'articles') {
                              handleDelete(item.id)
                            } else if (contentType === 'lessons') {
                              handleLessonDelete(item.id)
                            } else {
                              handleCourseDelete(item.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {(contentType === 'articles' ? filteredArticles : filteredLessons).length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p>لا توجد {contentType === 'articles' ? 'مقالات' : 'دروس'} مطابقة للبحث</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}