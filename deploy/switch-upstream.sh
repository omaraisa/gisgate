#!/bin/bash
TARGET=$1  # "blue" or "green"

# Ensure upstream directory exists
mkdir -p /etc/nginx/upstreams 2>/dev/null || sudo mkdir -p /etc/nginx/upstreams

# Create backup of current config
if [ -f /etc/nginx/upstreams/gisgate_upstream.conf ]; then
    sudo cp /etc/nginx/upstreams/gisgate_upstream.conf /etc/nginx/upstreams/gisgate_upstream.conf.bak
fi

if [ "$TARGET" = "blue" ]; then
    cat > /tmp/gisgate_upstream.conf << EOF
server 127.0.0.1:8001;  # blue container
# server 127.0.0.1:8002;  # green container (inactive)
EOF
elif [ "$TARGET" = "green" ]; then
    cat > /tmp/gisgate_upstream.conf << EOF
# server 127.0.0.1:8001;  # blue container (inactive)
server 127.0.0.1:8002;  # green container
EOF
else
    echo "Usage: $0 [blue|green]"
    exit 1
fi

# Move the file and reload nginx
sudo cp /tmp/gisgate_upstream.conf /etc/nginx/upstreams/gisgate_upstream.conf

# Test nginx configuration first
if sudo nginx -t; then
    echo "✅ Nginx configuration test passed"
    # Only reload if test passes
    if sudo systemctl reload nginx; then
        echo "✅ Nginx reloaded successfully"
        echo "Switched to $TARGET environment"
    else
        echo "❌ Failed to reload nginx"
        exit 1
    fi
else
    echo "❌ Nginx configuration test failed"
    # Restore previous config if test fails
    if [ -f /etc/nginx/upstreams/gisgate_upstream.conf.bak ]; then
        sudo cp /etc/nginx/upstreams/gisgate_upstream.conf.bak /etc/nginx/upstreams/gisgate_upstream.conf
        echo "🔄 Restored previous nginx configuration"
    fi
    exit 1
fi