const { test, expect } = require('@playwright/test');

const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = '123456';

async function login(page) {
  await page.goto('/');
  await page.getByTestId('sell-car-btn').click();
  await page.getByTestId('auth-email-input').fill(TEST_EMAIL);
  await page.getByTestId('auth-password-input').fill(TEST_PASSWORD);
  await page.getByTestId('auth-submit-btn').click();
}

 test('user can create a simple listing', async ({ page }) => {
  await login(page);

  // Go to My Listings
  await page.getByTestId('my-listings-btn').click();

  // Open create listing page
  await page.getByTestId('create-listing-btn').click();

  // NOTE: For now we only verify that page loads and main form elements are visible.
  // Detailed form filling and image upload can be added when test fixtures are prepared.

  await expect(page.getByText('Photos')).toBeVisible();
  await expect(page.getByText('Clean Title')).toBeVisible();
  await expect(page.getByText('Vehicle Details')).toBeVisible();
});
