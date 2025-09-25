import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const tutorial = await prisma.tutorial.findUnique({
      where: { slug: params.slug },
    });

    if (!tutorial) {
      return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.tutorial.update({
      where: { id: tutorial.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(tutorial);
  } catch (error) {
    console.error('Failed to fetch tutorial:', error);
    return NextResponse.json({ error: 'Failed to fetch tutorial' }, { status: 500 });
  }
}