import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_URL = 'https://www.seup.ch/admin/login';
const ADMIN_PASSWORD = '2l4se&HH43dom!';

// Helper function to create test images
async function createTestImage(filename: string, format: 'jpeg' | 'png' = 'jpeg'): Promise<string> {
  const testImagesDir = path.join(__dirname, 'test-images');
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
  }

  const imagePath = path.join(testImagesDir, filename);

  if (format === 'jpeg') {
    // Minimal JPEG header (1x1 pixel black image)
    const jpegData = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x00, 0xFF, 0xD9
    ]);
    fs.writeFileSync(imagePath, jpegData);
  } else if (format === 'png') {
    // Minimal PNG (1x1 pixel transparent image)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0x6A, 0xCE, 0x9B, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(imagePath, pngData);
  }

  return imagePath;
}

test.describe('Upload Functionality Production Test', () => {
  test('Complete Upload Flow Test', async ({ page }) => {
    console.log('🚀 Starting comprehensive upload test for production site...');

    // Monitor network requests and errors
    const networkLogs: Array<{type: string, url: string, status?: number, error?: string}> = [];
    const consoleErrors: string[] = [];

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkLogs.push({ type: 'request', url: request.url() });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        networkLogs.push({ type: 'response', url: response.url(), status: response.status() });
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Step 1: Navigate to admin login
    console.log('📋 Step 1: Navigating to admin login...');
    await page.goto(ADMIN_URL);
    await page.screenshot({ path: 'test-results/step1-login-page.png', fullPage: true });

    // Step 2: Check for login form and perform login
    console.log('📋 Step 2: Performing admin login...');
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });

    await passwordInput.fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // Wait for navigation or error
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/step2-after-login.png', fullPage: true });

    // Step 3: Navigate to Create Listing tab (German: "Neues Angebot")
    console.log('📋 Step 3: Navigating to Create Listing tab...');
    const createListingTab = page.locator('text=Neues Angebot');

    try {
      await expect(createListingTab).toBeVisible({ timeout: 10000 });
      await createListingTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/step3-create-listing.png', fullPage: true });
      console.log('✅ Successfully navigated to Create Listing tab');
    } catch (error) {
      console.log('❌ Failed to find Create Listing tab (Neues Angebot)');
      await page.screenshot({ path: 'test-results/step3-error.png', fullPage: true });
      throw error;
    }

    // Step 4: Test image upload
    console.log('📋 Step 4: Testing image upload...');
    const testImagePath = await createTestImage('test-upload.jpg', 'jpeg');

    // Look for file input
    const fileInput = page.locator('input[type="file"]');

    try {
      await expect(fileInput).toBeVisible({ timeout: 5000 });
      console.log('✅ File input found');

      // Upload the image
      await fileInput.setInputFiles(testImagePath);
      console.log('✅ File selected for upload');

      // Wait for upload response
      const uploadResponse = await page.waitForResponse(
        response => response.url().includes('/api/upload'),
        { timeout: 15000 }
      );

      console.log(`📤 Upload response: ${uploadResponse.status()} ${uploadResponse.statusText()}`);

      if (uploadResponse.status() === 200) {
        console.log('✅ Upload successful');

        // Check for image preview
        await page.waitForTimeout(3000);
        const imagePreview = page.locator('img[src*="uploads"], img[src*="supabase"]');
        const previewCount = await imagePreview.count();
        console.log(`🖼️ Found ${previewCount} image preview(s)`);

        if (previewCount > 0) {
          console.log('✅ Image preview displayed correctly');
        } else {
          console.log('⚠️ No image preview found');
        }

      } else {
        console.log(`❌ Upload failed with status: ${uploadResponse.status()}`);
        const responseText = await uploadResponse.text();
        console.log(`Response body: ${responseText}`);
      }

      await page.screenshot({ path: 'test-results/step4-after-upload.png', fullPage: true });

    } catch (error) {
      console.log('❌ File input not found or upload failed');
      await page.screenshot({ path: 'test-results/step4-upload-error.png', fullPage: true });
      console.log('Error:', error);
    }

    // Step 5: Test AI generation (optional)
    console.log('📋 Step 5: Testing AI generation...');
    try {
      const aiButton = page.locator('button:has-text("Mit KI generieren"), button:has-text("KI-Vorschlag"), button:has-text("AI"), button:has-text("Generate")');
      const aiButtonCount = await aiButton.count();

      if (aiButtonCount > 0) {
        console.log('✅ AI button found');
        await aiButton.first().click();

        const aiResponse = await page.waitForResponse(
          response => response.url().includes('/api/agent/draft'),
          { timeout: 30000 }
        );

        console.log(`🤖 AI response: ${aiResponse.status()} ${aiResponse.statusText()}`);

        if (aiResponse.status() === 200) {
          console.log('✅ AI generation successful');
        } else {
          console.log(`❌ AI generation failed with status: ${aiResponse.status()}`);
          const responseText = await aiResponse.text();
          console.log(`AI response body: ${responseText}`);
        }
      } else {
        console.log('⚠️ AI button not found');
      }

      await page.screenshot({ path: 'test-results/step5-ai-test.png', fullPage: true });

    } catch (error) {
      console.log('⚠️ AI generation test failed or timed out');
      await page.screenshot({ path: 'test-results/step5-ai-error.png', fullPage: true });
    }

    // Final screenshot
    await page.screenshot({ path: 'test-results/final-state.png', fullPage: true });

    // Report results
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');

    console.log('\n🌐 Network Activity:');
    networkLogs.forEach(log => {
      console.log(`  ${log.type}: ${log.url} ${log.status ? `(${log.status})` : ''}`);
    });

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('\n✅ No console errors detected');
    }

    console.log('\n🔍 Screenshots saved:');
    console.log('  - step1-login-page.png');
    console.log('  - step2-after-login.png');
    console.log('  - step3-create-listing.png');
    console.log('  - step4-after-upload.png');
    console.log('  - step5-ai-test.png');
    console.log('  - final-state.png');

    // Cleanup test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });
});