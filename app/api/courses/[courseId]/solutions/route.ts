import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ courseId: string }> }
) {
  try {
    const params = await props.params;
    const { courseId } = params;
    
    const solutions = await prisma.solution.findMany({
      where: {
        courseId,
        status: 'PUBLISHED', // Only show published solutions
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            username: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(solutions);
  } catch (error) {
    console.error('Error fetching course solutions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
