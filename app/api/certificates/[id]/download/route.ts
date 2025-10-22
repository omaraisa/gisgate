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

    // Generate PDF with the requested language template
    const pdfBuffer = await CertificateService.generateCertificatePDF(
      template.id,
      certificate.data as any
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