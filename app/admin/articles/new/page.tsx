'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NewArticlePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new article editor
    router.push('/admin/articles/new/edit')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">توجيه إلى صفحة إنشاء المقال...</p>
      </div>
    </div>
  )
}