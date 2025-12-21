import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { getMinioClient, BUCKET_NAME, getObjectKeyFromUrl } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ solutionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { solutionId } = resolvedParams;

    // 1. Authentication Check
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await AuthService.verifyToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    // 2. Get Solution Details
    const solution = await prisma.solution.findUnique({
      where: { id: solutionId },
      select: {
        id: true,
        isFree: true,
        price: true,
        fileUrl: true,
        authorId: true,
      }
    });

    if (!solution) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      );
    }

    if (!solution.fileUrl) {
      return NextResponse.json(
        { error: 'No file available for this solution' },
        { status: 404 }
      );
    }

    // 3. Authorization Check (Purchase or Free or Author)
    let isAuthorized = false;

    if (solution.isFree) {
      isAuthorized = true;
    } else if (userId) {
      // Check if user is the author
      if (solution.authorId === userId) {
        isAuthorized = true;
      } else {
        // Check for valid purchase
        const purchase = await prisma.solutionPurchase.findFirst({
          where: {
            solutionId: solutionId,
            userId: userId,
            status: 'COMPLETED' // Ensure payment is completed
          },
        });
        if (purchase) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You must purchase this solution to download it.' },
        { status: 403 }
      );
    }

    // 4. Generate Secure Download URL
    const objectKey = getObjectKeyFromUrl(solution.fileUrl);
    
    if (!objectKey) {
      // Fallback: If we can't parse the key, maybe it's an external URL?
      // For now, we'll return the original URL if it doesn't look like ours,
      // but strictly this defeats the purpose if it's just a public link.
      // Assuming all secure files are in our MinIO.
      console.warn(`Could not extract object key from URL: ${solution.fileUrl}`);
      return NextResponse.json(
        { error: 'Invalid file configuration' },
        { status: 500 }
      );
    }

    const minioClient = getMinioClient();
    
    // Generate presigned URL valid for 15 minutes
    const presignedUrl = await minioClient.presignedGetObject(
      BUCKET_NAME,
      objectKey,
      15 * 60 // 15 minutes in seconds
    );

    // 5. Track Download (Async)
    // We don't await this to speed up the response
    if (userId) {
      prisma.solutionDownload.create({
        data: {
          solutionId,
          userId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        },
      }).catch(err => console.error('Error tracking download:', err));
      
      // Increment count
      prisma.solution.update({
        where: { id: solutionId },
        data: { downloadCount: { increment: 1 } },
      }).catch(err => console.error('Error incrementing download count:', err));
    }

    return NextResponse.json({ url: presignedUrl });

  } catch (error) {
    console.error('Error generating secure download link:', error);
    return NextResponse.json(
      { error: 'Failed to generate download link' },
      { status: 500 }
    );
  }
}
