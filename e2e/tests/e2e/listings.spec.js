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

// Desktop-only smoke: open create listing page

test('user can open create listing page (desktop only)', async ({ browserName, page }) => {
  test.skip(browserName !== 'chromium', 'Desktop-only flow for now');

  await login(page);

  // Go to My Listings
  await page.getByTestId('my-listings-btn').click();

  // Open create listing page
  await page.getByTestId('create-listing-btn').click();

  // Verify that key sections of the form are visible via more specific locators
  await expect(page.getByRole('heading', { name: /Photos/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Clean Title/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Vehicle Details/i })).toBeVisible();
});
