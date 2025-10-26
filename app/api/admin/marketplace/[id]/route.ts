import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const solution = await prisma.solution.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullNameArabic: true,
            fullNameEnglish: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                email: true,
                fullNameArabic: true,
                fullNameEnglish: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }

    return NextResponse.json(solution);
  } catch (error) {
    console.error('Error fetching solution:', error);
    return NextResponse.json({ error: 'Failed to fetch solution' }, { status: 500 });
  }
}
