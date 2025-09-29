import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getCurrentUser, AuthenticatedRequest } from '@/lib/middleware';

// GET /api/admin/certificates/templates/[id] - Get specific template
export const GET = withAuth(async (request: AuthenticatedRequest, context?: { params?: Promise<Record<string, string>> }) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const resolvedParams = await context?.params;
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching certificate template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}, { requireAuth: true, requireAdmin: true });

// PUT /api/admin/certificates/templates/[id] - Update template
export const PUT = withAuth(async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { name, language, backgroundImage, fields, isActive } = await request.json();

    const template = await prisma.certificateTemplate.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        language,
        backgroundImage,
        fields: fields,
        isActive,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating certificate template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}, { requireAuth: true, requireAdmin: true });

// DELETE /api/admin/certificates/templates/[id] - Delete template
export const DELETE = withAuth(async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const resolvedParams = await params;
    await prisma.certificateTemplate.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}, { requireAuth: true, requireAdmin: true });