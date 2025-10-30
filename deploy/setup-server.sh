#!/bin/bash
# Production Deployment Setup for GIS Gate on 204.12.205.110

echo "🚀 Setting up GIS Gate Blue-Green Deployment on 204.12.205.110"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="204.12.205.110"
APP_DIR="/opt/apps/gisgate"
GIT_DIR="/opt/deploy/gisgate.git"
NGINX_UPSTREAM_DIR="/etc/nginx/upstreams"
STATIC_DIR="/var/www/static"
UPLOADS_DIR="/var/www/uploads"

echo -e "${YELLOW}📋 Checking system requirements...${NC}"

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   echo -e "${GREEN}✅ Running with administrative privileges${NC}"
else
   echo -e "${RED}❌ This script needs to be run with sudo${NC}"
   exit 1
fi

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
else
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $SUDO_USER
fi

# Check if Docker Compose is installed
if command -v docker compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose is installed${NC}"
else
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose manually"
    exit 1
fi

# Install required packages
echo -e "${YELLOW}📦 Installing required packages...${NC}"
apt update
apt install -y curl jq nginx git

echo -e "${YELLOW}📁 Creating directory structure...${NC}"

# Create nginx upstream directory
mkdir -p $NGINX_UPSTREAM_DIR

# Create static directories
mkdir -p $STATIC_DIR/image
mkdir -p $UPLOADS_DIR/images

# Set proper permissions
chown -R www-data:www-data $STATIC_DIR
chown -R www-data:www-data $UPLOADS_DIR
chmod -R 755 $STATIC_DIR
chmod -R 755 $UPLOADS_DIR

# Create initial upstream file (pointing to blue by default)
echo "server 127.0.0.1:8001;" > $NGINX_UPSTREAM_DIR/gisgate_upstream.conf

echo -e "${YELLOW}🔧 Setting up git repository...${NC}"

# Ensure git directories exist
mkdir -p $GIT_DIR
mkdir -p $APP_DIR

# Set proper ownership for git directories
if id "git" &>/dev/null; then
    chown -R git:git $GIT_DIR
    chown -R git:git $APP_DIR
else
    echo -e "${YELLOW}⚠️  Git user doesn't exist. Creating it...${NC}"
    useradd -r -m -d /home/git -s /bin/bash git
    chown -R git:git $GIT_DIR
    chown -R git:git $APP_DIR
fi

echo -e "${YELLOW}🌐 Checking nginx configuration...${NC}"

# Backup current nginx config if it exists
if [ -f /etc/nginx/nginx.conf ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Nginx configuration backed up${NC}"
fi

# Test if nginx is running
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${YELLOW}⚠️  Starting nginx...${NC}"
    systemctl start nginx
    systemctl enable nginx
fi

echo -e "${YELLOW}🔥 Setting up firewall rules...${NC}"

# Configure UFW firewall (if installed)
if command -v ufw &> /dev/null; then
    ufw allow 22        # SSH
    ufw allow 80        # HTTP
    ufw allow 443       # HTTPS
    ufw allow 8001      # Blue container (for debugging)
    ufw allow 8002      # Green container (for debugging)
    ufw allow 9000      # MinIO
    ufw allow 9001      # MinIO Console
    echo -e "${GREEN}✅ Firewall rules configured${NC}"
fi

echo -e "${GREEN}🎉 Basic setup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Copy your nginx.conf to /etc/nginx/nginx.conf"
echo "2. Copy your post-receive hook to $GIT_DIR/hooks/"
echo "3. Copy your .env file to $APP_DIR/"
echo "4. Test nginx configuration: nginx -t"
echo "5. Reload nginx: systemctl reload nginx"
echo "6. Push your code: git push production main"
echo ""
echo -e "${GREEN}Server IP: $SERVER_IP${NC}"
echo -e "${GREEN}App Directory: $APP_DIR${NC}"
echo -e "${GREEN}Git Directory: $GIT_DIR${NC}"