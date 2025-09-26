# Vercel Deployment Guide for MöbelMarkt

## Prerequisites

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`

## Environment Variables Setup

Configure these environment variables in your Vercel project:

### Required Variables

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@hostname/database

# Authentication
SESSION_SECRET=your-super-secret-session-key-here
ADMIN_PASS=your-admin-password

# AI Features
OPENAI_API_KEY=sk-your-openai-api-key

# Optional
PORT=5000
```

### Setting Environment Variables

**Via Vercel CLI:**
```bash
vercel env add DATABASE_URL production
vercel env add SESSION_SECRET production
vercel env add ADMIN_PASS production
vercel env add OPENAI_API_KEY production
```

**Via Vercel Dashboard:**
1. Go to your project settings
2. Navigate to Environment Variables
3. Add each variable for Production, Preview, and Development

## Deployment Steps

### 1. Build and Deploy

```bash
# First deployment
vercel

# Subsequent deployments
vercel --prod
```

### 2. Database Setup

Ensure your Neon database is accessible and tables are created:

```bash
# Push database schema (run locally with production DATABASE_URL)
npm run db:push
```

## File Upload Considerations

⚠️ **Important**: Vercel serverless functions have read-only filesystem except for `/tmp`.

### Current Setup
- Files are uploaded to `/tmp/uploads` (temporary)
- Static files need external storage for persistence

### Recommended for Production
1. **Vercel Blob Storage** (recommended)
2. **AWS S3** with CloudFront
3. **Cloudinary** for images
4. **Google Cloud Storage**

### Implementing Vercel Blob

```bash
npm install @vercel/blob
```

Update your upload routes to use Vercel Blob instead of local filesystem.

## Monitoring and Debugging

### Check Function Logs
```bash
vercel logs [deployment-url]
```

### Function Timeout
- Current limit: 30 seconds (configured in vercel.json)
- Increase if needed for large image processing

### Common Issues

1. **Database Connection**: Ensure DATABASE_URL includes SSL parameters for Neon
2. **Session Storage**: Uses PostgreSQL session store (configured automatically)
3. **CORS**: Configure for your domain in production
4. **File Uploads**: Remember temporary filesystem limitation

## Performance Optimization

1. **Cold Starts**: Functions may have cold start delay
2. **Image Processing**: Consider moving to background jobs for large files
3. **Caching**: Implement Redis or Vercel KV for better performance

## Security

1. **HTTPS**: Automatically handled by Vercel
2. **Environment Variables**: Never commit sensitive data
3. **Session Security**: Configured for production with secure cookies
4. **API Rate Limiting**: Consider implementing for production

## Domain Configuration

After deployment:
1. Add your custom domain in Vercel dashboard
2. Update CORS settings if needed
3. Test all API endpoints
4. Verify file upload functionality

## Rollback

```bash
# List deployments
vercel ls

# Promote a specific deployment to production
vercel promote [deployment-url]
```