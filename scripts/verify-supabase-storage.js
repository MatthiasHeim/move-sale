#!/usr/bin/env node

/**
 * Supabase Storage Verification Script
 *
 * This script verifies if the 'images' storage bucket exists and attempts to create it if missing.
 * It also checks RLS policies and provides guidance for manual setup if needed.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyStorageSetup() {
  console.log('🔍 Verifying Supabase storage setup...\n');

  try {
    // Check if images bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.error('❌ Error fetching buckets:', bucketError.message);
      return false;
    }

    console.log('📦 Available buckets:', buckets.map(b => b.name).join(', ') || 'none');

    const imagesBucket = buckets.find(bucket => bucket.name === 'images');

    if (!imagesBucket) {
      console.log('\n❌ "images" bucket not found!');

      // Try to create the bucket
      console.log('🔧 Attempting to create "images" bucket...');

      const { data: createData, error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });

      if (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        console.log('\n📋 Manual Setup Required:');
        console.log('1. Go to your Supabase Dashboard > Storage');
        console.log('2. Create a new bucket named "images"');
        console.log('3. Make it public');
        console.log('4. Set allowed MIME types: image/webp, image/jpeg, image/png');
        console.log('5. Set file size limit: 10MB');
        return false;
      } else {
        console.log('✅ Successfully created "images" bucket!');
      }
    } else {
      console.log('✅ "images" bucket exists');
      console.log(`   - Public: ${imagesBucket.public}`);
      console.log(`   - Created: ${imagesBucket.created_at}`);
    }

    // Test upload permissions
    console.log('\n🧪 Testing upload permissions...');

    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file to verify upload permissions.';

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(`test/${testFileName}`, testContent, {
        contentType: 'text/plain',
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);

      if (uploadError.message.includes('RLS')) {
        console.log('\n📋 RLS Policy Issue Detected:');
        console.log('1. Go to Supabase Dashboard > Storage > images bucket');
        console.log('2. Go to Policies tab');
        console.log('3. Create an INSERT policy:');
        console.log('   - Name: "Allow uploads"');
        console.log('   - Target roles: public');
        console.log('   - WITH CHECK expression: true');
        console.log('4. Create a SELECT policy:');
        console.log('   - Name: "Allow public access"');
        console.log('   - Target roles: public');
        console.log('   - USING expression: true');
      }

      return false;
    } else {
      console.log('✅ Upload test successful!');

      // Clean up test file
      await supabase.storage.from('images').remove([`test/${testFileName}`]);
      console.log('🧹 Test file cleaned up');
    }

    // Test public URL access
    console.log('\n🌐 Testing public URL generation...');

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl('test/sample.webp');

    console.log('✅ Public URL format:', urlData.publicUrl);

    console.log('\n🎉 Supabase storage setup verification complete!');
    console.log('Your upload endpoint should now work properly.');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

verifyStorageSetup().then(success => {
  process.exit(success ? 0 : 1);
});