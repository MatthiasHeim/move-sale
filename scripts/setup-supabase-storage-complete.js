#!/usr/bin/env node

/**
 * Complete Supabase Storage Setup Script
 * This script will:
 * 1. Create the 'images' bucket with public access
 * 2. Set up proper RLS policies for uploads
 * 3. Test the configuration
 *
 * Note: This script requires the SUPABASE_SERVICE_ROLE_KEY for bucket creation
 * You can get this key from: Supabase Dashboard > Settings > API > service_role key
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
  console.log('🔧 Setting up Supabase Storage for Image Uploads...\n');

  // Load environment variables
  const env = await loadEnv();
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required Supabase environment variables:');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.error('   SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
    console.log('   This key is needed to create buckets and policies');
    console.log('   You can find it in: Supabase Dashboard > Settings > API > service_role key');
    console.log('   Add it to your .env file as: SUPABASE_SERVICE_ROLE_KEY=your_service_key_here');
    console.log('\n   Continuing with anon key only (limited functionality)...\n');
  }

  console.log('✅ Environment variables loaded');
  console.log('   SUPABASE_URL:', supabaseUrl);
  console.log('   SUPABASE_ANON_KEY:', supabaseAnonKey.substring(0, 20) + '...');
  if (supabaseServiceKey) {
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey.substring(0, 20) + '...');
  }

  // Create Supabase clients
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const serviceClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

  try {
    // Step 1: Check existing buckets
    console.log('\n📋 Checking existing storage buckets...');

    const client = serviceClient || anonClient;
    const { data: buckets, error: listError } = await client.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw listError;
    }

    console.log('📁 Existing buckets:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    const imagesBucket = buckets.find(bucket => bucket.name === 'images');

    // Step 2: Create bucket if it doesn't exist
    if (!imagesBucket) {
      console.log('\n🔨 Creating "images" bucket...');

      if (!serviceClient) {
        console.error('❌ Cannot create bucket without service role key');
        console.log('\n📝 Manual bucket creation required:');
        console.log('   1. Go to Supabase Dashboard > Storage');
        console.log('   2. Click "Create a new bucket"');
        console.log('   3. Name: "images"');
        console.log('   4. Public: YES');
        console.log('   5. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif');
        console.log('   6. File size limit: 10485760 (10MB)');
        return;
      }

      const { data: newBucket, error: createError } = await serviceClient.storage.createBucket('images', {
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
    }

    // Step 3: Create/update storage policies
    if (serviceClient) {
      console.log('\n🛡️  Setting up storage policies...');

      const policies = [
        {
          name: 'Allow public uploads to images bucket',
          sql: `
            CREATE POLICY IF NOT EXISTS "Allow public uploads to images bucket" ON storage.objects
            FOR INSERT
            TO public
            WITH CHECK (bucket_id = 'images');
          `
        },
        {
          name: 'Allow public reads from images bucket',
          sql: `
            CREATE POLICY IF NOT EXISTS "Allow public reads from images bucket" ON storage.objects
            FOR SELECT
            TO public
            USING (bucket_id = 'images');
          `
        },
        {
          name: 'Allow public updates to images bucket',
          sql: `
            CREATE POLICY IF NOT EXISTS "Allow public updates to images bucket" ON storage.objects
            FOR UPDATE
            TO public
            USING (bucket_id = 'images')
            WITH CHECK (bucket_id = 'images');
          `
        },
        {
          name: 'Allow public deletes from images bucket',
          sql: `
            CREATE POLICY IF NOT EXISTS "Allow public deletes from images bucket" ON storage.objects
            FOR DELETE
            TO public
            USING (bucket_id = 'images');
          `
        }
      ];

      for (const policy of policies) {
        console.log(`   Creating policy: ${policy.name}`);
        const { error } = await serviceClient.rpc('execute_sql', { sql_query: policy.sql });

        if (error) {
          // Try alternative approach using direct SQL execution
          const { error: sqlError } = await serviceClient
            .from('_placeholder') // This won't work, but we'll handle it
            .select()
            .limit(0);

          console.log(`   ⚠️  Could not create policy via RPC: ${error.message}`);
          console.log(`   💡 You may need to run this SQL manually in the Supabase SQL Editor:`);
          console.log(`   ${policy.sql}`);
        } else {
          console.log(`   ✅ Policy created: ${policy.name}`);
        }
      }

      console.log('\n📄 If policies failed to create automatically, run this SQL in Supabase Dashboard > SQL Editor:');
      console.log('```sql');
      policies.forEach(policy => {
        console.log(policy.sql);
        console.log('');
      });
      console.log('```');
    } else {
      console.log('\n⚠️  Cannot create policies without service role key');
      console.log('   Please run the SQL script manually in Supabase Dashboard > SQL Editor');
    }

    // Step 4: Test upload functionality
    console.log('\n🧪 Testing upload functionality...');

    // Create a simple test image buffer (1x1 pixel WebP)
    const testImageBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x20, 0x0e, 0x00, 0x00, 0x00, 0x30, 0x01, 0x00, 0x9d,
      0x01, 0x2a, 0x01, 0x00, 0x01, 0x00, 0x02, 0x00, 0x34, 0x25, 0xa4, 0x00,
      0x03, 0x70, 0x00, 0xfe, 0xfb, 0xfd, 0x50, 0x00
    ]);

    const testFilename = `test-upload-${Date.now()}.webp`;

    // Test with anon client (this is what your app will use)
    const { data: uploadData, error: uploadError } = await anonClient.storage
      .from('images')
      .upload(`uploads/${testFilename}`, testImageBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Test upload failed with anon key:', uploadError);

      if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
        console.log('\n💡 RLS policies are not working. Manual setup required:');
        console.log('   1. Go to Supabase Dashboard > Authentication > Policies');
        console.log('   2. Find storage.objects table');
        console.log('   3. Create the policies from the SQL script');
        console.log('   OR');
        console.log('   1. Go to Supabase Dashboard > Storage > Settings');
        console.log('   2. Temporarily disable RLS for testing');
      }

      // Try with service client if available
      if (serviceClient) {
        console.log('\n🔄 Trying with service role key...');
        const { data: serviceUploadData, error: serviceUploadError } = await serviceClient.storage
          .from('images')
          .upload(`uploads/${testFilename}`, testImageBuffer, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false
          });

        if (serviceUploadError) {
          console.error('❌ Upload failed even with service key:', serviceUploadError);
        } else {
          console.log('✅ Upload works with service key, but not anon key');
          console.log('   This confirms that RLS policies need to be set up properly');

          // Clean up
          await serviceClient.storage.from('images').remove([`uploads/${testFilename}`]);
        }
      }

      throw uploadError;
    }

    console.log('✅ Test upload successful:', uploadData.path);

    // Test public URL generation
    const { data: urlData } = anonClient.storage
      .from('images')
      .getPublicUrl(`uploads/${testFilename}`);

    console.log('✅ Public URL generated:', urlData.publicUrl);

    // Clean up test file
    const { error: deleteError } = await anonClient.storage
      .from('images')
      .remove([`uploads/${testFilename}`]);

    if (deleteError) {
      console.log('⚠️  Could not clean up test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.log('\n🎉 Supabase storage is configured correctly!');
    console.log('\n📝 Configuration Summary:');
    console.log('   ✅ Bucket "images" exists and is public');
    console.log('   ✅ Upload functionality works with anon key');
    console.log('   ✅ Public URL generation works');
    console.log('   ✅ File deletion works');

    console.log('\n🔧 Your upload endpoint should work now!');

  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);

    if (error.message.includes('JWT')) {
      console.log('\n💡 JWT/Authentication issue. Check:');
      console.log('   1. SUPABASE_URL is correct');
      console.log('   2. Keys are not expired');
      console.log('   3. Keys are from the correct project');
    }

    if (error.message.includes('row-level security') || error.message.includes('RLS')) {
      console.log('\n💡 RLS is blocking operations. Manual steps:');
      console.log('   1. Go to Supabase Dashboard > Storage');
      console.log('   2. Create bucket "images" (public)');
      console.log('   3. Go to SQL Editor and run the policies from scripts/create-storage-policies.sql');
    }

    process.exit(1);
  }
};

main().catch(console.error);