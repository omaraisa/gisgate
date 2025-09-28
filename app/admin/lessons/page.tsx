'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Lesson {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | null
  featuredImage: string | null
  authorName: string | null
  category: string | null
  status: string
  viewCount: number
}

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')

  useEffect(() => {
    fetchLessons()
  }, [])

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

  const handleStatusChange = async (id: string, status: string) => {
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

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return

    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        setLessons(prev => prev.filter(lesson => lesson.id !== id))
        setSelectedLessons(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedLessons.size === 0) return

    const lessonIds = Array.from(selectedLessons)

    try {
      if (bulkAction === 'delete') {
        if (!confirm(`هل أنت متأكد من حذف ${lessonIds.length} درس؟`)) return

        const response = await fetch('/api/admin/lessons/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: lessonIds })
        })

        if (response.ok) {
          setLessons(prev => prev.filter(lesson => !selectedLessons.has(lesson.id)))
          setSelectedLessons(new Set())
        }
      } else {
        // Bulk status change
        const response = await fetch('/api/admin/lessons/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: lessonIds, status: bulkAction })
        })

        if (response.ok) {
          setLessons(prev =>
            prev.map(lesson =>
              selectedLessons.has(lesson.id)
                ? { ...lesson, status: bulkAction }
                : lesson
            )
          )
          setSelectedLessons(new Set())
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }

    setBulkAction('')
  }

  const toggleSelectAll = () => {
    if (selectedLessons.size === filteredLessons.length) {
      setSelectedLessons(new Set())
    } else {
      setSelectedLessons(new Set(filteredLessons.map(lesson => lesson.id)))
    }
  }

  const filteredLessons = lessons.filter(lesson => {
    const matchesFilter = filter === 'all' || lesson.status === filter
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lesson.excerpt && lesson.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الدروس...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الدروس</h1>
          <p className="text-gray-600">
            إجمالي الدروس: {lessons.length} | المنشور: {lessons.filter(l => l.status === 'PUBLISHED').length} | المسودة: {lessons.filter(l => l.status === 'DRAFT').length}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث في الدروس..."
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

            {/* Add Lesson */}
            <Link
              href="/admin/lessons/new"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              إضافة درس جديد
            </Link>
          </div>

          {/* Bulk Actions */}
          {selectedLessons.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  تم اختيار {selectedLessons.size} درس
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

        {/* Lessons Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-right">
                    <input
                      type="checkbox"
                      checked={selectedLessons.size === filteredLessons.length && filteredLessons.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-4 text-right font-medium text-gray-900">العنوان</th>
                  <th className="p-4 text-right font-medium text-gray-900">تاريخ النشر</th>
                  <th className="p-4 text-right font-medium text-gray-900">الحالة</th>
                  <th className="p-4 text-right font-medium text-gray-900">المشاهدات</th>
                  <th className="p-4 text-right font-medium text-gray-900">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredLessons.map((lesson, index) => (
                  <motion.tr
                    key={lesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedLessons.has(lesson.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedLessons)
                          if (e.target.checked) {
                            newSet.add(lesson.id)
                          } else {
                            newSet.delete(lesson.id)
                          }
                          setSelectedLessons(newSet)
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/admin/lessons/${lesson.id}/edit`}
                          className="font-medium text-blue-600 hover:text-blue-800 line-clamp-2"
                        >
                          {lesson.title}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">
                          <Link
                            href={`/lessons/${lesson.slug}`}
                            target="_blank"
                            className="hover:text-blue-600"
                          >
                            عرض الدرس ↗
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {lesson.publishedAt ? new Date(lesson.publishedAt).toLocaleDateString('ar-SA') : 'غير منشور'}
                    </td>
                    <td className="p-4">
                      <select
                        value={lesson.status}
                        onChange={(e) => handleStatusChange(lesson.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          lesson.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="PUBLISHED">منشور</option>
                        <option value="DRAFT">مسودة</option>
                      </select>
                    </td>
                    <td className="p-4 text-gray-600 text-center">
                      {lesson.viewCount || 0}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/lessons/${lesson.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          تحرير
                        </Link>
                        <button
                          onClick={() => handleDelete(lesson.id)}
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

          {filteredLessons.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p>لا توجد دروس مطابقة للبحث</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}