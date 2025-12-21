import { NextRequest, NextResponse } from 'next/server'
import * as Minio from 'minio'

const BUCKET_NAME = 'solutions' // Dedicated bucket for marketplace solution files

// Lazy MinIO client initialization
let minioClient: Minio.Client | null = null;

function getMinioClient(): Minio.Client {
  if (!minioClient) {
    const endpoint = process.env.SERVER_IP || 'dev.gis-gate.com';
    // Remove protocol if present
    const cleanEndpoint = endpoint.replace(/^https?:\/\//, '');
    
    minioClient = new Minio.Client({
      endPoint: cleanEndpoint,
      port: 9000,
      useSSL: true,
      accessKey: process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY || '',
      secretKey: process.env.NEXT_PRIVATE_MINIO_SECRET_KEY || ''
    });
  }
  return minioClient;
}

export async function POST(request: NextRequest) {
  try {
    const minioClient = getMinioClient();
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 250MB for solution files)
    const maxSize = 250 * 1024 * 1024 // 250MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 250MB.' },
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
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME)
      if (!bucketExists) {
        await minioClient.makeBucket(BUCKET_NAME)
      }

      // NOTE: We do NOT set a public read policy here anymore.
      // The 'solutions' bucket should be private to ensure secure downloads via signed URLs.
      // If the bucket was previously public, you should run 'scripts/secure-solutions-bucket.ts' to fix it.
      
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