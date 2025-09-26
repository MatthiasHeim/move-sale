import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY are required');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket configuration
export const STORAGE_BUCKET = 'product-images';

/**
 * Upload an image buffer to Supabase Storage
 * @param filename - The filename to save as
 * @param fileBuffer - The image buffer
 * @param contentType - The MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadImageToSupabase(filename: string, fileBuffer: Buffer, contentType: string): Promise<string> {
  console.log(`📁 Uploading ${filename} to Supabase Storage...`);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, fileBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('❌ Supabase upload error:', error);
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filename);

  console.log(`✅ Image uploaded successfully to: ${publicUrl}`);
  return publicUrl;
}

/**
 * Delete an image from Supabase Storage
 * @param filename - The filename to delete
 */
export async function deleteImageFromSupabase(filename: string): Promise<void> {
  console.log(`🗑️ Deleting ${filename} from Supabase Storage...`);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filename]);

  if (error) {
    console.error('❌ Supabase delete error:', error);
    throw new Error(`Failed to delete from Supabase: ${error.message}`);
  }

  console.log(`✅ Image deleted successfully: ${filename}`);
}