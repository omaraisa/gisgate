# GIS Gate Staging Setup Guide

## Quick Setup for Staging Environment

### 1. On Your VPS (One-time setup)

```bash
# Navigate to your app directory
cd /opt/apps/gisgate

# Make setup script executable
chmod +x deploy/setup-staging.sh

# Run setup (requires sudo)
sudo bash deploy/setup-staging.sh
```

### 2. On Your Local Machine

```bash
# Add staging remote
git remote add staging omartheadminuser@your-server-ip:/opt/deploy/gisgate-staging.git

# Push to staging
git push staging main
```

### 3. Access Your Staging Site

- **Direct Access:** `http://your-server-ip:8003`
- **Health Check:** `http://your-server-ip:8003/api/health`

### 4. Your Development Workflow

```bash
# After implementing a new feature
git add .
git commit -m "Add new feature"
git push staging main

# Test at http://your-server-ip:8003
# If good, deploy to production
git push production main
```

## What Gets Created

### Directories
- `/opt/apps/gisgate-staging/` - Staging application directory
- `/opt/deploy/gisgate-staging.git/` - Bare git repository for staging

### Files
- `post-receive` hook for automatic deployment
- Nginx config (optional) for subdomain access

### Docker
- `gisgate_staging` container on port 8003
- Isolated network: `gisgate-staging-network`

## Troubleshooting

### Check if staging is running
```bash
docker ps | grep staging
```

### View staging logs
```bash
docker logs gisgate_staging
```

### Restart staging
```bash
cd /opt/apps/gisgate-staging
docker compose -f docker-compose.staging.yml restart
```

### Remove staging completely
```bash
docker stop gisgate_staging
docker rm gisgate_staging
sudo rm -rf /opt/apps/gisgate-staging
sudo rm -rf /opt/deploy/gisgate-staging.git
```