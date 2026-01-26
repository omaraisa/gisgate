#!/bin/bash
# EMERGENCY SECURITY RESPONSE SCRIPT
# Run this immediately to contain the breach

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🚨 EMERGENCY SECURITY RESPONSE 🚨                 ║"
echo "║                                                            ║"
echo "║  This script will:                                         ║"
echo "║  1. Stop containers and kill malware                       ║"
echo "║  2. Block mining pool connections                          ║"
echo "║  3. Capture evidence                                       ║"
echo "║  4. Scan for malware files                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
read -p "Press ENTER to continue or Ctrl+C to abort..."
echo ""

# Create evidence directory
EVIDENCE_DIR="/tmp/security-evidence-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$EVIDENCE_DIR"
echo "📁 Evidence will be saved to: $EVIDENCE_DIR"
echo ""

# Step 1: Stop containers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Stopping Docker containers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep gisgate || echo "No gisgate containers running"
echo ""
docker stop gisgate_blue gisgate_green gisgate_staging 2>/dev/null || echo "Some containers were not running"
echo "✅ Containers stopped"
echo ""

# Step 2: Kill mining processes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Killing cryptocurrency mining processes..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for processes first
ps aux | grep -i xmrig | grep -v grep && echo "Found xmrig processes!" || echo "No xmrig in process list"

# Kill in containers
docker exec gisgate_blue pkill -9 xmrig 2>/dev/null && echo "Killed xmrig in blue container" || echo "No xmrig in blue container"
docker exec gisgate_green pkill -9 xmrig 2>/dev/null && echo "Killed xmrig in green container" || echo "No xmrig in green container"
docker exec gisgate_staging pkill -9 xmrig 2>/dev/null && echo "Killed xmrig in staging container" || echo "No xmrig in staging container"

# Kill on host
sudo pkill -9 xmrig 2>/dev/null && echo "Killed xmrig on host" || echo "No xmrig on host"
echo "✅ Mining processes terminated"
echo ""

# Step 3: Capture evidence
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Capturing evidence..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Container logs
echo "📋 Capturing container logs..."
docker logs gisgate_blue > "$EVIDENCE_DIR/gisgate_blue.log" 2>&1 || echo "Could not capture blue logs"
docker logs gisgate_green > "$EVIDENCE_DIR/gisgate_green.log" 2>&1 || echo "Could not capture green logs"
docker logs gisgate_staging > "$EVIDENCE_DIR/gisgate_staging.log" 2>&1 || echo "Could not capture staging logs"

# Process list
echo "📋 Capturing process list..."
ps aux > "$EVIDENCE_DIR/processes.txt"

# Network connections
echo "📋 Capturing network connections..."
sudo netstat -anp > "$EVIDENCE_DIR/network-connections.txt" 2>&1 || echo "Could not capture network"

# Iptables rules
echo "📋 Capturing firewall rules..."
sudo iptables -L -n -v > "$EVIDENCE_DIR/iptables-rules.txt" 2>&1 || echo "Could not capture iptables"

# Cron jobs
echo "📋 Capturing cron jobs..."
sudo crontab -l > "$EVIDENCE_DIR/cron-root.txt" 2>&1 || echo "No root crontab"
crontab -l > "$EVIDENCE_DIR/cron-user.txt" 2>&1 || echo "No user crontab"

echo "✅ Evidence captured"
echo ""

# Step 4: Block mining pools
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Blocking mining pool connections..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Block by domain (these will resolve to IPs)
echo "🚫 Blocking pool.supportxmr.com..."
sudo iptables -A OUTPUT -d pool.supportxmr.com -j DROP 2>/dev/null || echo "Rule may already exist"

echo "🚫 Blocking kryptex.network..."
sudo iptables -A OUTPUT -d xmr.kryptex.network -j DROP 2>/dev/null || echo "Rule may already exist"
sudo iptables -A OUTPUT -d xmr-ru.kryptex.network -j DROP 2>/dev/null || echo "Rule may already exist"
sudo iptables -A OUTPUT -d xmr-eu.kryptex.network -j DROP 2>/dev/null || echo "Rule may already exist"
sudo iptables -A OUTPUT -d xmr-us.kryptex.network -j DROP 2>/dev/null || echo "Rule may already exist"
sudo iptables -A OUTPUT -d xmr-sg.kryptex.network -j DROP 2>/dev/null || echo "Rule may already exist"

echo "🚫 Blocking c3pool.org..."
sudo iptables -A OUTPUT -d auto.c3pool.org -j DROP 2>/dev/null || echo "Rule may already exist"

echo "🚫 Blocking pool.hashvault.pro..."
sudo iptables -A OUTPUT -d pool.hashvault.pro -j DROP 2>/dev/null || echo "Rule may already exist"

# Block common mining ports
echo "🚫 Blocking common mining ports..."
sudo iptables -A OUTPUT -p tcp --dport 3333 -j DROP 2>/dev/null || echo "Port 3333 rule may already exist"
sudo iptables -A OUTPUT -p tcp --dport 7777 -j DROP 2>/dev/null || echo "Port 7777 rule may already exist"
sudo iptables -A OUTPUT -p tcp --dport 8029 -j DROP 2>/dev/null || echo "Port 8029 rule may already exist"

# Block known IPs from logs
echo "🚫 Blocking known mining pool IPs..."
sudo iptables -A OUTPUT -d 107.167.92.130 -j DROP 2>/dev/null || echo "IP rule may already exist"
sudo iptables -A OUTPUT -d 141.94.96.144 -j DROP 2>/dev/null || echo "IP rule may already exist"
sudo iptables -A OUTPUT -d 104.243.33.118 -j DROP 2>/dev/null || echo "IP rule may already exist"
sudo iptables -A OUTPUT -d 104.243.43.115 -j DROP 2>/dev/null || echo "IP rule may already exist"

# Save rules
echo "💾 Saving firewall rules..."
sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null || echo "Could not save iptables rules"

echo "✅ Mining pools blocked"
echo ""

# Step 5: Scan for malware
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Scanning for malware files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 Searching for xmrig files..."
sudo find / -name "*xmrig*" -type f 2>/dev/null | tee "$EVIDENCE_DIR/xmrig-files.txt" || echo "No xmrig files found"

echo "🔍 Searching for suspicious config files..."
sudo find / -name "config.json" -type f -exec grep -l "pool\|xmrig" {} \; 2>/dev/null | tee "$EVIDENCE_DIR/suspicious-configs.txt" || echo "No suspicious configs found"

echo "🔍 Searching for recently modified binaries..."
sudo find /tmp /var/tmp -type f -executable -mtime -7 2>/dev/null | tee "$EVIDENCE_DIR/recent-executables.txt" || echo "No recent executables in tmp"

echo "✅ Scan complete"
echo ""

# Step 6: Check current status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 6: Current system status..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📊 CPU Load:"
uptime

echo ""
echo "📊 Top CPU consumers:"
ps aux --sort=-%cpu | head -n 6

echo ""
echo "📊 Docker containers:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📊 Active network connections to suspicious ports:"
sudo netstat -anp | grep -E ":3333|:7777|:8029|ESTABLISHED" | grep -v "127.0.0.1" || echo "None found (good!)"

echo ""
echo "✅ Status check complete"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     ✅ SUMMARY                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Emergency containment complete!"
echo ""
echo "📁 Evidence location: $EVIDENCE_DIR"
echo ""
echo "🔍 Suspicious files found (check these):"
echo "   - $EVIDENCE_DIR/xmrig-files.txt"
echo "   - $EVIDENCE_DIR/suspicious-configs.txt"
echo "   - $EVIDENCE_DIR/recent-executables.txt"
echo ""
echo "📋 Logs captured:"
echo "   - Container logs: $EVIDENCE_DIR/*.log"
echo "   - Process list: $EVIDENCE_DIR/processes.txt"
echo "   - Network connections: $EVIDENCE_DIR/network-connections.txt"
echo "   - Firewall rules: $EVIDENCE_DIR/iptables-rules.txt"
echo "   - Cron jobs: $EVIDENCE_DIR/cron-*.txt"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  CRITICAL NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 🔐 ROTATE ALL CREDENTIALS (within next 2 hours)"
echo "   Run: ./security-audit/scripts/generate-secrets.sh"
echo "   Update:"
echo "   - Database password"
echo "   - JWT_SECRET"
echo "   - MinIO credentials"
echo "   - SMTP password"
echo "   - PayPal API keys"
echo "   - SSH keys"
echo ""
echo "2. 🧹 REMOVE MALWARE FILES"
echo "   Review and delete files listed in:"
echo "   $EVIDENCE_DIR/xmrig-files.txt"
echo ""
echo "3. 🔧 APPLY CODE FIXES"
echo "   See: security-audit/05-CODE-FIXES.md"
echo "   Priority fixes:"
echo "   - Add authentication to admin endpoints"
echo "   - Remove hardcoded credentials"
echo "   - Update .env with new secrets"
echo ""
echo "4. 🚀 DEPLOY SECURED VERSION"
echo "   After applying fixes, rebuild and deploy:"
echo "   docker compose -f docker-compose.blue.yml up -d --build"
echo ""
echo "5. ✅ VERIFY SYSTEM"
echo "   - Check CPU usage is normal"
echo "   - Verify no mining connections"
echo "   - Test authentication is working"
echo "   - Monitor logs for 24 hours"
echo ""
echo "6. 📚 REVIEW FULL AUDIT"
echo "   Read: security-audit/README.md"
echo "   For complete hardening guide"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏰ Time spent: containment phase complete"
echo "📞 Need help? Review security-audit/04-EXECUTIVE-SUMMARY.md"
echo ""
echo "Good luck! 🍀"
echo ""
