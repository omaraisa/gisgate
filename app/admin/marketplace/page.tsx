'use client'

import { useState, useEffect } from 'react'
import { ArticleStatus } from '@prisma/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, Plus, Search, Filter, Download, DollarSign, Eye, Star } from 'lucide-react'

interface Solution {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  solutionType: string
  status: ArticleStatus
  publishedAt?: Date | null
  updatedAt: Date
  price?: number | null
  currency?: string | null
  isFree: boolean
  downloadCount: number
  rating?: number | null
  reviewCount: number
  viewCount: number
  version?: string | null
}

export default function AdminMarketplacePage() {
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchSolutions()
  }, [])

  const fetchSolutions = async () => {
    try {
      const response = await fetch('/api/marketplace?limit=100')
      const data = await response.json()
      setSolutions(data.solutions || [])
    } catch (error) {
      console.error('Error fetching solutions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحل؟')) return

    try {
      const response = await fetch(`/api/marketplace/${slug}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSolutions(prev => prev.filter(solution => solution.id !== id))
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error deleting solution:', error)
    }
  }

  const filteredSolutions = solutions.filter(solution => {
    const matchesStatus = filter === 'all' || solution.status === filter
    const matchesType = typeFilter === 'all' || solution.solutionType === typeFilter
    const matchesSearch = !searchTerm || 
      solution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solution.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesType && matchesSearch
  })

  const stats = {
    total: solutions.length,
    published: solutions.filter(s => s.status === 'PUBLISHED').length,
    draft: solutions.filter(s => s.status === 'DRAFT').length,
    free: solutions.filter(s => s.isFree).length,
    paid: solutions.filter(s => !s.isFree).length,
    totalDownloads: solutions.reduce((sum, s) => sum + s.downloadCount, 0),
  }

  const solutionTypes = Array.from(new Set(solutions.map(s => s.solutionType)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-primary-600" />
                إدارة المتجر
              </h1>
              <p className="text-gray-600 mt-2">إدارة حلول نظم المعلومات الجغرافية</p>
            </div>
            <Link 
              href="/admin/marketplace/new"
              className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة حل جديد
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm mb-1">المجموع</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm mb-1">منشور</div>
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm mb-1">مسودة</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm mb-1">مجاني</div>
              <div className="text-2xl font-bold text-blue-600">{stats.free}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm mb-1">مدفوع</div>
              <div className="text-2xl font-bold text-purple-600">{stats.paid}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm mb-1 flex items-center gap-1">
                <Download className="w-3 h-3" />
                التحميلات
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.totalDownloads}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="PUBLISHED">منشور</option>
                <option value="DRAFT">مسودة</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">جميع الأنواع</option>
                {solutionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Solutions Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العنوان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    السعر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإحصائيات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSolutions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      لا توجد حلول
                    </td>
                  </tr>
                ) : (
                  filteredSolutions.map((solution) => (
                    <tr key={solution.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{solution.title}</div>
                          <div className="text-sm text-gray-500">{solution.excerpt?.substring(0, 50)}...</div>
                          {solution.version && (
                            <div className="text-xs text-gray-400 mt-1">v{solution.version}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {solution.solutionType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {solution.isFree ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            مجاني
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">
                            {solution.price} {solution.currency}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {solution.downloadCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {solution.viewCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {solution.rating?.toFixed(1) || 0} ({solution.reviewCount})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          solution.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {solution.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/marketplace/${solution.id}/edit`}
                            className="text-primary-600 hover:text-primary-900 font-medium text-sm"
                          >
                            تعديل
                          </Link>
                          <button
                            onClick={() => handleDelete(solution.id, solution.slug)}
                            className="text-red-600 hover:text-red-900 font-medium text-sm"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
