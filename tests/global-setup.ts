import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Setting up tests for seup.ch image upload functionality...');

  // You can add any global setup here, such as:
  // - Checking if the site is reachable
  // - Creating test data directories
  // - Setting up authentication tokens

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Quick connectivity check
    await page.goto('https://www.seup.ch', { timeout: 30000 });
    console.log('✅ Site is reachable');
  } catch (error) {
    console.log('❌ Site connectivity issue:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;