# READY-TO-USE CODE FIXES

This document contains copy-paste ready code to fix the critical vulnerabilities.

---

## FIX #1: Add Authentication to Upload Endpoint

**File**: `app/api/admin/upload-image/route.ts`

Replace the entire POST function with this:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import * as Minio from 'minio'

// ... keep getMinioClient function as is

export async function POST(request: NextRequest) {
  try {
    // ADDED: Require admin authentication
    await requireAdmin(request);
    
    const minioClient = getMinioClient()
    let file: File | null = null
    let imageUrlToDownload: string | null = null

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

    // ADDED: File size validation
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file && file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 })
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
      
      // ADDED: Validate magic bytes
      const magicNumbers: Record<string, number[]> = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/gif': [0x47, 0x49, 0x46, 0x38],
        'image/webp': [0x52, 0x49, 0x46, 0x46],
      };
      
      const signature = magicNumbers[file.type];
      if (signature && !signature.every((byte, index) => buffer[index] === byte)) {
        return NextResponse.json({ error: 'File content does not match declared type' }, { status: 400 })
      }
      
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
      console.error('Bucket Error:', bucketError)
      return NextResponse.json({
        error: 'MinIO Storage Connection Failed'
      }, { status: 500 })
    }

    // 2. Upload to MinIO
    try {
      await minioClient.putObject(BUCKET_NAME, objectKey, buffer, buffer.length, {
        'Content-Type': mimeType
      })
    } catch (uploadError) {
      console.error('Upload Error:', uploadError)
      return NextResponse.json({
        error: 'File Upload Failed'
      }, { status: 500 })
    }

    // 3. Generate public URL
    const publicHost = process.env.SERVER_IP || '204.12.205.110'
    const imageUrl = `http://${publicHost}:9000/${BUCKET_NAME}/${objectKey}`

    return NextResponse.json({
      success: true,
      imageUrl,
      objectKey,
      fileName: originalName
    })

  } catch (error) {
    console.error('Unexpected Upload Error:', error)
    // CHANGED: Don't expose error details to client
    return NextResponse.json({
      error: 'Upload failed'
    }, { status: 500 })
  }
}
```

---

## FIX #2: Remove Hardcoded Credentials

**File**: `app/api/admin/upload-image/route.ts`

Replace the `getMinioClient` function:

```typescript
const getMinioClient = () => {
  const endPoint = process.env.MINIO_ENDPOINT_INTERNAL || process.env.SERVER_IP;
  const accessKey = process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY;
  const secretKey = process.env.NEXT_PRIVATE_MINIO_SECRET_KEY;

  // Validate all required config is present
  if (!endPoint) {
    throw new Error('MinIO endpoint not configured');
  }
  if (!accessKey) {
    throw new Error('MinIO access key not configured');
  }
  if (!secretKey) {
    throw new Error('MinIO secret key not configured');
  }

  return new Minio.Client({
    endPoint: endPoint.replace('http://', '').replace('https://', ''),
    port: 9000,
    useSSL: process.env.NODE_ENV === 'production' && process.env.MINIO_USE_SSL === 'true',
    accessKey,
    secretKey
  })
}
```

**Apply same fix to:**
- `app/api/resume/route.ts`
- `app/api/admin/upload-resume/route.ts`

---

## FIX #3: Update .env with Strong Secrets

**File**: `.env` (or create `.env.production`)

```env
# Generate new secrets first:
# JWT_SECRET=$(openssl rand -base64 64)
# NEXTAUTH_SECRET=$(openssl rand -base64 32)
# MINIO_ACCESS=$(openssl rand -base64 16 | tr -d '/+=')
# MINIO_SECRET=$(openssl rand -base64 32)

# Database - CHANGE PASSWORD
DATABASE_URL="postgresql://gisgate_db_user:NEW_SECURE_PASSWORD_HERE@204.12.205.110:5432/gisgate"

# Authentication - REPLACE WITH GENERATED VALUES
JWT_SECRET="PASTE_OUTPUT_FROM_openssl_rand_-base64_64_HERE"
NEXTAUTH_SECRET="PASTE_OUTPUT_FROM_openssl_rand_-base64_32_HERE"

# Email - CHANGE PASSWORD
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="info@gis-gate.com"
SMTP_PASS="NEW_SMTP_PASSWORD_HERE"

SUPPORT_EMAIL="info@gis-gate.com"
FROM_EMAIL="info@gis-gate.com"

# Application
NEXT_PUBLIC_APP_URL="https://gis-gate.com"
SERVER_IP="204.12.205.110"

# MinIO - NEW CREDENTIALS
NEXT_PRIVATE_MINIO_ACCESS_KEY="PASTE_NEW_ACCESS_KEY_HERE"
NEXT_PRIVATE_MINIO_SECRET_KEY="PASTE_NEW_SECRET_KEY_HERE"
MINIO_USE_SSL=false

# PayPal - CONTACT PAYPAL TO ROTATE KEYS
NEXT_PUBLIC_PAYPAL_CLIENT_ID="YOUR_NEW_CLIENT_ID"
NEXT_PRIVATE_PAYPAL_CLIENT_ID="YOUR_NEW_CLIENT_ID"
NEXT_PRIVATE_PAYPAL_CLIENT_SECRET="YOUR_NEW_CLIENT_SECRET"
NEXT_PRIVATE_PAYPAL_ENVIRONMENT="production"
PAYPAL_ENVIRONMENT="production"
PAYPAL_WEBHOOK_ID="YOUR_WEBHOOK_ID"
NEXT_PRIVATE_PAYPAL_WEBHOOK_ID="YOUR_WEBHOOK_ID"

# Payment
PAYMENT_CURRENCY="USD"
NEXT_PRIVATE_PAYMENT_CURRENCY="USD"
NEXT_PUBLIC_PAYMENT_SUCCESS_URL="https://gis-gate.com/payment/success"
NEXT_PUBLIC_PAYMENT_CANCEL_URL="https://gis-gate.com/payment/cancel"
NEXT_PRIVATE_PAYMENT_SUCCESS_URL="https://gis-gate.com/payment/success"
NEXT_PRIVATE_PAYMENT_CANCEL_URL="https://gis-gate.com/payment/cancel"

# Security
HTTPS_ENABLED=true
NODE_ENV=production
```

---

## FIX #4: Add Authentication to WordPress Migration

**File**: `app/api/wordpress-migrate/route.ts`

Add this line at the start of both POST and GET handlers:

```typescript
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    // ADD THIS LINE
    await requireAdmin(request);
    
    const body = await request.json();
    // ... rest of code
  }
}

export async function GET(request: NextRequest) {
  // ADD THIS LINE
  await requireAdmin(request);
  
  const { searchParams } = new URL(request.url);
  // ... rest of code
}
```

---

## FIX #5: Fix XSS Vulnerabilities

**Step 1**: Install DOMPurify

```bash
npm install isomorphic-dompurify
npm install --save-dev @types/dompurify
```

**Step 2**: Create sanitizer utility

**File**: `lib/html-sanitizer.ts`

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirtyHTML: string): string {
  return DOMPurify.sanitize(dirtyHTML, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
  });
}
```

**Step 3**: Update components

**File**: `app/courses/[slug]/page.tsx` (line 599)

```typescript
import { sanitizeHTML } from '@/lib/html-sanitizer';

// BEFORE:
<div dangerouslySetInnerHTML={{ __html: course.description }} />

// AFTER:
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(course.description) }} />
```

**Apply same fix to:**
- `app/components/LessonContent.tsx` (line 156)
- `app/components/ArticleContent.tsx` (line 156)
- `app/courses/[slug]/lessons/[lessonSlug]/page.tsx` (line 471)

---

## FIX #6: Secure Docker Configuration

**File**: `Dockerfile`

Replace with this secure version:

```dockerfile
FROM node:20.11.0-alpine AS base

# Security: Update packages
RUN apk upgrade --no-cache

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 build-base

# Security: Create user early
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app
RUN chown nextjs:nodejs /app

# Security: Install as non-root
USER nextjs

COPY --chown=nextjs:nodejs package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

FROM base AS builder
RUN apk add --no-cache libc6-compat python3 build-base

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown nextjs:nodejs /app

USER nextjs

COPY --chown=nextjs:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

FROM base AS runner
WORKDIR /app

RUN apk upgrade --no-cache && \
    apk add --no-cache curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Security: Read-only except cache
RUN chmod -R 555 /app && \
    mkdir -p /app/.next/cache && \
    chown nextjs:nodejs /app/.next/cache

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**File**: `docker-compose.blue.yml`

```yaml
version: '3.8'

services:
  gisgate-blue:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: gisgate_blue
    ports:
      - "8001:3000"
    
    # REMOVED: Insecure volume mounts
    # volumes:
    #   - /var/www/static/image:/app/public/static/image:ro
    #   - /var/www/uploads/images:/app/public/uploads/images
    
    env_file:
      - .env.production
    
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
    
    restart: unless-stopped
    
    # ADDED: Resource limits
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    
    # ADDED: Security options
    read_only: true
    tmpfs:
      - /tmp
      - /app/.next/cache
    
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    
    security_opt:
      - no-new-privileges:true
    
    user: "1001:1001"
    
    extra_hosts:
      - "host.docker.internal:host-gateway"
    
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Apply same changes to `docker-compose.green.yml` and `docker-compose.staging.yml`.

---

## FIX #7: Remove Build Error Ignores

**File**: `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  
  // REMOVED: These were dangerous
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  
  // Keep the rest as is
  webpack: (config, { isServer }) => {
    // ... existing webpack config
    return config;
  },
  
  serverExternalPackages: ['canvas', 'fabric'],
  
  images: {
    // ... existing images config
  },
};

export default nextConfig;
```

---

## FIX #8: Emergency Script to Kill Malware

**Create**: `emergency-cleanup.sh`

```bash
#!/bin/bash
# Emergency malware cleanup script

echo "🚨 Emergency malware cleanup starting..."

# 1. Stop Docker containers
echo "Stopping Docker containers..."
docker stop gisgate_blue gisgate_green gisgate_staging 2>/dev/null

# 2. Kill any xmrig processes
echo "Killing mining processes..."
docker exec gisgate_blue pkill -9 xmrig 2>/dev/null
docker exec gisgate_green pkill -9 xmrig 2>/dev/null
sudo pkill -9 xmrig 2>/dev/null

# 3. Block mining pool connections
echo "Blocking mining pools..."
sudo iptables -A OUTPUT -d pool.supportxmr.com -j DROP
sudo iptables -A OUTPUT -d kryptex.network -j DROP
sudo iptables -A OUTPUT -d c3pool.org -j DROP
sudo iptables -A OUTPUT -d hashvault.pro -j DROP
sudo iptables -A OUTPUT -p tcp --dport 8029 -j DROP
sudo iptables -A OUTPUT -p tcp --dport 3333 -j DROP
sudo iptables -A OUTPUT -p tcp --dport 7777 -j DROP

# 4. Save evidence
echo "Capturing evidence..."
docker logs gisgate_blue > /tmp/malware-evidence-$(date +%Y%m%d-%H%M%S).log 2>&1
docker logs gisgate_green >> /tmp/malware-evidence-$(date +%Y%m%d-%H%M%S).log 2>&1

# 5. Search for malware files
echo "Searching for malware..."
sudo find / -name "*xmrig*" -type f 2>/dev/null > /tmp/malware-files.txt
sudo find / -name "config.json" -type f -exec grep -l "pool" {} \; 2>/dev/null >> /tmp/malware-files.txt

# 6. Check cron jobs
echo "Checking cron jobs..."
sudo crontab -l > /tmp/cron-root.txt 2>&1
crontab -l > /tmp/cron-user.txt 2>&1

echo "✅ Emergency cleanup complete"
echo "📋 Evidence saved to /tmp/malware-evidence-*.log"
echo "📋 Suspicious files saved to /tmp/malware-files.txt"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Review files in /tmp/malware-files.txt"
echo "2. Delete malware files manually"
echo "3. Rotate ALL credentials"
echo "4. Deploy fixed code"
```

Make it executable:
```bash
chmod +x emergency-cleanup.sh
```

---

## FIX #9: Generate New Secrets Script

**Create**: `generate-secrets.sh`

```bash
#!/bin/bash
# Generate new secure secrets

echo "🔐 Generating new secure secrets..."
echo ""
echo "Copy these to your .env.production file:"
echo ""
echo "# Database Password"
echo "DATABASE_PASSWORD=\"$(openssl rand -base64 32 | tr -d '/+=')\"" 
echo ""
echo "# JWT Secret"
echo "JWT_SECRET=\"$(openssl rand -base64 64)\""
echo ""
echo "# NextAuth Secret"
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\""
echo ""
echo "# MinIO Credentials"
echo "NEXT_PRIVATE_MINIO_ACCESS_KEY=\"$(openssl rand -base64 16 | tr -d '/+=')\""
echo "NEXT_PRIVATE_MINIO_SECRET_KEY=\"$(openssl rand -base64 32)\""
echo ""
echo "⚠️  Save these securely and update all configurations!"
```

---

## DEPLOYMENT CHECKLIST

After applying fixes:

```markdown
## Pre-Deployment Checklist

- [ ] All code fixes applied
- [ ] New .env.production created with strong secrets
- [ ] Hardcoded credentials removed from code
- [ ] Dependencies updated: `npm audit fix`
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass (if you have tests)
- [ ] Docker builds successfully: `docker build -t gisgate-test .`

## Post-Deployment Checklist

- [ ] Emergency cleanup script run on server
- [ ] All credentials rotated (Database, MinIO, SMTP, PayPal)
- [ ] New code deployed
- [ ] Health check passing: `curl https://gis-gate.com/api/health`
- [ ] Authentication working (try accessing admin endpoint without token)
- [ ] File upload requires authentication
- [ ] No mining processes running: `ps aux | grep xmrig`
- [ ] Firewall rules applied
- [ ] Monitoring alerts configured
- [ ] Backup verified

## Verification Commands

# Test authentication is required:
curl -X POST https://gis-gate.com/api/admin/upload-image
# Should return: 401 Unauthorized

# Test with valid admin token:
curl -H "Authorization: Bearer YOUR_TOKEN" -X POST https://gis-gate.com/api/admin/upload-image
# Should return: 400 No image file provided (good - passed auth)

# Check no mining connections:
sudo netstat -anp | grep -E "8029|3333|7777"
# Should return: nothing

# Check resource usage:
top
# CPU should be normal (not 100%)
```

---

## QUICK REFERENCE

### Generate Strong Password
```bash
openssl rand -base64 32
```

### Generate JWT Secret
```bash
openssl rand -base64 64
```

### Check for Mining Process
```bash
ps aux | grep -i xmrig
docker exec gisgate_blue ps aux | grep -i xmrig
```

### View Recent Logs
```bash
docker logs gisgate_blue --tail 100
```

### Test API Authentication
```bash
# Without auth (should fail):
curl -X POST http://your-server/api/admin/upload-image

# With auth (should work):
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -X POST http://your-server/api/admin/upload-image
```

---

These code fixes address the most critical vulnerabilities. Apply them in order, test thoroughly, and deploy to production as soon as possible.
