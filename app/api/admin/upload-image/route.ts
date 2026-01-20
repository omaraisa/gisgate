import { NextRequest, NextResponse } from 'next/server'
import * as Minio from 'minio'

// Shared MinIO Client Initialization
const getMinioClient = () => {
  // Use a fallback to 127.0.0.1 if we're running on the server to avoid loopback issues with public IP
  const endPoint = process.env.MINIO_ENDPOINT_INTERNAL || process.env.SERVER_IP || '127.0.0.1'

  return new Minio.Client({
    endPoint: endPoint.replace('http://', '').replace('https://', ''),
    port: 9000,
    useSSL: false,
    accessKey: process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY || 'miniomar',
    secretKey: process.env.NEXT_PRIVATE_MINIO_SECRET_KEY || '123wasd#@!WDSA'
  })
}

const BUCKET_NAME = 'images'

export async function POST(request: NextRequest) {
  try {
    const minioClient = getMinioClient()

    const data = await request.formData()
    const file: File | null = data.get('image') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 })
    }

    // Generate unique filename
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const randomId = Math.random().toString(36).substring(2, 11)
    const fileExtension = file.name.split('.').pop() || 'jpg'
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
    } catch (bucketError: any) {
      console.error('Bucket Error:', bucketError)
      return NextResponse.json({
        error: 'MinIO Storage Connection Failed',
        details: bucketError.message
      }, { status: 500 })
    }

    // 2. Upload to MinIO
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      await minioClient.putObject(BUCKET_NAME, objectKey, buffer, buffer.length, {
        'Content-Type': file.type
      })
    } catch (uploadError: any) {
      console.error('Upload Error:', uploadError)
      return NextResponse.json({
        error: 'File Upload Failed',
        details: uploadError.message
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
      fileName: file.name
    })

  } catch (error: any) {
    console.error('Unexpected Upload Error:', error)
    return NextResponse.json({
      error: 'Unexpected server error during upload',
      details: error.message
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
