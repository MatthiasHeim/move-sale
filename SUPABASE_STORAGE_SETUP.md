# Supabase Storage Setup Guide

This guide will help you fix the Supabase storage configuration for image uploads.

## Current Issue
Your upload endpoint is getting a 500 error because:
1. The 'images' storage bucket doesn't exist in your Supabase project
2. Row Level Security (RLS) is blocking uploads
3. Proper policies need to be created for public image uploads

## Solution Steps

### Step 1: Get Your Service Role Key (Recommended)

To automatically create the bucket and policies:

1. Go to your Supabase Dashboard: https://skyttkazfonfzhbgtbus.supabase.co
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. Add it to your `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
5. Run the setup script:
   ```bash
   node scripts/setup-supabase-storage-complete.js
   ```

### Step 2: Manual Setup (Alternative)

If you prefer to set up manually or don't want to use the service role key:

#### 2.1 Create the Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **"Create a new bucket"**
3. Configure the bucket:
   - **Name**: `images`
   - **Public**: ✅ YES (very important!)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`
   - **File size limit**: `10485760` (10MB)

#### 2.2 Set Up RLS Policies

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this SQL script:

```sql
-- Policy to allow public uploads to the 'images' bucket
CREATE POLICY "Allow public uploads to images bucket" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'images');

-- Policy to allow public reads from the 'images' bucket
CREATE POLICY "Allow public reads from images bucket" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- Policy to allow public updates to the 'images' bucket (for upserts)
CREATE POLICY "Allow public updates to images bucket" ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Policy to allow public deletes from the 'images' bucket (for cleanup)
CREATE POLICY "Allow public deletes from images bucket" ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'images');
```

#### 2.3 Alternative: Disable RLS (Less Secure)

If you want to quickly test without policies:

1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Find the `storage.objects` table
3. Temporarily disable RLS

**⚠️ Warning**: This makes all storage publicly accessible. Use policies instead for production.

### Step 3: Test the Setup

Run the test script to verify everything works:

```bash
node scripts/fix-supabase-storage.js
```

You should see:
- ✅ Bucket exists and is public
- ✅ Test upload successful
- ✅ Public URL generated
- ✅ Test file cleaned up

### Step 4: Test Your Upload Endpoint

Try uploading an image through your application. The endpoint should now work without 500 errors.

## Troubleshooting

### Error: "new row violates row-level security policy"
- **Cause**: RLS is blocking uploads
- **Solution**: Create the policies from Step 2.2 or temporarily disable RLS

### Error: "Bucket not found"
- **Cause**: The 'images' bucket doesn't exist
- **Solution**: Create the bucket as described in Step 2.1

### Error: "JWT expired" or authentication errors
- **Cause**: Invalid or expired API keys
- **Solution**:
  1. Verify `SUPABASE_URL` is correct
  2. Regenerate API keys in Supabase Dashboard → Settings → API
  3. Update your `.env` file

### Upload works but images aren't publicly accessible
- **Cause**: Bucket is not public or missing read policies
- **Solution**:
  1. Make sure bucket is marked as "Public"
  2. Create the read policy from Step 2.2

## What Was Fixed

1. **Bucket Name Consistency**: Updated `server/supabase.ts` to use 'images' bucket (matching the upload endpoint)
2. **Created Setup Scripts**: Automated bucket creation and policy setup
3. **Provided Manual Instructions**: Step-by-step guide for manual setup

## Files Created/Modified

- ✅ Fixed: `server/supabase.ts` - Updated bucket name to 'images'
- ➕ Created: `scripts/fix-supabase-storage.js` - Diagnostic script
- ➕ Created: `scripts/setup-supabase-storage-complete.js` - Complete setup script
- ➕ Created: `scripts/create-storage-policies.sql` - SQL policies for manual setup
- ➕ Created: `SUPABASE_STORAGE_SETUP.md` - This guide

## Next Steps

1. Follow either Step 1 (automatic) or Step 2 (manual) above
2. Test your upload endpoint
3. Your image uploads should now work correctly!

If you still encounter issues, check the browser console and server logs for specific error messages.