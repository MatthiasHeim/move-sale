import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testArticleCreationFlow() {
    console.log('🚀 Starting comprehensive article creation flow test...\n');

    // Create screenshots directory
    const screenshotDir = path.join(__dirname, 'test-screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir);
    }

    const browser = await chromium.launch({
        headless: false,  // Run in visible mode to see what's happening
        slowMo: 500       // Add delay between actions for better visibility
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    // Enable console logging and network monitoring
    const page = await context.newPage();
    const networkErrors = [];
    const consoleMessages = [];
    const apiRequests = [];

    // Monitor console messages
    page.on('console', msg => {
        const message = `[${msg.type()}] ${msg.text()}`;
        consoleMessages.push(message);
        console.log('Console:', message);
    });

    // Monitor network requests and errors
    page.on('response', response => {
        const url = response.url();
        const status = response.status();

        // Track API requests
        if (url.includes('/api/')) {
            apiRequests.push({
                url,
                status,
                method: response.request().method(),
                timestamp: new Date().toISOString()
            });
            console.log(`API ${response.request().method()} ${url} - ${status}`);
        }

        // Track network errors
        if (status >= 400) {
            networkErrors.push({
                url,
                status,
                method: response.request().method(),
                timestamp: new Date().toISOString()
            });
            console.log(`❌ Network Error: ${response.request().method()} ${url} - ${status}`);
        }
    });

    // Monitor JavaScript errors
    page.on('pageerror', error => {
        console.log('❌ JavaScript Error:', error.message);
        consoleMessages.push(`[ERROR] ${error.message}`);
    });

    try {
        // Step 1: Navigate to login page
        console.log('📍 Step 1: Navigating to login page...');
        await page.goto('http://localhost:5000/admin/login');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png') });

        // Step 2: Login with admin credentials
        console.log('📍 Step 2: Logging in with admin credentials...');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, '02-admin-dashboard.png') });

        // Step 3: Navigate to "Neues Angebot" tab
        console.log('📍 Step 3: Navigating to "Neues Angebot" tab...');
        await page.click('text=Neues Angebot');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotDir, '03-neues-angebot-tab.png') });

        // Step 4: Upload test image
        console.log('📍 Step 4: Uploading test image...');
        const testImagePath = path.join(__dirname, 'test-image.png');

        // Find and interact with file input
        const fileInput = await page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
            await fileInput.setInputFiles(testImagePath);
            console.log('✅ File input found and image uploaded');
        } else {
            // Try drag-and-drop area
            const dropZone = await page.locator('[data-testid="drop-zone"], .drop-zone, .upload-area');
            if (await dropZone.count() > 0) {
                console.log('🎯 Found drop zone, simulating file drop...');
                await dropZone.setInputFiles(testImagePath);
            } else {
                console.log('❌ No file input or drop zone found');
            }
        }

        await page.waitForTimeout(2000); // Wait for image processing
        await page.screenshot({ path: path.join(screenshotDir, '04-image-uploaded.png') });

        // Step 5: Generate AI proposal
        console.log('📍 Step 5: Generating AI proposal...');
        const generateButton = await page.locator('text=AI-Vorschlag generieren, button:has-text("Generieren"), button:has-text("AI"), [data-testid="generate-proposal"]');

        if (await generateButton.count() > 0) {
            await generateButton.first().click();
            console.log('✅ AI proposal generation triggered');

            // Wait for AI response (this might take a while)
            await page.waitForTimeout(10000);
            await page.screenshot({ path: path.join(screenshotDir, '05-ai-proposal-generated.png') });
        } else {
            console.log('❌ AI proposal generation button not found');
        }

        // Step 6: Fill in any missing required fields
        console.log('📍 Step 6: Checking and filling required fields...');

        // Check for title field
        const titleField = await page.locator('input[name="title"], input[placeholder*="Titel"], [data-testid="product-title"]');
        if (await titleField.count() > 0 && await titleField.inputValue() === '') {
            await titleField.fill('Test Möbel - Playwright Test');
            console.log('✅ Title filled');
        }

        // Check for price field
        const priceField = await page.locator('input[name="price"], input[type="number"], [data-testid="product-price"]');
        if (await priceField.count() > 0 && await priceField.inputValue() === '') {
            await priceField.fill('50');
            console.log('✅ Price filled');
        }

        // Check for category selection
        const categorySelect = await page.locator('select[name="category"], [data-testid="category-select"]');
        if (await categorySelect.count() > 0) {
            await categorySelect.selectOption('furniture');
            console.log('✅ Category selected');
        }

        await page.screenshot({ path: path.join(screenshotDir, '06-fields-filled.png') });

        // Step 7: Publish the article
        console.log('📍 Step 7: Publishing the article...');
        const publishButton = await page.locator('text=Artikel veröffentlichen, button:has-text("Veröffentlichen"), button:has-text("Erstellen"), [data-testid="publish-button"]');

        if (await publishButton.count() > 0) {
            console.log('🎯 Found publish button, clicking...');

            // Monitor network requests during publishing
            const publishStartTime = Date.now();
            await publishButton.first().click();

            // Wait for potential success/error messages
            await page.waitForTimeout(3000);

            // Look for success/error indicators
            const successMessage = await page.locator('text=erfolgreich, text=erstellt, text=veröffentlicht, [data-testid="success-message"]');
            const errorMessage = await page.locator('text=Fehler, text=Error, [data-testid="error-message"]');

            if (await successMessage.count() > 0) {
                console.log('✅ Success message detected');
            } else if (await errorMessage.count() > 0) {
                console.log('❌ Error message detected');
            } else {
                console.log('⚠️  No clear success/error message found');
            }

            await page.screenshot({ path: path.join(screenshotDir, '07-article-published.png') });
        } else {
            console.log('❌ Publish button not found');
            await page.screenshot({ path: path.join(screenshotDir, '07-no-publish-button.png') });
        }

        // Step 8: Check "Meine Artikel" tab
        console.log('📍 Step 8: Checking "Meine Artikel" tab...');
        await page.click('text=Meine Artikel');
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');

        // Count articles in the list
        const articles = await page.locator('[data-testid="product-item"], .product-card, .article-item');
        const articleCount = await articles.count();
        console.log(`📊 Found ${articleCount} articles in "Meine Artikel"`);

        await page.screenshot({ path: path.join(screenshotDir, '08-meine-artikel-tab.png') });

        // Step 9: Check for our test article
        const testArticle = await page.locator('text=Test Möbel, text=Playwright Test');
        const testArticleFound = await testArticle.count() > 0;
        console.log(`🔍 Test article found: ${testArticleFound ? '✅ YES' : '❌ NO'}`);

        // Step 10: Check database directly via API
        console.log('📍 Step 10: Checking database via API...');
        const response = await page.request.get('http://localhost:5000/api/admin/products');
        const products = await response.json();
        console.log(`📊 API returned ${products.length} products from database`);

        // Final screenshot
        await page.screenshot({ path: path.join(screenshotDir, '09-final-state.png') });

    } catch (error) {
        console.error('❌ Test execution error:', error);
        await page.screenshot({ path: path.join(screenshotDir, 'error-state.png') });
    } finally {
        // Generate comprehensive report
        console.log('\n📋 COMPREHENSIVE TEST REPORT');
        console.log('=====================================');

        console.log('\n🌐 Network Requests:');
        apiRequests.forEach(req => {
            console.log(`  ${req.method} ${req.url} - ${req.status} (${req.timestamp})`);
        });

        console.log('\n❌ Network Errors:');
        if (networkErrors.length === 0) {
            console.log('  ✅ No network errors detected');
        } else {
            networkErrors.forEach(err => {
                console.log(`  ${err.method} ${err.url} - ${err.status} (${err.timestamp})`);
            });
        }

        console.log('\n💬 Console Messages:');
        const errorMessages = consoleMessages.filter(msg => msg.includes('[ERROR]') || msg.includes('error') || msg.includes('Error'));
        if (errorMessages.length === 0) {
            console.log('  ✅ No JavaScript errors detected');
        } else {
            errorMessages.forEach(msg => console.log(`  ${msg}`));
        }

        console.log('\n📸 Screenshots saved in:', screenshotDir);

        await browser.close();
    }
}

// Run the test
testArticleCreationFlow().catch(console.error);