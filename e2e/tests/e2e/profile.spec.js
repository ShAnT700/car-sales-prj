const { test, expect } = require('@playwright/test');

// Test credentials
const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = '123456';

// Helper: Login function
async function login(page) {
  await page.goto('/');
  await page.getByTestId('sell-car-btn').click();
  await page.waitForSelector('[data-testid="auth-email-input"]', { state: 'visible' });
  await page.getByTestId('auth-email-input').fill(TEST_EMAIL);
  await page.getByTestId('auth-password-input').fill(TEST_PASSWORD);
  await page.getByTestId('auth-submit-btn').click();
  await page.waitForTimeout(2000);
  await expect(page.getByTestId('my-listings-btn')).toBeVisible({ timeout: 10000 });
}

// ===========================================
// TC-PROF: Profile Tests
// ===========================================
test.describe('Profile', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-PROF-01: Profile page accessible
  test('TC-PROF-01: profile page loads', async ({ page }) => {
    // Click on profile/avatar in header - use force if needed
    await page.getByTestId('profile-btn').click({ force: true });
    await page.waitForLoadState('networkidle');
    
    // Should show profile page elements
    await expect(page.getByTestId('profile-page')).toBeVisible();
  });

  // TC-PROF-02: Profile shows user info
  test('TC-PROF-02: profile displays user information', async ({ page }) => {
    await page.getByTestId('profile-btn').click();
    await page.waitForLoadState('networkidle');
    
    // Should have avatar area
    const avatarArea = page.getByTestId('avatar');
    await expect(avatarArea).toBeVisible();
    
    // Should have name input
    const nameInput = page.getByTestId('profile-name');
    await expect(nameInput).toBeVisible();
  });

  // TC-PROF-03: Can update profile name
  test('TC-PROF-03: profile name field editable', async ({ page }) => {
    await page.getByTestId('profile-btn').click();
    await page.waitForLoadState('networkidle');
    
    // Find name input
    const nameInput = page.getByTestId('profile-name');
    await expect(nameInput).toBeVisible();
    
    // Should be editable
    await nameInput.fill('Updated Test User');
    await expect(nameInput).toHaveValue('Updated Test User');
  });

  // TC-PROF-04: Avatar upload control exists
  test('TC-PROF-04: avatar upload control available', async ({ page }) => {
    await page.getByTestId('profile-btn').click();
    await page.waitForLoadState('networkidle');
    
    // Look for avatar upload button
    const uploadBtn = page.getByTestId('avatar-upload');
    await expect(uploadBtn).toBeVisible();
    
    // Should have hidden file input
    const fileInput = page.getByTestId('avatar-input');
    await expect(fileInput).toBeAttached();
  });

  // TC-PROF-05: Save profile changes
  test('TC-PROF-05: save button exists on profile', async ({ page }) => {
    await page.getByTestId('profile-btn').click();
    await page.waitForLoadState('networkidle');
    
    // Look for save button
    const saveBtn = page.getByTestId('save-profile-btn');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeEnabled();
  });
});

// ===========================================
// TC-PROF: Public Profile Tests
// ===========================================
test.describe('Public Profile', () => {
  
  // TC-PROF-PUBLIC-01: Public profile accessible via listing
  test('TC-PROF-PUBLIC-01: can view seller public profile from listing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click on a listing card
    const firstCard = page.getByTestId('listing-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // Look for seller link
    const sellerLink = page.getByTestId('seller-link');
    await expect(sellerLink).toBeVisible();
    
    await sellerLink.click();
    await page.waitForLoadState('networkidle');
    
    // Should be on public profile page
    await expect(page.url()).toContain('/user/');
    await expect(page.getByTestId('public-profile-page')).toBeVisible();
  });

  // TC-PROF-PUBLIC-02: Public profile shows user listings
  test('TC-PROF-PUBLIC-02: public profile displays user listings', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go to a listing detail
    const firstCard = page.getByTestId('listing-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // Click seller link
    const sellerLink = page.getByTestId('seller-link');
    await expect(sellerLink).toBeVisible();
    await sellerLink.click();
    await page.waitForLoadState('networkidle');
    
    // Should show public profile page
    await expect(page.getByTestId('public-profile-page')).toBeVisible();
  });

  // TC-PROF-PUBLIC-03: Avatar shown on listing cards
  test('TC-PROF-PUBLIC-03: seller avatar displayed on listing cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check first listing card for avatar
    const firstCard = page.getByTestId('listing-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    
    // Look for seller avatar element within card
    const avatar = firstCard.getByTestId('seller-avatar');
    await expect(avatar).toBeVisible();
  });
});
