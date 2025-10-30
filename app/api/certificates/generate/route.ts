import { NextResponse } from 'next/server';
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

// POST /api/certificates/generate - Generate certificate for completed course
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { enrollmentId, courseId, language } = await request.json();

    if (!enrollmentId && !courseId) {
      return NextResponse.json({ error: 'Either enrollment ID or course ID is required' }, { status: 400 });
    }

    let targetEnrollmentId = enrollmentId;
    
    // If courseId is provided instead of enrollmentId, find the enrollment
    if (courseId && !enrollmentId) {
      const { prisma } = await import('@/lib/prisma');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrollment = await (prisma as any).courseEnrollment.findFirst({
        where: {
          userId: user.id,
          courseId: courseId
        }
      });
      
      if (!enrollment) {
        return NextResponse.json({ error: 'No enrollment found for this course' }, { status: 404 });
      }
      
      targetEnrollmentId = enrollment.id;
    }

    // Load CertificateService dynamically
    const CertificateService = await getCertificateService();
    if (!CertificateService) {
      return NextResponse.json({ 
        error: 'Certificate service temporarily unavailable' 
      }, { status: 503 });
    }

    // Generate certificate
    const certificateId = await CertificateService.generateCertificate(targetEnrollmentId, language);

    return NextResponse.json({ 
      certificateId,
      downloadUrl: `/api/certificates/${certificateId}/download`,
      verifyUrl: `/certificates/verify/${certificateId}`
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate certificate' 
    }, { status: 500 });
  }
}, { requireAuth: true });