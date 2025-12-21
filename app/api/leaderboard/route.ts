import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get total number of published courses
    const totalCourses = await prisma.course.count({
      where: {
        status: 'PUBLISHED',
        isPrivate: false
      }
    })

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        certificates: {
          some: {}
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullNameArabic: true,
        fullNameEnglish: true,
        username: true,
        avatar: true,
        showProfile: true,
        _count: {
          select: {
            certificates: true
          }
        }
      },
      orderBy: {
        certificates: {
          _count: 'desc'
        }
      },
      take: 100
    })

    const leaderboard = users
      .filter(user => user.showProfile !== false)
      .map((user, index) => {
        const certificateCount = user._count.certificates
        const completionPercentage = totalCourses > 0 
          ? Math.round((certificateCount / totalCourses) * 100) 
          : 0
        
        const isTopTier = completionPercentage >= 90
        
        return {
          id: user.id,
          name: user.fullNameArabic || 
                (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
                user.fullNameEnglish ||
                user.username || 
                'مستخدم مجهول',
          username: user.username,
          avatar: user.avatar,
          certificateCount,
          completionPercentage,
          rank: index + 1,
          isTopTier,
        }
      })
      .filter(user => user.certificateCount > 0)

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
