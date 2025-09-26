'use client'

import { useState, useEffect } from 'react'
import { Article, ArticleStatus } from '@prisma/client'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface ArticleWithStats extends Article {
  imageCount?: number
}

export default function AdminPage() {
  const [articles, setArticles] = useState<ArticleWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/admin/articles')
      const data = await response.json()
      setArticles(data)
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
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
        setSelectedArticles(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedArticles.size === 0) return

    const articleIds = Array.from(selectedArticles)
    
    try {
      if (bulkAction === 'delete') {
        if (!confirm(`هل أنت متأكد من حذف ${articleIds.length} مقال؟`)) return
        
        const response = await fetch('/api/admin/articles/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: articleIds })
        })

        if (response.ok) {
          setArticles(prev => prev.filter(article => !selectedArticles.has(article.id)))
          setSelectedArticles(new Set())
        }
      } else {
        // Bulk status change
        const response = await fetch('/api/admin/articles/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: articleIds, status: bulkAction })
        })

        if (response.ok) {
          setArticles(prev => 
            prev.map(article => 
              selectedArticles.has(article.id) 
                ? { ...article, status: bulkAction as ArticleStatus }
                : article
            )
          )
          setSelectedArticles(new Set())
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }

    setBulkAction('')
  }

  const toggleSelectAll = () => {
    if (selectedArticles.size === filteredArticles.length) {
      setSelectedArticles(new Set())
    } else {
      setSelectedArticles(new Set(filteredArticles.map(article => article.id)))
    }
  }

  const filteredArticles = articles.filter(article => {
    const matchesFilter = filter === 'all' || article.status === filter
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المقالات</h1>
          <p className="text-gray-600">
            إجمالي المقالات: {articles.length} | المنشور: {articles.filter(a => a.status === ArticleStatus.PUBLISHED).length} | المسودة: {articles.filter(a => a.status === ArticleStatus.DRAFT).length}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث في المقالات..."
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

            {/* Add Article */}
            <Link
              href="/admin/articles/new"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              إضافة مقال جديد
            </Link>
          </div>

          {/* Bulk Actions */}
          {selectedArticles.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  تم اختيار {selectedArticles.size} مقال
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

        {/* Articles Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-right">
                    <input
                      type="checkbox"
                      checked={selectedArticles.size === filteredArticles.length && filteredArticles.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-4 text-right font-medium text-gray-900">العنوان</th>
                  <th className="p-4 text-right font-medium text-gray-900">تاريخ النشر</th>
                  <th className="p-4 text-right font-medium text-gray-900">الحالة</th>
                  <th className="p-4 text-right font-medium text-gray-900">الصور</th>
                  <th className="p-4 text-right font-medium text-gray-900">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article, index) => (
                  <motion.tr
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedArticles.has(article.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedArticles)
                          if (e.target.checked) {
                            newSet.add(article.id)
                          } else {
                            newSet.delete(article.id)
                          }
                          setSelectedArticles(newSet)
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="font-medium text-blue-600 hover:text-blue-800 line-clamp-2"
                        >
                          {article.title}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">
                          <Link
                            href={`/articles/${article.slug}`}
                            target="_blank"
                            className="hover:text-blue-600"
                          >
                            عرض المقال ↗
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('ar-SA') : 'غير منشور'}
                    </td>
                    <td className="p-4">
                      <select
                        value={article.status}
                        onChange={(e) => handleStatusChange(article.id, e.target.value as ArticleStatus)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          article.status === ArticleStatus.PUBLISHED
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value={ArticleStatus.PUBLISHED}>منشور</option>
                        <option value={ArticleStatus.DRAFT}>مسودة</option>
                      </select>
                    </td>
                    <td className="p-4 text-gray-600 text-center">
                      {article.imageCount || 0}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          تحرير
                        </Link>
                        <button
                          onClick={() => handleDelete(article.id)}
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

          {filteredArticles.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p>لا توجد مقالات مطابقة للبحث</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}