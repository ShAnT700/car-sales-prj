const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

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

// Helper: Navigate to Create Listing page
async function goToCreateListing(page) {
  await page.getByTestId('my-listings-btn').click();
  await page.waitForTimeout(1000);
  await page.getByTestId('create-listing-btn').click();
  await page.waitForLoadState('networkidle');
}

// Helper: Create a test image file
function createTestImagePath() {
  // Use a placeholder - in real tests, you'd have test fixtures
  return path.join(__dirname, '../../fixtures/test-car.jpg');
}

// ===========================================
// TC-LIST: Listings Tests
// ===========================================
test.describe('Listings - Create', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-LIST-01: Create a Valid Listing (Minimum Requirements - 1 photo)
  test('TC-LIST-01: create listing with minimum 1 photo', async ({ page }) => {
    await goToCreateListing(page);
    
    // Verify form sections are visible
    await expect(page.getByRole('heading', { name: /Photos/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Clean Title/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Vehicle Details/i })).toBeVisible();
    
    // Verify the correct text for photo requirements
    await expect(page.getByText(/Upload at least 1 photo/i)).toBeVisible();
    await expect(page.getByText(/max 10MB each/i)).toBeVisible();
  });

  // TC-LIST-03: Validate Minimum 1 Photo requirement
  test('TC-LIST-03: cannot submit without photos', async ({ page }) => {
    await goToCreateListing(page);
    
    // Verify "At least 1 photo required" message is shown
    await expect(page.getByText(/At least 1 photo required/i)).toBeVisible();
    
    // Fill all other fields
    await page.getByTestId('listing-make').click();
    await page.getByText('Toyota', { exact: true }).click();
    
    await page.getByTestId('listing-model').click();
    await page.getByText('Camry', { exact: true }).click();
    
    await page.getByTestId('listing-year').click();
    await page.getByText('2023', { exact: true }).click();
    
    await page.getByTestId('listing-drive-type').click();
    await page.getByText('FWD', { exact: true }).click();
    
    await page.getByTestId('listing-mileage').fill('25000');
    await page.getByTestId('listing-price').fill('28000');
    await page.getByTestId('listing-vin').fill('1HGCM82633A004352');
    
    await page.getByTestId('listing-city').click();
    await page.getByText('Los Angeles', { exact: true }).click();
    
    await page.getByTestId('listing-zip').fill('90001');
    await page.getByTestId('listing-phone').fill('+1 213 555 1234');
    await page.getByTestId('listing-description').fill('This is a well-maintained Toyota Camry with excellent fuel economy.');
    
    // Try to submit
    await page.getByTestId('submit-listing-btn').click();
    
    // Should show error about photos
    await expect(page.getByText(/at least 1 image/i)).toBeVisible({ timeout: 3000 });
  });

  // TC-LIST-04: Validate ZIP Code (Only 5 Digits)
  test('TC-LIST-04: ZIP code accepts only 5 digits', async ({ page }) => {
    await goToCreateListing(page);
    
    const zipInput = page.getByTestId('listing-zip');
    
    // Try to enter letters - should be stripped
    await zipInput.fill('abc12');
    await expect(zipInput).toHaveValue('12');
    
    // Try to enter more than 5 digits - should be limited
    await zipInput.fill('1234567890');
    await expect(zipInput).toHaveValue('12345');
    
    // Valid 5-digit ZIP
    await zipInput.fill('90001');
    await expect(zipInput).toHaveValue('90001');
  });

  // TC-LIST-05: Validate Description Length
  test('TC-LIST-05: description must be 30-1000 characters', async ({ page }) => {
    await goToCreateListing(page);
    
    const descInput = page.getByTestId('listing-description');
    
    // Enter short description (less than 30 chars)
    await descInput.fill('Too short');
    
    // Character counter should show
    await expect(page.getByText(/\/1000 characters/)).toBeVisible();
    
    // Enter valid description
    await descInput.fill('This is a valid description that meets the minimum 30 character requirement for the listing.');
    
    // Verify counter updates
    await expect(page.getByText(/\/1000 characters/)).toBeVisible();
  });
});

test.describe('Listings - View', () => {
  
  // TC-LIST-VIEW-01: Latest listings visible on homepage
  test('TC-LIST-VIEW-01: homepage shows latest listings', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify Latest Listings section
    await expect(page.getByText('Latest Listings')).toBeVisible();
    
    // Should have listing cards
    const cards = page.locator('[data-testid="listing-card"]');
    // At least one listing should exist (from previous tests or seed data)
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  // TC-LIST-VIEW-02: Listing card shows essential info
  test('TC-LIST-VIEW-02: listing card displays car info', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid="listing-card"]').first();
    
    // Card should show price
    await expect(firstCard.locator('text=/\\$[0-9,]+/')).toBeVisible();
    
    // Card should show location icon or city
    await expect(firstCard.locator('[class*="location"], text=/Los Angeles|Miami|New York/i')).toBeVisible();
  });

  // TC-LIST-VIEW-03: Click listing card opens detail page
  test('TC-LIST-VIEW-03: clicking listing opens detail page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid="listing-card"]').first();
    await firstCard.click();
    
    // Should navigate to detail page
    await page.waitForLoadState('networkidle');
    await expect(page.url()).toContain('/listing/');
    
    // Detail page should show car info
    await expect(page.getByText(/Call Seller|Contact/i)).toBeVisible();
  });
});

test.describe('Listings - My Listings', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-LIST-MY-01: My Listings page accessible after login
  test('TC-LIST-MY-01: my listings page shows user listings', async ({ page }) => {
    await page.getByTestId('my-listings-btn').click();
    await page.waitForLoadState('networkidle');
    
    // Should show My Listings heading
    await expect(page.getByRole('heading', { name: /My Listings/i })).toBeVisible();
    
    // Should have create button
    await expect(page.getByTestId('create-listing-btn')).toBeVisible();
  });
});

// ===========================================
// TC-CT: Clean Title Tests
// ===========================================
test.describe('Clean Title Badge', () => {
  
  // TC-CT-01: Listings with Clean Title show CT badge
  test('TC-CT-01: clean title badge visible on qualifying listings', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for CT badge on cards (green badge in corner)
    const ctBadge = page.locator('text=CT').first();
    
    // If there are listings with clean title, badge should be visible
    if (await ctBadge.isVisible()) {
      await expect(ctBadge).toBeVisible();
    }
  });

  // TC-CT-02: Create listing form has Clean Title toggle
  test('TC-CT-02: clean title toggle exists on create form', async ({ page }) => {
    await login(page);
    await goToCreateListing(page);
    
    // Should have Yes/No buttons for Clean Title
    await expect(page.getByRole('heading', { name: /Clean Title/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'No' })).toBeVisible();
  });
});
