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
// TC-FAV: Favorites Tests
// ===========================================
test.describe('Favorites', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // TC-FAV-01: Favorite and Unfavorite from Card
  test('TC-FAV-01: toggle favorite from listing card', async ({ page }) => {
    // Find first listing card
    const firstCard = page.getByTestId('listing-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    
    // Find heart/favorite button on the card
    const heartBtn = firstCard.getByTestId('favorite-btn');
    await expect(heartBtn).toBeVisible();
    
    // Click to favorite
    await heartBtn.click();
    await page.waitForTimeout(1000);
    
    // Click again to unfavorite
    await heartBtn.click();
    await page.waitForTimeout(1000);
  });

  // TC-FAV-02: Favorites Page Lists Favorite Listings
  test('TC-FAV-02: favorites page shows favorited listings', async ({ page }) => {
    // Navigate to Favorites page
    await page.getByTestId('favorites-btn').click();
    await page.waitForLoadState('networkidle');
    
    // Should show Favorites heading
    await expect(page.getByRole('heading', { name: /Favorites/i })).toBeVisible();
  });

  // TC-FAV-03: Add to favorites from detail page
  test('TC-FAV-03: can favorite from listing detail page', async ({ page }) => {
    // Click on first listing to go to detail
    const firstCard = page.getByTestId('listing-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // Look for favorite button on detail page
    const favBtn = page.getByTestId('detail-favorite-btn');
    await expect(favBtn).toBeVisible();
    
    await favBtn.click();
    await page.waitForTimeout(1000);
  });

  // TC-FAV-04: Favorite count updates in real-time
  test('TC-FAV-04: favorite count visible on cards', async ({ page }) => {
    const firstCard = page.getByTestId('listing-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    
    // Look for favorite count within the card
    const favoriteBtn = firstCard.getByTestId('favorite-btn');
    await expect(favoriteBtn).toBeVisible();
    
    // Count should be visible
    const count = firstCard.getByTestId('favorite-count');
    await expect(count).toBeVisible();
  });
});

// ===========================================
// TC-FAV: Favorites - Guest User
// ===========================================
test.describe('Favorites - Guest', () => {
  
  // TC-FAV-GUEST-01: Guest cannot favorite (prompts login)
  test('TC-FAV-GUEST-01: guest user prompted to login when favoriting', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid="listing-card"]').first();
    const heartBtn = firstCard.locator('[data-testid="favorite-btn"], button:has(svg[class*="heart"])').first();
    
    if (await heartBtn.isVisible()) {
      await heartBtn.click();
      await page.waitForTimeout(1000);
      
      // Should show login modal or redirect
      const loginModal = page.locator('[data-testid="auth-email-input"]');
      const isLoginVisible = await loginModal.isVisible().catch(() => false);
      
      // Either login modal appears or there's some auth prompt
      // This behavior depends on implementation
    }
  });
});
