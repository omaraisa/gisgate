# GIS Gate Blue-Green Deployment Guide

## Overview

GIS Gate uses a **blue-green deployment strategy** to ensure zero-downtime deployments. This system maintains two identical environments (blue and green) running on different ports, with nginx acting as a reverse proxy to route traffic to the active environment.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Blue Container │    │  Green Container │
│   (Port 8001)    │    │   (Port 8002)    │
└─────────────────┘    └─────────────────┘
         │                       │
         └─────────┬─────────────┘
                   │
          ┌─────────────────┐
          │     Nginx       │
          │   (Port 80)     │
          │                 │
          │ upstream:       │
          │ gisgate_app     │
          └─────────────────┘
```

## Key Components

### Core Files

#### `deploy/post-receive-fixed`
**Location:** `deploy/post-receive-fixed`  
**Purpose:** Git post-receive hook that triggers automated deployments  
**Key Features:**
- Detects currently running container (blue/green)
- Builds and starts the opposite environment
- Waits for health checks before switching traffic
- Handles deployment failures gracefully

#### `deploy/switch-upstream.sh`
**Location:** `deploy/switch-upstream.sh`  
**Purpose:** Updates nginx upstream configuration  
**Key Features:**
- Creates backup of current nginx config
- Updates upstream file atomically
- Tests nginx configuration before reload
- Rolls back on failure

#### `deploy/setup-nginx-permissions.sh`
**Location:** `deploy/setup-nginx-permissions.sh`  
**Purpose:** Configures passwordless sudo for deployment user  
**Security:** Grants limited sudo access only for nginx commands

### Docker Configuration

#### `docker-compose.blue.yml`
**Location:** `docker-compose.blue.yml`  
**Purpose:** Defines blue environment container  
**Network:** `gisgate-blue-network`  
**Port:** `8001`

#### `docker-compose.green.yml`
**Location:** `docker-compose.green.yml`  
**Purpose:** Defines green environment container  
**Network:** `gisgate-green-network`  
**Port:** `8002`

### Nginx Configuration

#### `nginx/nginx.conf`
**Location:** `nginx/nginx.conf`  
**Purpose:** Main nginx configuration  
**Key Section:**
```nginx
upstream gisgate_app {
    include /etc/nginx/upstreams/gisgate_upstream.conf;
}
```

#### `deploy/gisgate_upstream.conf`
**Location:** `deploy/gisgate_upstream.conf`  
**Purpose:** Nginx upstream configuration template  
**Active Config:** `/etc/nginx/upstreams/gisgate_upstream.conf`

## Deployment Process

### 1. Git Push Trigger
When you push to the `production` branch:

```bash
git push production main
```

### 2. Post-Receive Hook Execution
The `deploy/post-receive-fixed` script runs automatically:

```bash
# 1. Checkout latest code
git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" checkout -f main

# 2. Detect current active environment
BLUE_RUNNING=$(docker ps -q --filter "name=gisgate_blue")
GREEN_RUNNING=$(docker ps -q --filter "name=gisgate_green")

# 3. Determine target environment
if blue is running → deploy to green (port 8002)
if green is running → deploy to blue (port 8001)
```

### 3. Container Build & Health Check
```bash
# Build target container
docker compose -f docker-compose.{blue|green}.yml up -d --build

# Wait for health check (60 seconds timeout)
docker inspect "gisgate_{blue|green}" --format='{{.State.Health.Status}}'
```

### 4. Nginx Switch
```bash
# Update upstream configuration
bash deploy/switch-upstream.sh {blue|green}

# Script performs:
# 1. Backup current config
# 2. Update upstream file
# 3. Test nginx config: sudo nginx -t
# 4. Reload nginx: sudo systemctl reload nginx
```

### 5. Cleanup
```bash
# Stop old container only after successful switch
docker compose -f docker-compose.{old}.yml down
```

## Health Checks

### Container Health
Each container has a health check defined in `docker-compose.{blue|green}.yml`:

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### Application Health
The `/api/health` endpoint returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T10:42:22Z",
  "uptime": "1h 23m"
}
```

## Error Handling

### Deployment Failure Scenarios

#### 1. Container Build Fails
- Script exits with error code
- No traffic switch occurs
- Old container continues serving traffic

#### 2. Health Check Timeout
- Script waits 60 seconds for healthy status
- If timeout, stops new container and exits
- Old container remains active

#### 3. Nginx Configuration Invalid
- Switch script tests config with `sudo nginx -t`
- If test fails, restores backup configuration
- Deployment script exits with error

#### 4. Nginx Reload Fails
- Switch script attempts reload with `sudo systemctl reload nginx`
- If reload fails, restores backup and exits
- New container is stopped, old container remains active

## Security Configuration

### Passwordless Sudo Setup
The deployment requires specific sudo permissions configured via:

```bash
sudo bash deploy/setup-nginx-permissions.sh omartheadminuser
```

This creates `/etc/sudoers.d/gisgate-deploy` with:
```
omartheadminuser ALL=(ALL) NOPASSWD: /usr/bin/nginx
omartheadminuser ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
omartheadminuser ALL=(ALL) NOPASSWD: /bin/cp /tmp/gisgate_upstream.conf /etc/nginx/upstreams/gisgate_upstream.conf
```

### Network Isolation
- Blue and green containers use separate Docker networks
- Prevents port conflicts and network interference
- `gisgate-blue-network` and `gisgate-green-network`

## Monitoring & Troubleshooting

### Check Current Status
```bash
# See running containers
docker ps

# Check nginx upstream config
cat /etc/nginx/upstreams/gisgate_upstream.conf

# Test application health
curl http://localhost/api/health

# Check nginx status
sudo systemctl status nginx
```

### Common Issues

#### 502 Bad Gateway
**Cause:** Nginx pointing to stopped container
**Solution:** Check upstream config and reload nginx
```bash
sudo systemctl reload nginx
```

#### Container Not Starting
**Cause:** Build failure or port conflict
**Solution:** Check container logs
```bash
docker logs gisgate_blue  # or gisgate_green
```

#### Nginx Test Failure
**Cause:** Invalid configuration syntax
**Solution:** Check nginx error logs
```bash
sudo nginx -t
sudo systemctl status nginx
```

## Deployment Flow Summary

```
Git Push → Post-Receive Hook → Detect Active → Build Target → Health Check → Nginx Switch → Cleanup Old
     ↓             ↓              ↓           ↓            ↓             ↓            ↓
   main      post-receive     docker ps   docker build  curl /health  switch-upstream  docker down
```

## Benefits

✅ **Zero Downtime**: Traffic switches only after new container is healthy  
✅ **Instant Rollback**: Failed deployments don't affect users  
✅ **Automated**: No manual intervention required  
✅ **Reliable**: Comprehensive error handling and health checks  
✅ **Secure**: Limited sudo permissions for deployment operations  

## File Reference

| File | Purpose | Critical? |
|------|---------|-----------|
| `deploy/post-receive-fixed` | Main deployment orchestrator | ✅ Yes |
| `deploy/switch-upstream.sh` | Nginx configuration manager | ✅ Yes |
| `docker-compose.blue.yml` | Blue environment definition | ✅ Yes |
| `docker-compose.green.yml` | Green environment definition | ✅ Yes |
| `nginx/nginx.conf` | Nginx reverse proxy config | ✅ Yes |
| `deploy/setup-nginx-permissions.sh` | Security setup script | ⚠️ One-time |
| `Dockerfile` | Container build instructions | ✅ Yes |
| `app/api/health/route.ts` | Health check endpoint | ✅ Yes |

## Maintenance

### Regular Tasks
- Monitor disk space for Docker images
- Clean up old images: `docker image prune -f`
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Updates
- Test deployments in development first
- Update health check logic as needed
- Monitor nginx configuration changes

---

**Last Updated:** November 1, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready</content>
<parameter name="filePath">d:\sandbox\gisgate\BLUE_GREEN_DEPLOYMENT.md