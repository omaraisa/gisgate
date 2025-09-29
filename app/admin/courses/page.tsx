'use client'

import { useState, useEffect } from 'react'
import { ArticleStatus, CourseLevel } from '@prisma/client'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface CourseWithStats {
  id: string
  title: string
  slug: string
  description?: string | null
  excerpt?: string | null
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

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      const data = await response.json()
      setCourses(data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, status: ArticleStatus) => {
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

  const handleDelete = async (id: string) => {
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
      if (bulkAction === 'delete') {
        if (!confirm(`هل أنت متأكد من حذف ${itemIds.length} كورس؟`)) return

        const response = await fetch('/api/admin/courses/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: itemIds })
        })

        if (response.ok) {
          setCourses(prev => prev.filter(item => !selectedItems.has(item.id)))
          setSelectedItems(new Set())
        }
      } else {
        // Bulk status change
        const response = await fetch('/api/admin/courses/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: itemIds, status: bulkAction })
        })

        if (response.ok) {
          setCourses(prev =>
            prev.map(item =>
              selectedItems.has(item.id)
                ? { ...item, status: bulkAction as ArticleStatus }
                : item
            )
          )
          setSelectedItems(new Set())
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }

    setBulkAction('')
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredCourses.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredCourses.map(item => item.id)))
    }
  }

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
          <p className="mt-4 text-gray-600">جاري تحميل الكورسات...</p>
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
            إدارة الكورسات
          </h1>
          <p className="text-gray-600">
            إجمالي الكورسات: {courses.length} | 
            المنشور: {courses.filter(course => course.status === ArticleStatus.PUBLISHED).length} | 
            المسودة: {courses.filter(course => course.status === ArticleStatus.DRAFT).length}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث في الكورسات..."
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
              href="/admin/courses/new"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              إضافة كورس جديد
            </Link>
          </div>

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  تم اختيار {selectedItems.size} كورس
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

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-right">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredCourses.length && filteredCourses.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-4 text-right font-medium text-gray-900">العنوان</th>
                  <th className="p-4 text-right font-medium text-gray-900">المستوى</th>
                  <th className="p-4 text-right font-medium text-gray-900">السعر</th>
                  <th className="p-4 text-right font-medium text-gray-900">الحالة</th>
                  <th className="p-4 text-right font-medium text-gray-900">الدروس</th>
                  <th className="p-4 text-right font-medium text-gray-900">المسجلين</th>
                  <th className="p-4 text-right font-medium text-gray-900">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course, index) => (
                  <motion.tr
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(course.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedItems)
                          if (e.target.checked) {
                            newSet.add(course.id)
                          } else {
                            newSet.delete(course.id)
                          }
                          setSelectedItems(newSet)
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/admin/courses/${course.id}/edit`}
                          className="font-medium text-blue-600 hover:text-blue-800 line-clamp-2"
                        >
                          {course.title}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">
                          <Link
                            href={`/courses/${course.slug}`}
                            target="_blank"
                            className="hover:text-blue-600"
                          >
                            عرض الكورس ↗
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {course.level === CourseLevel.BEGINNER ? 'مبتدئ' :
                       course.level === CourseLevel.INTERMEDIATE ? 'متوسط' : 'متقدم'}
                    </td>
                    <td className="p-4 text-gray-600">
                      {course.isFree ? 'مجاني' : `${course.price} ${course.currency || 'USD'}`}
                    </td>
                    <td className="p-4">
                      <select
                        value={course.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as ArticleStatus
                          handleStatusChange(course.id, newStatus)
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          course.status === ArticleStatus.PUBLISHED
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value={ArticleStatus.PUBLISHED}>منشور</option>
                        <option value={ArticleStatus.DRAFT}>مسودة</option>
                      </select>
                    </td>
                    <td className="p-4 text-gray-600 text-center">
                      {course.lessonCount || 0}
                    </td>
                    <td className="p-4 text-gray-600 text-center">
                      {course.enrollmentCount || 0}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/courses/${course.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          تحرير
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
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

          {filteredCourses.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p>لا توجد كورسات مطابقة للبحث</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}