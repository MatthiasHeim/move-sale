#!/bin/bash

# Vercel Build Script for MöbelMarkt

set -e

echo "🔨 Building MöbelMarkt for Vercel deployment..."

# Check Node.js version
echo "📋 Node.js version: $(node --version)"
echo "📋 npm version: $(npm --version)"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf client/dist/
rm -rf .vercel/output/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Type checking
echo "🔍 Running TypeScript type check..."
npm run check

# Build frontend
echo "⚛️ Building React frontend..."
npm run build:vercel

# Verify build output
echo "✅ Verifying build output..."

if [ ! -d "dist/public" ]; then
    echo "❌ Frontend build failed - dist/public directory not found"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Frontend build failed - index.html not found"
    exit 1
fi

# Check API entry point
if [ ! -f "api/index.ts" ]; then
    echo "❌ API entry point not found - api/index.ts missing"
    exit 1
fi

# Verify critical files exist
echo "📁 Verifying critical files..."
files_to_check=(
    "vercel.json"
    "api/index.ts"
    "dist/public/index.html"
    "shared/schema.ts"
)

for file in "${files_to_check[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Critical file missing: $file"
        exit 1
    fi
    echo "✅ Found: $file"
done

# Check environment variables
echo "🔧 Checking environment variables..."
required_vars=("DATABASE_URL" "SESSION_SECRET" "ADMIN_PASS" "OPENAI_API_KEY")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  Warning: $var not set in environment (should be configured in Vercel)"
    else
        echo "✅ $var is configured"
    fi
done

echo ""
echo "🎉 Build complete! Ready for Vercel deployment."
echo ""
echo "📋 Next steps:"
echo "1. Ensure environment variables are set in Vercel dashboard"
echo "2. Run: vercel --prod"
echo "3. Test deployment with: npm run test:deployment <url>"