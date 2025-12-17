import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ solutionId: string }> }
) {
  try {
    // Await params for Next.js 15 compatibility
    const resolvedParams = await params;
    const { solutionId } = resolvedParams;

    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', hasPurchased: false },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await AuthService.verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token', hasPurchased: false },
        { status: 401 }
      );
    }

    // Check if user has purchased this solution
    const purchase = await prisma.solutionPurchase.findFirst({
      where: {
        solutionId: solutionId,
        userId: payload.userId,
      },
    });

    return NextResponse.json({
      hasPurchased: !!purchase,
    });
  } catch (error) {
    console.error('Error checking purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}