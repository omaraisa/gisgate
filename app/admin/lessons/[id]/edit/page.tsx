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
}

interface LessonEditorProps {
  params: Promise<{ id: string }>
}

export default function LessonEditor({ params }: LessonEditorProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const isNewLesson = resolvedParams.id === 'new'

  const [lesson, setLesson] = useState<ExtendedLesson>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    status: ArticleStatus.PUBLISHED, // سيتم تحديثها من البيانات المجلوبة
    category: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    videoUrl: '',
    duration: '',
    thumbnail: ''
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
      const response = await fetch(`/api/admin/lessons/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setLesson(data)
      } else {
        console.error('Lesson not found')
        router.push('/admin/lessons')
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
      router.push('/admin/lessons')
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, router])

  useEffect(() => {
    if (!isNewLesson) {
      fetchLesson()
    }
  }, [resolvedParams.id, isNewLesson, fetchLesson])

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
        ? '/api/admin/lessons/create'
        : `/api/admin/lessons/${resolvedParams.id}`

      const method = isNewLesson ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      })

      if (response.ok) {
        const savedLesson = await response.json()
        if (isNewLesson) {
          router.push(`/admin/lessons/${savedLesson.id}/edit`)
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
        setLesson(prev => ({ ...prev, featuredImage: data.imageUrl }))
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

  const insertYouTubeVideo = async () => {
    let url = ''

    // Try to get URL from clipboard first
    try {
      const clipboardText = await navigator.clipboard.readText()
      const videoIdMatch = clipboardText.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
      if (videoIdMatch) {
        url = clipboardText
      }
    } catch {
      // Clipboard access failed, continue with prompt
    }

    // If no valid URL from clipboard, show prompt
    if (!url) {
      const promptResult = window.prompt('أدخل رابط الفيديو من يوتيوب:')
      if (!promptResult) return // User cancelled
      url = promptResult
    }

    if (url) {
      // Extract video ID from various YouTube URL formats
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
      if (videoIdMatch) {
        const videoId = videoIdMatch[1]
        // Insert a simple marker that will be replaced with React component when displaying
        const marker = `[YOUTUBE:${videoId}]`
        editor?.chain().focus().insertContent(marker).run()

        // Update the lesson state
        const updatedHTML = editor?.getHTML() || ''
        setLesson(prev => ({ ...prev, content: updatedHTML }))
      } else {
        // alert('رابط يوتيوب غير صحيح')
      }
    }
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isNewLesson ? 'إضافة درس جديد' : 'تحرير الدرس'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/admin/lessons" className="hover:text-blue-600">
                ← العودة لإدارة الدروس
              </Link>
              {!isNewLesson && lesson.slug && (
                <Link
                  href={`/lessons/${lesson.slug}`}
                  target="_blank"
                  className="hover:text-blue-600"
                >
                  عرض الدرس ↗
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
              {saving ? 'جاري النشر...' : 'نشر الدرس'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات أساسية</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان الدرس *
                  </label>
                  <input
                    type="text"
                    value={lesson.title || ''}
                    onChange={(e) => setLesson((prev: ExtendedLesson) => ({
                      ...prev,
                      title: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل عنوان الدرس"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الرابط (Slug) *
                  </label>
                  <input
                    type="text"
                    value={lesson.slug || ''}
                    onChange={(e) => setLesson((prev: ExtendedLesson) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="lesson-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    مقدمة الدرس
                  </label>
                  <textarea
                    value={lesson.excerpt || ''}
                    onChange={(e) => setLesson((prev: ExtendedLesson) => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="مقدمة مختصرة عن الدرس"
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">محتوى الدرس</h3>
                <div className="text-xs text-gray-500">
                  <span className="mr-4">Ctrl+B: عريض</span>
                  <span className="mr-4">Ctrl+I: مائل</span>
                  <span className="mr-4">Ctrl+U: تحتي</span>
                  <span>Ctrl+Z: تراجع</span>
                </div>
              </div>

            {/* Enhanced Editor Toolbar */}
            <div className="sticky top-[73px] z-30 mb-0 border border-gray-300 rounded-t-md bg-gray-50 shadow-md transition-all duration-300">
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

                  {/* Image Options */}
                  <div className="flex gap-1 bg-gray-100 p-0.5 rounded border border-gray-200">
                    <button
                      type="button"
                      onClick={addImageByUrl}
                      className="px-3 py-2 rounded text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                      title="إضافة صورة برابط"
                    >
                      🖼️ URL
                    </button>
                    <label className="px-3 py-2 rounded text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 cursor-pointer" title="رفع صورة">
                      📤 رفع
                      <input type="file" className="hidden" accept="image/*" onChange={handleContentImageUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={updateImageLink}
                      className={`px-3 py-2 rounded text-sm ${editor?.isActive('image') ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                      title="تعديل رابط الصورة المحددة"
                    >
                      ✏️ رابط الصورة
                    </button>
                    <button
                      type="button"
                      onClick={localizeImages}
                      className="px-3 py-2 rounded text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                      title="سحب الصور الخارجية للسيرفر المحلي"
                    >
                      🛡️ توطين الصور
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={insertYouTubeVideo}
                    className="px-3 py-2 rounded text-sm bg-red-600 text-white border border-red-600 hover:bg-red-700"
                    title="إدراج فيديو يوتيوب"
                  >
                    📺 YouTube
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

                {/* HTML Toggle */}
                <button
                  type="button"
                  onClick={toggleHtmlMode}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${isHtmlMode ? 'bg-amber-500 text-white shadow-inner' : 'bg-gray-800 text-gray-100 hover:bg-gray-700'}`}
                  title={isHtmlMode ? 'العودة للمحرر المرئي' : 'عرض الكود (HTML)'}
                >
                  {isHtmlMode ? '👁️ عرض المحرر' : '</> HTML'}
                </button>
              </div>
            </div>

              {/* Editor Content */}
              <div className="border border-t-0 border-gray-300 rounded-b-md min-h-[500px] overflow-y-auto relative bg-white">
                {uploadingImage && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm font-medium text-blue-600">جاري معالجة الصورة...</p>
                    </div>
                  </div>
                )}

                {isHtmlMode ? (
                  <textarea
                    value={lesson.content}
                    onChange={(e) => setLesson(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full min-h-[500px] p-6 font-mono text-sm border-0 focus:ring-0 resize-none bg-gray-900 text-gray-100 selection:bg-blue-500/30"
                    style={{ direction: 'ltr' }}
                    placeholder="اكتب كود HTML هنا..."
                  />
                ) : (
                  <div className="p-6 prose prose-sm max-w-none focus:outline-none" style={{ direction: 'rtl' }}>
                    <EditorContent
                      editor={editor}
                      className="min-h-[450px] focus:outline-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-blockquote:border-r-4 prose-blockquote:border-gray-300 prose-blockquote:pr-4 prose-blockquote:italic prose-img:rounded-xl prose-img:shadow-lg prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">إعدادات النشر</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    حالة الدرس
                  </label>
                  <select
                    value={lesson.status || ArticleStatus.DRAFT}
                    onChange={(e) => setLesson((prev: ExtendedLesson) => ({ ...prev, status: e.target.value as ArticleStatus }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={ArticleStatus.DRAFT}>مسودة</option>
                    <option value={ArticleStatus.PUBLISHED}>منشور</option>
                    <option value={ArticleStatus.ARCHIVED}>مؤرشف</option>
                  </select>
                </div>

                {/* Publication Date */}
                {lesson.publishedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ النشر (ميلادي)
                    </label>
                    <input
                      type="text"
                      value={new Date(lesson.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(lesson.publishedAt).toLocaleDateString('en-US', {
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">التصنيف والوسوم</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التصنيف
                  </label>
                  <input
                    type="text"
                    value={lesson.category || ''}
                    onChange={(e) => setLesson((prev: ExtendedLesson) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="تصنيف الدرس"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوسوم (مفصولة بفاصلة)
                  </label>
                  <input
                    type="text"
                    value={lesson.tags || ''}
                    onChange={(e) => setLesson((prev: ExtendedLesson) => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="وسم1, وسم2, وسم3"
                  />
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الصورة البارزة</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  صورة مميزة
                </label>
                <div className="space-y-3">
                  {/* Current Image Preview */}
                  {lesson.featuredImage && (
                    <div className="relative inline-block">
                      <Image
                        src={lesson.featuredImage}
                        alt="صورة مميزة"
                        width={128}
                        height={128}
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => setLesson(prev => ({ ...prev, featuredImage: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file)
                        }
                      }}
                      disabled={uploadingImage}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    {uploadingImage && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                  </div>

                  {/* URL Input as Fallback */}
                  <div className="text-sm text-gray-600">
                    أو أدخل رابط الصورة مباشرة:
                    <input
                      type="url"
                      value={lesson.featuredImage || ''}
                      onChange={(e) => setLesson(prev => ({ ...prev, featuredImage: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>            {/* SEO Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">إعدادات SEO</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان SEO
                  </label>
                  <input
                    type="text"
                    value={lesson.metaTitle || ''}
                    onChange={(e) => setLesson((prev: ExtendedLesson) => ({ ...prev, metaTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="عنوان محسن لمحركات البحث"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(lesson.metaTitle || '').length}/60 حرف
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وصف SEO
                  </label>
                  <textarea
                    value={lesson.metaDescription || ''}
                    onChange={(e) => setLesson((prev: ExtendedLesson) => ({ ...prev, metaDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="وصف محسن لمحركات البحث"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(lesson.metaDescription || '').length}/160 حرف
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