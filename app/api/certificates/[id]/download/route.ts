import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

// Conditional imports to avoid build-time errors
let prisma: any;
let CertificateService: any;

if (process.env.NODE_ENV !== 'production' || process.env.SKIP_BUILD_STATIC_GENERATION !== 'true') {
  try {
    const { prisma: _prisma } = require('@/lib/prisma');
    const { CertificateService: _CertificateService } = require('@/lib/certificate-service');
    prisma = _prisma;
    CertificateService = _CertificateService;
  } catch (error) {
    console.warn('Failed to import dependencies during build:', error);
  }
}

// GET /api/certificates/[id]/download - Download certificate PDF
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Handle missing dependencies during build
    if (!prisma || !CertificateService) {
      return NextResponse.json({ 
        error: 'Service temporarily unavailable during build' 
      }, { status: 503 });
    }

    // Handle build-time pre-rendering
    if (!params) {
      return NextResponse.json({ error: 'No parameters provided' }, { status: 400 });
    }

    const resolvedParams = await params;
    
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }
    
    const certificateId = resolvedParams.id;
    
    // Get language from query params, default to 'ar'
    const language = (request.nextUrl.searchParams.get('lang') || 'ar') as 'ar' | 'en';

    // Find certificate
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId },
      include: {
        user: true,
        enrollment: {
          include: {
            course: true
          }
        }
      }
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Get the appropriate template based on requested language
    const template = await prisma.certificateTemplate.findFirst({
      where: {
        language: language,
        isDefault: true,
        isActive: true
      }
    });

    if (!template) {
      return NextResponse.json({ 
        error: `No certificate template found for language: ${language}` 
      }, { status: 404 });
    }

    // Prepare certificate data for the requested language
    const isArabic = language === 'ar';
    
    const studentName = isArabic 
      ? certificate.user.fullNameArabic || `${certificate.user.firstName || ''} ${certificate.user.lastName || ''}`.trim() || certificate.user.email
      : certificate.user.fullNameEnglish || `${certificate.user.firstName || ''} ${certificate.user.lastName || ''}`.trim() || certificate.user.email;

    const courseTitle = isArabic 
      ? certificate.enrollment.course.title
      : certificate.enrollment.course.titleEnglish || certificate.enrollment.course.title;

    const instructor = isArabic 
      ? certificate.enrollment.course.authorName || 'عمر الهادي'
      : certificate.enrollment.course.authorNameEnglish || certificate.enrollment.course.authorName || 'Omar Elhadi';

    // Format duration based on certificate language  
    const course = certificate.enrollment.course;
    const duration = CertificateService.formatDuration(
      course.durationValue,
      course.durationUnit,
      isArabic
    );

    const certificateData = {
      studentName,
      courseTitle,
      completionDate: isArabic 
        ? certificate.enrollment.completedAt?.toLocaleDateString('ar-SA') || new Date().toLocaleDateString('ar-SA')
        : certificate.enrollment.completedAt?.toLocaleDateString('en-US') || new Date().toLocaleDateString('en-US'),
      duration,
      instructor,
      certificateId: certificate.certificateId,
      language: language
    };

    // Return template and data for client-side PDF generation
    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        language: template.language,
        backgroundImage: template.backgroundImage,
        backgroundWidth: template.backgroundWidth,
        backgroundHeight: template.backgroundHeight,
        fields: template.fields
      },
      data: certificateData,
      certificateId: certificate.certificateId,
      language: language
    });

  } catch (error) {
    console.error('Error downloading certificate:', error);
    return NextResponse.json({ 
      error: 'Failed to download certificate' 
    }, { status: 500 });
  }
}