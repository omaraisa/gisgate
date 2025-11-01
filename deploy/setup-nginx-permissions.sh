#!/bin/bash

# Setup script to configure passwordless sudo for nginx commands
# Run this ONCE on your VPS as root or with sudo

echo "Setting up passwordless sudo for nginx deployment commands..."

# Get the deployment user (usually the git user)
DEPLOY_USER=${1:-$(whoami)}

# Create sudoers file for nginx commands
cat > /etc/sudoers.d/gisgate-deploy << EOF
# Allow $DEPLOY_USER to run nginx commands without password for gisgate deployment
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/mkdir -p /etc/nginx/upstreams
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/cp /tmp/gisgate_upstream.conf /etc/nginx/upstreams/gisgate_upstream.conf
EOF

# Set proper permissions
chmod 440 /etc/sudoers.d/gisgate-deploy

# Create nginx upstreams directory if it doesn't exist
mkdir -p /etc/nginx/upstreams

# Set proper ownership and permissions
chown root:root /etc/nginx/upstreams
chmod 755 /etc/nginx/upstreams

# Test the configuration
echo "Testing sudo configuration..."
if sudo -u $DEPLOY_USER sudo nginx -t >/dev/null 2>&1; then
    echo "✅ Passwordless sudo for nginx configured successfully!"
    echo "✅ User '$DEPLOY_USER' can now run nginx commands without password"
else
    echo "❌ Configuration failed. Please check the setup."
    exit 1
fi

echo ""
echo "📋 Setup complete! The deployment user can now:"
echo "   - Run 'sudo nginx -t' without password"
echo "   - Run 'sudo systemctl reload nginx' without password" 
echo "   - Copy upstream config files to /etc/nginx/upstreams/"
echo ""
echo "🔐 Security note: Only specific nginx commands are allowed, not full sudo access"