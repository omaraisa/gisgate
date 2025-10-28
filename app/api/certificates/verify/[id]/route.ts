import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/certificates/verify/[id] - Verify certificate
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const certificateId = resolvedParams.id;

    // Find certificate with related data
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId },
      select: {
        id: true,
        certificateId: true,
        createdAt: true,
        data: true,
        user: {
          select: {
            id: true,
            email: true,
            fullNameArabic: true,
            fullNameEnglish: true
          }
        },
        enrollment: {
          select: {
            completedAt: true,
            course: {
              select: {
                title: true,
                duration: true,
                authorName: true,
                language: true
              }
            }
          }
        },
        template: {
          select: {
            name: true,
            language: true
          }
        }
      }
    });

    if (!certificate) {
      return NextResponse.json({ 
        error: 'Certificate not found',
        valid: false 
      }, { status: 404 });
    }

    // Return verification data
    return NextResponse.json({
      valid: true,
      certificate: {
        id: certificate.certificateId,
        issuedAt: certificate.createdAt,
        studentName: certificate.enrollment.course.language === 'ar' 
          ? certificate.user.fullNameArabic 
          : certificate.user.fullNameEnglish,
        courseTitle: certificate.enrollment.course.title,
        completedAt: certificate.enrollment.completedAt,
        duration: certificate.enrollment.course.duration,
        instructor: certificate.enrollment.course.authorName,
        language: certificate.template?.language || 'ar'
      }
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json({ 
      error: 'Failed to verify certificate',
      valid: false 
    }, { status: 500 });
  }
}