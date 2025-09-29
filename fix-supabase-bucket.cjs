#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateBuckets() {
  console.log('🔍 Checking Supabase Storage setup...');

  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    console.log('📦 Current buckets:', buckets.map(b => b.name));

    // Check if 'images' bucket exists
    const imagesBucket = buckets.find(b => b.name === 'images');

    if (!imagesBucket) {
      console.log('📁 Creating "images" bucket...');

      const { data: newBucket, error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);

        // If we can't create bucket due to permissions, try to test upload to existing bucket
        console.log('🔄 Trying to test upload functionality...');
        await testUpload();
      } else {
        console.log('✅ "images" bucket created successfully!');
        await testUpload();
      }
    } else {
      console.log('✅ "images" bucket already exists');
      await testUpload();
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

async function testUpload() {
  console.log('🧪 Testing upload functionality...');

  const testFile = Buffer.from('test image data');
  const testFilename = `test-${Date.now()}.txt`;

  try {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(testFilename, testFile, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload test failed:', error);

      // Check if it's a bucket not found error
      if (error.message.includes('bucket')) {
        console.log('💡 The bucket might need to be created manually in Supabase Dashboard');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Go to Storage section');
        console.log('   4. Create a bucket named "images"');
        console.log('   5. Make it public and allow image uploads');
      }
    } else {
      console.log('✅ Upload test successful!');

      // Clean up test file
      await supabase.storage.from('images').remove([testFilename]);
      console.log('🧹 Test file cleaned up');
    }

  } catch (error) {
    console.error('💥 Upload test error:', error);
  }
}

// Run the check
checkAndCreateBuckets();