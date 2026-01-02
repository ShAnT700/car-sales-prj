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

// Basic smoke test: homepage loads

 test('homepage loads and shows hero title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-page')).toBeVisible();
  await expect(page.getByText('Good cars are selling here!')).toBeVisible();
});

// Login flow with existing account

 test('user can login with test account', async ({ page }) => {
  await login(page);

  // After login, header should show My Listings button
  await expect(page.getByTestId('my-listings-btn')).toBeVisible();
});
