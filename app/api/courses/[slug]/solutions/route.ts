import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const { slug } = params;
    
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const solutions = await prisma.solution.findMany({
      where: {
        courseId: course.id,
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
