import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CertificateService } from '@/lib/certificate-service';

// GET /api/certificates/[id]/download - Download certificate PDF
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const certificateId = resolvedParams.id;

    // Find certificate
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId },
      include: {
        template: true,
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

    // Generate PDF
    const pdfBuffer = await CertificateService.generateCertificatePDF(
      certificate.template.id,
      certificate.data as any
    );

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificateId}.pdf"`,
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