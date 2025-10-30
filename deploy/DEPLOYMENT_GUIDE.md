# 🚀 GIS Gate Blue-Green Deployment Guide
## Server: 204.12.205.110

This guide will set up automatic blue-green deployment for your GIS Gate application on server `204.12.205.110`.

## 📋 Prerequisites

- Ubuntu/Debian server with root access
- Docker and Docker Compose installed
- Git repository already set up at `/opt/deploy/gisgate.git`
- Application directory at `/opt/apps/gisgate`

## 🛠️ Step-by-Step Setup

### 1. Run Initial Server Setup

Upload and run the setup script:

```bash
# Upload setup script to server
scp deploy/setup-server.sh root@204.12.205.110:/tmp/

# SSH to server and run setup
ssh root@204.12.205.110
chmod +x /tmp/setup-server.sh
sudo /tmp/setup-server.sh
```

### 2. Upload and Configure Nginx

```bash
# From your local machine, upload nginx config
scp nginx/nginx.conf root@204.12.205.110:/tmp/

# On server, apply nginx config
ssh root@204.12.205.110
sudo mv /tmp/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Apply changes
```

### 3. Set Up Git Hook

```bash
# Upload post-receive hook
scp deploy/post-receive root@204.12.205.110:/tmp/

# On server, install the hook
ssh root@204.12.205.110
sudo mv /tmp/post-receive /opt/deploy/gisgate.git/hooks/
sudo chmod +x /opt/deploy/gisgate.git/hooks/post-receive
sudo chown git:git /opt/deploy/gisgate.git/hooks/post-receive
```

### 4. Configure Environment Variables

```bash
# Upload environment file
scp .env root@204.12.205.110:/tmp/

# On server, place env file
ssh root@204.12.205.110
sudo mv /tmp/.env /opt/apps/gisgate/
sudo chown git:git /opt/apps/gisgate/.env
```

### 5. Upload Docker Compose Files

```bash
# Upload both docker compose files
scp docker-compose.blue.yml root@204.12.205.110:/opt/apps/gisgate/
scp docker-compose.green.yml root@204.12.205.110:/opt/apps/gisgate/

# Set permissions
ssh root@204.12.205.110
sudo chown git:git /opt/apps/gisgate/docker-compose.*.yml
```

## 🚀 Deploy Your Application

### Initial Deployment

```bash
# From your local machine, push to production
git push production main
```

The system will automatically:
1. 🔍 Detect this is the first deployment
2. 🔨 Build the blue container (port 8001)
3. ⏳ Wait for health check to pass
4. 🔄 Point nginx to the new container
5. ✅ Application is live!

### Subsequent Deployments

Every time you push code:

```bash
git push production main
```

The system will:
1. 🔍 Detect which container (blue/green) is currently running
2. 🔨 Build the other container silently
3. ⏳ Wait for health check to pass  
4. 🔄 Switch nginx traffic instantly
5. 🧹 Remove old container
6. ✅ Zero downtime deployment complete!

## 🔍 Monitoring Commands

### Check System Status

```bash
# SSH to your server
ssh root@204.12.205.110

# Check which container is active
cat /etc/nginx/upstreams/gisgate_upstream.conf

# Check running containers
docker ps | grep gisgate

# Check application health
curl http://localhost/api/health
curl http://204.12.205.110/api/health

# Check nginx status
sudo systemctl status nginx

# View deployment logs
tail -f /var/log/nginx/access.log
```

### Debug Container Issues

```bash
# View container logs
docker logs gisgate_blue
docker logs gisgate_green

# Check container health
docker inspect gisgate_blue | grep Health
docker inspect gisgate_green | grep Health

# Manual health check
curl http://localhost:8001/api/health  # Blue
curl http://localhost:8002/api/health  # Green
```

## 🌐 Access Your Application

- **Production URL**: `http://204.12.205.110`
- **Health Check**: `http://204.12.205.110/api/health`
- **Nginx Status**: `http://204.12.205.110/nginx_status` (local only)

## 🔧 Configuration Files

### Current Server Setup

- **Nginx Config**: `/etc/nginx/nginx.conf`
- **Upstream Config**: `/etc/nginx/upstreams/gisgate_upstream.conf`
- **App Directory**: `/opt/apps/gisgate`
- **Git Repository**: `/opt/deploy/gisgate.git`
- **Static Files**: `/var/www/static/image`
- **Uploads**: `/var/www/uploads/images`

### Environment Variables

Your `.env` file is configured for production on `204.12.205.110`:

- Database: PostgreSQL on same server
- URLs: Point to `204.12.205.110`
- PayPal: Production environment
- Static files: Served by nginx directly

## 🎯 Domain Migration

When you're ready to point your domain to this server:

1. **Update DNS**: Point your domain A record to `204.12.205.110`
2. **Update Environment**: Change URLs in `.env` from IP to domain name
3. **Redeploy**: `git push production main`

Example `.env` updates for domain:
```bash
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_PAYMENT_SUCCESS_URL="https://yourdomain.com/payment/success"
NEXT_PUBLIC_PAYMENT_CANCEL_URL="https://yourdomain.com/payment/cancel"
```

## 🆘 Troubleshooting

### Common Issues

1. **Container won't start**: Check logs with `docker logs gisgate_blue`
2. **Health check fails**: Verify app starts correctly and `/api/health` responds
3. **Nginx errors**: Check `sudo nginx -t` and logs in `/var/log/nginx/`
4. **Permission issues**: Ensure git user owns application files

### Manual Rollback

If deployment fails and you need to manually switch:

```bash
# Switch to blue container
echo "server 127.0.0.1:8001;" | sudo tee /etc/nginx/upstreams/gisgate_upstream.conf
sudo nginx -s reload

# Switch to green container  
echo "server 127.0.0.1:8002;" | sudo tee /etc/nginx/upstreams/gisgate_upstream.conf
sudo nginx -s reload
```

## 📊 Performance Monitoring

Your setup includes:
- **Health checks** every 30 seconds
- **Automatic container restarts** if unhealthy
- **Nginx caching** for static content
- **Gzip compression** for better performance
- **Security headers** for protection

Perfect! Your application is now ready for zero-downtime production deployments! 🎉