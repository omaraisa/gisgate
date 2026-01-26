import { NextRequest, NextResponse } from 'next/server'
import * as Minio from 'minio'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit'
import { validateFileSize } from '@/lib/file-validation'

const BUCKET_NAME = 'solutions' // Dedicated bucket for marketplace solution files

// Helper function to get MinIO client (lazy initialization)
function getMinioClient() {
  // Validate required environment variables
  if (!process.env.SERVER_IP) {
    throw new Error('SERVER_IP environment variable is required')
  }

  // MinIO configuration (same as your image upload)
  if (!process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY || !process.env.NEXT_PRIVATE_MINIO_SECRET_KEY) {
    throw new Error('MinIO credentials not configured')
  }

  return new Minio.Client({
    endPoint: process.env.SERVER_IP,
    port: 9000,
    useSSL: false,
    accessKey: process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY,
    secretKey: process.env.NEXT_PRIVATE_MINIO_SECRET_KEY
  })
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require admin authentication
    await requireAdmin(request)

    // SECURITY: Rate limiting - prevent upload abuse
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(identifier, RateLimitPresets.UPLOAD_FILE);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // SECURITY: Validate file size (max 250MB for solution files)
    const sizeValidation = validateFileSize(file.size, 250);
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 400 })
    }

    // Generate unique filename with year/month structure
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'bin'
    const fileName = `${randomId}.${fileExtension}`
    const objectKey = `${year}/${month}/${fileName}`

    const minioClient = getMinioClient()

    // Ensure bucket exists and has public read policy
    try {
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME)
      if (!bucketExists) {
        await minioClient.makeBucket(BUCKET_NAME)
      }

      // Always set public read policy (whether bucket is new or existing)
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
    } catch (bucketError) {
      console.error('Error with bucket operations:', bucketError)
      const errorMessage = bucketError instanceof Error ? bucketError.message : 'Unknown bucket error'
      return NextResponse.json(
        { error: `Bucket operation failed: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Convert file to buffer and upload to MinIO
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Set appropriate content type or use original
    const contentType = file.type || 'application/octet-stream'

    await minioClient.putObject(BUCKET_NAME, objectKey, buffer, buffer.length, {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${file.name}"`
    })

    // Generate public URL
    const fileUrl = `http://${process.env.SERVER_IP}:9000/${BUCKET_NAME}/${objectKey}`

    // Calculate file size in human readable format
    const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)

    return NextResponse.json({
      success: true,
      fileUrl,
      objectKey,
      fileName: file.name,
      fileSize: `${fileSizeInMB} MB`,
      fileType: fileExtension.toUpperCase(),
      size: file.size,
      contentType: file.type
    })

  } catch (error) {
    // Handle authentication errors with proper status codes
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || 
          error.message.includes('Invalid or expired token') ||
          error.message.includes('User not found or inactive')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (error.message.includes('Admin access required')) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://gis-gate.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}