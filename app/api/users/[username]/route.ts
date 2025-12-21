import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { id: username } // Allow lookup by ID as fallback
        ]
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        fullNameArabic: true,
        fullNameEnglish: true,
        avatar: true,
        bio: true,
        website: true,
        createdAt: true,
        showProfile: true,
        showContactDetails: true,
        certificates: {
          include: {
            enrollment: {
              include: {
                course: {
                  select: {
                    title: true,
                    slug: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            courses: true, // Created courses (if instructor)
            enrollments: true // Enrolled courses
          }
        }
      }
    })

    if (!user || user.showProfile === false) {
      return NextResponse.json(
        { error: 'User profile is not public or does not exist' },
        { status: 404 }
      )
    }

    // Format response
    const publicProfile = {
      id: user.id,
      username: user.username,
      name: user.fullNameArabic || 
            (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
            user.fullNameEnglish ||
            user.username || 
            'مستخدم',
      avatar: user.avatar,
      bio: user.bio,
      website: user.showContactDetails ? user.website : null,
      joinedAt: user.createdAt,
      stats: {
        certificates: user.certificates.length,
        coursesEnrolled: user._count.enrollments,
        coursesCreated: user._count.courses
      },
      certificates: user.certificates.map(cert => ({
        id: cert.id,
        courseName: cert.enrollment.course.title,
        date: cert.createdAt,
        certificateId: cert.certificateId
      }))
    }

    return NextResponse.json(publicProfile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
