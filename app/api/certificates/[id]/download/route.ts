import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CertificateService } from '@/lib/certificate-service';

// GET /api/certificates/[id]/download - Download certificate PDF
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
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

    const certificateData = {
      studentName,
      courseTitle,
      completionDate: isArabic 
        ? certificate.enrollment.completedAt?.toLocaleDateString('ar-SA') || new Date().toLocaleDateString('ar-SA')
        : certificate.enrollment.completedAt?.toLocaleDateString('en-US') || new Date().toLocaleDateString('en-US'),
      duration: certificate.enrollment.course.duration || undefined,
      instructor,
      certificateId: certificate.certificateId,
      language: language
    };

    // Generate PDF with the requested language template and data
    const pdfBuffer = await CertificateService.generateCertificatePDF(
      template.id,
      certificateData
    );

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificateId}-${language}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error downloading certificate:', error);
    return NextResponse.json({ 
      error: 'Failed to download certificate' 
    }, { status: 500 });
  }
}