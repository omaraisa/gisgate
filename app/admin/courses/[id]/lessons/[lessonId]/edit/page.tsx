'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ArticleStatus } from '@prisma/client'
import { useRouter, useParams } from 'next/navigation'
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

interface ExtendedLesson {
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
  videoUrl?: string
  duration?: string
  thumbnail?: string
  order?: number
}

interface CourseLessonEditorProps {
  params: Promise<{ id: string; lessonId: string }>
}

export default function CourseLessonEditor({ params }: CourseLessonEditorProps) {
  const router = useRouter()
  const urlParams = useParams()
  const courseId = urlParams.id as string
  const resolvedParams = React.use(params)
  const isNewLesson = resolvedParams.lessonId === 'new'

  const [lesson, setLesson] = useState<ExtendedLesson>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    status: ArticleStatus.DRAFT,
    category: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    videoUrl: '',
    duration: '',
    thumbnail: '',
    order: 0
  })
  const [loading, setLoading] = useState(!isNewLesson)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isHtmlMode, setIsHtmlMode] = useState(false)

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
        placeholder: 'ابدأ في كتابة محتوى الدرس هنا...',
      }),
      CharacterCount,
      Typography,
    ],
    content: lesson.content,
    onUpdate: ({ editor }) => {
      setLesson(prev => ({ ...prev, content: editor.getHTML() }))
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && lesson.content !== editor.getHTML()) {
      editor.commands.setContent(lesson.content)
    }
  }, [editor, lesson.content])

  const fetchLesson = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/lessons/${resolvedParams.lessonId}`)
      if (response.ok) {
        const data = await response.json()
        setLesson(data)
      } else {
        console.error('Lesson not found')
        router.push(`/admin/courses/${courseId}/lessons`)
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
      router.push(`/admin/courses/${courseId}/lessons`)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.lessonId, courseId, router])

  useEffect(() => {
    if (!isNewLesson) {
      fetchLesson()
    }
  }, [resolvedParams.lessonId, isNewLesson, fetchLesson])

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
        ...lesson,
        status: status || lesson.status,
        publishedAt: (status === ArticleStatus.PUBLISHED || lesson.status === ArticleStatus.PUBLISHED)
          ? new Date().toISOString()
          : null
      }

      // Generate slug if not provided
      if (!saveData.slug && saveData.title) {
        saveData.slug = generateSlug(saveData.title)
      }

      const url = isNewLesson
        ? `/api/admin/courses/${courseId}/lessons`
        : `/api/admin/courses/${courseId}/lessons`

      const method = isNewLesson ? 'POST' : 'PATCH'

      const body = isNewLesson
        ? saveData
        : { lessonId: resolvedParams.lessonId, ...saveData }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const savedLesson = await response.json()
        if (isNewLesson) {
          router.push(`/admin/courses/${courseId}/lessons/${savedLesson.id}/edit`)
        } else {
          setLesson(savedLesson)
        }

        // Show success message
        // alert(status === ArticleStatus.PUBLISHED ? 'تم نشر الدرس بنجاح!' : 'تم حفظ الدرس بنجاح!')
      } else {
        const error = await response.json()
        alert(`خطأ في الحفظ: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
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
        setLesson(prev => ({ ...prev, featuredImage: data.url }))
      } else {
        alert('فشل في رفع الصورة')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('حدث خطأ أثناء رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  const addImageByUrl = () => {
    const url = window.prompt('أدخل رابط الصورة (URL):')
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }

  const handleContentImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
        editor?.chain().focus().setImage({ src: data.imageUrl }).run()
      } else {
        const error = await response.json()
        alert(`خطأ في رفع الصورة: ${error.error}`)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('حدث خطأ أثناء رفع الصورة')
    } finally {
      setUploadingImage(false)
      // Reset input
      event.target.value = ''
    }
  }

  const updateImageLink = () => {
    if (editor?.isActive('image')) {
      const currentUrl = editor.getAttributes('image').src
      const newUrl = window.prompt('تعديل رابط الصورة:', currentUrl)
      if (newUrl !== null && newUrl !== '') {
        editor.chain().focus().setImage({ src: newUrl }).run()
      }
    } else {
      alert('يجب تحديد صورة أولاً لتعديل رابطها')
    }
  }

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML to Rich Text, sync editor
      editor?.commands.setContent(lesson.content)
    }
    setIsHtmlMode(!isHtmlMode)
  }

  const localizeImages = async () => {
    if (!editor) return;

    const content = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const images = Array.from(doc.querySelectorAll('img'));
    
    // Server IP/Domain to check against
    const serverIp = '204.12.205.110';
    
    const externalImages = images.filter(img => {
      const src = img.getAttribute('src');
      return src && src.startsWith('http') && !src.includes(serverIp);
    });

    if (externalImages.length === 0) {
      alert('لا توجد صور خارجية لمعالجتها');
      return;
    }

    if (!confirm(`تم العثور على ${externalImages.length} صور خارجية. هل تريد تحميلها إلى سيرفرك وتحديث الروابط؟`)) {
      return;
    }

    setUploadingImage(true);
    let successCount = 0;

    try {
      for (const img of externalImages) {
        const externalUrl = img.getAttribute('src');
        if (!externalUrl) continue;

        try {
          const response = await fetch('/api/admin/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: externalUrl })
          });

          if (response.ok) {
            const data = await response.json();
            // Replace the URL in the temporary DOM
            img.setAttribute('src', data.imageUrl);
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to localize image: ${externalUrl}`, error);
        }
      }

      if (successCount > 0) {
        // Update the editor with the new content
        const updatedHtml = doc.body.innerHTML;
        editor.commands.setContent(updatedHtml);
        setLesson(prev => ({ ...prev, content: updatedHtml }));
        alert(`تم بنجاح معالجة وتثبيت ${successCount} صور من أصل ${externalImages.length}`);
      } else {
        alert('فشل في معالجة الصور الخارجية');
      }
    } catch (error) {
      console.error('Error in localizeImages:', error);
      alert('حدث خطأ أثناء معالجة الصور');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInputChange = (field: keyof ExtendedLesson, value: string | number) => {
    setLesson(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الدرس...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/admin/courses/${courseId}/lessons`}
              className="text-blue-600 hover:text-blue-800"
            >
              ← العودة لدروس الكورس
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isNewLesson ? 'إضافة درس جديد' : 'تحرير الدرس'}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عنوان الدرس *
            </label>
            <input
              type="text"
              value={lesson.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل عنوان الدرس"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الرابط (Slug)
            </label>
            <input
              type="text"
              value={lesson.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="سيتم إنشاؤه تلقائياً من العنوان"
            />
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ترتيب الدرس
            </label>
            <input
              type="number"
              value={lesson.order || 0}
              onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملخص الدرس
            </label>
            <textarea
              value={lesson.excerpt || ''}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="وصف مختصر للدرس"
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رابط الفيديو
            </label>
            <input
              type="url"
              value={lesson.videoUrl || ''}
              onChange={(e) => handleInputChange('videoUrl', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المدة الزمنية
            </label>
            <input
              type="text"
              value={lesson.duration || ''}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="مثال: 10:30"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الصورة البارزة
            </label>
            <div className="flex gap-4 items-start">
              <input
                type="url"
                value={lesson.featuredImage || ''}
                onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="رابط الصورة"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="px-4 py-2 border border-gray-300 rounded-lg"
                disabled={uploadingImage}
              />
            </div>
            {lesson.featuredImage && (
              <div className="mt-2">
                <Image
                  src={lesson.featuredImage}
                  alt="Featured"
                  width={200}
                  height={150}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
          </div>

          {/* Content Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                محتوى الدرس *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleHtmlMode}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${isHtmlMode ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-100 hover:bg-gray-700'}`}
                >
                  {isHtmlMode ? '👁️ عرض المحرر' : '</> HTML'}
                </button>
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white relative">
              {!isHtmlMode && (
                <div className="sticky top-[73px] z-20 flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 shadow-sm transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                    title="عريض"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                    title="مائل"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={addImageByUrl}
                    className="p-2 rounded hover:bg-gray-200"
                    title="إضافة صورة برابط"
                  >
                    🖼️ URL
                  </button>
                  <label className="p-2 rounded hover:bg-gray-200 cursor-pointer" title="رفع صورة">
                    📤 رفع
                    <input type="file" className="hidden" accept="image/*" onChange={handleContentImageUpload} />
                  </label>
                  <button
                    type="button"
                    onClick={updateImageLink}
                    className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('image') ? 'text-orange-600' : ''}`}
                    title="تعديل رابط الصورة"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={localizeImages}
                    className="p-1 px-2 rounded hover:bg-gray-200 text-blue-600"
                    title="توطين الصور الخارجية"
                  >
                    🛡️
                  </button>
                </div>
              )}

              {isHtmlMode ? (
                <textarea
                  value={lesson.content}
                  onChange={(e) => setLesson(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full min-h-[400px] p-4 font-mono text-sm border-0 focus:ring-0 resize-none bg-gray-900 text-gray-100"
                  style={{ direction: 'ltr' }}
                />
              ) : (
                <EditorContent
                  editor={editor}
                  className="min-h-[400px] p-4 prose max-w-none focus:outline-none"
                />
              )}

              {uploadingImage && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {editor && !isHtmlMode && (
              <div className="mt-2 text-sm text-gray-500">
                {editor.storage.characterCount.characters()} حرف
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحالة
            </label>
            <select
              value={lesson.status}
              onChange={(e) => handleInputChange('status', e.target.value as ArticleStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={ArticleStatus.DRAFT}>مسودة</option>
              <option value={ArticleStatus.PUBLISHED}>منشور</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              onClick={() => handleSave()}
              disabled={saving || !lesson.title || !lesson.content}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={() => handleSave(ArticleStatus.PUBLISHED)}
              disabled={saving || !lesson.title || !lesson.content}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? 'جاري النشر...' : 'حفظ ونشر'}
            </button>
            <Link
              href={`/admin/courses/${courseId}/lessons`}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              إلغاء
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}