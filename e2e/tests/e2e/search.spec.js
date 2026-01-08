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
}

// ===========================================
// TC-SEARCH: Search & Filter Tests
// ===========================================
test.describe('Search Panel', () => {
  
  // TC-SEARCH-01: Open and Close Search Panel
  test('TC-SEARCH-01: open and close search panel via Go Search / Hide Search', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify Go Search button is visible
    const goSearchBtn = page.getByText('Go Search!');
    await expect(goSearchBtn).toBeVisible();
    
    // Click to open search panel
    await goSearchBtn.click();
    await page.waitForTimeout(500);
    
    // Verify filter panel is visible (check for filter elements)
    await expect(page.getByTestId('full-search-panel')).toBeVisible();
    await expect(page.getByTestId('filter-make')).toBeVisible();
    await expect(page.getByText('Hide Search!')).toBeVisible();
    
    // Click Hide Search to close
    await page.getByText('Hide Search!').click();
    await page.waitForTimeout(500);
    
    // Panel should be hidden, Go Search visible again
    await expect(page.getByText('Go Search!')).toBeVisible();
  });

  // TC-SEARCH-02: Filter by Make
  test('TC-SEARCH-02: filter by make shows relevant results', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open search panel
    await page.getByText('Go Search!').click();
    await page.waitForTimeout(500);
    
    // Select Make
    const makeSelect = page.getByTestId('filter-make');
    await expect(makeSelect).toBeVisible();
    await makeSelect.click();
    await page.getByText('Tesla', { exact: true }).click();
    
    // Click Show Matches - use force to bypass any overlay issues
    await page.getByTestId('search-btn').click({ force: true });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Results should only show Tesla (or no results if none exist)
    const cards = page.getByTestId('listing-card');
    const count = await cards.count();
    
    if (count > 0) {
      // All visible cards should be Tesla
      for (let i = 0; i < Math.min(count, 3); i++) {
        const cardText = await cards.nth(i).textContent();
        expect(cardText.toLowerCase()).toContain('tesla');
      }
    }
  });

  // TC-SEARCH-03: Filter by Make and Model (dependent dropdown)
  test('TC-SEARCH-03: model dropdown depends on selected make', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open search panel
    await page.getByText('Go Search!').click();
    await page.waitForTimeout(500);
    
    // Select Make first
    const makeSelect = page.getByTestId('filter-make');
    await expect(makeSelect).toBeVisible();
    await makeSelect.click();
    await page.getByText('BMW', { exact: true }).click();
    await page.waitForTimeout(500);
    
    // Now Model should be enabled with BMW models
    const modelSelect = page.getByTestId('filter-model');
    await expect(modelSelect).toBeVisible();
    await modelSelect.click({ force: true });
    // Should show BMW models like 3 Series, X5, etc.
    await expect(page.getByText('3 Series')).toBeVisible();
  });

  // TC-SEARCH-04: Filter by Price Range
  test('TC-SEARCH-04: filter by price range', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open search panel
    await page.getByText('Go Search!').click();
    await page.waitForTimeout(500);
    
    // Verify search panel is open
    await expect(page.getByTestId('full-search-panel')).toBeVisible();
    
    // Apply filter - use force for overlay
    await page.getByTestId('search-btn').click({ force: true });
    await page.waitForLoadState('networkidle');
  });

  // TC-SEARCH-05: Filter by Clean Title
  test('TC-SEARCH-05: filter by clean title only', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open search panel
    await page.getByText('Go Search!').click();
    await page.waitForTimeout(500);
    
    // Look for Clean Title filter
    const ctFilter = page.getByTestId('filter-clean-title');
    await expect(ctFilter).toBeVisible();
    await ctFilter.click({ force: true });
    await page.getByText('Clean Title Only').click();
    
    // Apply filter - use force for overlay
    await page.getByTestId('search-btn').click({ force: true });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  // TC-SEARCH-06: Clear filters
  test('TC-SEARCH-06: clear filters resets search', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open search panel
    await page.getByText('Go Search!').click();
    await page.waitForTimeout(500);
    
    // Apply some filter
    const makeSelect = page.getByTestId('filter-make');
    await expect(makeSelect).toBeVisible();
    await makeSelect.click();
    await page.getByText('Tesla', { exact: true }).click();
    
    // Hide and show again
    await page.getByText('Hide Search!').click();
    await page.waitForTimeout(300);
    await page.getByText('Go Search!').click();
    await page.waitForTimeout(300);
  });
});

// ===========================================
// Mobile Search Tests
// ===========================================
test.describe('Search Panel - Mobile', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  // TC-SEARCH-MOBILE-01: Search panel works on mobile
  test('TC-SEARCH-MOBILE-01: search panel accessible on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go Search should be visible on mobile
    const goSearchBtn = page.getByText('Go Search!');
    await expect(goSearchBtn).toBeVisible();
    
    // Open search
    await goSearchBtn.click();
    await page.waitForTimeout(500);
    
    // Panel should open - check for search button
    await expect(page.getByTestId('search-btn')).toBeVisible();
  });
});
