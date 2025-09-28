import { test, expect } from '@playwright/test';

const ADMIN_URL = 'https://www.seup.ch/admin/login';
const ADMIN_PASSWORD = '2l4se&HH43dom!';

test('Quick Site Check', async ({ page }) => {
  console.log('Checking site accessibility...');

  // Navigate to the main site
  await page.goto('https://www.seup.ch');

  // Check if the page loads
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());

  // Take a screenshot
  await page.screenshot({ path: 'test-results/main-page.png', fullPage: true });

  // Navigate to admin login
  await page.goto(ADMIN_URL);
  console.log('Admin page title:', await page.title());
  console.log('Admin page URL:', page.url());

  // Take admin page screenshot
  await page.screenshot({ path: 'test-results/admin-login.png', fullPage: true });

  // Check if there's a password input
  const passwordInput = page.locator('input[type="password"]');
  const hasPasswordInput = await passwordInput.count() > 0;
  console.log('Has password input:', hasPasswordInput);

  if (hasPasswordInput) {
    // Try login
    await passwordInput.fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // Wait a bit and see what happens
    await page.waitForTimeout(3000);
    console.log('After login URL:', page.url());
    console.log('After login title:', await page.title());

    // Take post-login screenshot
    await page.screenshot({ path: 'test-results/after-login.png', fullPage: true });
  }
});