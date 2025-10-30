#!/bin/bash
# GIS Gate Production Deployment Script

echo "🚀 Starting GIS Gate production deployment..."

# Set environment variables
export DATABASE_URL="postgresql://omardbmangr:N%21neB3ars%26D0gZ_in_Th%40BusH_1776%21@204.12.205.110:5432/gisgate"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗃️  Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗃️  Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🔨 Building application..."
npm run build

# Start the application
echo "🚀 Starting application..."
npm start