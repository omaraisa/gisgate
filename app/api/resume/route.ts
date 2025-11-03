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

const BUCKET_NAME = 'files'
const RESUME_FILENAME = 'omar-elhadi.pdf'

export async function GET(request: NextRequest) {
  try {
    // Get the file from MinIO
    const stream = await minioClient.getObject(BUCKET_NAME, RESUME_FILENAME)

    // Get file stats for headers
    const stat = await minioClient.statObject(BUCKET_NAME, RESUME_FILENAME)

    // Return the file with proper headers
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${RESUME_FILENAME}"`,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Error serving resume:', error)

    // If file doesn't exist, return 404
    if (error && typeof error === 'object' && 'code' in error &&
        (error.code === 'NoSuchKey' || error.code === 'NotFound')) {
      return NextResponse.json(
        { error: 'Resume file not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to serve resume file' },
      { status: 500 }
    )
  }
}