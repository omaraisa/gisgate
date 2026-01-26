import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getCurrentUser, AuthenticatedRequest } from '@/lib/middleware';

// GET /api/certificates/templates/[courseId] - Get available certificate templates for a course
export const GET = withAuth(async (request: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const resolvedParams = await context?.params;
    if (!resolvedParams?.courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Get course to determine language
    const course = await prisma.course.findUnique({
      where: { id: resolvedParams.courseId },
      select: { language: true }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get all active templates for the course language
    const templates = await prisma.certificateTemplate.findMany({
      where: {
        language: course.language || 'ar',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        language: true,
        isDefault: true,
        backgroundImage: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching certificate templates:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch templates'
    }, { status: 500 });
  }
}, { requireAuth: true });