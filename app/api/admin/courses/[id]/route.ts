import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const course = await prisma.course.findUnique({
      where: { id: resolvedParams.id },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            videoUrl: true,
            duration: true,
            order: true,
            images: {
              select: {
                id: true,
                url: true,
                alt: true,
                caption: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        enrollments: {
          select: {
            id: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const data = await request.json()

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id: resolvedParams.id },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        category: data.category,
        tags: data.tags,
        price: data.price,
        currency: data.currency,
        isFree: data.isFree,
        isPrivate: data.isPrivate,
        level: data.level,
        language: data.language,
        duration: data.duration,
      }
    })

    // Handle lessons
    if (data.lessons) {
      // Get existing lessons
      const existingLessons = await prisma.video.findMany({
        where: { courseId: resolvedParams.id },
        select: { id: true }
      })
      const existingLessonIds = existingLessons.map(l => l.id)
      const newLessonIds = data.lessons.filter((l: any) => l.id).map((l: any) => l.id)

      // Delete lessons that are no longer in the list
      const lessonsToDelete = existingLessonIds.filter(id => !newLessonIds.includes(id))
      if (lessonsToDelete.length > 0) {
        await prisma.video.deleteMany({
          where: { id: { in: lessonsToDelete } }
        })
      }

      // Update or create lessons
      for (let i = 0; i < data.lessons.length; i++) {
        const lessonData = data.lessons[i]

        if (lessonData.id) {
          // Update existing lesson
          await prisma.video.update({
            where: { id: lessonData.id },
            data: {
              title: lessonData.title,
              slug: lessonData.slug,
              excerpt: lessonData.excerpt,
              content: lessonData.content,
              videoUrl: lessonData.videoUrl,
              duration: lessonData.duration,
              order: i,
            }
          })

          // Handle attachments for existing lesson
          if (lessonData.attachments) {
            // Delete existing attachments
            await prisma.videoImage.deleteMany({
              where: { videoId: lessonData.id }
            })

            // Create new attachments
            for (const attachment of lessonData.attachments) {
              if (attachment.url) {
                await prisma.videoImage.create({
                  data: {
                    url: attachment.url,
                    alt: attachment.title || null,
                    caption: attachment.title || null,
                    videoId: lessonData.id,
                  }
                })
              }
            }
          }
        } else {
          // Create new lesson
          const newLesson = await prisma.video.create({
            data: {
              title: lessonData.title,
              slug: lessonData.slug,
              excerpt: lessonData.excerpt,
              content: lessonData.content,
              videoUrl: lessonData.videoUrl,
              duration: lessonData.duration,
              status: 'DRAFT',
              courseId: resolvedParams.id,
              order: i,
            }
          })

          // Create attachments for new lesson
          if (lessonData.attachments && lessonData.attachments.length > 0) {
            for (const attachment of lessonData.attachments) {
              if (attachment.url) {
                await prisma.videoImage.create({
                  data: {
                    url: attachment.url,
                    alt: attachment.title || null,
                    caption: attachment.title || null,
                    videoId: newLesson.id,
                  }
                })
              }
            }
          }
        }
      }
    }

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}