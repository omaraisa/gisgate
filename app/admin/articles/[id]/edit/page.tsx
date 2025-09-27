'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ArticleStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'

interface ExtendedArticle {
  id?: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featuredImage?: string
  status: ArticleStatus
  publishedAt?: Date | null
  category?: string
  tags?: string
  metaTitle?: string
  metaDescription?: string
}

interface ArticleEditorProps {
  params: Promise<{ id: string }>
}

export default function ArticleEditor({ params }: ArticleEditorProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const isNewArticle = resolvedParams.id === 'new'
  
  const [article, setArticle] = useState<ExtendedArticle>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    status: ArticleStatus.DRAFT,
    category: '',
    tags: '',
    metaTitle: '',
    metaDescription: ''
  })
  const [loading, setLoading] = useState(!isNewArticle)
  const [saving, setSaving] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
      }),
      ImageExtension
    ],
    content: article.content,
    onUpdate: ({ editor }) => {
      setArticle(prev => ({ ...prev, content: editor.getHTML() }))
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && article.content !== editor.getHTML()) {
      editor.commands.setContent(article.content)
    }
  }, [editor, article.content])

  const fetchArticle = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/articles/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setArticle(data)
      } else {
        console.error('Article not found')
        router.push('/admin')
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, router])

  useEffect(() => {
    if (!isNewArticle) {
      fetchArticle()
    }
  }, [resolvedParams.id, isNewArticle, fetchArticle])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '') // Keep Arabic, English, numbers, spaces, hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  const handleSave = async (status?: ArticleStatus) => {
    setSaving(true)
    
    try {
      const saveData = {
        ...article,
        status: status || article.status,
        publishedAt: (status === ArticleStatus.PUBLISHED || article.status === ArticleStatus.PUBLISHED) 
          ? new Date().toISOString() 
          : null
      }

      // Generate slug if not provided
      if (!saveData.slug && saveData.title) {
        saveData.slug = generateSlug(saveData.title)
      }

      const url = isNewArticle 
        ? '/api/admin/articles/create'
        : `/api/admin/articles/${resolvedParams.id}`
      
      const method = isNewArticle ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      })

      if (response.ok) {
        const savedArticle = await response.json()
        if (isNewArticle) {
          router.push(`/admin/articles/${savedArticle.id}/edit`)
        } else {
          setArticle(savedArticle)
        }
        
        // Show success message
        alert(status === ArticleStatus.PUBLISHED ? 'تم نشر المقال بنجاح!' : 'تم حفظ المقال بنجاح!')
      } else {
        const error = await response.json()
        alert(`خطأ في الحفظ: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving article:', error)
      alert('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المقال...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isNewArticle ? 'إضافة مقال جديد' : 'تحرير المقال'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/admin" className="hover:text-blue-600">
                ← العودة لإدارة المقالات
              </Link>
              {!isNewArticle && article.slug && (
                <Link 
                  href={`/articles/${article.slug}`} 
                  target="_blank"
                  className="hover:text-blue-600"
                >
                  عرض المقال ↗
                </Link>
              )}
            </div>
          </div>

          {/* Save Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(ArticleStatus.DRAFT)}
              disabled={saving}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
            </button>
            <button
              onClick={() => handleSave(ArticleStatus.PUBLISHED)}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? 'جاري النشر...' : 'نشر المقال'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">معلومات أساسية</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان المقال *
                  </label>
                  <input
                    type="text"
                    value={article.title || ''}
                    onChange={(e) => setArticle((prev: ExtendedArticle) => ({ 
                      ...prev, 
                      title: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل عنوان المقال"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الرابط (Slug) *
                  </label>
                  <input
                    type="text"
                    value={article.slug || ''}
                    onChange={(e) => setArticle((prev: ExtendedArticle) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="article-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    مقدمة المقال
                  </label>
                  <textarea
                    value={article.excerpt || ''}
                    onChange={(e) => setArticle((prev: ExtendedArticle) => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="مقدمة مختصرة عن المقال"
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">محتوى المقال</h3>
              
              {/* Editor Toolbar */}
              <div className="mb-4 flex flex-wrap gap-2 p-3 border border-gray-300 rounded-t-md bg-gray-50">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`px-3 py-1 rounded text-sm ${editor?.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`px-3 py-1 rounded text-sm ${editor?.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`px-3 py-1 rounded text-sm ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`px-3 py-1 rounded text-sm ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`px-3 py-1 rounded text-sm ${editor?.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  • قائمة
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`px-3 py-1 rounded text-sm ${editor?.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  1. قائمة
                </button>
              </div>

              {/* Editor Content */}
              <div className="prose prose-sm max-w-none border border-gray-300 rounded-b-md min-h-[400px] p-4">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">إعدادات النشر</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    حالة المقال
                  </label>
                  <select
                    value={article.status || ArticleStatus.DRAFT}
                    onChange={(e) => setArticle((prev: ExtendedArticle) => ({ ...prev, status: e.target.value as ArticleStatus }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={ArticleStatus.DRAFT}>مسودة</option>
                    <option value={ArticleStatus.PUBLISHED}>منشور</option>
                    <option value={ArticleStatus.ARCHIVED}>مؤرشف</option>
                  </select>
                </div>

                {/* Publication Date */}
                {article.publishedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ النشر (ميلادي)
                    </label>
                    <input
                      type="text"
                      value={new Date(article.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* Categories & Tags */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">التصنيف والوسوم</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التصنيف
                  </label>
                  <input
                    type="text"
                    value={article.category || ''}
                                        onChange={(e) => setArticle((prev: ExtendedArticle) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="تصنيف المقال"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوسوم (مفصولة بفاصلة)
                  </label>
                  <input
                    type="text"
                    value={article.tags || ''}
                    onChange={(e) => setArticle((prev: ExtendedArticle) => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="وسم1, وسم2, وسم3"
                  />
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">الصورة البارزة</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رابط الصورة
                </label>
                <input
                  type="url"
                  value={article.featuredImage || ''}
                  onChange={(e) => setArticle((prev: ExtendedArticle) => ({ ...prev, featuredImage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                
                {article.featuredImage && (
                  <div className="mt-3">
                    <Image
                      src={article.featuredImage}
                      alt="معاينة الصورة"
                      width={400}
                      height={128}
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">إعدادات SEO</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان SEO
                  </label>
                  <input
                    type="text"
                    value={article.metaTitle || ''}
                    onChange={(e) => setArticle((prev: ExtendedArticle) => ({ ...prev, metaTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="عنوان محسن لمحركات البحث"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(article.metaTitle || '').length}/60 حرف
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وصف SEO
                  </label>
                  <textarea
                    value={article.metaDescription || ''}
                    onChange={(e) => setArticle((prev: ExtendedArticle) => ({ ...prev, metaDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="وصف محسن لمحركات البحث"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(article.metaDescription || '').length}/160 حرف
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}