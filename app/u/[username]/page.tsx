'use client'

import { useState, useEffect, use } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { User, Calendar, Globe, Award, BookOpen, Shield } from 'lucide-react'
import Link from 'next/link'

interface PublicProfile {
  id: string
  username: string
  name: string
  avatar: string | null
  bio: string | null
  website: string | null
  joinedAt: string
  stats: {
    certificates: number
    coursesEnrolled: number
    coursesCreated: number
  }
  certificates: Array<{
    id: string
    courseName: string
    date: string
    certificateId: string
  }>
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${username}`)
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        } else {
          setError('المستخدم غير موجود')
        }
      } catch (error) {
        console.error(error)
        setError('حدث خطأ أثناء تحميل الملف الشخصي')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">عذراً</h1>
          <p className="text-gray-600">{error || 'المستخدم غير موجود'}</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="bg-white p-1 rounded-full">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white"
                    unoptimized
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-4 border-white">
                    <User className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h1>
              {profile.bio && (
                <p className="text-gray-600 mb-4 max-w-2xl">{profile.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>انضم في {new Date(profile.joinedAt).toLocaleDateString('ar-EG')}</span>
                </div>
                {profile.website && (
                  <a 
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    <span>الموقع الشخصي</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">الإحصائيات</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <span>الشهادات</span>
                  </div>
                  <span className="font-bold">{profile.stats.certificates}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <span>الكورسات المسجلة</span>
                  </div>
                  <span className="font-bold">{profile.stats.coursesEnrolled}</span>
                </div>
                {profile.stats.coursesCreated > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Shield className="w-5 h-5 text-purple-500" />
                      <span>الكورسات المنشورة</span>
                    </div>
                    <span className="font-bold">{profile.stats.coursesCreated}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Certificates */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                الشهادات المكتسبة
              </h2>
              
              {profile.certificates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لم يحصل هذا المستخدم على أي شهادات بعد
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.certificates.map((cert) => (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-bold text-gray-900">{cert.courseName}</h3>
                        <p className="text-sm text-gray-500">
                          تم الحصول عليها في {new Date(cert.date).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <Link
                        href={`/certificates/verify?id=${cert.certificateId}`}
                        className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                      >
                        عرض الشهادة
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
