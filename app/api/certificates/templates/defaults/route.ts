import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getCurrentUser, AuthenticatedRequest } from '@/lib/middleware';

// GET /api/certificates/templates/defaults - Get default certificate templates for Arabic and English
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get default templates for both languages
    const templates = await prisma.certificateTemplate.findMany({
      where: {
        isDefault: true,
        isActive: true,
        language: { in: ['ar', 'en'] }
      },
      select: {
        id: true,
        name: true,
        language: true,
        backgroundImage: true,
        isDefault: true
      }
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching default certificate templates:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch default templates'
    }, { status: 500 });
  }
}, { requireAuth: true });