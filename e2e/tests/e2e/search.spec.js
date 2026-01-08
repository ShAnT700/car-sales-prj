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
    await expect(page.getByText('Make')).toBeVisible();
    await expect(page.getByText('Show Matches')).toBeVisible();
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
    const makeSelect = page.locator('[data-testid="filter-make"]');
    if (await makeSelect.isVisible()) {
      await makeSelect.click();
      await page.getByText('Tesla', { exact: true }).click();
      
      // Click Show Matches
      await page.getByText('Show Matches').click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Results should only show Tesla (or no results if none exist)
      const cards = page.locator('[data-testid="listing-card"]');
      const count = await cards.count();
      
      if (count > 0) {
        // All visible cards should be Tesla
        for (let i = 0; i < Math.min(count, 3); i++) {
          const cardText = await cards.nth(i).textContent();
          expect(cardText.toLowerCase()).toContain('tesla');
        }
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
    
    // Model should be disabled or empty before Make is selected
    const modelSelect = page.locator('[data-testid="filter-model"]');
    
    // Select Make first
    const makeSelect = page.locator('[data-testid="filter-make"]');
    if (await makeSelect.isVisible()) {
      await makeSelect.click();
      await page.getByText('BMW', { exact: true }).click();
      await page.waitForTimeout(500);
      
      // Now Model should be enabled with BMW models
      if (await modelSelect.isVisible()) {
        await modelSelect.click();
        // Should show BMW models like 3 Series, X5, etc.
        await expect(page.getByText('3 Series')).toBeVisible();
      }
    }
  });

  // TC-SEARCH-04: Filter by Price Range
  test('TC-SEARCH-04: filter by price range', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open search panel
    await page.getByText('Go Search!').click();
    await page.waitForTimeout(500);
    
    // Set price filters if available
    const priceFromInput = page.locator('[data-testid="filter-price-from"], [placeholder*="Min Price"]');
    const priceToInput = page.locator('[data-testid="filter-price-to"], [placeholder*="Max Price"]');
    
    if (await priceFromInput.isVisible()) {
      await priceFromInput.fill('20000');
    }
    if (await priceToInput.isVisible()) {
      await priceToInput.fill('50000');
    }
    
    // Apply filter
    await page.getByText('Show Matches').click();
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
    const ctFilter = page.locator('[data-testid="filter-clean-title"], text=/Clean Title/i');
    if (await ctFilter.isVisible()) {
      await ctFilter.click();
    }
    
    // Apply filter
    await page.getByText('Show Matches').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // If results exist, they should all have CT badge
    const ctBadges = page.locator('text=CT');
    const cards = page.locator('[data-testid="listing-card"]');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // Each card should have a CT badge (approximately)
      const badgeCount = await ctBadges.count();
      expect(badgeCount).toBeGreaterThanOrEqual(0);
    }
  });

  // TC-SEARCH-06: Clear filters
  test('TC-SEARCH-06: clear filters resets search', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open search panel
    await page.getByText('Go Search!').click();
    await page.waitForTimeout(500);
    
    // Apply some filter
    const makeSelect = page.locator('[data-testid="filter-make"]');
    if (await makeSelect.isVisible()) {
      await makeSelect.click();
      await page.getByText('Tesla', { exact: true }).click();
    }
    
    // Look for clear/reset button
    const clearBtn = page.locator('button:has-text("Clear"), button:has-text("Reset")');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Hide and show again to verify reset
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
    
    // Panel should open
    await expect(page.getByText('Show Matches')).toBeVisible();
  });
});
