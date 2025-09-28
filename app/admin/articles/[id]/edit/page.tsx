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
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import { Underline } from '@tiptap/extension-underline'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Placeholder } from '@tiptap/extension-placeholder'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Typography } from '@tiptap/extension-typography'

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
      ImageExtension,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'ابدأ في كتابة محتوى المقال هنا...',
      }),
      CharacterCount,
      Typography,
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">محتوى المقال</h3>
                <div className="text-xs text-gray-500">
                  <span className="mr-4">Ctrl+B: عريض</span>
                  <span className="mr-4">Ctrl+I: مائل</span>
                  <span className="mr-4">Ctrl+U: تحتي</span>
                  <span>Ctrl+Z: تراجع</span>
                </div>
              </div>
              
            {/* Enhanced Editor Toolbar */}
            <div className="mb-4 border border-gray-300 rounded-t-md bg-gray-50">
              {/* Main Formatting Row */}
              <div className="flex flex-wrap gap-1 p-3 border-b border-gray-200">
                {/* Text Formatting */}
                <div className="flex gap-1 mr-4">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`px-3 py-2 rounded text-sm font-bold ${editor?.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="عريض"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`px-3 py-2 rounded text-sm italic ${editor?.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="مائل"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    className={`px-3 py-2 rounded text-sm underline ${editor?.isActive('underline') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="تحتي"
                  >
                    U
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    className={`px-3 py-2 rounded text-sm line-through ${editor?.isActive('strike') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="مشطوب"
                  >
                    S
                  </button>
                </div>

                {/* Headings */}
                <div className="flex gap-1 mr-4">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().setParagraph().run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive('paragraph') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="فقرة عادية"
                  >
                    ¶
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`px-3 py-2 rounded text-sm font-bold ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="عنوان رئيسي"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-3 py-2 rounded text-sm font-bold ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="عنوان فرعي"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`px-3 py-2 rounded text-sm font-bold ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="عنوان ثانوي"
                  >
                    H3
                  </button>
                </div>

                {/* Lists */}
                <div className="flex gap-1 mr-4">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="قائمة نقاط"
                  >
                    •
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="قائمة مرقمة"
                  >
                    1.
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleTaskList().run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive('taskList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="قائمة مهام"
                  >
                    ☑
                  </button>
                </div>

                {/* Text Effects */}
                <div className="flex gap-1 mr-4">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleSubscript().run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive('subscript') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="حرف سفلي"
                  >
                    x₂
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive('superscript') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="حرف علوي"
                  >
                    x²
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleCode().run()}
                    className={`px-3 py-2 rounded text-sm font-mono ${editor?.isActive('code') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="كود"
                  >
                    &lt;/&gt;
                  </button>
                </div>

                {/* Colors and Highlight */}
                <div className="flex gap-1 mr-4">
                  <input
                    type="color"
                    onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    title="لون النص"
                  />
                  <input
                    type="color"
                    onChange={(e) => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    title="تمييز النص"
                    defaultValue="#ffff00"
                  />
                </div>

                {/* Alignment */}
                <div className="flex gap-1 mr-4">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive({ textAlign: 'left' }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="محاذاة لليسار"
                  >
                    ⬅
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive({ textAlign: 'center' }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="توسيط"
                  >
                    ⬌
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive({ textAlign: 'right' }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="محاذاة لليمين"
                  >
                    ➡
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="ضبط"
                  >
                    ⬌⬅
                  </button>
                </div>

                {/* Special Elements */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive('blockquote') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="اقتباس"
                  >
                    &quot;
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive('horizontalRule') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="خط أفقي"
                  >
                    ―
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = window.prompt('أدخل رابط URL:')
                      if (url) {
                        editor?.chain().focus().setLink({ href: url }).run()
                      }
                    }}
                    className={`px-3 py-2 rounded text-sm ${editor?.isActive('link') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                    title="إدراج رابط"
                  >
                    🔗
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().unsetLink().run()}
                    className="px-3 py-2 rounded text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                    title="إزالة الرابط"
                  >
                    ❌
                  </button>
                </div>
              </div>

              {/* Second Row - Additional Tools */}
              <div className="flex flex-wrap gap-1 p-3">
                {/* Undo/Redo */}
                <div className="flex gap-1 mr-4">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().undo().run()}
                    disabled={!editor?.can().undo()}
                    className="px-3 py-2 rounded text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="تراجع"
                  >
                    ↶
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().redo().run()}
                    disabled={!editor?.can().redo()}
                    className="px-3 py-2 rounded text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="إعادة"
                  >
                    ↷
                  </button>
                </div>

                {/* Character Count */}
                <div className="flex items-center text-sm text-gray-600 mr-4">
                  <span>{editor?.storage?.characterCount?.characters() || 0} حرف</span>
                  <span className="mx-2">•</span>
                  <span>{editor?.storage?.characterCount?.words() || 0} كلمة</span>
                </div>

                {/* Clear Formatting */}
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().unsetAllMarks().run()}
                  className="px-3 py-2 rounded text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  title="مسح التنسيق"
                >
                  🧹 تنسيق
                </button>
              </div>
            </div>

              {/* Editor Content */}
              <div className="border border-gray-300 rounded-b-md min-h-[500px] overflow-y-auto">
                <div className="p-6 prose prose-sm max-w-none focus:outline-none" style={{ direction: 'rtl' }}>
                  <EditorContent 
                    editor={editor} 
                    className="min-h-[450px] focus:outline-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-blockquote:border-r-4 prose-blockquote:border-gray-300 prose-blockquote:pr-4 prose-blockquote:italic prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                  />
                </div>
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