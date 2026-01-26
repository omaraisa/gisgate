# SECURITY HARDENING RECOMMENDATIONS

Comprehensive security improvements for the GIS Gate application.

---

## IMMEDIATE EMERGENCY ACTIONS (Do First)

### 1. Incident Response

```bash
# 1. ISOLATE THE SERVER
# Disconnect from network or block all traffic except SSH
sudo iptables -I INPUT -p tcp --dport 80 -j DROP
sudo iptables -I INPUT -p tcp --dport 443 -j DROP

# 2. IDENTIFY AND KILL MINING PROCESSES
docker exec gisgate_blue ps aux | grep xmrig
docker exec gisgate_blue pkill -9 xmrig
# Or stop containers completely:
docker stop gisgate_blue gisgate_green

# 3. BLOCK MINING POOL CONNECTIONS
sudo iptables -A OUTPUT -d pool.supportxmr.com -j DROP
sudo iptables -A OUTPUT -d kryptex.network -j DROP
sudo iptables -A OUTPUT -d c3pool.org -j DROP
sudo iptables -A OUTPUT -d hashvault.pro -j DROP
sudo iptables -A OUTPUT -p tcp --dport 8029 -j DROP

# 4. CAPTURE EVIDENCE
docker logs gisgate_blue > /tmp/breach-logs.txt
docker cp gisgate_blue:/app /tmp/container-filesystem
sudo cp -r /var/www /tmp/host-filesystem-backup

# 5. SCAN FOR ROOTKITS
sudo apt install -y rkhunter chkrootkit
sudo rkhunter --check
sudo chkrootkit
```

### 2. Credential Rotation (CRITICAL)

**ALL credentials must be changed immediately:**

```bash
# Generate new secrets
JWT_NEW=$(openssl rand -base64 64)
NEXTAUTH_NEW=$(openssl rand -base64 32)
MINIO_ACCESS_NEW=$(openssl rand -base64 16 | tr -d '/+=')
MINIO_SECRET_NEW=$(openssl rand -base64 32)

echo "New JWT Secret: $JWT_NEW"
echo "New NextAuth Secret: $NEXTAUTH_NEW"
echo "New MinIO Access Key: $MINIO_ACCESS_NEW"
echo "New MinIO Secret Key: $MINIO_SECRET_NEW"
```

**Rotate these credentials:**
- [ ] Database password (PostgreSQL)
- [ ] JWT_SECRET
- [ ] NEXTAUTH_SECRET
- [ ] MinIO access key and secret
- [ ] SMTP password
- [ ] PayPal API credentials (contact PayPal support)
- [ ] SSH keys (generate new, revoke old)
- [ ] Sudo passwords
- [ ] Any other API keys

**Update all servers and clients with new credentials**

### 3. Review and Remove Malware

```bash
# Search for XMRig files
sudo find / -name "*xmrig*" -type f 2>/dev/null
sudo find / -name "*.so" -type f -mtime -30 2>/dev/null
sudo find / -type f -name "config.json" -exec grep -l "pool" {} \;

# Check cron jobs
sudo crontab -l
sudo crontab -l -u www-data
sudo cat /etc/cron*/*

# Check startup scripts
sudo cat /etc/rc.local
sudo ls -la /etc/systemd/system/

# Check for unauthorized SSH keys
cat ~/.ssh/authorized_keys
```

---

## APPLICATION CODE FIXES (Priority Order)

### Fix #1: Add Authentication to File Upload Endpoints

**File**: `app/api/admin/upload-image/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'  // ADD THIS
import * as Minio from 'minio'

export async function POST(request: NextRequest) {
  try {
    // ADD THIS LINE - Require admin authentication
    await requireAdmin(request);
    
    const minioClient = getMinioClient()
    // ... rest of the code
```

**File**: `app/api/admin/upload-resume/route.ts` - Same fix

### Fix #2: Add Authentication to WordPress Migration

**File**: `app/api/wordpress-migrate/route.ts`

```typescript
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    // ADD THIS LINE
    await requireAdmin(request);
    
    const body = await request.json();
    // ... rest of code
```

### Fix #3: Remove Hardcoded Credentials

**File**: `app/api/admin/upload-image/route.ts`

```typescript
// CURRENT (VULNERABLE):
const getMinioClient = () => {
  const endPoint = process.env.MINIO_ENDPOINT_INTERNAL || process.env.SERVER_IP || '127.0.0.1'
  return new Minio.Client({
    endPoint: endPoint.replace('http://', '').replace('https://', ''),
    port: 9000,
    useSSL: false,
  })
}

// FIXED (SECURE):
const getMinioClient = () => {
  const endPoint = process.env.MINIO_ENDPOINT_INTERNAL || process.env.SERVER_IP;
  const accessKey = process.env.NEXT_PRIVATE_MINIO_ACCESS_KEY;
  const secretKey = process.env.NEXT_PRIVATE_MINIO_SECRET_KEY;

  if (!endPoint || !accessKey || !secretKey) {
    throw new Error('MinIO configuration is incomplete. Check environment variables.');
  }

  return new Minio.Client({
    endPoint: endPoint.replace('http://', '').replace('https://', ''),
    port: 9000,
    useSSL: process.env.NODE_ENV === 'production', // Use SSL in production
    accessKey,
    secretKey
  })
}
```

Apply same fix to:
- `app/api/resume/route.ts`
- `app/api/admin/upload-resume/route.ts`

### Fix #4: Strengthen JWT Secret

**File**: `.env`

```env
# CURRENT (VULNERABLE):
JWT_SECRET="your-super-secure-jwt-secret-key-here-change-this-in-production"

# REPLACE WITH:
JWT_SECRET="<output from: openssl rand -base64 64>"

# Example:
JWT_SECRET="xK9vM2pL7qR3wE5yT8nH6jD4fG1aS0zX9cV7bN5mQ2wE8rT3yU6iO1pA4sD7fG0h"
```

### Fix #5: Implement Proper File Upload Security

**Create new file**: `lib/file-upload-security.ts`

```typescript
import crypto from 'crypto';

export interface FileValidationOptions {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  scanForMalware?: boolean;
}

export class FileUploadSecurity {
  
  // Validate file magic bytes (not just MIME type from client)
  static async validateFileMagicBytes(buffer: Buffer, expectedType: string): Promise<boolean> {
    const magicNumbers: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    };

    const signatures = magicNumbers[expectedType];
    if (!signatures) return false;

    return signatures.some(signature => 
      signature.every((byte, index) => buffer[index] === byte)
    );
  }

  // Generate secure random filename
  static generateSecureFilename(originalExtension: string): string {
    const randomName = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomName}${originalExtension}`;
  }

  // Validate file size
  static validateFileSize(sizeBytes: number, maxSizeBytes: number): boolean {
    return sizeBytes > 0 && sizeBytes <= maxSizeBytes;
  }

  // Sanitize filename to prevent path traversal
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove special chars
      .replace(/\.\.+/g, '.') // Remove multiple dots
      .replace(/^\./, '') // Remove leading dot
      .substring(0, 255); // Limit length
  }
}
```

**Update**: `app/api/admin/upload-image/route.ts`

```typescript
import { FileUploadSecurity } from '@/lib/file-upload-security';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request); // Authentication
    
    const minioClient = getMinioClient()
    let file: File | null = null

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const data = await request.formData()
      file = data.get('image') as unknown as File
    }

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (!FileUploadSecurity.validateFileSize(file.size, MAX_SIZE)) {
      return NextResponse.json({ error: 'File too large. Max 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate magic bytes (not just client MIME type)
    const isValidImage = await FileUploadSecurity.validateFileMagicBytes(buffer, file.type);
    if (!isValidImage) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 })
    }

    // Generate secure filename
    const fileExtension = '.' + file.type.split('/').pop()?.split('+')[0];
    const secureFilename = FileUploadSecurity.generateSecureFilename(fileExtension);
    
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const objectKey = `${year}/${month}/${secureFilename}`

    // Upload to MinIO
    await minioClient.putObject(BUCKET_NAME, objectKey, buffer, buffer.length, {
      'Content-Type': file.type
    })

    const publicHost = process.env.SERVER_IP
    const imageUrl = `http://${publicHost}:9000/${BUCKET_NAME}/${objectKey}`

    return NextResponse.json({
      success: true,
      imageUrl,
      objectKey
    })

  } catch (error) {
    console.error('Upload error:', error) // Log server-side
    // Don't expose error details to client
    return NextResponse.json({
      error: 'Upload failed'
    }, { status: 500 })
  }
}
```

### Fix #6: Sanitize HTML to Prevent XSS

**Install DOMPurify**:
```bash
npm install dompurify
npm install --save-dev @types/dompurify
npm install isomorphic-dompurify  # For SSR
```

**Create**: `lib/html-sanitizer.ts`

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
```

**Update**: `app/components/ArticleContent.tsx` and similar files

```typescript
import { sanitizeHTML } from '@/lib/html-sanitizer';

// CURRENT (VULNERABLE):
<div dangerouslySetInnerHTML={{ __html: part.content }} />

// FIXED (SECURE):
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(part.content) }} />
```

### Fix #7: Implement Rate Limiting

**Install**:
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Create**: `lib/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory store for development, Redis for production
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined;

// Create rate limiters
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
      analytics: true,
    })
  : null;

export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      analytics: true,
    })
  : null;

export const uploadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads per hour
      analytics: true,
    })
  : null;

// Helper function to check rate limit
export async function checkRateLimit(
  identifier: string,
  limiter: typeof authRateLimiter
): Promise<{ success: boolean; remaining: number }> {
  if (!limiter) {
    // No rate limiting in development
    return { success: true, remaining: 999 };
  }

  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  
  return { success, remaining };
}
```

**Update**: `app/api/auth/login/route.ts`

```typescript
import { checkRateLimit, authRateLimiter } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Check rate limit by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { success, remaining } = await checkRateLimit(`auth:${ip}`, authRateLimiter);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Continue with authentication...
```

### Fix #8: Secure Cookie Configuration

**File**: `app/api/auth/login/route.ts`

```typescript
// CURRENT (INSECURE):
const useSecureCookies = process.env.NODE_ENV === 'production' && process.env.HTTPS_ENABLED === 'true';

response.cookies.set('auth-token-client', token, {
  httpOnly: false, // Client can access - INSECURE!
  secure: useSecureCookies,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
});

// FIXED (SECURE):
const useSecureCookies = process.env.NODE_ENV === 'production'; // Always secure in prod

response.cookies.set('auth-token', token, {
  httpOnly: true, // Server-side only
  secure: useSecureCookies,
  sameSite: 'strict', // Changed from 'lax' to 'strict'
  maxAge: 2 * 60 * 60, // 2 hours instead of 7 days
  path: '/',
});

// REMOVE the 'auth-token-client' cookie entirely
// Client-side code should make API calls, not read tokens directly
```

### Fix #9: Add Input Validation Middleware

**Create**: `lib/validation-middleware.ts`

```typescript
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (request: NextRequest): Promise<z.infer<T>> => {
    try {
      const body = await request.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.issues.map(i => i.message).join(', ')}`);
      }
      throw error;
    }
  };
}

// Usage example:
const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  price: z.number().min(0).max(9999),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

export async function POST(request: NextRequest) {
  await requireAdmin(request);
  const data = await validateBody(createCourseSchema)(request);
  // data is now type-safe and validated
}
```

### Fix #10: Implement Content Security Policy (CSP)

**File**: `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  // ... existing config
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.paypal.com https://www.paypalobjects.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: http:", // Be specific in production
              "font-src 'self' data:",
              "connect-src 'self' https://www.paypal.com https://api.paypal.com",
              "frame-src 'self' https://www.paypal.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

---

## DOCKER & INFRASTRUCTURE HARDENING

### Docker #1: Secure Dockerfile

**File**: `Dockerfile`

```dockerfile
# Use specific version, not 'latest'
FROM node:20.11.0-alpine AS base

# Add security updates
RUN apk upgrade --no-cache

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 build-base

# Create non-root user early
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app
RUN chown nextjs:nodejs /app

# Switch to non-root user for npm install
USER nextjs

COPY --chown=nextjs:nodejs package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Builder stage
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
RUN npm run build

# Production runtime
FROM base AS runner
WORKDIR /app

RUN apk upgrade --no-cache && \
    apk add --no-cache curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy with ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Make filesystem read-only except for specific directories
RUN chmod -R 555 /app && \
    mkdir -p /app/.next/cache && \
    chown nextjs:nodejs /app/.next/cache

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use exec form to properly handle signals
CMD ["node", "server.js"]
```

### Docker #2: Secure Docker Compose

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
    
    # REMOVE VOLUME MOUNTS - Security risk!
    # volumes:
    #   - /var/www/static/image:/app/public/static/image:ro
    #   - /var/www/uploads/images:/app/public/uploads/images
    
    # Use environment file instead of individual vars
    env_file:
      - .env.production
    
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
    
    restart: unless-stopped
    
    # SECURITY: Add resource limits
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    
    # SECURITY: Make root filesystem read-only
    read_only: true
    tmpfs:
      - /tmp
      - /app/.next/cache
    
    # SECURITY: Drop unnecessary capabilities
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    
    # SECURITY: Disable privilege escalation
    security_opt:
      - no-new-privileges:true
    
    # SECURITY: Use specific user
    user: "1001:1001"
    
    extra_hosts:
      - "host.docker.internal:host-gateway"
    
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    
    # SECURITY: Limit log size
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Docker #3: Separate .env Files

**Never use `.env` in production. Create `.env.production` (not in git):**

```bash
# .gitignore
.env*
!.env.example  # Only commit example file
```

**Create `.env.example`:**
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
JWT_SECRET="<generate-with-openssl-rand>"
NEXTAUTH_SECRET="<generate-with-openssl-rand>"

# MinIO
NEXT_PRIVATE_MINIO_ACCESS_KEY="<generate-secure-key>"
NEXT_PRIVATE_MINIO_SECRET_KEY="<generate-secure-key>"

# ... etc
```

---

## SERVER HARDENING

### Server #1: Firewall Configuration

```bash
#!/bin/bash
# setup-firewall.sh

# Reset iptables
sudo iptables -F
sudo iptables -X

# Default policies
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH (change port if needed)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# BLOCK mining pools (add all known pools)
sudo iptables -A OUTPUT -d pool.supportxmr.com -j DROP
sudo iptables -A OUTPUT -d kryptex.network -j DROP
sudo iptables -A OUTPUT -d c3pool.org -j DROP
sudo iptables -A OUTPUT -d hashvault.pro -j DROP
sudo iptables -A OUTPUT -p tcp --dport 8029 -j DROP
sudo iptables -A OUTPUT -p tcp --dport 3333 -j DROP
sudo iptables -A OUTPUT -p tcp --dport 7777 -j DROP

# Save rules
sudo iptables-save | sudo tee /etc/iptables/rules.v4

# Install iptables-persistent
sudo apt install -y iptables-persistent
```

### Server #2: MinIO Security

```bash
# 1. Change MinIO port to non-standard (security through obscurity + security)
# 2. Use strong credentials (already in fixes above)
# 3. Enable HTTPS
# 4. Restrict access

# Create MinIO config
sudo nano /etc/minio/config.json
```

```json
{
  "version": "35",
  "credential": {
    "accessKey": "<NEW_SECURE_KEY>",
    "secretKey": "<NEW_SECURE_SECRET>"
  },
  "region": "",
  "browser": "off",
  "domain": "",
  "logger": {
    "console": {
      "enable": true
    },
    "file": {
      "enable": true,
      "filename": "/var/log/minio/minio.log"
    }
  }
}
```

### Server #3: PostgreSQL Security

```bash
# 1. Edit pg_hba.conf to restrict access
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

```conf
# Only allow from specific IPs
host    gisgate    gisgate_db_user    172.17.0.0/16    scram-sha-256  # Docker network
host    gisgate    gisgate_db_user    <YOUR_SERVER_IP>/32    scram-sha-256
```

```bash
# 2. Change database password
sudo -u postgres psql
ALTER USER gisgate_db_user WITH PASSWORD '<NEW_STRONG_PASSWORD>';
\q

# 3. Restart PostgreSQL
sudo systemctl restart postgresql
```

### Server #4: SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

```conf
# Disable root login
PermitRootLogin no

# Disable password authentication (use keys only)
PasswordAuthentication no
PubkeyAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Change SSH port (optional but recommended)
Port 2222

# Allow only specific users
AllowUsers yourusername

# Disable X11 forwarding
X11Forwarding no

# Max authentication attempts
MaxAuthTries 3

# Login grace time
LoginGraceTime 30
```

```bash
# Restart SSH
sudo systemctl restart sshd
```

### Server #5: Fail2Ban Setup

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
destemail = admin@gis-gate.com
sendername = Fail2Ban

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
logpath = /var/log/nginx/access.log
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Server #6: File Integrity Monitoring (AIDE)

```bash
# Install AIDE
sudo apt install -y aide

# Initialize database
sudo aideinit

# Move database
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Run check
sudo aide --check

# Setup daily cron
echo "0 5 * * * root /usr/bin/aide --check | mail -s 'AIDE Report' admin@gis-gate.com" | sudo tee -a /etc/crontab
```

### Server #7: Monitoring & Alerting

```bash
# Install monitoring tools
sudo apt install -y htop nethogs iotop sysstat

# Setup email alerts for high CPU
# Create /usr/local/bin/check-cpu.sh
```

```bash
#!/bin/bash
THRESHOLD=80
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

if (( $(echo "$CPU_USAGE > $THRESHOLD" | bc -l) )); then
    echo "High CPU usage detected: $CPU_USAGE%" | mail -s "CPU Alert" admin@gis-gate.com
fi
```

```bash
sudo chmod +x /usr/local/bin/check-cpu.sh
echo "*/5 * * * * root /usr/local/bin/check-cpu.sh" | sudo tee -a /etc/crontab
```

---

## MONITORING & LOGGING

### Setup #1: Centralized Logging

```bash
# Install rsyslog or use cloud service like Logtail, Papertrail
sudo apt install -y rsyslog

# Configure to send logs to external service
sudo nano /etc/rsyslog.conf

# Add at end:
# *.* @@logs.papertrailapp.com:12345
```

### Setup #2: Docker Logs

```bash
# View logs
docker logs gisgate_blue --tail 100 -f

# Export logs for analysis
docker logs gisgate_blue > /var/log/gisgate/app.log
```

### Setup #3: Nginx Access Logs Analysis

```bash
# Install GoAccess for log analysis
sudo apt install -y goaccess

# Analyze logs
sudo goaccess /var/log/nginx/access.log -o /var/www/html/stats.html --log-format=COMBINED --real-time-html

# Look for suspicious patterns:
grep "/api/admin/upload-image" /var/log/nginx/access.log
grep "POST" /var/log/nginx/access.log | grep -v "Authorization"
```

---

## APPLICATION MONITORING

### Setup #1: Health Check Endpoint Enhancement

**File**: `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import os from 'os';

export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    // System metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const systemLoad = os.loadavg();
    
    // Detect anomalies
    const highCPU = systemLoad[0] > 2; // Adjust based on your server
    const highMemory = (memoryUsage.heapUsed / memoryUsage.heapTotal) > 0.9;
    
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      database: 'connected',
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100) + '%'
      },
      cpu: {
        load: systemLoad.map(l => l.toFixed(2)),
        cores: os.cpus().length
      },
      alerts: []
    };
    
    if (highCPU) status.alerts.push('High CPU usage detected');
    if (highMemory) status.alerts.push('High memory usage detected');
    
    return NextResponse.json(status);
    
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Health check failed' },
      { status: 503 }
    );
  }
}
```

### Setup #2: External Monitoring

Use services like:
- **UptimeRobot** (free): Monitor endpoint availability
- **Better Stack** (Logtail): Log aggregation and alerts
- **Sentry**: Error tracking and monitoring
- **DataDog**: Comprehensive monitoring (paid)

---

## INCIDENT RESPONSE PLAN

### Create Response Playbook

**File**: `INCIDENT_RESPONSE.md`

```markdown
# Security Incident Response Plan

## Phase 1: Detection & Triage (0-15 minutes)
1. Confirm incident (unusual activity, alerts, reports)
2. Assess severity (CRITICAL, HIGH, MEDIUM, LOW)
3. Notify security team
4. Begin logging all actions

## Phase 2: Containment (15-30 minutes)
1. Isolate affected systems
2. Block malicious IPs
3. Disable compromised accounts
4. Take system snapshots

## Phase 3: Eradication (30 minutes - 2 hours)
1. Identify and remove malware
2. Patch vulnerabilities
3. Reset compromised credentials
4. Scan all systems

## Phase 4: Recovery (2-24 hours)
1. Restore from clean backups if needed
2. Gradually restore services
3. Monitor for reinfection
4. Verify system integrity

## Phase 5: Post-Incident (24-72 hours)
1. Complete incident report
2. Identify root cause
3. Update security measures
4. Train team on lessons learned

## Emergency Contacts
- Security Lead: [Phone]
- Hosting Provider: [Support Number]
- Database Admin: [Contact]
```

---

## COMPLIANCE & BEST PRACTICES

### Enable TypeScript Strict Mode

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Update next.config.ts

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  
  // REMOVE THESE - Fix the errors instead!
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  
  // Add production optimizations
  swcMinify: true,
  compress: true,
  
  // ... rest of config
}
```

---

## DEPLOYMENT SECURITY

### Secure CI/CD Pipeline

If using GitHub Actions or similar:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Scan for secrets
      - name: TruffleHog Secrets Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          
      # Dependency audit
      - name: NPM Audit
        run: npm audit --audit-level=high
        
      # SAST scanning
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  deploy:
    needs: security-scan
    runs-on: ubuntu-latest
    # ... deployment steps
```

---

## REGULAR MAINTENANCE CHECKLIST

### Weekly:
- [ ] Review access logs for anomalies
- [ ] Check fail2ban reports
- [ ] Verify backup integrity
- [ ] Review CPU/memory usage
- [ ] Check for failed login attempts

### Monthly:
- [ ] Update all dependencies (`npm audit fix`)
- [ ] Review and rotate API keys
- [ ] Audit user permissions
- [ ] Test backup restoration
- [ ] Review firewall rules
- [ ] Update SSL certificates

### Quarterly:
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review incident response plan
- [ ] Security awareness training
- [ ] Review third-party integrations

---

## EMERGENCY CONTACTS & RESOURCES

### Incident Response
- **Primary Contact**: [Your Phone]
- **Backup Contact**: [Backup Phone]
- **Hosting Support**: [VPS Provider]

### Security Resources
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js Security: https://nextjs.org/docs/advanced-features/security
- Docker Security: https://docs.docker.com/engine/security/

### Malware Databases
- VirusTotal: https://www.virustotal.com/
- Hybrid Analysis: https://www.hybrid-analysis.com/
- Any.run: https://any.run/

---

## ESTIMATED IMPLEMENTATION TIME

- **Critical Fixes (Do First)**: 2-4 hours
  - Credential rotation
  - Add authentication to endpoints
  - Kill malware
  
- **High Priority**: 8-12 hours
  - File upload security
  - XSS fixes
  - Docker hardening
  
- **Medium Priority**: 16-24 hours
  - Rate limiting
  - CSP implementation
  - Server hardening
  
- **Ongoing**: 
  - Monitoring setup
  - Regular maintenance

---

## TESTING & VALIDATION

After implementing fixes, test:

1. **Authentication**:
   ```bash
   # Should fail without auth
   curl -X POST http://your-server/api/admin/upload-image
   
   # Should succeed with valid admin token
   curl -H "Authorization: Bearer <token>" -X POST http://your-server/api/admin/upload-image
   ```

2. **File Upload**:
   - Try uploading non-image file (should fail)
   - Try uploading malicious file (should fail)
   - Try large file (should fail if > limit)

3. **Rate Limiting**:
   - Make 10 rapid login attempts (should get blocked)

4. **XSS**:
   - Try creating article with `<script>alert('XSS')</script>` (should be sanitized)

5. **Security Headers**:
   ```bash
   curl -I https://your-domain.com
   # Should see CSP, X-Frame-Options, etc.
   ```

---

This comprehensive hardening plan should significantly improve your security posture. Implement fixes in the priority order listed, starting with the critical items.

