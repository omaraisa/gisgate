#!/bin/bash
TARGET=$1  # "blue" or "green"

if [ "$TARGET" = "blue" ]; then
    cat > /etc/nginx/upstreams/gisgate_upstream.conf << EOF
server 127.0.0.1:8001;  # blue container
# server 127.0.0.1:8002;  # green container (inactive)
EOF
elif [ "$TARGET" = "green" ]; then
    cat > /etc/nginx/upstreams/gisgate_upstream.conf << EOF
# server 127.0.0.1:8001;  # blue container (inactive)
server 127.0.0.1:8002;  # green container
EOF
else
    echo "Usage: $0 [blue|green]"
    exit 1
fi

# Test nginx configuration and reload
nginx -t && systemctl reload nginx
echo "Switched to $TARGET environment"