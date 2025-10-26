import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/marketplace/download - Track solution download
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { solutionId, userId } = body;

    // Create download record
    await prisma.solutionDownload.create({
      data: {
        solutionId,
        userId: userId || null,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    });

    // Increment download count
    await prisma.solution.update({
      where: { id: solutionId },
      data: { downloadCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking download:', error);
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    );
  }
}
