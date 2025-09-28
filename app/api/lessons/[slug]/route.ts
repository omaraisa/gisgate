import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const video = await prisma.video.findUnique({
      where: { slug },
      include: {
        images: true,
        author: {
          select: {
            fullNameArabic: true,
            fullNameEnglish: true,
            email: true
          }
        }
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Format the response
    const formattedVideo = {
      id: video.id,
      title: video.title,
      slug: video.slug,
      content: video.content,
      excerpt: video.excerpt,
      featuredImage: video.featuredImage,
      category: video.category,
      tags: video.tags,
      publishedAt: video.publishedAt?.toISOString(),
      viewCount: video.viewCount,
      videoUrl: video.videoUrl,
      duration: video.duration,
      authorName: video.authorName || video.author?.fullNameArabic || video.author?.fullNameEnglish || 'مجهول',
      images: video.images
    };

    return NextResponse.json(formattedVideo);
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}