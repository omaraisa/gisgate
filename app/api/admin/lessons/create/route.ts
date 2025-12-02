import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      status,
      category,
      tags,
      metaTitle,
      metaDescription,
      videoUrl,
      duration,
      thumbnail,
      courseId,
      order
    } = body

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      // Generate unique slug from title
      const baseSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      let slugCandidate = baseSlug;
      let counter = 1;

      // Ensure slug is unique
      while (true) {
        const existingLesson = await prisma.video.findUnique({
          where: { slug: slugCandidate }
        });

        if (!existingLesson) break;

        // If slug exists, append counter
        slugCandidate = `${baseSlug}-${counter}`;
        counter++;

        // Prevent infinite loop
        if (counter > 100) {
          slugCandidate = `${baseSlug}-${Date.now()}`;
          break;
        }
      }

      finalSlug = slugCandidate;
    } else {
      // Check if provided slug is unique
      const existingLesson = await prisma.video.findUnique({
        where: { slug: finalSlug }
      });

      if (existingLesson) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    const newLesson = await prisma.video.create({
      data: {
        title,
        slug: finalSlug,
        excerpt,
        content,
        featuredImage,
        status: status as ArticleStatus,
        category,
        tags,
        metaTitle,
        metaDescription,
        videoUrl,
        duration,
        thumbnail,
        courseId,
        order: order || 0
      }
    })

    return NextResponse.json(newLesson, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}