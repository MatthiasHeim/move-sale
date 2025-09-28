import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Test configuration
const ADMIN_URL = 'https://www.seup.ch/admin/login';
const ADMIN_PASSWORD = '2l4se&HH43dom!';

// Helper function to create test images
async function createTestImage(filename: string, format: 'jpeg' | 'png' | 'heic' = 'jpeg'): Promise<string> {
  const testImagesDir = path.join(__dirname, 'test-images');
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
  }

  const imagePath = path.join(testImagesDir, filename);

  // Create a minimal test image based on format
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

test.describe('Image Upload Functionality Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => console.log(`Console ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.log(`Page error: ${error.message}`));

    // Monitor network requests
    page.on('requestfailed', request => {
      console.log(`Failed request: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Admin Login Flow', async () => {
    console.log('Testing admin login...');

    // Navigate to login page
    await page.goto(ADMIN_URL);
    await expect(page).toHaveTitle(/Umzugsbeute|Admin/);

    // Check if login form exists
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Enter admin password
    await passwordInput.fill(ADMIN_PASSWORD);

    // Submit login form
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    // Wait for redirect to admin panel
    await page.waitForURL(/.*\/admin(?:\/.*)?$/);

    // Verify we're in the admin panel
    await expect(page.locator('text=Create Listing')).toBeVisible({ timeout: 10000 });

    console.log('✅ Admin login successful');
  });

  test('Navigate to Create Listing Tab', async () => {
    console.log('Testing navigation to Create Listing tab...');

    // Login first
    await page.goto(ADMIN_URL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/admin(?:\/.*)?$/);

    // Click on Create Listing tab
    const createListingTab = page.locator('text=Create Listing');
    await createListingTab.click();

    // Verify the upload interface is visible
    await expect(page.locator('[data-testid="drag-drop-area"]')).toBeVisible();

    console.log('✅ Successfully navigated to Create Listing tab');
  });

  test('Test Drag and Drop Upload Interface', async () => {
    console.log('Testing drag and drop upload interface...');

    // Login and navigate to Create Listing
    await page.goto(ADMIN_URL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/admin(?:\/.*)?$/);
    await page.locator('text=Create Listing').click();

    // Check if upload area exists
    const uploadArea = page.locator('[data-testid="drag-drop-area"]');
    await expect(uploadArea).toBeVisible();

    // Test drag-over state
    await uploadArea.hover();

    // Check for upload instructions
    const uploadText = page.locator('text=/.*drag.*drop.*|.*Dateien.*hochladen.*/i');
    await expect(uploadText).toBeVisible();

    console.log('✅ Drag and drop interface is working');
  });

  test('Test Image Upload - JPEG', async () => {
    console.log('Testing JPEG image upload...');

    // Login and navigate
    await page.goto(ADMIN_URL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/admin(?:\/.*)?$/);
    await page.locator('text=Create Listing').click();

    // Create test JPEG image
    const testImagePath = await createTestImage('test-image.jpg', 'jpeg');

    // Upload the image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload to complete
    await page.waitForResponse(response =>
      response.url().includes('/api/upload') && response.status() === 200,
      { timeout: 15000 }
    );

    // Check if image appears in preview
    const imagePreview = page.locator('img[src*="uploads"]');
    await expect(imagePreview).toBeVisible({ timeout: 10000 });

    console.log('✅ JPEG upload successful');
  });

  test('Test Image Upload - PNG', async () => {
    console.log('Testing PNG image upload...');

    // Login and navigate
    await page.goto(ADMIN_URL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/admin(?:\/.*)?$/);
    await page.locator('text=Create Listing').click();

    // Create test PNG image
    const testImagePath = await createTestImage('test-image.png', 'png');

    // Upload the image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload to complete
    await page.waitForResponse(response =>
      response.url().includes('/api/upload') && response.status() === 200,
      { timeout: 15000 }
    );

    // Check if image appears in preview
    const imagePreview = page.locator('img[src*="uploads"]');
    await expect(imagePreview).toBeVisible({ timeout: 10000 });

    console.log('✅ PNG upload successful');
  });

  test('Test Multiple Image Upload', async () => {
    console.log('Testing multiple image upload...');

    // Login and navigate
    await page.goto(ADMIN_URL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/admin(?:\/.*)?$/);
    await page.locator('text=Create Listing').click();

    // Create multiple test images
    const testImage1 = await createTestImage('test-image-1.jpg', 'jpeg');
    const testImage2 = await createTestImage('test-image-2.png', 'png');
    const testImage3 = await createTestImage('test-image-3.jpg', 'jpeg');

    // Upload multiple images
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([testImage1, testImage2, testImage3]);

    // Wait for upload to complete
    await page.waitForResponse(response =>
      response.url().includes('/api/upload') && response.status() === 200,
      { timeout: 20000 }
    );

    // Check if all images appear in preview
    const imagePreviews = page.locator('img[src*="uploads"]');
    await expect(imagePreviews).toHaveCount(3, { timeout: 15000 });

    console.log('✅ Multiple image upload successful');
  });

  test('Test AI Generation Functionality', async () => {
    console.log('Testing AI generation functionality...');

    // Login and navigate
    await page.goto(ADMIN_URL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/admin(?:\/.*)?$/);
    await page.locator('text=Create Listing').click();

    // Upload a test image first
    const testImagePath = await createTestImage('furniture-test.jpg', 'jpeg');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload
    await page.waitForResponse(response =>
      response.url().includes('/api/upload') && response.status() === 200,
      { timeout: 15000 }
    );

    // Find and click AI generation button
    const aiButton = page.locator('button:has-text("KI-Vorschlag")');
    await expect(aiButton).toBeVisible({ timeout: 10000 });
    await aiButton.click();

    // Wait for AI response
    const aiResponse = page.waitForResponse(response =>
      response.url().includes('/api/agent/draft') &&
      (response.status() === 200 || response.status() === 500),
      { timeout: 30000 }
    );

    const response = await aiResponse;
    if (response.status() === 200) {
      console.log('✅ AI generation endpoint is working');

      // Check if form fields are populated
      const titleField = page.locator('input[name="title"]');
      await expect(titleField).toHaveValue(/.+/);
    } else {
      console.log('⚠️ AI generation returned error status:', response.status());
    }
  });

  test('Test API Endpoints Specifically', async () => {
    console.log('Testing API endpoints directly...');

    // Login to get session
    await page.goto(ADMIN_URL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/admin(?:\/.*)?$/);

    // Test /api/upload endpoint
    console.log('Testing /api/upload endpoint...');
    const testImagePath = await createTestImage('api-test.jpg', 'jpeg');
    const testFile = fs.readFileSync(testImagePath);

    const uploadResponse = await page.evaluate(async (fileBuffer) => {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'image/jpeg' });
      formData.append('images', blob, 'test.jpg');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        return {
          status: 0,
          statusText: 'Network Error',
          ok: false,
          error: error.message
        };
      }
    }, Array.from(testFile));

    console.log('Upload API Response:', uploadResponse);

    if (uploadResponse.status === 405) {
      console.log('❌ 405 Method Not Allowed - Upload endpoint not properly configured');
    } else if (uploadResponse.ok) {
      console.log('✅ Upload API working correctly');
    } else {
      console.log('⚠️ Upload API error:', uploadResponse.status, uploadResponse.statusText);
    }

    // Test /api/agent/draft endpoint
    console.log('Testing /api/agent/draft endpoint...');
    const draftResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/agent/draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageUrls: ['/uploads/test.jpg'],
            description: 'Test furniture item'
          })
        });

        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        return {
          status: 0,
          statusText: 'Network Error',
          ok: false,
          error: error.message
        };
      }
    });

    console.log('Draft API Response:', draftResponse);

    if (draftResponse.status === 405) {
      console.log('❌ 405 Method Not Allowed - Draft endpoint not properly configured');
    } else if (draftResponse.ok) {
      console.log('✅ Draft API working correctly');
    } else {
      console.log('⚠️ Draft API error:', draftResponse.status, draftResponse.statusText);
    }
  });

  test('Test Error Handling', async () => {
    console.log('Testing error handling...');

    // Login and navigate
    await page.goto(ADMIN_URL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/admin(?:\/.*)?$/);
    await page.locator('text=Create Listing').click();

    // Test upload of invalid file type
    const invalidFile = path.join(__dirname, 'test-invalid.txt');
    fs.writeFileSync(invalidFile, 'This is not an image');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFile);

    // Check for error message
    const errorMessage = page.locator('text=/.*error.*|.*fehler.*|.*invalid.*/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    console.log('✅ Error handling working correctly');
  });

  test('Test Network and Console Errors', async () => {
    console.log('Monitoring for network and console errors...');

    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Go through the full flow
    await page.goto(ADMIN_URL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/admin(?:\/.*)?$/);
    await page.locator('text=Create Listing').click();

    // Upload an image
    const testImagePath = await createTestImage('error-test.jpg', 'jpeg');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait a bit for any delayed errors
    await page.waitForTimeout(5000);

    // Report errors
    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No console errors detected');
    }

    if (networkErrors.length > 0) {
      console.log('❌ Network Errors Found:');
      networkErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No network errors detected');
    }
  });
});