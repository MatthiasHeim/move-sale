#!/bin/bash

# MöbelMarkt Vercel Deployment Script

set -e

echo "🚀 Starting Vercel deployment for MöbelMarkt..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Build the project
echo "🔨 Building project..."
npm run build:client

# Copy built files to public directory for Vercel
echo "📁 Copying files to public directory..."
mkdir -p public
cp -r dist/public/* public/

# Check if this is the first deployment
if [ ! -f .vercel/project.json ]; then
    echo "🆕 First time deployment - setting up project..."
    vercel --confirm
else
    echo "📦 Deploying to production..."
    vercel --prod
fi

echo "✅ Deployment complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. Verify environment variables are set in Vercel dashboard"
echo "2. Test API endpoints: /api/products, /api/auth/status"
echo "3. Test file upload functionality"
echo "4. Check database connection"
echo "5. Verify session management works"
echo ""
echo "🔧 If you encounter issues:"
echo "1. Check function logs: vercel logs [deployment-url]"
echo "2. Verify DATABASE_URL includes SSL parameters"
echo "3. Consider implementing external storage for file uploads"
echo ""
echo "Happy selling! 🏠➡️🇭🇰"