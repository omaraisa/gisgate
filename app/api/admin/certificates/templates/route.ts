import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getCurrentUser, AuthenticatedRequest } from '@/lib/middleware';

// GET /api/admin/certificates/templates - Get all certificate templates
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const templates = await prisma.certificateTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching certificate templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}, { requireAuth: true, requireAdmin: true });

// POST /api/admin/certificates/templates - Create new certificate template
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, language, backgroundImage, backgroundWidth, backgroundHeight, fields } = await request.json();

    if (!name || !language || !backgroundImage || !fields) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const template = await prisma.certificateTemplate.create({
      data: {
        name,
        language,
        backgroundImage,
        backgroundWidth: backgroundWidth || 2480,
        backgroundHeight: backgroundHeight || 3508,
        fields: fields,
        isActive: true
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating certificate template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}, { requireAuth: true, requireAdmin: true });