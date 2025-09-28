#!/usr/bin/env node

/**
 * Script to check and fix Supabase storage bucket configuration
 * This script will:
 * 1. Check if the 'images' bucket exists
 * 2. Create it if it doesn't exist
 * 3. Set proper public access permissions
 * 4. Test upload functionality
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const loadEnv = async () => {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = await fs.readFile(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        envVars[key.trim()] = value.trim();
      }
    });

    return envVars;
  } catch (error) {
    console.log('No .env file found, using process.env');
    return process.env;
  }
};

const main = async () => {
  console.log('🔧 Fixing Supabase Storage Configuration...\n');

  // Load environment variables
  const env = await loadEnv();
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables:');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.error('   SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log('   SUPABASE_URL:', supabaseUrl);
  console.log('   SUPABASE_ANON_KEY:', supabaseKey.substring(0, 20) + '...');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if 'images' bucket exists
  console.log('\n📋 Checking storage buckets...');

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw listError;
    }

    console.log('📁 Existing buckets:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    const imagesBucket = buckets.find(bucket => bucket.name === 'images');

    if (!imagesBucket) {
      console.log('\n🔨 Creating "images" bucket...');

      const { data: newBucket, error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        throw createError;
      }

      console.log('✅ "images" bucket created successfully');
    } else {
      console.log('✅ "images" bucket already exists');

      if (!imagesBucket.public) {
        console.log('⚠️  Bucket is not public, this might cause issues with public access');
      }
    }

    // Test upload functionality
    console.log('\n🧪 Testing upload functionality...');

    // Create a simple test image buffer (1x1 pixel WebP)
    const testImageBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x20, 0x0e, 0x00, 0x00, 0x00, 0x30, 0x01, 0x00, 0x9d,
      0x01, 0x2a, 0x01, 0x00, 0x01, 0x00, 0x02, 0x00, 0x34, 0x25, 0xa4, 0x00,
      0x03, 0x70, 0x00, 0xfe, 0xfb, 0xfd, 0x50, 0x00
    ]);

    const testFilename = `test-upload-${Date.now()}.webp`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(`uploads/${testFilename}`, testImageBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
      console.log('\n🔍 Possible causes:');
      console.log('   1. Bucket permissions are not configured correctly');
      console.log('   2. The anon key does not have sufficient permissions');
      console.log('   3. Row Level Security (RLS) is blocking the upload');

      // Check if it's a permissions issue
      if (uploadError.message.includes('new row violates row-level security')) {
        console.log('\n💡 Solution: Disable RLS or create proper policies for the storage.objects table');
      }

      throw uploadError;
    }

    console.log('✅ Test upload successful:', uploadData.path);

    // Test public URL generation
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(`uploads/${testFilename}`);

    console.log('✅ Public URL generated:', urlData.publicUrl);

    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('images')
      .remove([`uploads/${testFilename}`]);

    if (deleteError) {
      console.log('⚠️  Could not clean up test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.log('\n🎉 Supabase storage configuration is working correctly!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure your upload endpoint uses the "images" bucket');
    console.log('   2. Verify that your application has the correct SUPABASE_URL and SUPABASE_ANON_KEY');
    console.log('   3. Test your actual upload endpoint');

  } catch (error) {
    console.error('\n💥 Configuration check failed:', error.message);

    if (error.message.includes('JWT')) {
      console.log('\n💡 This might be a JWT/authentication issue. Possible solutions:');
      console.log('   1. Check that SUPABASE_ANON_KEY is the anon (public) key, not the service role key');
      console.log('   2. Verify the key is not expired');
      console.log('   3. Make sure the project URL is correct');
    }

    if (error.message.includes('row-level security') || error.message.includes('RLS')) {
      console.log('\n💡 Row Level Security (RLS) is blocking uploads. Solutions:');
      console.log('   1. Go to Supabase Dashboard > Storage > Settings');
      console.log('   2. Disable RLS for the storage.objects table');
      console.log('   3. Or create a policy that allows public uploads to the "images" bucket');
    }

    process.exit(1);
  }
};

main().catch(console.error);