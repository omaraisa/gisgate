'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ArticleStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Save, Eye, ArrowLeft, Upload, X, Trash2, ExternalLink } from 'lucide-react'

const SOLUTION_TYPES = [
  { value: 'TOOL', label: 'أداة' },
  { value: 'ADDIN', label: 'إضافة' },
  { value: 'PLUGIN', label: 'مكون إضافي' },
  { value: 'SCRIPT', label: 'سكريبت' },
  { value: 'DATASET', label: 'مجموعة بيانات' },
  { value: 'TEMPLATE', label: 'قالب' },
  { value: 'TOOLBOX', label: 'صندوق أدوات' },
  { value: 'MODEL', label: 'نموذج' },
  { value: 'STYLE', label: 'ستايل' },
  { value: 'WIDGET', label: 'ويدجت' },
  { value: 'APPLICATION', label: 'تطبيق' },
  { value: 'SERVICE', label: 'خدمة' },
  { value: 'EXTENSION', label: 'امتداد' },
  { value: 'LIBRARY', label: 'مكتبة' },
  { value: 'CONFIGURATION', label: 'ملف إعدادات' },
  { value: 'OTHER', label: 'أخرى' }
]

interface Solution {
  id?: string
  title: string
  slug: string
  description: string
  excerpt?: string
  featuredImage?: string
  images?: string
  solutionType: string
  category?: string
  tags?: string
  price?: number
  currency?: string
  isFree: boolean
  fileUrl?: string
  fileSize?: string
  fileType?: string
  demoUrl?: string
  documentationUrl?: string
  sourceCodeUrl?: string
  version?: string
  compatibility?: string
  requirements?: string
  status: ArticleStatus
  publishedAt?: Date | null
  authorName?: string
  metaTitle?: string
  metaDescription?: string
}

interface SolutionEditorProps {
  params: Promise<{ id: string }>
}

export default function SolutionEditPage({ params }: SolutionEditorProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const solutionId = resolvedParams.id

  const [solution, setSolution] = useState<Solution>({
    title: '',
    slug: '',
    description: '',
    excerpt: '',
    featuredImage: '',
    solutionType: 'TOOL',
    category: '',
    tags: '',
    price: 0,
    currency: 'USD',
    isFree: true,
    fileUrl: '',
    fileSize: '',
    fileType: '',
    demoUrl: '',
    documentationUrl: '',
    sourceCodeUrl: '',
    version: '1.0.0',
    compatibility: '',
    requirements: '',
    status: ArticleStatus.PUBLISHED, // سيتم تحديثها من البيانات المجلوبة
    authorName: '',
    metaTitle: '',
    metaDescription: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'files' | 'seo'>('basic')

  const fetchSolution = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/marketplace/${solutionId}`)
      if (response.ok) {
        const data = await response.json()
        setSolution(data)
      } else {
        console.error('Failed to fetch solution')
      }
    } catch (error) {
      console.error('Error fetching solution:', error)
    } finally {
      setLoading(false)
    }
  }, [solutionId])

  useEffect(() => {
    fetchSolution()
  }, [solutionId, fetchSolution])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/marketplace/${solution.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(solution)
      })

      if (response.ok) {
        router.push('/admin/marketplace')
      } else {
        const error = await response.json()
        alert(`خطأ: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving solution:', error)
      alert('حدث خطأ أثناء حفظ الحل')
    } finally {
      setSaving(false)
    }
  }

  const handleTitleChange = (title: string) => {
    setSolution(prev => ({
      ...prev,
      title,
      // Don't auto-generate slug for existing solutions
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSolution(prev => ({ ...prev, featuredImage: data.imageUrl }))
      } else {
        alert('فشل تحميل الصورة')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('حدث خطأ أثناء تحميل الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/admin/upload-file', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSolution(prev => ({
          ...prev,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          fileType: data.fileType
        }))
      } else {
        alert('فشل تحميل الملف')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('حدث خطأ أثناء تحميل الملف')
    } finally {
      setUploadingFile(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin/marketplace"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة إلى القائمة
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-primary-600" />
              تعديل الحل
            </h1>
          </div>
          <div className="flex gap-3">
            {solution.slug && (
              <Link
                href={`/marketplace/${solution.slug}`}
                target="_blank"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                معاينة
              </Link>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'basic'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  المعلومات الأساسية
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('files')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'files'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  الملفات والروابط
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('seo')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'seo'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  SEO
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Basic Info Tab - Continuing from the file... */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العنوان *
                    </label>
                    <input
                      type="text"
                      required
                      value={solution.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="عنوان الحل..."
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الرابط (Slug)
                    </label>
                    <input
                      type="text"
                      value={solution.slug}
                      onChange={(e) => setSolution(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
                      placeholder="solution-slug"
                      readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500">لا يمكن تعديل الرابط بعد الإنشاء</p>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      مقتطف قصير
                    </label>
                    <textarea
                      value={solution.excerpt || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, excerpt: e.target.value }))}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="وصف مختصر للحل..."
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الوصف الكامل *
                    </label>
                    <textarea
                      required
                      value={solution.description}
                      onChange={(e) => setSolution(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="وصف تفصيلي للحل وميزاته..."
                    />
                  </div>

                  {/* Type and Category Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نوع الحل *
                      </label>
                      <select
                        required
                        value={solution.solutionType}
                        onChange={(e) => setSolution(prev => ({ ...prev, solutionType: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {SOLUTION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الفئة
                      </label>
                      <input
                        type="text"
                        value={solution.category || ''}
                        onChange={(e) => setSolution(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="مثال: &quot;ArcGIS&quot;, &quot;QGIS&quot;..."
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الوسوم (مفصولة بفواصل)
                    </label>
                    <input
                      type="text"
                      value={solution.tags || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="GIS, تحليل مكاني, خرائط..."
                    />
                  </div>

                  {/* Price Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="isFree"
                        checked={solution.isFree}
                        onChange={(e) => setSolution(prev => ({ ...prev, isFree: e.target.checked, price: e.target.checked ? 0 : prev.price }))}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="isFree" className="text-sm font-medium text-gray-700">
                        حل مجاني
                      </label>
                    </div>

                    {!solution.isFree && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            السعر *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={solution.price || 0}
                            onChange={(e) => setSolution(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            العملة
                          </label>
                          <select
                            value={solution.currency || 'USD'}
                            onChange={(e) => setSolution(prev => ({ ...prev, currency: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Version and Compatibility */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الإصدار
                      </label>
                      <input
                        type="text"
                        value={solution.version || ''}
                        onChange={(e) => setSolution(prev => ({ ...prev, version: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="1.0.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        التوافق
                      </label>
                      <input
                        type="text"
                        value={solution.compatibility || ''}
                        onChange={(e) => setSolution(prev => ({ ...prev, compatibility: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="ArcGIS Pro 3.0+"
                      />
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المتطلبات
                    </label>
                    <textarea
                      value={solution.requirements || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, requirements: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="المتطلبات البرمجية أو الأجهزة المطلوبة..."
                    />
                  </div>

                  {/* Author Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم المطور
                    </label>
                    <input
                      type="text"
                      value={solution.authorName || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, authorName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="اسم مطور الحل..."
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الحالة
                    </label>
                    <select
                      value={solution.status}
                      onChange={(e) => setSolution(prev => ({ 
                        ...prev, 
                        status: e.target.value as ArticleStatus,
                        publishedAt: e.target.value === 'PUBLISHED' ? (prev.publishedAt || new Date()) : null
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="DRAFT">مسودة</option>
                      <option value="PUBLISHED">منشور</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className="space-y-6">
                  {/* Featured Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الصورة المميزة
                    </label>
                    {solution.featuredImage && (
                      <div className="mb-4 relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={solution.featuredImage}
                          alt="Featured"
                          className="w-48 h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => setSolution(prev => ({ ...prev, featuredImage: '' }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {uploadingImage ? 'جاري الرفع...' : 'اختر صورة'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Solution File */}
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملف الحل
                    </label>
                    {solution.fileUrl && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900 mb-1">ملف محمل</div>
                            <div className="text-sm text-gray-600">
                              النوع: {solution.fileType} | الحجم: {solution.fileSize}
                            </div>
                            <a
                              href={solution.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              معاينة الملف
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSolution(prev => ({ ...prev, fileUrl: '', fileSize: '', fileType: '' }))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                    <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 inline-flex">
                      <Upload className="w-4 h-4" />
                      {uploadingFile ? 'جاري الرفع...' : 'اختر ملف'}
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadingFile}
                      />
                    </label>
                    <p className="mt-2 text-xs text-gray-500">الحد الأقصى: 100 ميجابايت</p>
                  </div>

                  {/* URLs */}
                  <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رابط التجربة (Demo URL) أو فيديو
                      </label>
                      <input
                        type="url"
                        value={solution.demoUrl || ''}
                        onChange={(e) => setSolution(prev => ({ ...prev, demoUrl: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://demo.example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رابط التوثيق (Documentation URL)
                      </label>
                      <input
                        type="url"
                        value={solution.documentationUrl || ''}
                        onChange={(e) => setSolution(prev => ({ ...prev, documentationUrl: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://docs.example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رابط الكود المصدري (Source Code URL)
                      </label>
                      <input
                        type="url"
                        value={solution.sourceCodeUrl || ''}
                        onChange={(e) => setSolution(prev => ({ ...prev, sourceCodeUrl: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان SEO
                    </label>
                    <input
                      type="text"
                      value={solution.metaTitle || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, metaTitle: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="عنوان محركات البحث..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {solution.metaTitle?.length || 0} / 60 حرف
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      وصف SEO
                    </label>
                    <textarea
                      value={solution.metaDescription || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, metaDescription: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="وصف محركات البحث..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {solution.metaDescription?.length || 0} / 160 حرف
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/marketplace"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
