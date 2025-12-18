import { NextResponse } from 'next/server'
import * as Minio from 'minio'

const BUCKET_NAME = 'files'
const RESUME_FILENAME = 'omar-elhadi.pdf'

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

export async function GET() {
  try {
    const minioClient = getMinioClient();
    // Get the file from MinIO
    const stream = await minioClient.getObject(BUCKET_NAME, RESUME_FILENAME)

    // Get file stats for headers
    const stat = await minioClient.statObject(BUCKET_NAME, RESUME_FILENAME)

    // Return the file with proper headers
    return new NextResponse(stream as unknown as BodyInit, {
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