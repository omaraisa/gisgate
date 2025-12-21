import * as Minio from 'minio';

let minioClient: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
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

export const BUCKET_NAME = 'solutions';

/**
 * Extract object key from a full MinIO URL
 */
export function getObjectKeyFromUrl(url: string): string | null {
  try {
    // URL format: http://host:9000/bucket/year/month/filename
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // pathParts[0] is empty, pathParts[1] is bucket
    // We want everything after the bucket
    if (pathParts.length < 3) return null;
    
    // Find the bucket name index
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);
    if (bucketIndex === -1) return null;
    
    // Join everything after the bucket
    return pathParts.slice(bucketIndex + 1).join('/');
  } catch {
    // Fallback for relative URLs or other formats if necessary
    return null;
  }
}
