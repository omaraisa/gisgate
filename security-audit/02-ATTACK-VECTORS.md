# POTENTIAL ATTACK VECTORS

This document analyzes the most likely ways the attacker gained initial access.

---

## MOST LIKELY ATTACK VECTOR: File Upload Exploitation

### Vector #1: Unauthenticated Admin File Upload (HIGHEST PROBABILITY)

**Component**: `app/api/admin/upload-image/route.ts`

**Vulnerability Chain**:
1. **Missing Authentication**: Endpoint has NO auth check
   ```typescript
   export async function POST(request: NextRequest) {
     // NO requireAdmin() or requireAuth() call
     const minioClient = getMinioClient()
   ```

2. **Weak File Validation**: Only checks MIME type (easily spoofed)
   ```typescript
   const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
   if (!allowedTypes.includes(file.type)) { // Client-provided MIME type
   ```

3. **Arbitrary File Upload to MinIO**: Files stored with predictable names
   ```typescript
   const objectKey = `${year}/${month}/${fileName}`
   ```

4. **Public Bucket**: All files automatically public
   ```typescript
   const policy = {
     Effect: 'Allow',
     Principal: { 'AWS': '*' },
     Action: ['s3:GetObject'],
   ```

**Attack Scenario**:
1. Attacker discovers unauthenticated `/api/admin/upload-image` endpoint
2. Crafts malicious file (web shell, executable) with image MIME type
3. Uploads file successfully to MinIO
4. File is publicly accessible at `http://SERVER_IP:9000/images/YYYY/MM/filename`
5. If MinIO has RCE vulnerability or misconfiguration, attacker gains code execution
6. Deploys cryptocurrency miner
7. Establishes persistence

**Supporting Evidence**:
- Endpoint exists in production codebase
- No auth check present
- MinIO credentials hardcoded (easy to discover)
- Crypto miner successfully running (proof of code execution)

**Probability**: 85%

---

### Vector #2: Resume Upload Endpoint Exploitation

**Component**: `app/api/admin/upload-resume/route.ts`

**Similar Issues**:
- Also missing authentication check
- Allows arbitrary PDF upload
- Fixed filename but overwritable
- Could be exploited via PDF vulnerabilities

**Probability**: 60%

---

## SECONDARY ATTACK VECTORS

### Vector #3: Weak JWT Secret Exploitation

**Component**: JWT authentication system

**Attack Chain**:
1. Attacker discovers weak JWT secret (default value in .env)
2. Secret either:
   - Found in exposed .env file
   - Guessed (it's the default/placeholder value)
   - Leaked via git history
   
3. Attacker forges JWT token:
   ```javascript
   const payload = {
     userId: "admin-id",
     email: "admin@example.com",
     role: "ADMIN"
   }
   const token = signJWT(payload, "your-super-secure-jwt-secret-key-here-change-this-in-production")
   ```

4. Uses forged token to access admin endpoints
5. Uses authenticated admin upload endpoints or other admin functions
6. Uploads malicious payload

**Probability**: 70%

---

### Vector #4: SSH Key or Credential Compromise

**Possible Sources**:
1. **Git commit with credentials**: .env file might have been committed at some point
2. **Exposed .git directory**: If nginx misconfigured, could serve .git/config
3. **Leaked SSH keys**: Developer workstation compromise
4. **Weak SSH password**: If password auth enabled
5. **Sudo permissions abuse**: Deployment user with sudo access

**Attack Chain**:
1. Attacker gains SSH access via compromised key
2. Direct access to server filesystem
3. Can read .env file with all credentials
4. Can modify application code
5. Can inject malware into Docker builds
6. Deploys crypto miner

**Evidence**:
- XMRig appears to be running inside Docker container
- Suggests build-time or runtime injection
- `crontab: must be suid to work properly` in logs suggests attempted persistence

**Probability**: 65%

---

### Vector #5: Compromised npm Package (Supply Chain Attack)

**Vulnerability**: Installing packages during Docker build

**Attack Chain**:
1. Attacker compromises an npm package in dependencies
2. Malicious package runs during `npm install` in Dockerfile
3. Installs crypto miner as part of build process
4. Miner starts when container starts

**Evidence**:
- XMRig runs from container start
- Logs show miner initializing early in container lifecycle
- Build process runs as root initially

**Analysis**:
- Review `package.json` for suspicious packages
- Check for packages with:
  - Postinstall scripts
  - Native modules
  - Recently updated packages (compare with backup)

**Probability**: 40%

---

### Vector #6: WordPress Migration SSRF/RCE

**Component**: `app/api/wordpress-migrate/route.ts`

**Vulnerability**:
- No authentication required
- Accepts arbitrary URLs
- Makes server-side requests to provided URLs

**Attack Chain**:
1. Attacker calls migration endpoint with malicious URL
2. Points to attacker-controlled "WordPress" server
3. Server responds with malicious content/payloads
4. Application imports malicious data into database
5. XSS payloads later executed
6. Or SSRF to access internal network services

**Additional Risk**:
- Could be used to scan internal network
- Access AWS metadata endpoint (if on AWS)
- Exploit internal services

**Probability**: 30%

---

### Vector #7: SQL Injection (Less Likely)

**Component**: Admin stats endpoint

**Analysis**:
- Uses Prisma ORM (generally safe)
- Some raw queries present but using template literals
- Would require specific exploitation scenario

**Probability**: 15%

---

### Vector #8: XSS to Account Takeover

**Chain**:
1. Admin account has stored XSS in course content
2. Other admin views content
3. XSS steals admin session token
4. Attacker uses token to upload malware

**Probability**: 25%

---

### Vector #9: Docker Escape via Volume Mount

**Component**: Docker volume mounts

**Vulnerability**:
```yaml
volumes:
  - /var/www/static/image:/app/public/static/image:ro
  - /var/www/uploads/images:/app/public/uploads/images  # Read-write!
```

**Attack Chain**:
1. Attacker gains code execution inside container (via upload exploit)
2. Writes malicious file to `/app/public/uploads/images`
3. File appears on host at `/var/www/uploads/images`
4. Uses symlink or path traversal to write outside mounted directory
5. Achieves container escape

**Probability**: 50%

---

### Vector #10: Exposed Git Repository

**Risk**: If `.git` directory is accessible via web

**Evidence Check**:
- Is nginx configured to block `.git`?
- Is there a public-facing web root?

**If exposed**:
- Attacker downloads entire source code
- Gets all credentials from .env in git history
- Understands full application architecture
- Plans targeted attack

**Probability**: Unknown (requires nginx config review)

---

## ATTACK TIMELINE RECONSTRUCTION

Based on logs and evidence:

1. **Initial Breach** (Unknown exact time, but before Jan 21, 2026):
   - Most likely: Unauthenticated file upload exploitation
   - Attacker discovered `/api/admin/upload-image` endpoint
   - Uploaded malicious payload

2. **Code Execution Achieved**:
   - Payload executed (possibly via MinIO vuln, or direct Docker exec)
   - Attacker gained shell access inside container

3. **Reconnaissance**:
   - Attempted to access persistence locations: `/dev/lrt`, `/var/lrt`, `/etc/lrt`
   - Explored filesystem (multiple EACCES errors)
   - Attempted crontab setup (failed: `crontab: must be suid to work properly`)

4. **Malware Deployment** (Jan 21, 2026 ~04:07 AM):
   - Downloaded and installed XMRig
   - Configured with multiple mining pools
   - Started mining operation
   - Configured for auto-restart

5. **Obfuscation**:
   - Injected `returnNaN` errors to create noise in logs
   - Made detection more difficult

6. **Current State**:
   - Miner actively running
   - Resources being stolen
   - Persistence mechanisms attempted

---

## ENTRY POINT DETERMINATION

**Primary Entry Point (Highest Confidence)**: 
`/api/admin/upload-image` endpoint with missing authentication

**Secondary Entry Points (Possible)**:
1. Compromised SSH credentials
2. Weak JWT secret exploitation
3. Supply chain attack via npm

**Recommended Investigation**:
1. Check MinIO access logs for uploads around breach time
2. Review nginx access logs for `/api/admin/upload-image` requests
3. Check SSH auth logs: `/var/log/auth.log`
4. Review Docker build logs for suspicious activities
5. Analyze network traffic logs for C2 communications
6. Check iptables/firewall logs for mining pool connections

---

## INDICATORS OF COMPROMISE (IOCs)

**Network IOCs**:
- Connections to: pool.supportxmr.com (port 443, 80, 3333, 7777)
- Connections to: *.kryptex.network:8029
- Connections to: auto.c3pool.org:33333
- Connections to: pool.hashvault.pro:443
- IPs: 107.167.92.130, 141.94.96.144, 104.243.33.118, 104.243.43.115

**File IOCs**:
- XMRig binary (location unknown - need to find)
- Configuration files: "system", "startup" (mentioned in logs)
- Possible locations: `/tmp`, `/opt`, `/var/tmp`, container filesystem

**Process IOCs**:
- Process name: likely `xmrig` or obfuscated
- CPU usage: ~100% on 2 cores
- Memory: ~2336 MB allocated (mentioned in logs)

**Behavioral IOCs**:
- High CPU usage (100% on 2 cores)
- Network traffic to known mining pools
- Failed file access attempts to system directories
- Attempted crontab modifications

---

## PREVENTION RECOMMENDATIONS

1. **Implement Authentication on ALL Admin Endpoints**
2. **Remove Hardcoded Credentials**
3. **Validate JWT Secret is Strong**
4. **Add Rate Limiting**
5. **Implement File Upload Security**:
   - Magic byte validation
   - File size limits
   - Quarantine and scan uploads
   - Separate storage domain
6. **Container Security**:
   - Remove unnecessary volume mounts
   - Run as non-root user
   - Resource limits
   - Read-only filesystem where possible
7. **Network Security**:
   - Firewall rules to block mining pools
   - Egress filtering
   - IDS/IPS implementation
8. **Monitoring**:
   - CPU/memory alerts
   - Unusual network traffic alerts
   - File integrity monitoring
   - Log aggregation and analysis

