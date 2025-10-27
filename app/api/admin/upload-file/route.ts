import { NextRequest, NextResponse } from 'next/server'
import * as Minio from 'minio'

// MinIO configuration (same as your image upload)
const minioClient = new Minio.Client({
  endPoint: '13.61.185.194',
  port: 9000,
  useSSL: false,
  accessKey: 'miniomar',
  secretKey: '123wasd#@!WDSA'
})

const BUCKET_NAME = 'solutions' // Dedicated bucket for marketplace solution files

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 100MB for solution files)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 100MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename with year/month structure
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'bin'
    const fileName = `${randomId}.${fileExtension}`
    const objectKey = `${year}/${month}/${fileName}`

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
    const fileUrl = `http://13.61.185.194:9000/${BUCKET_NAME}/${objectKey}`

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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}