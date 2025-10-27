'use client'

import React, { useState, useEffect } from 'react'
import { ArticleStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Save, Eye, ArrowLeft, Upload, X, Plus, Trash2, ExternalLink } from 'lucide-react'

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

export default function SolutionEditor() {
  const router = useRouter()
  const isNewSolution = true // This page is always for new solutions

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
    status: ArticleStatus.DRAFT,
    authorName: '',
    metaTitle: '',
    metaDescription: ''
  })

  const [loading, setLoading] = useState(!isNewSolution)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'files' | 'seo'>('basic')

  useEffect(() => {
    // For new solutions, we don't need to fetch anything
    if (!isNewSolution) {
      fetchSolution()
    }
  }, [isNewSolution])

  const fetchSolution = async () => {
    // This function is not used for new solutions
    // but kept for consistency
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = isNewSolution 
        ? '/api/marketplace' 
        : `/api/marketplace/${solution.slug}`
      const method = isNewSolution ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/[أ-ي]/g, (match) => {
        // Simple transliteration for Arabic characters
        const arabicToLatin: { [key: string]: string } = {
          'أ': 'a', 'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
          'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
          'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
          'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'y', 'ة': 'h'
        };
        return arabicToLatin[match] || match;
      }) || `solution-${Date.now()}`;
  }

  const handleTitleChange = (title: string) => {
    setSolution(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }))
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setSolution(prev => ({ ...prev, featuredImage: data.imageUrl }))
      } else {
        const error = await response.json()
        alert(`خطأ في رفع الصورة: ${error.error}`)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('حدث خطأ أثناء رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload-file', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)
        setSolution(prev => ({
          ...prev,
          fileUrl: data.fileUrl,
          fileSize: `${fileSizeInMB} MB`,
          fileType: file.name.split('.').pop()?.toUpperCase() || ''
        }))
      } else {
        const error = await response.json()
        alert(`خطأ في رفع الملف: ${error.error}`)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('حدث خطأ أثناء رفع الملف')
    } finally {
      setUploadingFile(false)
    }
  }

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/marketplace"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة إلى المتجر
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-primary-600" />
                {isNewSolution ? 'إضافة حل جديد' : 'تعديل الحل'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isNewSolution ? 'أضف حل جديد إلى المتجر' : 'تعديل معلومات الحل'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSolution(prev => ({ 
                  ...prev, 
                  status: prev.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
                }))}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {solution.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`flex-1 px-6 py-3 text-sm font-medium ${
                  activeTab === 'basic'
                    ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                    : 'bg-gray-50 text-gray-600 hover:text-gray-900'
                }`}
              >
                المعلومات الأساسية
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('files')}
                className={`flex-1 px-6 py-3 text-sm font-medium ${
                  activeTab === 'files'
                    ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                    : 'bg-gray-50 text-gray-600 hover:text-gray-900'
                }`}
              >
                الملفات والروابط
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`flex-1 px-6 py-3 text-sm font-medium ${
                  activeTab === 'seo'
                    ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                    : 'bg-gray-50 text-gray-600 hover:text-gray-900'
                }`}
              >
                SEO والإعدادات
              </button>
            </div>

            <div className="p-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العنوان <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={solution.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="مثال: أداة تحليل الشبكات المتقدمة"
                      required
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="advanced-network-analysis-tool"
                    />
                  </div>

                  {/* Solution Type and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نوع الحل <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={solution.solutionType}
                        onChange={(e) => setSolution(prev => ({ ...prev, solutionType: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        {SOLUTION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        التصنيف
                      </label>
                      <input
                        type="text"
                        value={solution.category || ''}
                        onChange={(e) => setSolution(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="مثال: تحليل مكاني"
                      />
                    </div>
                  </div>

                  {/* Version and Compatibility */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الإصدار
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
                        placeholder='["ArcGIS Pro 3.x", "QGIS 3.x"]'
                      />
                      <p className="text-xs text-gray-500 mt-1">أدخل JSON array مثال: ["ArcGIS Pro 3.x"]</p>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المقتطف
                    </label>
                    <textarea
                      value={solution.excerpt || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, excerpt: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={2}
                      placeholder="وصف مختصر يظهر في البطاقات..."
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الوصف الكامل <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={solution.description}
                      onChange={(e) => setSolution(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={8}
                      placeholder="وصف تفصيلي للحل..."
                      required
                    />
                  </div>

                  {/* Requirements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المتطلبات
                    </label>
                    <textarea
                      value={solution.requirements || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, requirements: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="المتطلبات اللازمة لتشغيل الحل..."
                    />
                  </div>

                  {/* Featured Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الصورة البارزة
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {solution.featuredImage ? (
                        <div className="relative">
                          <img
                            src={solution.featuredImage}
                            alt="Featured"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setSolution(prev => ({ ...prev, featuredImage: '' }))}
                            className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-2">
                            <label className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-primary-600 hover:text-primary-500">
                                {uploadingImage ? 'جاري الرفع...' : 'اختر صورة'}
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                disabled={uploadingImage}
                              />
                            </label>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isFree"
                        checked={solution.isFree}
                        onChange={(e) => setSolution(prev => ({ 
                          ...prev, 
                          isFree: e.target.checked,
                          price: e.target.checked ? 0 : prev.price
                        }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isFree" className="mr-2 block text-sm text-gray-700">
                        حل مجاني
                      </label>
                    </div>

                    {!solution.isFree && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            السعر
                          </label>
                          <input
                            type="number"
                            value={solution.price || 0}
                            onChange={(e) => setSolution(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            step="0.01"
                            min="0"
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
                            <option value="SAR">SAR</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الوسوم
                    </label>
                    <input
                      type="text"
                      value={solution.tags || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="GIS, Python, Analysis, Network (افصل بفاصلة)"
                    />
                  </div>
                </div>
              )}

              {/* Files & Links Tab */}
              {activeTab === 'files' && (
                <div className="space-y-6">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملف التحميل الرئيسي
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {solution.fileUrl ? (
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Package className="w-8 h-8 text-primary-600" />
                            <div>
                              <p className="font-medium text-gray-900">ملف مرفوع</p>
                              <p className="text-sm text-gray-500">
                                {solution.fileSize} • {solution.fileType}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSolution(prev => ({ 
                              ...prev, 
                              fileUrl: '', 
                              fileSize: '', 
                              fileType: '' 
                            }))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-2">
                            <label className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-primary-600 hover:text-primary-500">
                                {uploadingFile ? 'جاري الرفع...' : 'اختر ملف'}
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                disabled={uploadingFile}
                              />
                            </label>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">أي نوع ملف • حتى 100MB</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      يمكنك أيضاً إدخال رابط مباشر في الحقل أدناه
                    </p>
                    <input
                      type="url"
                      value={solution.fileUrl || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, fileUrl: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mt-2"
                      placeholder="https://example.com/download/file.zip"
                    />
                  </div>

                  {/* Demo URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رابط العرض التجريبي
                    </label>
                    <div className="relative">
                      <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={solution.demoUrl || ''}
                        onChange={(e) => setSolution(prev => ({ ...prev, demoUrl: e.target.value }))}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://demo.example.com"
                      />
                    </div>
                  </div>

                  {/* Documentation URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رابط التوثيق
                    </label>
                    <div className="relative">
                      <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={solution.documentationUrl || ''}
                        onChange={(e) => setSolution(prev => ({ ...prev, documentationUrl: e.target.value }))}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://docs.example.com"
                      />
                    </div>
                  </div>

                  {/* Source Code URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رابط الكود المصدري (GitHub)
                    </label>
                    <div className="relative">
                      <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={solution.sourceCodeUrl || ''}
                        onChange={(e) => setSolution(prev => ({ ...prev, sourceCodeUrl: e.target.value }))}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://github.com/username/repo"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  {/* Author Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم المؤلف/المطور
                    </label>
                    <input
                      type="text"
                      value={solution.authorName || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, authorName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="اسم المطور أو الشركة"
                    />
                  </div>

                  {/* Meta Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان SEO
                    </label>
                    <input
                      type="text"
                      value={solution.metaTitle || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, metaTitle: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="عنوان يظهر في محركات البحث"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(solution.metaTitle || '').length}/60 حرف (الموصى به)
                    </p>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      وصف SEO
                    </label>
                    <textarea
                      value={solution.metaDescription || ''}
                      onChange={(e) => setSolution(prev => ({ ...prev, metaDescription: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="وصف يظهر في نتائج البحث"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(solution.metaDescription || '').length}/160 حرف (الموصى به)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <Link
              href="/admin/marketplace"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-2 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الحل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
