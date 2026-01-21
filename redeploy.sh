#!/bin/bash
# Redeploy script - triggers deployment without new commits
# Usage: ./redeploy.sh

echo "🔄 Triggering redeployment..."

# Delete the deploy tag locally and remotely
git tag -d deploy 2>/dev/null || true
git push production :refs/tags/deploy 2>/dev/null || true

# Create a new deploy tag at current HEAD
git tag deploy

# Push the tag to trigger deployment
git push production deploy

echo "✅ Redeployment triggered!"
echo "Check server logs to monitor deployment progress."
