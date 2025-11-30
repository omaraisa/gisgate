import { NextRequest, NextResponse } from 'next/server'
import * as Minio from 'minio'

// Validate required environment variables
if (!process.env.SERVER_IP) {
  throw new Error('SERVER_IP environment variable is required')
}

// MinIO configuration
const minioClient = new Minio.Client({
  endPoint: process.env.SERVER_IP,
  port: 9000,
  useSSL: false,
  accessKey: process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY || 'miniomar',
  secretKey: process.env.NEXT_PRIVATE_MINIO_SECRET_KEY || '123wasd#@!WDSA'
})

const BUCKET_NAME = 'images'

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.SERVER_IP) {
      console.error('SERVER_IP environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error: SERVER_IP not set' },
        { status: 500 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('image') as unknown as File

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename with year/month structure
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${randomId}.${fileExtension}`
    const objectKey = `${year}/${month}/${fileName}`

    console.log('Attempting to upload file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      objectKey,
      bucket: BUCKET_NAME,
      endpoint: process.env.SERVER_IP
    })

    // Ensure bucket exists
    try {
      console.log('Checking if bucket exists:', BUCKET_NAME)
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME)
      console.log('Bucket exists:', bucketExists)

      if (!bucketExists) {
        console.log('Creating bucket:', BUCKET_NAME)
        await minioClient.makeBucket(BUCKET_NAME)

        // Set public read policy
        const policy = {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { 'AWS': '*' },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }]
        }
        console.log('Setting bucket policy')
        await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy))
        console.log('Bucket policy set successfully')
      }
    } catch (bucketError) {
      console.error('Error with bucket operations:', bucketError)
      const errorMessage = bucketError instanceof Error ? bucketError.message : 'Unknown bucket error'
      return NextResponse.json(
        { error: `Bucket operation failed: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Convert file to buffer and upload to MinIO
    try {
      console.log('Converting file to buffer')
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      console.log('File converted to buffer, size:', buffer.length)

      console.log('Uploading to MinIO...')
      await minioClient.putObject(BUCKET_NAME, objectKey, buffer, buffer.length, {
        'Content-Type': file.type
      })
      console.log('Upload to MinIO successful')
    } catch (uploadError) {
      console.error('Error uploading to MinIO:', uploadError)
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown upload error'
      return NextResponse.json(
        { error: `Upload failed: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Generate public URL
    const imageUrl = `http://${process.env.SERVER_IP}:9000/${BUCKET_NAME}/${objectKey}`
    console.log('Generated image URL:', imageUrl)

    return NextResponse.json({
      success: true,
      imageUrl,
      objectKey,
      fileName: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Unexpected error in upload-image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { error: `Unexpected error: ${errorMessage}`, stack: errorStack },
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