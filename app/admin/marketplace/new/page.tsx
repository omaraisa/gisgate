'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NewSolutionPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new solution editor
    router.push('/admin/marketplace/new/edit')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">توجيه إلى صفحة إنشاء الحل...</p>
      </div>
    </div>
  )
}
