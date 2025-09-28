# Supabase Storage Setup Instructions

## Issue
The upload endpoint is failing with a 500 error because the Supabase storage bucket "images" doesn't exist.

## Manual Setup Required

Follow these steps to create the storage bucket:

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Sign in to your account
- Select your project: `skyttkazfonfzhbgtbus`

### 2. Create Storage Bucket
- Navigate to **Storage** in the left sidebar
- Click **Create Bucket**
- Enter bucket name: `images`
- Make it **Public**: ✅ (checked)
- Set allowed MIME types: `image/webp`, `image/jpeg`, `image/png`
- Set file size limit: `10MB`
- Click **Create Bucket**

### 3. Configure RLS Policies
After creating the bucket, you need to set up Row Level Security policies:

#### Insert Policy (Allow Uploads)
- Go to **Storage** > **images** bucket > **Policies** tab
- Click **New Policy**
- Choose **For full customization**
- Policy name: `Allow uploads`
- Target roles: `public`
- WITH CHECK expression: `true`
- Click **Save**

#### Select Policy (Allow Public Access)
- Click **New Policy** again
- Choose **For full customization**
- Policy name: `Allow public access`
- Target roles: `public`
- USING expression: `true`
- Click **Save**

### 4. Verify Setup
Run the verification script to confirm everything works:
```bash
node scripts/verify-supabase-storage.js
```

## Current Status
- ❌ Storage bucket "images" does not exist
- ❌ Upload endpoint returns 500 error
- ✅ Verification script created to test setup

## After Setup
Once the bucket is created with proper policies, the upload endpoint should work correctly and images will be stored in Supabase Storage instead of local filesystem.