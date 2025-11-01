#!/bin/bash

# Setup script for GIS Gate Staging Environment
# Run this on your VPS to set up the staging deployment

echo "🚀 Setting up GIS Gate Staging Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/apps/gisgate-staging"
GIT_DIR="/opt/deploy/gisgate-staging.git"
DEPLOY_USER="omartheadminuser"

echo "📁 Creating directories..."
sudo mkdir -p "$APP_DIR"
sudo mkdir -p "$GIT_DIR"
sudo mkdir -p /var/www/uploads/images
sudo mkdir -p /var/www/static/image

echo "🔧 Setting up bare git repository..."
cd /opt/deploy
sudo git init --bare gisgate-staging.git
sudo chown -R $DEPLOY_USER:$DEPLOY_USER gisgate-staging.git
# Rename default branch to main
cd gisgate-staging.git
sudo git branch -m master main
cd /opt/deploy

echo "📋 Setting up post-receive hook..."
# Copy from current app directory (where this script is run from)
sudo cp "/opt/apps/gisgate/deploy/post-receive-staging" "$GIT_DIR/hooks/post-receive"
sudo chmod +x "$GIT_DIR/hooks/post-receive"
sudo chown $DEPLOY_USER:$DEPLOY_USER "$GIT_DIR/hooks/post-receive"
 
echo "🌐 Adding staging to nginx (optional)..."
# Create nginx config for staging subdomain (optional)
sudo tee /etc/nginx/sites-available/gisgate-staging > /dev/null <<EOF
server {
    listen 80;
    server_name staging.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

echo "🔗 Setting up git remote..."
echo "Run these commands on your LOCAL machine:"
echo ""
echo "${GREEN}git remote add staging $DEPLOY_USER@your-server-ip:/opt/deploy/gisgate-staging.git${NC}"
echo ""
echo "Then deploy to staging:"
echo "${GREEN}git push staging main${NC}"
echo ""
echo "Access staging at:"
echo "${GREEN}http://your-server-ip:8003${NC}"
echo "or with domain:"
echo "${GREEN}sudo ln -s /etc/nginx/sites-available/gisgate-staging /etc/nginx/sites-enabled/${NC}"
echo "${GREEN}sudo systemctl reload nginx${NC}"
echo "${GREEN}https://staging.yourdomain.com${NC}"

echo ""
echo "🎉 Staging setup complete!"
echo "📝 Remember to:"
echo "   1. Add the git remote locally"
echo "   2. Set up your domain DNS if using subdomain"
echo "   3. Test the deployment with: git push staging main"