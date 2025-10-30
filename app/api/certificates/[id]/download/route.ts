import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

// Dynamic imports to avoid build-time errors
async function getDependencies() {
  try {
    const [{ prisma }, { CertificateService }] = await Promise.all([
      import('@/lib/prisma'),
      import('@/lib/certificate-service')
    ]);
    return { prisma, CertificateService };
  } catch (error) {
    console.warn('Failed to import dependencies:', error);
    return null;
  }
}

// GET /api/certificates/[id]/download - Download certificate PDF
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Load dependencies dynamically
    const dependencies = await getDependencies();
    
    // Handle missing dependencies during build
    if (!dependencies) {
      return NextResponse.json({ 
        error: 'Service temporarily unavailable during build' 
      }, { status: 503 });
    }

    const { prisma, CertificateService } = dependencies;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const certificate = await (prisma as any).certificate.findUnique({
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = await (prisma as any).certificateTemplate.findFirst({
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