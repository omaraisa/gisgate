'use client'

import React, { useState, useEffect } from 'react'
import { ArticleStatus, CourseLevel } from '@prisma/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import YouTubePlayer, { extractYouTubeVideoId, isYouTubeUrl } from '@/app/components/YouTubePlayer'

interface Lesson {
  id?: string
  title: string
  slug?: string
  excerpt?: string
  content?: string
  videoUrl?: string
  order: number
  attachments?: Attachment[]
}

interface Attachment {
  id?: string
  url: string
  title: string
}

interface ExtendedCourse {
  id?: string
  title: string
  slug: string
  description?: string
  excerpt?: string
  featuredImage?: string
  status: ArticleStatus
  publishedAt?: Date | null
  category?: string
  tags?: string
  price?: number
  currency?: string
  isFree: boolean
  isPrivate: boolean
  level: CourseLevel
  language?: string
  duration?: string
  lessons?: Lesson[]
}

interface ExtendedCourse {
  id?: string
  title: string
  slug: string
  description?: string
  excerpt?: string
  featuredImage?: string
  status: ArticleStatus
  publishedAt?: Date | null
  category?: string
  tags?: string
  price?: number
  currency?: string
  isFree: boolean
  isPrivate: boolean
  level: CourseLevel
  language?: string
  duration?: string
  lessons?: Lesson[]
}

interface CourseEditorProps {
  params: Promise<{ id: string }>
}

export default function CourseEditor({ params }: CourseEditorProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const isNewCourse = resolvedParams.id === 'new'

  const [course, setCourse] = useState<ExtendedCourse>({
    title: '',
    slug: '',
    description: '',
    excerpt: '',
    featuredImage: '',
    status: ArticleStatus.DRAFT,
    category: '',
    tags: '',
    price: 0,
    currency: 'USD',
    isFree: true,
    isPrivate: false,
    level: CourseLevel.BEGINNER,
    language: 'ar',
    duration: '',
    lessons: []
  })
  const [loading, setLoading] = useState(!isNewCourse)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonForm, setLessonForm] = useState<Lesson>({
    title: '',
    excerpt: '',
    content: '',
    videoUrl: '',
    order: 0,
    attachments: []
  })

  useEffect(() => {
    if (!isNewCourse) {
      fetchCourse()
    }
  }, [isNewCourse, resolvedParams.id])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${resolvedParams.id}`)
      if (response.ok) {
        const courseData = await response.json()
        setCourse({
          ...courseData,
          price: courseData.price || 0,
          currency: courseData.currency || 'USD',
          isFree: courseData.isFree !== false,
          isPrivate: courseData.isPrivate || false,
          level: courseData.level || CourseLevel.BEGINNER,
          language: courseData.language || 'ar',
          lessons: courseData.lessons?.map((lesson: any) => ({
            ...lesson,
            attachments: lesson.images?.map((image: any) => ({
              id: image.id,
              url: image.url,
              title: image.caption || image.alt || ''
            })) || []
          })) || []
        })
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = isNewCourse ? '/api/admin/courses/create' : `/api/admin/courses/${resolvedParams.id}`
      const method = isNewCourse ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...course,
          lessons: course.lessons?.map(lesson => ({
            ...lesson,
            // Remove UI-specific fields and ensure proper format
            attachments: lesson.attachments?.filter(att => att.url.trim())
          }))
        })
      })

      if (response.ok) {
        const savedCourse = await response.json()
        router.push('/admin/courses')
      } else {
        const error = await response.json()
        alert(`خطأ: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving course:', error)
      alert('حدث خطأ أثناء حفظ الكورس')
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
  }

  const handleTitleChange = (title: string) => {
    setCourse(prev => ({
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
        setCourse(prev => ({ ...prev, featuredImage: data.imageUrl }))
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

  // Lesson management functions
  const addLesson = () => {
    setLessonForm({
      title: '',
      excerpt: '',
      content: '',
      videoUrl: '',
      order: course.lessons?.length || 0,
      attachments: []
    })
    setEditingLesson(null)
    setShowLessonForm(true)
  }

  const editLesson = (lesson: Lesson) => {
    setLessonForm({ ...lesson })
    setEditingLesson(lesson)
    setShowLessonForm(true)
  }

  const deleteLesson = (lessonId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons?.filter(l => l.id !== lessonId) || []
      }))
    }
  }

  const saveLesson = () => {
    if (!lessonForm.title.trim()) {
      alert('يرجى إدخال عنوان الدرس')
      return
    }

    const lessonToSave = {
      ...lessonForm
      // Slug will be auto-generated by the API
    }

    setCourse(prev => {
      const lessons = [...(prev.lessons || [])]
      if (editingLesson) {
        const index = lessons.findIndex(l => l.id === editingLesson.id)
        if (index !== -1) {
          lessons[index] = lessonToSave
        }
      } else {
        lessons.push(lessonToSave)
      }
      return { ...prev, lessons }
    })

    setShowLessonForm(false)
    setLessonForm({
      title: '',
      excerpt: '',
      content: '',
      videoUrl: '',
      order: 0,
      attachments: []
    })
  }

  const addAttachment = () => {
    setLessonForm(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), { url: '', title: '' }]
    }))
  }

  const updateAttachment = (index: number, field: 'url' | 'title', value: string) => {
    setLessonForm(prev => ({
      ...prev,
      attachments: prev.attachments?.map((att, i) =>
        i === index ? { ...att, [field]: value } : att
      ) || []
    }))
  }

  const removeAttachment = (index: number) => {
    setLessonForm(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || []
    }))
  }

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    setCourse(prev => {
      const lessons = [...(prev.lessons || [])]
      if (direction === 'up' && index > 0) {
        [lessons[index], lessons[index - 1]] = [lessons[index - 1], lessons[index]]
      } else if (direction === 'down' && index < lessons.length - 1) {
        [lessons[index], lessons[index + 1]] = [lessons[index + 1], lessons[index]]
      }
      // Update order numbers
      lessons.forEach((lesson, i) => {
        lesson.order = i
      })
      return { ...prev, lessons }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الكورس...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {isNewCourse ? 'إضافة كورس جديد' : 'تحرير الكورس'}
            </h1>
            <Link
              href="/admin/courses"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              العودة للكورسات
            </Link>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العنوان *
            </label>
            <input
              type="text"
              value={course.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الرابط (Slug) *
            </label>
            <input
              type="text"
              value={course.slug}
              onChange={(e) => setCourse(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المستوى
              </label>
              <select
                value={course.level}
                onChange={(e) => setCourse(prev => ({ ...prev, level: e.target.value as CourseLevel }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={CourseLevel.BEGINNER}>مبتدئ</option>
                <option value={CourseLevel.INTERMEDIATE}>متوسط</option>
                <option value={CourseLevel.ADVANCED}>متقدم</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اللغة
              </label>
              <select
                value={course.language}
                onChange={(e) => setCourse(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ar">العربية</option>
                <option value="en">الإنجليزية</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السعر
              </label>
              <input
                type="number"
                value={course.price}
                onChange={(e) => setCourse(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العملة
              </label>
              <select
                value={course.currency}
                onChange={(e) => setCourse(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="SAR">SAR</option>
                <option value="AED">AED</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المدة الزمنية
              </label>
              <input
                type="text"
                value={course.duration || ''}
                onChange={(e) => setCourse(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="مثال: 4 أسابيع"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              نوع الكورس
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="courseType"
                  checked={course.isFree && !course.isPrivate}
                  onChange={() => setCourse(prev => ({ ...prev, isFree: true, isPrivate: false }))}
                  className="ml-2 w-4 h-4 text-green-500 focus:ring-blue-500"
                />
                <span className="text-sm text-green-500">مجاني</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="courseType"
                  checked={!course.isFree && !course.isPrivate}
                  onChange={() => setCourse(prev => ({ ...prev, isFree: false, isPrivate: false }))}
                  className="ml-2 w-4 h-4 text-green-500 focus:ring-blue-500"
                />
                <span className="text-sm text-green-500">مدفوع</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="courseType"
                  checked={course.isPrivate}
                  onChange={() => setCourse(prev => ({ ...prev, isFree: false, isPrivate: true }))}
                  className="ml-2 w-4 h-4 text-green-500 focus:ring-blue-500"
                />
                <span className="text-sm text-green-500">خاص</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوصف
            </label>
            <textarea
              value={course.description || ''}
              onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المقتطف
            </label>
            <textarea
              value={course.excerpt || ''}
              onChange={(e) => setCourse(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفئة
              </label>
              <input
                type="text"
                value={course.category || ''}
                onChange={(e) => setCourse(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوسوم
              </label>
              <input
                type="text"
                value={course.tags || ''}
                onChange={(e) => setCourse(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="مفصولة بفواصل"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              صورة مميزة
            </label>
            <div className="space-y-3">
              {/* Current Image Preview */}
              {course.featuredImage && (
                <div className="relative inline-block">
                  <img
                    src={course.featuredImage}
                    alt="صورة مميزة"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setCourse(prev => ({ ...prev, featuredImage: '' }))}
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
                  value={course.featuredImage || ''}
                  onChange={(e) => setCourse(prev => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحالة
            </label>
            <select
              value={course.status}
              onChange={(e) => setCourse(prev => ({ ...prev, status: e.target.value as ArticleStatus }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={ArticleStatus.DRAFT}>مسودة</option>
              <option value={ArticleStatus.PUBLISHED}>منشور</option>
            </select>
          </div>

          {/* Lessons Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                الدروس ({course.lessons?.length || 0})
              </label>
              <button
                type="button"
                onClick={addLesson}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                إضافة درس جديد
              </button>
            </div>

            {/* Lessons List */}
            <div className="space-y-3">
              {course.lessons?.map((lesson, index) => (
                <div key={lesson.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                      {lesson.excerpt && (
                        <p className="text-sm text-gray-600 mt-1">{lesson.excerpt}</p>
                      )}
                      {lesson.videoUrl && (
                        <div className="mt-2">
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                            يحتوي على فيديو يوتيوب
                          </span>
                        </div>
                      )}
                      {lesson.attachments && lesson.attachments.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {lesson.attachments.length} مرفق
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveLesson(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLesson(index, 'down')}
                        disabled={index === (course.lessons?.length || 0) - 1}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => editLesson(lesson)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLesson(lesson.id!)}
                        className="text-red-600 hover:text-red-800"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {(!course.lessons || course.lessons.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  لا توجد دروس بعد. اضغط على "إضافة درس جديد" لبدء إضافة المحتوى.
                </div>
              )}
            </div>
          </div>

          {/* Lesson Form Modal */}
          {showLessonForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">
                  {editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان الدرس *
                    </label>
                    <input
                      type="text"
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      محتوى الدرس
                    </label>
                    <textarea
                      value={lessonForm.content || ''}
                      onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رابط فيديو يوتيوب
                    </label>
                    <input
                      type="url"
                      value={lessonForm.videoUrl || ''}
                      onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {lessonForm.videoUrl && isYouTubeUrl(lessonForm.videoUrl) && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">معاينة الفيديو:</p>
                        <YouTubePlayer
                          videoId={extractYouTubeVideoId(lessonForm.videoUrl)!}
                          className="max-w-md"
                        />
                      </div>
                    )}
                  </div>

                  {/* Attachments */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        المرفقات
                      </label>
                      <button
                        type="button"
                        onClick={addAttachment}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        إضافة مرفق
                      </button>
                    </div>
                    <div className="space-y-2">
                      {lessonForm.attachments?.map((attachment, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="عنوان المرفق"
                            value={attachment.title}
                            onChange={(e) => updateAttachment(index, 'title', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          <input
                            type="url"
                            placeholder="رابط المرفق"
                            value={attachment.url}
                            onChange={(e) => updateAttachment(index, 'url', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-800 px-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowLessonForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={saveLesson}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingLesson ? 'حفظ التغييرات' : 'إضافة الدرس'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href="/admin/courses"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? 'جاري الحفظ...' : (isNewCourse ? 'إضافة الكورس' : 'حفظ التغييرات')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}