import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { ArticleStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const payload = await AuthService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      repoUrl, 
      demoUrl, 
      courseId, 
      lessonId,
      solutionType 
    } = body;

    if (!title || !description || !courseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create slug
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const solution = await prisma.solution.create({
      data: {
        title,
        slug,
        description,
        sourceCodeUrl: repoUrl,
        demoUrl,
        courseId,
        lessonId,
        authorId: payload.userId,
        status: 'PENDING_REVIEW' as ArticleStatus,
        solutionType: solutionType || 'OTHER',
        isFree: true, // User submissions are free
        price: 0,
      }
    });

    return NextResponse.json(solution);

  } catch (error) {
    console.error('Error submitting solution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
