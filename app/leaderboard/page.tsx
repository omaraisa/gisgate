'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, User } from 'lucide-react'

interface LeaderboardUser {
  id: string
  name: string
  username: string | null
  avatar: string | null
  certificateCount: number
  completionPercentage: number
  rank: number
  isTopTier: boolean
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard')
        if (response.ok) {
          const data = await response.json()
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            لوحة الشرف
          </h1>
          <p className="text-gray-600">
            أكثر الطلاب تميزاً وحصولاً على الشهادات في منصة GIS Gate
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              لا يوجد بيانات لعرضها حالياً
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 flex items-center gap-6 hover:bg-gray-50 transition-colors ${
                    index < 3 ? 'bg-gradient-to-l from-gray-50 to-white' : ''
                  } ${user.isTopTier ? 'border-r-4 border-yellow-500' : ''}`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center font-bold text-xl">
                    {index === 0 ? (
                      <Medal className="w-8 h-8 text-yellow-500" />
                    ) : index === 1 ? (
                      <Medal className="w-8 h-8 text-gray-400" />
                    ) : index === 2 ? (
                      <Medal className="w-8 h-8 text-amber-600" />
                    ) : (
                      <span className="text-gray-400">#{index + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        unoptimized
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-grow">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      {user.name}
                      {user.isTopTier && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          ⭐ النخبة
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {user.completionPercentage}% إنجاز • طالب مجتهد
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-center">
                    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                      <Award className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-blue-900">
                        {user.certificateCount}
                      </span>
                      <span className="text-xs text-blue-600">شهادة</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
