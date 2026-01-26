import { NextRequest, NextResponse } from 'next/server'
import * as Minio from 'minio'
import { requireAdmin } from '@/lib/api-auth'

// Shared MinIO Client Initialization
const getMinioClient = () => {
  // Validate required credentials
  if (!process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY || !process.env.NEXT_PRIVATE_MINIO_SECRET_KEY) {
    throw new Error('MinIO credentials not configured')
  }

  // Use a fallback to 127.0.0.1 if we're running on the server to avoid loopback issues with public IP
  const endPoint = process.env.MINIO_ENDPOINT_INTERNAL || process.env.SERVER_IP || '127.0.0.1'

  return new Minio.Client({
    endPoint: endPoint.replace('http://', '').replace('https://', ''),
    port: 9000,
    useSSL: false,
    accessKey: process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY,
    secretKey: process.env.NEXT_PRIVATE_MINIO_SECRET_KEY
  })
}

const BUCKET_NAME = 'images'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require admin authentication
    await requireAdmin(request)

    const minioClient = getMinioClient()
    let file: File | null = null
    let imageUrlToDownload: string | null = null

    // Check if it's form data (file upload) or JSON (URL upload)
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const data = await request.formData()
      file = data.get('image') as unknown as File
    } else if (contentType.includes('application/json')) {
      const body = await request.json()
      imageUrlToDownload = body.url
    }

    if (!file && !imageUrlToDownload) {
      return NextResponse.json({ error: 'No image file or URL provided' }, { status: 400 })
    }

    let buffer: Buffer
    let mimeType: string
    let originalName: string

    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 })
      }
      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)
      mimeType = file.type
      originalName = file.name
    } else {
      // Download from URL
      try {
        const response = await fetch(imageUrlToDownload!)
        if (!response.ok) throw new Error('Failed to fetch image')
        const arrayBuffer = await response.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
        mimeType = response.headers.get('content-type') || 'image/jpeg'
        originalName = imageUrlToDownload!.split('/').pop() || 'image.jpg'
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: 'Failed to download image from URL', details: errorMessage }, { status: 500 })
      }
    }

    // Generate unique filename
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const randomId = Math.random().toString(36).substring(2, 11)
    const fileExtension = mimeType.split('/').pop()?.split('+')[0] || 'jpg'
    const fileName = `${randomId}.${fileExtension}`
    const objectKey = `${year}/${month}/${fileName}`

    // 1. Ensure bucket exists and is public
    try {
      if (!(await minioClient.bucketExists(BUCKET_NAME))) {
        await minioClient.makeBucket(BUCKET_NAME)
      }

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
      const errorMessage = bucketError instanceof Error ? bucketError.message : 'Unknown error'
      console.error('Bucket Error:', bucketError)
      return NextResponse.json({
        error: 'MinIO Storage Connection Failed',
        details: errorMessage
      }, { status: 500 })
    }

    // 2. Upload to MinIO
    try {
      await minioClient.putObject(BUCKET_NAME, objectKey, buffer, buffer.length, {
        'Content-Type': mimeType
      })
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error'
      console.error('Upload Error:', uploadError)
      return NextResponse.json({
        error: 'File Upload Failed',
        details: errorMessage
      }, { status: 500 })
    }

    // 3. Generate public URL
    // We use the public SERVER_IP for the URL so clients can access it, 
    // but the internal connection used localhost/internal IP
    const publicHost = process.env.SERVER_IP || '204.12.205.110'
    const imageUrl = `http://${publicHost}:9000/${BUCKET_NAME}/${objectKey}`

    return NextResponse.json({
      success: true,
      imageUrl,
      objectKey,
      fileName: originalName
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

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Unexpected Upload Error:', error)
    return NextResponse.json({
      error: 'Unexpected server error during upload',
      details: errorMessage
    }, { status: 500 })
  }
}

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
