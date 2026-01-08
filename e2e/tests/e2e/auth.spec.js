const { test, expect } = require('@playwright/test');

// Test credentials
const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = '123456';

// Helper: Generate unique email for registration tests
function generateTestEmail() {
  return `test_${Date.now()}@test.com`;
}

// Helper: Login function
async function login(page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/');
  await page.getByTestId('sell-car-btn').click();
  await page.waitForSelector('[data-testid="auth-email-input"]', { state: 'visible' });
  await page.getByTestId('auth-email-input').fill(email);
  await page.getByTestId('auth-password-input').fill(password);
  await page.getByTestId('auth-submit-btn').click();
  await page.waitForTimeout(2000);
}

// ===========================================
// TC-AUTH-01: Homepage loads
// ===========================================
test.describe('Homepage', () => {
  test('TC-SMOKE-01: homepage loads and shows hero title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByText('Good cars are selling here!')).toBeVisible();
  });

  test('TC-SMOKE-02: Sell Car button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('sell-car-btn')).toBeVisible();
  });

  test('TC-SMOKE-03: Go Search button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Go Search!')).toBeVisible();
  });
});

// ===========================================
// TC-AUTH: Authentication Tests
// ===========================================
test.describe('Authentication', () => {
  
  // TC-AUTH-01: Register a New User (Happy Path)
  test('TC-AUTH-01: register a new user successfully', async ({ page }) => {
    const newEmail = generateTestEmail();
    
    await page.goto('/');
    await page.getByTestId('sell-car-btn').click();
    
    // Switch to Sign Up mode
    await page.getByText('Sign up').click();
    await page.waitForTimeout(500);
    
    // Fill registration form
    await page.getByTestId('auth-name-input').fill('Test User');
    await page.getByTestId('auth-email-input').fill(newEmail);
    await page.getByTestId('auth-password-input').fill('Test1234!');
    await page.getByTestId('auth-submit-btn').click();
    
    // Verify successful registration - user should see My Listings
    await expect(page.getByTestId('my-listings-btn')).toBeVisible({ timeout: 10000 });
  });

  // TC-AUTH-02: Prevent Duplicate Registration
  test('TC-AUTH-02: prevent duplicate registration', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sell-car-btn').click();
    
    // Switch to Sign Up mode
    await page.getByText('Sign up').click();
    await page.waitForTimeout(500);
    
    // Try to register with existing email
    await page.getByTestId('auth-name-input').fill('Duplicate User');
    await page.getByTestId('auth-email-input').fill(TEST_EMAIL);
    await page.getByTestId('auth-password-input').fill('Test1234!');
    await page.getByTestId('auth-submit-btn').click();
    
    // Verify error message
    await expect(page.getByText(/already registered|already in use|exists/i)).toBeVisible({ timeout: 5000 });
    
    // Verify user is NOT logged in
    await expect(page.getByTestId('my-listings-btn')).not.toBeVisible();
  });

  // TC-AUTH-03: Login with Valid Credentials
  test('TC-AUTH-03: login with valid credentials', async ({ page }) => {
    await login(page);
    
    // Verify successful login
    await expect(page.getByTestId('my-listings-btn')).toBeVisible({ timeout: 10000 });
    
    // Verify other authenticated elements
    await expect(page.getByTestId('favorites-btn')).toBeVisible();
    await expect(page.getByTestId('messages-btn')).toBeVisible();
  });

  // TC-AUTH-04: Login with Invalid Credentials
  test('TC-AUTH-04: login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sell-car-btn').click();
    
    await page.getByTestId('auth-email-input').fill(TEST_EMAIL);
    await page.getByTestId('auth-password-input').fill('WrongPassword123!');
    await page.getByTestId('auth-submit-btn').click();
    
    // Verify error message
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 5000 });
    
    // Verify user is NOT logged in
    await expect(page.getByTestId('my-listings-btn')).not.toBeVisible();
  });

  // TC-AUTH-05: Logout from Desktop Header
  test('TC-AUTH-05: logout clears session', async ({ page }) => {
    // First login
    await login(page);
    await expect(page.getByTestId('my-listings-btn')).toBeVisible({ timeout: 10000 });
    
    // Click logout button
    await page.getByTestId('logout-btn').click();
    await page.waitForTimeout(1000);
    
    // Verify logged out state
    await expect(page.getByTestId('sell-car-btn')).toBeVisible();
    await expect(page.getByTestId('my-listings-btn')).not.toBeVisible();
    
    // Verify token is cleared from localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  // TC-AUTH-06: Logout from Mobile Menu
  test('TC-AUTH-06: logout from mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await login(page);
    await page.waitForTimeout(2000);
    
    // Open mobile menu and logout
    const mobileMenuBtn = page.getByTestId('mobile-menu-btn');
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      await page.waitForTimeout(500);
      await page.getByTestId('mobile-logout-btn').click();
    }
    
    // Verify logged out
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('sell-car-btn')).toBeVisible();
  });
});

// ===========================================
// Session Persistence Tests
// ===========================================
test.describe('Session Management', () => {
  
  test('TC-SESSION-01: session persists after page reload', async ({ page }) => {
    await login(page);
    await expect(page.getByTestId('my-listings-btn')).toBeVisible({ timeout: 10000 });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify still logged in
    await expect(page.getByTestId('my-listings-btn')).toBeVisible({ timeout: 10000 });
  });

  test('TC-SESSION-02: token stored in localStorage', async ({ page }) => {
    await login(page);
    await expect(page.getByTestId('my-listings-btn')).toBeVisible({ timeout: 10000 });
    
    // Check localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).not.toBeNull();
    expect(token.length).toBeGreaterThan(10);
  });
});
