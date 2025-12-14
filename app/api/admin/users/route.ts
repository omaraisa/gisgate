import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { UserRole, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') as UserRole | null;
    const status = searchParams.get('status'); // active, inactive

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { fullNameArabic: { contains: search, mode: 'insensitive' } },
        { fullNameEnglish: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [usersData, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          fullNameArabic: true,
          fullNameEnglish: true,
          role: true,
          emailVerified: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          wordpressId: true,
          enrollments: {
            select: {
              id: true,
              isCompleted: true,
              progress: true,
              course: {
                select: {
                  id: true,
                },
              },
              lessonProgress: {
                select: {
                  id: true,
                  isCompleted: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate completed courses (certificates earned) for each user
    const users = usersData.map(user => {
      const completedEnrollments = user.enrollments.filter(enrollment => {
        // Check if marked as completed
        if (enrollment.isCompleted) {
          return true;
        }
        // Or if progress is 100%
        if (enrollment.progress >= 100) {
          return true;
        }
        return false;
      });

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullNameArabic: user.fullNameArabic,
        fullNameEnglish: user.fullNameEnglish,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        wordpressId: user.wordpressId,
        _count: {
          enrollments: user._count.enrollments,
          certificates: completedEnrollments.length,
        },
      };
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get users error:', error);

    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}