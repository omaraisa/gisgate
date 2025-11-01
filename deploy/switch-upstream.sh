#!/bin/bash
TARGET=$1  # "blue" or "green"

# Ensure upstream directory exists
mkdir -p /etc/nginx/upstreams 2>/dev/null || sudo mkdir -p /etc/nginx/upstreams

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
sudo nginx -t && sudo systemctl reload nginx
echo "Switched to $TARGET environment"