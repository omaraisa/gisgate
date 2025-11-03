'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CloudArrowUpIcon, DocumentIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface UploadResult {
  success: boolean
  fileUrl?: string
  fileName?: string
  fileSize?: string
  size?: number
  uploadedAt?: string
  error?: string
}

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [currentResumeUrl, setCurrentResumeUrl] = useState('')

  useEffect(() => {
    // Set the URL on client side only
    setCurrentResumeUrl(`${window.location.origin}/api/resume`)
  }, [])

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setResult({ success: false, error: 'يجب أن يكون الملف PDF فقط' })
      return
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setResult({ success: false, error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت' })
      return
    }

    setFile(selectedFile)
    setResult(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload-resume', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          size: data.size,
          uploadedAt: data.uploadedAt
        })
        setFile(null) // Clear the file after successful upload
      } else {
        setResult({ success: false, error: data.error || 'فشل في رفع الملف' })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setResult({ success: false, error: 'حدث خطأ أثناء رفع الملف' })
    } finally {
      setUploading(false)
    }
  }

  const minioUrl = `http://${process.env.NEXT_PUBLIC_SERVER_IP || 'localhost'}:9000/files/omar-elhadi.pdf`

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              ← العودة للإدارة
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            رفع السيرة الذاتية
          </h1>
          <p className="text-gray-600">
            رفع وتحديث ملف السيرة الذاتية (PDF) - سيتم حفظ الملف باسم omar-elhadi.pdf
          </p>
        </div>

        {/* Current Resume Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">السيرة الذاتية الحالية</h2>
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <DocumentIcon className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">omar-elhadi.pdf</p>
              <p className="text-sm text-blue-700">الرابط: {currentResumeUrl}</p>
            </div>
            <a
              href={currentResumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              عرض الملف
            </a>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">رفع ملف جديد</h2>

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  handleFileSelect(selectedFile)
                }
              }}
              className="hidden"
              id="file-upload"
            />

            {file ? (
              <div className="flex flex-col items-center">
                <CheckCircleIcon className="w-12 h-12 text-green-600 mb-4" />
                <p className="text-lg font-medium text-green-900 mb-2">{file.name}</p>
                <p className="text-sm text-green-700 mb-4">
                  حجم الملف: {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <label
                  htmlFor="file-upload"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-sm"
                >
                  اختيار ملف آخر
                </label>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  اسحب وأفلت ملف PDF هنا
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  أو انقر لاختيار الملف من جهازك
                </p>
                <label
                  htmlFor="file-upload"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  اختيار ملف PDF
                </label>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {file && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {uploading ? 'جاري الرفع...' : 'رفع الملف'}
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                )}
                <div className="flex-1">
                  {result.success ? (
                    <div>
                      <p className="font-medium text-green-900">تم رفع الملف بنجاح!</p>
                      <p className="text-sm text-green-700 mt-1">
                        الملف: {result.fileName} | الحجم: {result.fileSize}
                      </p>
                      {result.fileUrl && (
                        <p className="text-sm text-green-700">
                          الرابط: <a href={result.fileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">
                            {result.fileUrl}
                          </a>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-red-900">{result.error}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">ملاحظات مهمة</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• سيتم حفظ الملف دائماً باسم &quot;omar-elhadi.pdf&quot; في مجلد &quot;files&quot;</li>
            <li>• سيتم استبدال الملف السابق إذا كان موجوداً</li>
            <li>• الحد الأقصى لحجم الملف هو 10 ميجابايت</li>
            <li>• الرابط النظيف: {currentResumeUrl}</li>
            <li>• رابط MinIO المباشر: {minioUrl}</li>
          </ul>

          <div className="mt-4 p-4 bg-yellow-50 rounded border">
            <h4 className="font-semibold text-yellow-900 mb-2">تكوين MinIO</h4>
            <p className="text-sm text-yellow-800 mb-2">
              تأكد من إعداد التالي في MinIO:
            </p>
            <ul className="text-sm text-yellow-800 mb-3 list-disc list-inside">
              <li>إنشاء bucket باسم &quot;files&quot;</li>
              <li>تفعيل الوصول العام للقراءة</li>
              <li>تعيين متغيرات البيئة الصحيحة</li>
            </ul>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`NEXT_PRIVATE_MINIO_ACCESS_KEY=your_access_key
NEXT_PRIVATE_MINIO_SECRET_KEY=your_secret_key
SERVER_IP=your_minio_server_ip`}
            </pre>
            <p className="text-sm text-yellow-800 mt-2">
              إذا لم يتم تعيين هذه المتغيرات، سيتم استخدام القيم الافتراضية.
            </p>
          </div>

          <div className="mt-4 p-4 bg-white rounded border">
            <h4 className="font-semibold text-blue-900 mb-2">إعداد Nginx (اختياري)</h4>
            <p className="text-sm text-blue-700 mb-2">
              للوصول للملف من خلال الرابط https://gis-gate.com/omar-elhadi.pdf، أضف هذا لملف nginx.conf:
            </p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`location /omar-elhadi.pdf {
    proxy_pass http://127.0.0.1:3000/api/resume;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}