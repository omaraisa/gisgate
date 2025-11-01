#!/bin/bash

# Setup script to configure passwordless sudo for nginx commands
# Run this ONCE on your VPS as root or with sudo

echo "🔧 Setting up passwordless sudo for nginx deployment commands..."

# Get the deployment user (usually the git user)
DEPLOY_USER=${1:-$(whoami)}

echo "👤 Target user: $DEPLOY_USER"

# Check if user exists
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    echo "❌ User '$DEPLOY_USER' does not exist"
    exit 1
fi

# Create sudoers file with proper syntax
SUDOERS_FILE="/etc/sudoers.d/gisgate-deploy"
echo "📝 Creating sudoers file: $SUDOERS_FILE"

cat > "$SUDOERS_FILE" << EOF
# Allow $DEPLOY_USER to run nginx commands without password for gisgate deployment
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/mkdir -p /etc/nginx/upstreams
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/cp /tmp/gisgate_upstream.conf /etc/nginx/upstreams/gisgate_upstream.conf
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/cp /etc/nginx/upstreams/gisgate_upstream.conf /etc/nginx/upstreams/gisgate_upstream.conf.bak
EOF

# Set proper permissions (critical!)
chmod 440 "$SUDOERS_FILE"
chown root:root "$SUDOERS_FILE"

echo "🔐 Set permissions: $(ls -la $SUDOERS_FILE)"

# Create nginx upstreams directory if it doesn't exist
mkdir -p /etc/nginx/upstreams 2>/dev/null || true
chown root:root /etc/nginx/upstreams
chmod 755 /etc/nginx/upstreams

# Test the configuration by switching to the user
echo "🧪 Testing sudo configuration..."
if sudo -u "$DEPLOY_USER" sudo -n nginx -t 2>/dev/null; then
    echo "✅ Passwordless sudo for nginx configured successfully!"
    echo "✅ User '$DEPLOY_USER' can now run nginx commands without password"
else
    echo "❌ Testing failed. Checking what went wrong..."

    # Check if sudoers file is valid
    if visudo -c -f "$SUDOERS_FILE" 2>/dev/null; then
        echo "✅ Sudoers file syntax is valid"
    else
        echo "❌ Sudoers file syntax is invalid"
        cat "$SUDOERS_FILE"
        exit 1
    fi

    # Try to see what's happening
    echo "🔍 Debug info:"
    echo "Sudoers file: $(ls -la $SUDOERS_FILE)"
    echo "User: $(id $DEPLOY_USER)"
    echo "Groups: $(groups $DEPLOY_USER)"

    # Try manual test
    echo "Manual test result:"
    sudo -u "$DEPLOY_USER" sudo -n /bin/echo "test" 2>&1 || echo "Failed"

    exit 1
fi

echo ""
echo "📋 Setup complete! The deployment user can now:"
echo "   - Run 'sudo nginx -t' without password"
echo "   - Run 'sudo systemctl reload nginx' without password"
echo "   - Copy upstream config files to /etc/nginx/upstreams/"
echo ""
echo "🔐 Security note: Only specific nginx commands are allowed, not full sudo access"
echo ""
echo "🚀 You can now test deployment with: git push production main"