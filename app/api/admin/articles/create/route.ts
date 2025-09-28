import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus } from '@prisma/client'
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

interface ArticleData {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  featuredImage?: string
  status?: string
  category?: string
  tags?: string
  metaTitle?: string
  metaDescription?: string
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let articleData: ArticleData = {}
    let uploadedImages: string[] = []

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with potential file uploads)
      const formData = await request.formData()

      // Extract text fields
      articleData = {
        title: formData.get('title') as string,
        slug: formData.get('slug') as string,
        excerpt: formData.get('excerpt') as string,
        content: formData.get('content') as string,
        featuredImage: formData.get('featuredImage') as string,
        status: formData.get('status') as string || ArticleStatus.DRAFT,
        category: formData.get('category') as string,
        tags: formData.get('tags') as string,
        metaTitle: formData.get('metaTitle') as string,
        metaDescription: formData.get('metaDescription') as string,
      }

      // Handle image uploads
      const imageFiles = formData.getAll('images') as File[]
      if (imageFiles.length > 0) {
        uploadedImages = await uploadImagesToMinIO(imageFiles)

        // Replace image placeholders in content with actual URLs
        if (articleData.content) {
          articleData.content = replaceImagePlaceholders(articleData.content, uploadedImages)
        }
      }

    } else {
      // Handle JSON (backward compatibility)
      articleData = await request.json()
    }

    // Validate required fields
    if (!articleData.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    if (!articleData.slug) {
      articleData.slug = generateSlug(articleData.title)
    }

    // Check if slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug: articleData.slug }
    })

    if (existingArticle) {
      return NextResponse.json(
        { error: 'An article with this slug already exists' },
        { status: 400 }
      )
    }

    const newArticle = await prisma.article.create({
      data: {
        title: articleData.title,
        slug: articleData.slug,
        excerpt: articleData.excerpt || null,
        content: articleData.content || '',
        featuredImage: articleData.featuredImage || null,
        status: articleData.status as ArticleStatus || ArticleStatus.DRAFT,
        publishedAt: articleData.status === ArticleStatus.PUBLISHED ? new Date() : null,
        category: articleData.category || null,
        tags: articleData.tags || null,
        metaTitle: articleData.metaTitle || null,
        metaDescription: articleData.metaDescription || null,
      }
    })

    return NextResponse.json({
      ...newArticle,
      uploadedImages
    }, { status: 201 })

  } catch {
    console.error('Error creating article')
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}

// Helper function to upload images to MinIO
async function uploadImagesToMinIO(files: File[]): Promise<string[]> {
  const uploadedUrls: string[] = []

  for (const file of files) {
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
    uploadedUrls.push(imageUrl)
  }

  return uploadedUrls
}

// Helper function to replace image placeholders with actual URLs
function replaceImagePlaceholders(content: string, imageUrls: string[]): string {
  // Look for common placeholder patterns like [IMAGE_1], [IMAGE_2], etc.
  let processedContent = content

  imageUrls.forEach((url, index) => {
    const placeholder = new RegExp(`\\[IMAGE_${index + 1}\\]`, 'gi')
    processedContent = processedContent.replace(placeholder, `![Image ${index + 1}](${url})`)
  })

  return processedContent
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}