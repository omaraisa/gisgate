import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CertificateService } from '@/lib/certificate-service';

// Helper function to parse existing duration string
function parseDurationString(durationStr: string | null, isArabic: boolean): string {
  if (!durationStr) return '';
  
  // Try to extract number and unit from existing duration
  const match = durationStr.match(/(\d+)\s*(.+)/);
  if (!match) return durationStr; // Return as-is if can't parse
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase().trim();
  
  // Map common units
  let standardUnit = 'hours';
  if (unit.includes('ساعة') || unit.includes('ساعات') || unit.includes('hour')) {
    standardUnit = 'hours';
  } else if (unit.includes('دقيقة') || unit.includes('دقائق') || unit.includes('minute')) {
    standardUnit = 'minutes';
  } else if (unit.includes('يوم') || unit.includes('أيام') || unit.includes('day')) {
    standardUnit = 'days';
  } else if (unit.includes('أسبوع') || unit.includes('أسابيع') || unit.includes('week')) {
    standardUnit = 'weeks';
  }
  
  return CertificateService.formatDuration(value, standardUnit, isArabic);
}

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

    // Format duration based on certificate language  
    const course = certificate.enrollment.course as any; // Type assertion for new duration fields
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