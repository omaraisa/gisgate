#!/bin/bash
# Generate cryptographically secure secrets for production

echo "🔐 SECURE SECRET GENERATOR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Generating new secure credentials..."
echo ""
echo "⚠️  IMPORTANT: Save these to your .env.production file"
echo "⚠️  NEVER commit these to version control"
echo "⚠️  Store securely (password manager recommended)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Database Password
echo "# Database Password"
DB_PASS=$(openssl rand -base64 32 | tr -d '/+=')
echo "DATABASE_PASSWORD=\"$DB_PASS\""
echo ""

# JWT Secret
echo "# JWT Secret (for authentication tokens)"
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=\"$JWT_SECRET\""
echo ""

# NextAuth Secret
echo "# NextAuth Secret"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\""
echo ""

# MinIO Credentials
echo "# MinIO Object Storage Credentials"
MINIO_ACCESS=$(openssl rand -base64 16 | tr -d '/+=')
MINIO_SECRET=$(openssl rand -base64 32)
echo "NEXT_PRIVATE_MINIO_ACCESS_KEY=\"$MINIO_ACCESS\""
echo "NEXT_PRIVATE_MINIO_SECRET_KEY=\"$MINIO_SECRET\""
echo ""

# Session Secret
echo "# Session Secret"
SESSION_SECRET=$(openssl rand -base64 32)
echo "SESSION_SECRET=\"$SESSION_SECRET\""
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Secrets generated successfully!"
echo ""
echo "📋 COPY THE ABOVE TO YOUR .env.production FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Update PostgreSQL password:"
echo "   sudo -u postgres psql"
echo "   ALTER USER gisgate_db_user WITH PASSWORD '$DB_PASS';"
echo "   \\q"
echo ""
echo "2. Update DATABASE_URL in .env.production:"
echo "   DATABASE_URL=\"postgresql://gisgate_db_user:$DB_PASS@204.12.205.110:5432/gisgate\""
echo ""
echo "3. Update MinIO configuration (if separate service)"
echo ""
echo "4. Update SMTP password (login to email provider)"
echo ""
echo "5. Rotate PayPal API credentials (contact PayPal support)"
echo ""
echo "6. Generate new SSH keys:"
echo "   ssh-keygen -t ed25519 -C \"your_email@example.com\""
echo ""
echo "7. Force all users to re-login (JWT secret changed)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💾 Save these secrets to your password manager now!"
echo ""
