import { NextResponse } from 'next/server';
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
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

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
export const PUT = withAuth(async (request: AuthenticatedRequest, context?: { params?: Promise<Record<string, string>> }) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const resolvedParams = await context?.params;
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const { name, language, backgroundImage, fields, isActive } = await request.json();

    const template = await prisma.certificateTemplate.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        language,
        backgroundImage,
        fields: fields,
        isActive: isActive ?? true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating certificate template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}, { requireAuth: true, requireAdmin: true });

// PATCH /api/admin/certificates/templates/[id] - Partial update template
export const PATCH = withAuth(async (request: AuthenticatedRequest, context?: { params?: Promise<Record<string, string>> }) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const resolvedParams = await context?.params;
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const updates = await request.json();

    // Handle isDefault toggle logic
    if (updates.hasOwnProperty('isDefault')) {
      const currentTemplate = await prisma.certificateTemplate.findUnique({
        where: { id: resolvedParams.id }
      });

      if (!currentTemplate) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      if (updates.isDefault === true) {
        // Setting as default: unset all other defaults for the same language
        await prisma.certificateTemplate.updateMany({
          where: {
            language: currentTemplate.language,
            id: { not: resolvedParams.id }
          },
          data: { isDefault: false }
        });
      } else if (updates.isDefault === false) {
        // Unsetting as default: check if this would leave the language without any default
        const otherDefaultsCount = await prisma.certificateTemplate.count({
          where: {
            language: currentTemplate.language,
            isDefault: true,
            id: { not: resolvedParams.id }
          }
        });

        if (otherDefaultsCount === 0) {
          // This is the only default for this language, don't allow unsetting
          return NextResponse.json({
            error: `لا يمكن إلغاء الافتراضي لهذا القالب. يجب أن يكون هناك قالب افتراضي واحد على الأقل للغة ${currentTemplate.language === 'ar' ? 'العربية' : 'English'}`
          }, { status: 400 });
        }
      }
    }

    const template = await prisma.certificateTemplate.update({
      where: { id: resolvedParams.id },
      data: {
        ...updates,
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
export const DELETE = withAuth(async (request: AuthenticatedRequest, context?: { params?: Promise<Record<string, string>> }) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const resolvedParams = await context?.params;
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    await prisma.certificateTemplate.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}, { requireAuth: true, requireAdmin: true });