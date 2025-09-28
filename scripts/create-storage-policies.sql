-- SQL script to create storage policies for image uploads
-- This script should be run in the Supabase SQL Editor

-- 1. Create the 'images' bucket if it doesn't exist
-- Note: This needs to be done with elevated permissions (service role key)

-- 2. Create policies for storage.objects table to allow public uploads and reads

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

-- Create policies for storage.buckets table if needed
CREATE POLICY "Allow public read access to images bucket info" ON storage.buckets
FOR SELECT
TO public
USING (id = 'images');

-- Note: The bucket creation might need to be done separately with a service role key
-- You can create the bucket manually in the Supabase dashboard:
-- 1. Go to Storage in the Supabase Dashboard
-- 2. Click "Create a new bucket"
-- 3. Name it "images"
-- 4. Make it public
-- 5. Set allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- 6. Set file size limit: 10485760 (10MB)