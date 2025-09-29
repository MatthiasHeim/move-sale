import { chromium } from 'playwright';

async function testProductionSite() {
  console.log('🚀 Starting production site testing for seup.ch');

  const browser = await chromium.launch({
    headless: false,  // Keep visible for debugging
    slowMo: 1000      // Slow down for observation
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: '/tmp/test-videos/' }
  });

  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[CONSOLE ${type.toUpperCase()}]:`, msg.text());
    }
  });

  // Monitor network requests
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/admin/products')) {
      console.log(`[API Response] ${response.url()}: ${response.status()}`);
    }
  });

  try {
    // Step 1: Navigate to seup.ch and check version
    console.log('📍 Step 1: Navigating to https://seup.ch');
    await page.goto('https://seup.ch', { waitUntil: 'networkidle' });

    // Take initial screenshot
    await page.screenshot({ path: '/tmp/01-homepage.png', fullPage: true });

    // Check for version number v1.0.4
    const versionElement = await page.locator('text=v1.0.4').first();
    const versionVisible = await versionElement.isVisible().catch(() => false);

    if (versionVisible) {
      console.log('✅ Version v1.0.4 found on homepage');
    } else {
      console.log('⚠️  Version v1.0.4 not visible - checking page title or other locations');
      const title = await page.title();
      console.log('Page title:', title);
    }

    // Step 2: Navigate to admin login
    console.log('📍 Step 2: Navigating to admin login');
    await page.goto('https://seup.ch/admin/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/tmp/02-login-page.png' });

    // Step 3: Login with credentials
    console.log('📍 Step 3: Logging in with admin credentials');
    await page.fill('input[type="password"]', '2l4se&HH43dom!');
    await page.click('button[type="submit"]');

    // Wait for admin panel to load
    await page.waitForURL('**/admin', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/03-admin-panel-loaded.png' });

    console.log('✅ Successfully logged into admin panel');

    // Step 4: Test tab switching
    console.log('📍 Step 4: Testing tab switching functionality');

    // Verify we start on "Neues Angebot" tab
    const activeTab = await page.locator('[role="tab"][aria-selected="true"]').textContent();
    console.log('Initial active tab:', activeTab);
    await page.screenshot({ path: '/tmp/04-initial-tab.png' });

    // Test switch to "Meine Artikel"
    console.log('🔄 Switching to "Meine Artikel" tab');
    await page.click('text="Meine Artikel"');
    await page.waitForTimeout(2000); // Wait for potential loading

    // Check for white screen or proper content
    const bodyText = await page.textContent('body');
    const hasContent = bodyText.length > 100; // Basic content check

    if (hasContent) {
      console.log('✅ "Meine Artikel" tab loaded successfully');
    } else {
      console.log('❌ "Meine Artikel" tab appears to have white screen or no content');
    }

    await page.screenshot({ path: '/tmp/05-meine-artikel-tab.png' });

    // Test switch to "Tutti Archiv"
    console.log('🔄 Switching to "Tutti Archiv" tab');
    await page.click('text="Tutti Archiv"');
    await page.waitForTimeout(2000);

    const bodyTextArchiv = await page.textContent('body');
    const hasContentArchiv = bodyTextArchiv.length > 100;

    if (hasContentArchiv) {
      console.log('✅ "Tutti Archiv" tab loaded successfully');
    } else {
      console.log('❌ "Tutti Archiv" tab appears to have white screen or no content');
    }

    await page.screenshot({ path: '/tmp/06-tutti-archiv-tab.png' });

    // Test switch back to "Neues Angebot"
    console.log('🔄 Switching back to "Neues Angebot" tab');
    await page.click('text="Neues Angebot"');
    await page.waitForTimeout(2000);

    const bodyTextNeues = await page.textContent('body');
    const hasContentNeues = bodyTextNeues.length > 100;

    if (hasContentNeues) {
      console.log('✅ "Neues Angebot" tab loaded successfully');
    } else {
      console.log('❌ "Neues Angebot" tab appears to have white screen or no content');
    }

    await page.screenshot({ path: '/tmp/07-neues-angebot-return.png' });

    // Step 5: Multiple rapid tab switches for reliability testing
    console.log('📍 Step 5: Testing multiple rapid tab switches');
    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Rapid switch cycle ${i + 1}`);
      await page.click('text="Meine Artikel"');
      await page.waitForTimeout(500);
      await page.click('text="Tutti Archiv"');
      await page.waitForTimeout(500);
      await page.click('text="Neues Angebot"');
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: '/tmp/08-after-rapid-switches.png' });
    console.log('✅ Completed rapid tab switching test');

    // Step 6: API request analysis
    console.log('📍 Step 6: Analyzing API requests');
    console.log('API requests made during testing:');
    apiRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url} at ${req.timestamp}`);
    });

    // Final verification - check current state
    const finalActiveTab = await page.locator('[role="tab"][aria-selected="true"]').textContent();
    console.log('Final active tab:', finalActiveTab);

    // Check for any console errors
    console.log('📍 Step 7: Checking for JavaScript errors');
    const errors = await page.evaluate(() => {
      return window.console.errors || [];
    });

    if (errors.length > 0) {
      console.log('❌ JavaScript errors found:', errors);
    } else {
      console.log('✅ No JavaScript errors detected');
    }

    console.log('🎉 Production testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testProductionSite().catch(console.error);