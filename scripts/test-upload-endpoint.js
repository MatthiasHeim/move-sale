#!/usr/bin/env node

/**
 * Test script for the upload endpoint
 * This script simulates a file upload to test if everything is working
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a test image buffer (1x1 pixel WebP)
const createTestImage = () => {
  return Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x20, 0x0e, 0x00, 0x00, 0x00, 0x30, 0x01, 0x00, 0x9d,
    0x01, 0x2a, 0x01, 0x00, 0x01, 0x00, 0x02, 0x00, 0x34, 0x25, 0xa4, 0x00,
    0x03, 0x70, 0x00, 0xfe, 0xfb, 0xfd, 0x50, 0x00
  ]);
};

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

const testUploadEndpoint = async () => {
  console.log('🧪 Testing Upload Endpoint...\n');

  // Load environment variables
  const env = await loadEnv();
  const apiToken = env.API_TOKEN;

  if (!apiToken) {
    console.error('❌ API_TOKEN not found in environment variables');
    console.log('   The upload endpoint requires authentication');
    console.log('   Add API_TOKEN to your .env file');
    return;
  }

  // Determine the upload URL
  const uploadUrl = process.env.NODE_ENV === 'production'
    ? 'https://your-vercel-deployment.vercel.app/api/upload'
    : 'http://localhost:5000/api/upload';

  console.log('📡 Upload URL:', uploadUrl);
  console.log('🔑 Using API Token:', apiToken.substring(0, 10) + '...');

  try {
    // Create test image
    const testImageBuffer = createTestImage();

    // Create FormData
    const FormData = (await import('form-data')).default;
    const form = new FormData();

    form.append('images', testImageBuffer, {
      filename: 'test-image.webp',
      contentType: 'image/webp'
    });

    // Make the request
    const fetch = (await import('node-fetch')).default;

    console.log('📤 Sending upload request...');

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        ...form.getHeaders()
      },
      body: form
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`❌ Upload failed: ${response.status} ${response.statusText}`);
      console.error('Response:', responseText);

      if (response.status === 401) {
        console.log('\n💡 Authentication issue:');
        console.log('   - Check that API_TOKEN is correct');
        console.log('   - Make sure the server is running');
      } else if (response.status === 500) {
        console.log('\n💡 Server error - likely Supabase storage issue:');
        console.log('   - Run the storage setup scripts first');
        console.log('   - Check server logs for detailed error');
      }

      return;
    }

    const result = JSON.parse(responseText);

    console.log('✅ Upload successful!');
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.image_urls && result.image_urls.length > 0) {
      console.log('\n🖼️  Uploaded image URLs:');
      result.image_urls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });

      console.log('\n✅ Upload endpoint is working correctly!');
      console.log('🎉 Your Supabase storage is properly configured.');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused:');
      console.log('   - Make sure your server is running (npm run dev)');
      console.log('   - Check the upload URL is correct');
    } else {
      console.log('\n💡 Possible causes:');
      console.log('   - Network connectivity issues');
      console.log('   - Server not running');
      console.log('   - Incorrect environment variables');
    }
  }
};

// Install required dependencies if not present
const checkDependencies = async () => {
  try {
    await import('form-data');
    await import('node-fetch');
    return true;
  } catch (error) {
    console.log('📦 Installing required dependencies...');
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
      const install = spawn('npm', ['install', 'form-data', 'node-fetch'], {
        stdio: 'inherit'
      });

      install.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Dependencies installed');
          resolve(true);
        } else {
          reject(new Error('Failed to install dependencies'));
        }
      });
    });
  }
};

const main = async () => {
  try {
    await checkDependencies();
    await testUploadEndpoint();
  } catch (error) {
    console.error('💥 Test script failed:', error.message);
    process.exit(1);
  }
};

main().catch(console.error);