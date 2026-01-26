# SECURITY REMEDIATION CHECKLIST

Use this checklist to track your progress through the security fixes.

---

## 🚨 PHASE 1: EMERGENCY RESPONSE (Day 1 - First 2 Hours)

### Immediate Containment
- [ ] Stop Docker containers (`docker stop gisgate_blue gisgate_green`)
- [ ] Kill cryptocurrency miner processes (`sudo pkill -9 xmrig`)
- [ ] Block mining pool IPs with iptables
- [ ] Block mining ports (3333, 7777, 8029)
- [ ] Capture evidence (logs, processes, network connections)
- [ ] Document timeline of events

### Evidence Collection
- [ ] Save container logs to `/tmp/evidence/`
- [ ] Capture process list
- [ ] Save network connection list
- [ ] Export iptables rules
- [ ] Check cron jobs for persistence
- [ ] Search for malware files (`find / -name "*xmrig*"`)
- [ ] Save original .env file as evidence

---

## 🔐 PHASE 2: CREDENTIAL ROTATION (Day 1 - Hours 2-4)

### Generate New Secrets
- [ ] Run `./security-audit/generate-secrets.sh`
- [ ] Save output to password manager
- [ ] Copy secrets to secure location

### Database
- [ ] Generate new PostgreSQL password
- [ ] Update password in database: `ALTER USER gisgate_db_user WITH PASSWORD 'new_password';`
- [ ] Test connection with new password
- [ ] Update DATABASE_URL in .env.production

### Authentication
- [ ] Generate new JWT_SECRET (64 bytes)
- [ ] Generate new NEXTAUTH_SECRET (32 bytes)
- [ ] Update .env.production with new secrets
- [ ] Invalidate all existing user sessions

### MinIO Object Storage
- [ ] Generate new MINIO_ACCESS_KEY
- [ ] Generate new MINIO_SECRET_KEY
- [ ] Update MinIO server configuration
- [ ] Update .env.production
- [ ] Test MinIO connection

### Email (SMTP)
- [ ] Change SMTP password in email provider
- [ ] Update SMTP_PASS in .env.production
- [ ] Send test email

### PayPal
- [ ] Contact PayPal support to rotate API keys
- [ ] Get new CLIENT_ID and CLIENT_SECRET
- [ ] Update .env.production
- [ ] Update webhook configuration
- [ ] Test payment flow in sandbox first

### SSH
- [ ] Generate new SSH key pair (`ssh-keygen -t ed25519`)
- [ ] Add new public key to authorized_keys
- [ ] Test connection with new key
- [ ] Remove old key from authorized_keys
- [ ] Remove old private key from local machine

### Verification
- [ ] All new secrets documented in password manager
- [ ] Old .env file backed up and removed
- [ ] New .env.production created (not in git)
- [ ] Test application can start with new credentials

---

## 💻 PHASE 3: CODE FIXES (Day 1-2)

### Critical Fix #1: Authentication on Upload Endpoints
- [ ] Add `await requireAdmin(request);` to `/api/admin/upload-image/route.ts`
- [ ] Add `await requireAdmin(request);` to `/api/admin/upload-resume/route.ts`
- [ ] Add file size validation (10MB max)
- [ ] Add magic byte validation
- [ ] Test: Upload without auth should fail with 401
- [ ] Test: Upload with admin token should succeed

### Critical Fix #2: Remove Hardcoded Credentials
- [ ] Update `getMinioClient()` in `upload-image/route.ts`
- [ ] Remove default values for accessKey and secretKey
- [ ] Add proper error handling if env vars missing
- [ ] Apply same fix to `resume/route.ts`
- [ ] Apply same fix to `upload-resume/route.ts`
- [ ] Search codebase for other hardcoded secrets
- [ ] Test: App should fail to start if MinIO creds missing

### Critical Fix #3: WordPress Migration Auth
- [ ] Add `await requireAdmin(request);` to POST in `/api/wordpress-migrate/route.ts`
- [ ] Add `await requireAdmin(request);` to GET in `/api/wordpress-migrate/route.ts`
- [ ] Test: Endpoint should require authentication

### Critical Fix #4: Update .env
- [ ] Create new `.env.production` file
- [ ] Add all rotated credentials
- [ ] Verify no secrets are hardcoded
- [ ] Ensure `.env*` is in `.gitignore`
- [ ] Remove old .env from production server
- [ ] Set proper file permissions (600)

### Critical Fix #5: Fix XSS Vulnerabilities
- [ ] Install DOMPurify: `npm install isomorphic-dompurify`
- [ ] Create `lib/html-sanitizer.ts`
- [ ] Update `app/courses/[slug]/page.tsx` line 599
- [ ] Update `app/components/LessonContent.tsx` line 156
- [ ] Update `app/components/ArticleContent.tsx` line 156
- [ ] Update `app/courses/[slug]/lessons/[lessonSlug]/page.tsx` line 471
- [ ] Test: Try injecting `<script>alert('XSS')</script>` - should be sanitized

### Build & Test
- [ ] Run `npm install` (for new dependencies)
- [ ] Fix all TypeScript errors (don't ignore them)
- [ ] Fix all ESLint errors
- [ ] Run `npm run build` successfully
- [ ] Test locally: `npm run dev`
- [ ] Verify all features work
- [ ] Run `npm audit` and fix vulnerabilities

---

## 🐳 PHASE 4: DOCKER HARDENING (Day 2-3)

### Dockerfile Security
- [ ] Update base image to specific version (node:20.11.0-alpine)
- [ ] Add security updates (`apk upgrade`)
- [ ] Create non-root user early
- [ ] Switch to non-root for npm install
- [ ] Copy files with proper ownership
- [ ] Make filesystem read-only except cache
- [ ] Drop all capabilities, add only NET_BIND_SERVICE
- [ ] Run final container as user 1001

### Docker Compose Security
- [ ] Remove insecure volume mounts
- [ ] Add resource limits (CPU: 2, Memory: 2G)
- [ ] Set read_only: true
- [ ] Add tmpfs for /tmp and cache
- [ ] Add cap_drop: ALL
- [ ] Add security_opt: no-new-privileges
- [ ] Set user: "1001:1001"
- [ ] Add logging limits (max-size: 10m)
- [ ] Update docker-compose.blue.yml
- [ ] Update docker-compose.green.yml
- [ ] Update docker-compose.staging.yml

### Test Docker Build
- [ ] Build image: `docker build -t gisgate-secured .`
- [ ] Run container: `docker run -p 3000:3000 gisgate-secured`
- [ ] Verify app starts correctly
- [ ] Check health endpoint: `curl localhost:3000/api/health`
- [ ] Verify no root processes: `docker exec <container> ps aux`

---

## 🖥️ PHASE 5: SERVER HARDENING (Day 3-4)

### Firewall Configuration
- [ ] Install iptables-persistent
- [ ] Set default policies (DROP INPUT, DROP FORWARD, ACCEPT OUTPUT)
- [ ] Allow loopback traffic
- [ ] Allow established connections
- [ ] Allow SSH (port 22 or custom)
- [ ] Allow HTTP (port 80)
- [ ] Allow HTTPS (port 443)
- [ ] Block all mining pools by domain
- [ ] Block mining ports (3333, 7777, 8029)
- [ ] Save rules: `iptables-save`
- [ ] Test: Can still SSH to server
- [ ] Test: Web traffic works
- [ ] Test: No connections to mining pools

### SSH Hardening
- [ ] Edit `/etc/ssh/sshd_config`
- [ ] Set `PermitRootLogin no`
- [ ] Set `PasswordAuthentication no`
- [ ] Set `PubkeyAuthentication yes`
- [ ] Set `PermitEmptyPasswords no`
- [ ] Change port (optional but recommended)
- [ ] Set `MaxAuthTries 3`
- [ ] Set `AllowUsers <your_username>`
- [ ] Restart SSH: `systemctl restart sshd`
- [ ] Test SSH with new key from another terminal
- [ ] Log out and verify can still log in

### PostgreSQL Security
- [ ] Edit `/etc/postgresql/*/main/pg_hba.conf`
- [ ] Restrict access to specific IPs only
- [ ] Use scram-sha-256 authentication
- [ ] Remove "trust" authentication
- [ ] Restart PostgreSQL: `systemctl restart postgresql`
- [ ] Test database connection
- [ ] Review PostgreSQL logs

### Fail2Ban Setup
- [ ] Install fail2ban: `apt install fail2ban`
- [ ] Copy jail.conf to jail.local
- [ ] Configure SSH jail
- [ ] Configure nginx jails
- [ ] Set bantime, findtime, maxretry
- [ ] Start fail2ban: `systemctl start fail2ban`
- [ ] Enable on boot: `systemctl enable fail2ban`
- [ ] Test: Multiple failed SSH attempts should trigger ban

### AIDE File Integrity Monitoring
- [ ] Install AIDE: `apt install aide`
- [ ] Initialize database: `aideinit`
- [ ] Move database: `mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db`
- [ ] Run initial check: `aide --check`
- [ ] Setup daily cron job
- [ ] Configure email alerts

---

## 📊 PHASE 6: MONITORING & ALERTING (Day 4-5)

### Application Monitoring
- [ ] Enhance `/api/health` endpoint
- [ ] Add CPU usage monitoring
- [ ] Add memory usage monitoring
- [ ] Add database connection check
- [ ] Add alert thresholds
- [ ] Test health endpoint returns full status

### Log Aggregation
- [ ] Choose logging service (Logtail, Papertrail, etc.)
- [ ] Configure rsyslog to forward logs
- [ ] Set up Docker logging driver
- [ ] Configure log retention
- [ ] Test logs are being received

### Alerting
- [ ] Set up UptimeRobot (free)
- [ ] Monitor health endpoint every 5 minutes
- [ ] Configure email alerts
- [ ] Set up CPU usage alerts
- [ ] Set up memory usage alerts
- [ ] Set up disk space alerts
- [ ] Test alerts by stopping services

### Error Tracking
- [ ] Sign up for Sentry (or similar)
- [ ] Install Sentry SDK: `npm install @sentry/nextjs`
- [ ] Configure Sentry in next.config.ts
- [ ] Add SENTRY_DSN to .env
- [ ] Test error reporting
- [ ] Set up alert rules

---

## 🚀 PHASE 7: DEPLOYMENT (Day 5)

### Pre-Deployment Checklist
- [ ] All code fixes applied
- [ ] All credentials rotated
- [ ] Build succeeds: `npm run build`
- [ ] Docker builds: `docker build -t gisgate .`
- [ ] All tests pass (if you have tests)
- [ ] .env.production ready on server
- [ ] Backups verified

### Deployment Steps
- [ ] SSH to production server
- [ ] Navigate to project directory
- [ ] Stop current containers
- [ ] Pull latest code (if using git)
- [ ] Or copy files to server
- [ ] Copy .env.production to correct location
- [ ] Build Docker image
- [ ] Start containers with new compose file
- [ ] Watch logs: `docker logs -f gisgate_blue`
- [ ] Wait for health check to pass

### Post-Deployment Verification
- [ ] Health endpoint responding: `curl https://gis-gate.com/api/health`
- [ ] Can login to application
- [ ] Can access admin panel
- [ ] File upload requires authentication
- [ ] Try uploading file without auth (should fail)
- [ ] Try uploading file with auth (should succeed)
- [ ] Check for TypeScript/runtime errors in logs
- [ ] Monitor CPU usage (should be normal, not 100%)
- [ ] Check for network connections to mining pools (should be none)
- [ ] Run `ps aux | grep xmrig` (should find nothing)

---

## 🔒 PHASE 8: ADDITIONAL HARDENING (Week 2)

### Rate Limiting
- [ ] Choose rate limiting solution (Upstash, Redis)
- [ ] Install dependencies
- [ ] Create `lib/rate-limit.ts`
- [ ] Add rate limiting to login endpoint
- [ ] Add rate limiting to registration endpoint
- [ ] Add rate limiting to upload endpoints
- [ ] Add rate limiting to API endpoints
- [ ] Test: Rapid requests should be blocked

### Content Security Policy
- [ ] Add CSP headers in next.config.ts
- [ ] Configure script-src
- [ ] Configure style-src
- [ ] Configure img-src
- [ ] Configure connect-src
- [ ] Add X-Frame-Options: DENY
- [ ] Add X-Content-Type-Options: nosniff
- [ ] Test: Verify headers in browser DevTools

### Input Validation
- [ ] Create `lib/validation-middleware.ts`
- [ ] Define Zod schemas for all API inputs
- [ ] Add validation to course creation
- [ ] Add validation to article creation
- [ ] Add validation to user management
- [ ] Add validation to payment endpoints
- [ ] Test: Invalid inputs should be rejected

### Session Security
- [ ] Remove client-side accessible auth token
- [ ] Keep only httpOnly cookie
- [ ] Set sameSite: 'strict'
- [ ] Reduce maxAge to 2 hours
- [ ] Always use secure: true in production
- [ ] Implement refresh token mechanism
- [ ] Test: Sessions expire after timeout

---

## 📋 PHASE 9: TESTING & VALIDATION (Week 3)

### Security Testing
- [ ] Run npm audit: `npm audit`
- [ ] Fix high/critical vulnerabilities
- [ ] Run Snyk scan (if available)
- [ ] Manual penetration testing
- [ ] Try SQL injection on all inputs
- [ ] Try XSS on all text fields
- [ ] Try CSRF attacks
- [ ] Try authentication bypass
- [ ] Try unauthorized file access

### Verification Commands
```bash
# No mining processes
ps aux | grep xmrig  # Should return nothing
docker exec gisgate_blue ps aux | grep xmrig  # Should return nothing

# No mining connections
sudo netstat -anp | grep -E ":3333|:7777|:8029"  # Should return nothing

# CPU usage normal
top  # CPU should be reasonable, not 100%

# Authentication required
curl -X POST https://gis-gate.com/api/admin/upload-image
# Should return: 401 Unauthorized

# Health check working
curl https://gis-gate.com/api/health
# Should return: {"status": "healthy", ...}

# Security headers present
curl -I https://gis-gate.com
# Should see: Content-Security-Policy, X-Frame-Options, etc.
```

### Checklist Results
- [ ] No malware found
- [ ] No suspicious network connections
- [ ] CPU usage normal
- [ ] All endpoints require authentication
- [ ] File uploads validated
- [ ] XSS attempts blocked
- [ ] Rate limiting works
- [ ] Security headers present
- [ ] No npm audit warnings
- [ ] Clean security scan

---

## 📚 PHASE 10: DOCUMENTATION & TRAINING (Week 4)

### Documentation
- [ ] Document all changes made
- [ ] Update deployment procedures
- [ ] Create incident report
- [ ] Document lessons learned
- [ ] Update security policies
- [ ] Create developer security guidelines
- [ ] Document emergency procedures

### Team Training
- [ ] Schedule security training session
- [ ] Review common vulnerabilities
- [ ] Demonstrate attack scenarios
- [ ] Explain secure coding practices
- [ ] Show how to use security tools
- [ ] Quiz team on security concepts

### Runbooks
- [ ] Create incident response runbook
- [ ] Create deployment runbook
- [ ] Create backup/restore runbook
- [ ] Create monitoring runbook
- [ ] Test runbooks with team

---

## ♻️ ONGOING MAINTENANCE

### Weekly
- [ ] Review application logs
- [ ] Check fail2ban reports
- [ ] Monitor CPU/memory usage
- [ ] Review security alerts
- [ ] Check backup status

### Monthly
- [ ] Run `npm audit` and update dependencies
- [ ] Review user access permissions
- [ ] Check for unused accounts
- [ ] Review firewall rules
- [ ] Test backup restoration
- [ ] Review security logs

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review and update policies
- [ ] Team security training
- [ ] Review third-party integrations
- [ ] Update SSL certificates

### Annually
- [ ] Comprehensive penetration test
- [ ] Security policy review
- [ ] Compliance audit
- [ ] Disaster recovery drill
- [ ] Infrastructure review

---

## ✅ COMPLETION CRITERIA

Your system is secure when:

- [x] Cryptocurrency miner removed and blocked
- [x] All credentials rotated
- [x] Authentication required on all admin endpoints
- [x] No hardcoded secrets in code
- [x] File uploads properly validated
- [x] XSS vulnerabilities patched
- [x] Docker running with security constraints
- [x] Firewall properly configured
- [x] SSH hardened
- [x] Monitoring and alerting active
- [x] Rate limiting implemented
- [x] Security headers configured
- [x] Clean security scans
- [x] Team trained
- [x] Documentation complete

---

## 🎉 CONGRATULATIONS!

Once all items are checked, you will have:

✅ **Removed the active threat**  
✅ **Fixed all critical vulnerabilities**  
✅ **Hardened your infrastructure**  
✅ **Established ongoing security practices**  
✅ **Protected your users and business**  

**Well done! 🚀**

---

**Track your progress by checking off items as you complete them.**  
**Estimated total time: 40-60 hours over 2-4 weeks.**  
**Stay focused, work systematically, and you'll get there!**
