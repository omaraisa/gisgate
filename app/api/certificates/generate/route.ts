import { NextRequest, NextResponse } from 'next/server';
import { CertificateService } from '@/lib/certificate-service';
import { withAuth, getCurrentUser, AuthenticatedRequest } from '@/lib/middleware';

// POST /api/certificates/generate - Generate certificate for completed course
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { enrollmentId, templateId } = await request.json();

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    // Generate certificate
    const certificateId = await CertificateService.generateCertificate(enrollmentId, templateId);

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