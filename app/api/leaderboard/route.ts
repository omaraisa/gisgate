import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
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
      take: 50
    })

    const leaderboard = users
      .map(user => ({
        id: user.id,
        name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username || 'مستخدم مجهول',
        avatar: user.avatar,
        certificateCount: user._count.certificates
      }))
      .filter(user => user.certificateCount > 0) // Only show users with at least 1 certificate

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
