import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getCurrentUser, AuthenticatedRequest } from '@/lib/middleware';

// Force dynamic rendering to prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

// Dynamic import to avoid build-time issues
async function getCertificateService() {
  try {
    const { CertificateService } = await import('@/lib/certificate-service');
    return CertificateService;
  } catch (error) {
    console.warn('Failed to import CertificateService:', error);
    return null;
  }
}

// POST /api/admin/certificates/generate - Generate certificate for completed course
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { enrollmentId } = await request.json();

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    // Load CertificateService dynamically
    const CertificateService = await getCertificateService();
    if (!CertificateService) {
      return NextResponse.json({ 
        error: 'Certificate service temporarily unavailable' 
      }, { status: 503 });
    }

    // Generate certificate
    const certificateId = await CertificateService.generateCertificate(enrollmentId);

    return NextResponse.json({ 
      success: true, 
      certificateId,
      downloadUrl: `/api/certificates/${certificateId}/download`,
      verifyUrl: `/certificates/verify/${certificateId}`
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate certificate' 
    }, { status: 500 });
  }
}, { requireAuth: true });

// GET /api/admin/certificates - Get all certificates (admin only)
export const GET = withAuth(async (request: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => {
  try {
    // Explicitly handle unused context parameter for Next.js 15 compatibility
    void context;
    
    const user = getCurrentUser(request);
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [certificates, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).certificate.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          certificateId: true,
          arTemplateId: true,
          enTemplateId: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              fullNameArabic: true,
              fullNameEnglish: true
            }
          },
          enrollment: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).certificate.count()
    ]);

    return NextResponse.json({
      certificates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}, { requireAuth: true, requireAdmin: true });