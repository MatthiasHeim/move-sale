# MöbelMarkt - Vercel Deployment Guide

This guide covers deploying the MöbelMarkt furniture marketplace to Vercel.

## Quick Start

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy using the automated script**:
   ```bash
   npm run deploy
   ```

## Manual Deployment

### 1. Login to Vercel
```bash
vercel login
```

### 2. Set Environment Variables

Configure these in your Vercel project dashboard or via CLI:

```bash
# Required environment variables
vercel env add DATABASE_URL production
vercel env add SESSION_SECRET production
vercel env add ADMIN_PASS production
vercel env add OPENAI_API_KEY production

# Optional
vercel env add PORT production  # defaults to 5000
```

**Environment Variable Values:**

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `ADMIN_PASS`: Password for admin access
- `OPENAI_API_KEY`: Your OpenAI API key for AI features

### 3. Deploy

```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

## Project Structure

```
move-sale/
├── api/
│   └── index.ts              # Vercel serverless function entry point
├── client/
│   ├── src/                  # React frontend source
│   └── public/              # Static assets
├── server/                   # Express.js backend code
├── shared/                   # Shared TypeScript schemas
├── vercel.json              # Vercel configuration
└── scripts/deploy.sh        # Deployment script
```

## Configuration Files

### vercel.json
- Configures serverless function routing
- Sets build commands and output directory
- Defines function timeout (30 seconds)

### API Routes
All API routes are handled by the serverless function at `/api/index.ts`:
- `/api/*` → Routed to Express.js backend
- Static files → Served from build output
- SPA routing → Falls back to `index.html`

## Important Considerations

### 1. File Uploads
⚠️ **Critical**: Vercel serverless functions have read-only filesystem except `/tmp`.

**Current Setup:**
- Files uploaded to `/tmp` (temporary)
- ⚠️ Files are lost between function invocations
- Production requires external storage

**Recommended Solutions:**
1. **Vercel Blob** (easiest integration)
2. **AWS S3** with CloudFront
3. **Cloudinary** for image optimization
4. **Google Cloud Storage**

**Implementation Notes:**
- File processing code is in `server/image-processing-vercel.ts`
- Environment detection in `server/env.ts`
- Example integrations commented in code

### 2. Database
- Uses Neon PostgreSQL (serverless-friendly)
- Connection pooling configured for serverless
- Session storage uses PostgreSQL

### 3. Sessions
- Configured for HTTPS in production
- Uses PostgreSQL session store
- 24-hour session lifetime

### 4. Performance
- Function cold starts: ~1-2 seconds
- 30-second function timeout
- Image processing happens in-function

## Deployment Checklist

### Before Deployment
- [ ] Environment variables configured
- [ ] Database schema deployed (`npm run db:push`)
- [ ] OpenAI API key has sufficient credits
- [ ] Admin password is secure

### After Deployment
- [ ] Test homepage loads
- [ ] Test admin login (`/admin/login`)
- [ ] Test API endpoints (`/api/auth/status`)
- [ ] Test product creation (without images first)
- [ ] Verify database connections
- [ ] Check function logs for errors

### Testing Endpoints
```bash
# Check API status
curl https://your-domain.vercel.app/api/auth/status

# Test products endpoint
curl https://your-domain.vercel.app/api/products

# Check admin authentication
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-admin-password"}'
```

## Monitoring & Debugging

### View Function Logs
```bash
vercel logs https://your-deployment-url.vercel.app
```

### Common Issues

1. **Database Connection Errors**
   - Ensure `DATABASE_URL` includes SSL parameters
   - Check Neon database is accessible
   - Verify connection string format

2. **Session Issues**
   - Ensure `SESSION_SECRET` is set
   - Check database session table exists
   - Verify HTTPS configuration

3. **File Upload Failures**
   - Expected in production without external storage
   - Check `/tmp` directory permissions
   - Monitor function timeout for large images

4. **Cold Start Timeouts**
   - First request may take 1-2 seconds
   - Consider implementing health check endpoint
   - Monitor function duration

### Environment-Specific Behavior

**Development:**
- Files saved to local filesystem
- HTTP cookies allowed
- Detailed error messages

**Production (Vercel):**
- Files saved to `/tmp` only
- HTTPS required for cookies
- Sanitized error messages
- Connection pooling optimized

## Scaling Considerations

### Performance Optimization
1. **Image Processing**: Consider background jobs for large files
2. **Caching**: Implement Redis or Vercel KV for frequent data
3. **CDN**: Use Vercel's built-in CDN for static assets
4. **Database**: Monitor connection pool usage

### Cost Management
1. **Function Invocations**: Monitor monthly usage
2. **Database**: Neon has usage-based pricing
3. **External Storage**: Choose cost-effective solution
4. **OpenAI API**: Monitor token usage

## Rollback Process

```bash
# List recent deployments
vercel ls

# Promote a specific deployment to production
vercel promote https://specific-deployment-url.vercel.app
```

## Security

- HTTPS enforced automatically
- Environment variables encrypted
- Session cookies secured
- CORS configured for production
- No sensitive data in client bundle

## Support

For deployment issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test database connectivity
4. Review this documentation
5. Check Vercel dashboard for function metrics

Happy selling! 🏠➡️🇭🇰