import * as Minio from 'minio';

// New Minio server configuration
const minioClient = new Minio.Client({
  endPoint: '204.12.205.110',
  port: 9001,
  useSSL: false,
  accessKey: 'miniomar', // Using the credentials from the upload routes
  secretKey: '123wasd#@!WDSA'
});

const BUCKETS = ['images', 'solutions'];

async function createBuckets() {
  for (const bucketName of BUCKETS) {
    try {
      console.log(`Checking bucket: ${bucketName}`);

      // Check if bucket exists
      const exists = await minioClient.bucketExists(bucketName);
      if (exists) {
        console.log(`✅ Bucket '${bucketName}' already exists`);
        continue;
      }

      // Create bucket
      await minioClient.makeBucket(bucketName);
      console.log(`📦 Created bucket: ${bucketName}`);

      // Set public read policy
      const policy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { 'AWS': '*' },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }]
      };

      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log(`🔓 Set public read policy on bucket: ${bucketName}`);

    } catch (error) {
      console.error(`❌ Error creating bucket '${bucketName}':`, error);
    }
  }

  console.log('✅ Bucket creation completed!');
}

// Run the script
createBuckets().catch(console.error);