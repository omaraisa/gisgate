import { NextRequest, NextResponse } from 'next/server'
import * as Minio from 'minio'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit'
import { validatePDFFile, validateFileSize } from '@/lib/file-validation'

// Validate required environment variables
if (!process.env.SERVER_IP) {
  throw new Error('SERVER_IP environment variable is required')
}

// MinIO configuration
if (!process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY || !process.env.NEXT_PRIVATE_MINIO_SECRET_KEY) {
  throw new Error('MinIO credentials not configured')
}

const minioClient = new Minio.Client({
  endPoint: process.env.SERVER_IP,
  port: 9000,
  useSSL: false,
  accessKey: process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY,
  secretKey: process.env.NEXT_PRIVATE_MINIO_SECRET_KEY
})

const BUCKET_NAME = 'files' // Dedicated bucket for resume files
const RESUME_FILENAME = 'omar-elhadi.pdf'

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

    // SECURITY: Validate file size (max 10MB for resume)
    const sizeValidation = validateFileSize(file.size, 10 * 1024 * 1024);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 400 }
      )
    }

    // Convert file to buffer for magic byte validation
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // SECURITY: Validate file type using magic bytes (only PDF allowed)
    const fileValidation = await validatePDFFile(buffer);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      )
    }

    // Ensure bucket exists
    try {
      await minioClient.bucketExists(BUCKET_NAME)
    } catch {
      await minioClient.makeBucket(BUCKET_NAME)
      // Set public read policy for downloads
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

    // Upload to MinIO (buffer already created for validation)
    await minioClient.putObject(BUCKET_NAME, RESUME_FILENAME, buffer, buffer.length, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${RESUME_FILENAME}"`
    })

    // Generate public URL
    const fileUrl = `http://${process.env.SERVER_IP}:9000/${BUCKET_NAME}/${RESUME_FILENAME}`

    // Calculate file size in human readable format
    const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: RESUME_FILENAME,
      fileSize: `${fileSizeInMB} MB`,
      size: file.size,
      uploadedAt: new Date().toISOString()
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

    console.error('Error uploading resume:', error)
    return NextResponse.json(
      { error: 'Failed to upload resume' },
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