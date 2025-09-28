const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testImageUpload() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  try {
    console.log('🔍 Starting image upload test for www.seup.ch');

    // Step 1: Navigate to login page
    console.log('📝 Step 1: Navigating to login page...');
    await page.goto('https://www.seup.ch/admin/login');
    await page.waitForLoadState('networkidle');

    // Step 2: Login
    console.log('🔐 Step 2: Logging in...');
    await page.fill('input[type="password"]', '2l4se&HH43dom!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin', { timeout: 10000 });
    console.log('✅ Successfully logged in and redirected to admin dashboard');

    // Step 3: Navigate to Create Listing tab
    console.log('📋 Step 3: Accessing Create Listing tab...');
    await page.click('text=Neues Angebot');
    await page.waitForTimeout(2000);

    // Step 4: Create test images in memory for upload
    console.log('📷 Step 4: Preparing test images...');

    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xCC, 0x2E, 0x34, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const testImagePath = '/tmp/test-image.png';
    fs.writeFileSync(testImagePath, testImageBuffer);

    // Test 1: Upload PNG image
    console.log('🧪 Test 1: Testing PNG image upload...');
    const test1 = { name: 'PNG Image Upload', status: 'running', errors: [] };

    try {
      // Find file input and upload
      const fileInput = await page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(testImagePath);

      // Wait for upload to complete and check for errors
      await page.waitForTimeout(5000);

      // Check for error messages
      const errorElements = await page.locator('.text-red-500, .error, [role="alert"]').all();
      const errors = [];
      for (const errorEl of errorElements) {
        const text = await errorEl.textContent();
        if (text && text.trim()) {
          errors.push(text.trim());
        }
      }

      // Check network requests for 500 errors
      let networkErrors = [];
      page.on('response', response => {
        if (response.status() >= 500) {
          networkErrors.push(`${response.status()} error on ${response.url()}`);
        }
      });

      // Check if images are displayed
      const uploadedImages = await page.locator('img[src*="uploads/"], img[src*="blob:"]').count();

      if (errors.length === 0 && networkErrors.length === 0 && uploadedImages > 0) {
        test1.status = 'passed';
        console.log('✅ PNG upload test passed');
      } else {
        test1.status = 'failed';
        test1.errors = [...errors, ...networkErrors];
        if (uploadedImages === 0) test1.errors.push('No images displayed after upload');
        console.log('❌ PNG upload test failed:', test1.errors);
      }
    } catch (error) {
      test1.status = 'failed';
      test1.errors = [error.message];
      console.log('❌ PNG upload test failed with exception:', error.message);
    }

    results.tests.push(test1);
    results.summary.total++;
    if (test1.status === 'passed') results.summary.passed++;
    else results.summary.failed++;

    // Test 2: Check console errors
    console.log('🧪 Test 2: Checking for console errors...');
    const test2 = { name: 'Console Error Check', status: 'running', errors: [] };

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Trigger upload again to capture any console errors
    await page.reload();
    await page.waitForTimeout(2000);
    await page.click('text=Neues Angebot');
    await page.waitForTimeout(2000);

    const fileInput2 = await page.locator('input[type="file"]').first();
    await fileInput2.setInputFiles(testImagePath);
    await page.waitForTimeout(3000);

    if (consoleErrors.length === 0) {
      test2.status = 'passed';
      console.log('✅ No console errors detected');
    } else {
      test2.status = 'failed';
      test2.errors = consoleErrors;
      console.log('❌ Console errors detected:', consoleErrors);
    }

    results.tests.push(test2);
    results.summary.total++;
    if (test2.status === 'passed') results.summary.passed++;
    else results.summary.failed++;

    // Test 3: Check network tab for upload endpoint response
    console.log('🧪 Test 3: Testing upload endpoint response...');
    const test3 = { name: 'Upload Endpoint Response', status: 'running', errors: [] };

    let uploadResponse = null;
    let uploadError = null;

    page.on('response', response => {
      if (response.url().includes('/api/upload')) {
        uploadResponse = {
          status: response.status(),
          statusText: response.statusText(),
          url: response.url()
        };
      }
    });

    // Reload and test upload endpoint specifically
    await page.reload();
    await page.waitForTimeout(2000);
    await page.click('text=Neues Angebot');
    await page.waitForTimeout(2000);

    const fileInput3 = await page.locator('input[type="file"]').first();
    await fileInput3.setInputFiles(testImagePath);

    // Wait for upload response
    await page.waitForTimeout(5000);

    if (uploadResponse) {
      if (uploadResponse.status === 200) {
        test3.status = 'passed';
        console.log('✅ Upload endpoint responded successfully:', uploadResponse);
      } else {
        test3.status = 'failed';
        test3.errors = [`Upload endpoint returned ${uploadResponse.status}: ${uploadResponse.statusText}`];
        console.log('❌ Upload endpoint failed:', uploadResponse);
      }
    } else {
      test3.status = 'failed';
      test3.errors = ['No response received from upload endpoint'];
      console.log('❌ No upload endpoint response detected');
    }

    results.tests.push(test3);
    results.summary.total++;
    if (test3.status === 'passed') results.summary.passed++;
    else results.summary.failed++;

    // Cleanup
    fs.unlinkSync(testImagePath);

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    results.tests.push({
      name: 'Test Suite Execution',
      status: 'failed',
      errors: [error.message]
    });
    results.summary.total++;
    results.summary.failed++;
  } finally {
    await browser.close();
  }

  return results;
}

// Run the test
testImageUpload().then(results => {
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);

  console.log('\n📋 DETAILED RESULTS');
  console.log('===================');
  results.tests.forEach((test, index) => {
    const status = test.status === 'passed' ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${test.name}: ${status}`);
    if (test.errors && test.errors.length > 0) {
      test.errors.forEach(error => console.log(`   Error: ${error}`));
    }
  });

  // Save results to file
  fs.writeFileSync('/tmp/test-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Full results saved to /tmp/test-results.json');

}).catch(error => {
  console.error('Failed to run tests:', error);
  process.exit(1);
});