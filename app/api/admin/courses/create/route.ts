import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus, CourseLevel } from '@prisma/client'
import * as Minio from 'minio'

// MinIO configuration
const minioClient = new Minio.Client({
  endPoint: '13.61.185.194',
  port: 9000,
  useSSL: false,
  accessKey: 'miniomar',
  secretKey: '123wasd#@!WDSA'
})

const BUCKET_NAME = 'images'

interface CourseData {
  title?: string
  titleEnglish?: string
  slug?: string
  description?: string
  excerpt?: string
  featuredImage?: string
  category?: string
  tags?: string
  status?: string
  price?: number
  currency?: string
  isFree?: boolean
  isPrivate?: boolean
  level?: string
  language?: string
  duration?: string
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let courseData: CourseData = {}

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with potential file uploads)
      const formData = await request.formData()

      // Extract text fields
      courseData = {
        title: formData.get('title') as string,
        titleEnglish: formData.get('titleEnglish') as string,
        slug: formData.get('slug') as string,
        description: formData.get('description') as string,
        excerpt: formData.get('excerpt') as string,
        featuredImage: formData.get('featuredImage') as string,
        category: formData.get('category') as string,
        tags: formData.get('tags') as string,
        status: formData.get('status') as string || ArticleStatus.DRAFT,
        price: formData.get('price') ? parseFloat(formData.get('price') as string) : 0,
        currency: formData.get('currency') as string || 'USD',
        isFree: formData.get('isFree') === 'true',
        isPrivate: formData.get('isPrivate') === 'true',
        level: formData.get('level') as string || CourseLevel.BEGINNER,
        language: formData.get('language') as string || 'ar',
        duration: formData.get('duration') as string,
      }

      // Handle featured image upload
      const featuredImageFile = formData.get('featuredImageFile') as File
      if (featuredImageFile) {
        const uploadedImageUrl = await uploadImageToMinIO(featuredImageFile)
        courseData.featuredImage = uploadedImageUrl
      }

    } else {
      // Handle JSON (backward compatibility)
      courseData = await request.json()
    }

    // Validate required fields
    if (!courseData.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    if (!courseData.slug) {
      courseData.slug = generateSlug(courseData.title)
    }

    // Check if slug already exists
    const existingCourse = await prisma.course.findUnique({
      where: { slug: courseData.slug }
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'A course with this slug already exists' },
        { status: 400 }
      )
    }

    const newCourse = await prisma.course.create({
      data: {
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description || null,
        excerpt: courseData.excerpt || null,
        featuredImage: courseData.featuredImage || null,
        category: courseData.category || null,
        tags: courseData.tags || null,
        status: courseData.status as ArticleStatus || ArticleStatus.DRAFT,
        publishedAt: courseData.status === ArticleStatus.PUBLISHED ? new Date() : null,
        price: courseData.price || 0,
        currency: courseData.currency || 'USD',
        isFree: courseData.isFree !== undefined ? courseData.isFree : true,
        isPrivate: courseData.isPrivate || false,
        level: courseData.level as CourseLevel || CourseLevel.BEGINNER,
        language: courseData.language || 'ar',
        duration: courseData.duration || null,
      }
    })

    return NextResponse.json(newCourse, { status: 201 })

  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}

// Helper function to upload image to MinIO
async function uploadImageToMinIO(file: File): Promise<string> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type for ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`)
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`)
  }

  // Generate unique filename with year/month structure
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const randomId = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop() || 'jpg'
  const fileName = `${randomId}.${fileExtension}`
  const objectKey = `${year}/${month}/${fileName}`

  // Ensure bucket exists
  try {
    await minioClient.bucketExists(BUCKET_NAME)
  } catch {
    await minioClient.makeBucket(BUCKET_NAME)
    const policy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { 'AWS': '*' },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
      }]
    }
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy))
  }

  // Upload to MinIO
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  await minioClient.putObject(BUCKET_NAME, objectKey, buffer, buffer.length, {
    'Content-Type': file.type
  })

  const imageUrl = `http://13.61.185.194:9000/${BUCKET_NAME}/${objectKey}`
  return imageUrl
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}