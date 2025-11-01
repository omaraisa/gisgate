#!/bin/bash

# Alternative setup script - run this as ROOT user
# This script sets up passwordless sudo for the deployment user

echo "🔧 Setting up passwordless sudo for nginx deployment (ROOT VERSION)..."

# Get the deployment user
DEPLOY_USER=${1:-"omartheadminuser"}

echo "👤 Target user: $DEPLOY_USER"

# Check if user exists
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    echo "❌ User '$DEPLOY_USER' does not exist"
    exit 1
fi

# Create sudoers file
SUDOERS_FILE="/etc/sudoers.d/gisgate-deploy"
echo "📝 Creating sudoers file: $SUDOERS_FILE"

cat > "$SUDOERS_FILE" << 'EOF'
# Allow deployment user to run nginx commands without password
omartheadminuser ALL=(ALL) NOPASSWD: /usr/sbin/nginx
omartheadminuser ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
omartheadminuser ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx
omartheadminuser ALL=(ALL) NOPASSWD: /bin/mkdir -p /etc/nginx/upstreams
omartheadminuser ALL=(ALL) NOPASSWD: /bin/cp /tmp/gisgate_upstream.conf /etc/nginx/upstreams/gisgate_upstream.conf
omartheadminuser ALL=(ALL) NOPASSWD: /bin/cp /etc/nginx/upstreams/gisgate_upstream.conf /etc/nginx/upstreams/gisgate_upstream.conf.bak
EOF

# Set proper permissions (critical!)
chmod 440 "$SUDOERS_FILE"
chown root:root "$SUDOERS_FILE"

echo "🔐 Set permissions: $(ls -la $SUDOERS_FILE)"

# Create nginx upstreams directory
mkdir -p /etc/nginx/upstreams
chown root:root /etc/nginx/upstreams
chmod 755 /etc/nginx/upstreams

# Test the configuration
echo "🧪 Testing sudo configuration..."
if sudo -u "$DEPLOY_USER" sudo -n nginx -t 2>/dev/null; then
    echo "✅ Passwordless sudo configured successfully!"
else
    echo "❌ Test failed, but this might be because nginx config is invalid"
    echo "   The sudo permissions should still work for valid commands"
fi

# Validate sudoers syntax
if visudo -c -f "$SUDOERS_FILE" 2>/dev/null; then
    echo "✅ Sudoers file syntax is valid"
else
    echo "❌ Sudoers file syntax is invalid"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Run this to test:"
echo "   sudo -u $DEPLOY_USER sudo -n nginx -t"
echo ""
echo "🚀 Ready for deployment!"