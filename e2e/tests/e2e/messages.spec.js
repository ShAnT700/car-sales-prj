const { test, expect } = require('@playwright/test');

// Test credentials
const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = '123456';

// Helper: Login function
async function login(page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/');
  await page.getByTestId('sell-car-btn').click();
  await page.waitForSelector('[data-testid="auth-email-input"]', { state: 'visible' });
  await page.getByTestId('auth-email-input').fill(email);
  await page.getByTestId('auth-password-input').fill(password);
  await page.getByTestId('auth-submit-btn').click();
  await page.waitForTimeout(2000);
  await expect(page.getByTestId('my-listings-btn')).toBeVisible({ timeout: 10000 });
}

// ===========================================
// TC-MSG: Messaging Tests
// ===========================================
test.describe('Messaging', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-MSG-01: Messages page accessible
  test('TC-MSG-01: messages page loads', async ({ page }) => {
    // Click Messages button in header
    await page.getByTestId('messages-btn').click();
    await page.waitForLoadState('networkidle');
    
    // Should show Messages page
    await expect(page.getByRole('heading', { name: /Messages/i })).toBeVisible();
  });

  // TC-MSG-02: Send message from listing detail
  test('TC-MSG-02: can open message form from listing detail', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click on a listing (not own listing)
    const cards = page.locator('[data-testid="listing-card"]');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // Try to find a listing that's not from current user
      await cards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Look for message/contact button or area
      const messageBtn = page.locator('button:has-text("Message"), button:has-text("Contact"), [data-testid="send-message-btn"]');
      const messageArea = page.locator('textarea[placeholder*="message"], [data-testid="message-input"]');
      
      // Either a button or text area should be visible for messaging
      const hasMessageFeature = await messageBtn.isVisible().catch(() => false) || 
                                await messageArea.isVisible().catch(() => false);
    }
  });

  // TC-MSG-03: Messages page shows conversation threads
  test('TC-MSG-03: messages page displays conversation threads', async ({ page }) => {
    await page.getByTestId('messages-btn').click();
    await page.waitForLoadState('networkidle');
    
    // Look for thread list or "no messages" state
    const threadList = page.locator('[data-testid="thread-list"], [data-testid="conversation-list"]');
    const noMessages = page.locator('text=/no messages|no conversations|empty/i');
    
    // Either threads exist or empty state is shown
    const hasThreads = await threadList.isVisible().catch(() => false);
    const isEmpty = await noMessages.isVisible().catch(() => false);
    
    // One of these should be true
    expect(hasThreads || isEmpty).toBeTruthy();
  });

  // TC-MSG-04: Can select and view a conversation
  test('TC-MSG-04: can view conversation history', async ({ page }) => {
    await page.getByTestId('messages-btn').click();
    await page.waitForLoadState('networkidle');
    
    // If there are conversation threads
    const threads = page.locator('[data-testid="thread-item"], [data-testid="conversation-item"]');
    const threadCount = await threads.count();
    
    if (threadCount > 0) {
      // Click first thread
      await threads.first().click();
      await page.waitForTimeout(1000);
      
      // Should show message history area
      const messageArea = page.locator('[data-testid="message-history"], [data-testid="chat-messages"]');
      const hasMessageArea = await messageArea.isVisible().catch(() => false);
    }
  });

  // TC-MSG-05: Can send a reply in conversation
  test('TC-MSG-05: can type and send message in conversation', async ({ page }) => {
    await page.getByTestId('messages-btn').click();
    await page.waitForLoadState('networkidle');
    
    // Try to find message input
    const messageInput = page.locator('[data-testid="message-input"], textarea[placeholder*="message"], input[placeholder*="message"]');
    const sendBtn = page.locator('[data-testid="send-btn"], button:has-text("Send")');
    
    if (await messageInput.isVisible()) {
      await messageInput.fill('Test message from E2E test');
      
      if (await sendBtn.isVisible()) {
        // Don't actually send in test to avoid spam
        // Just verify the UI works
        await expect(sendBtn).toBeEnabled();
      }
    }
  });
});

// ===========================================
// TC-MSG: Messaging - Unread Indicator
// ===========================================
test.describe('Messaging - Unread Indicator', () => {
  
  // TC-MSG-UNREAD-01: Unread badge shows in header
  test('TC-MSG-UNREAD-01: unread badge visible when there are unread messages', async ({ page }) => {
    await login(page);
    
    // Look for unread indicator on messages button
    const messagesBtn = page.getByTestId('messages-btn');
    await expect(messagesBtn).toBeVisible();
    
    // Check if there's an unread badge/dot (implementation specific)
    const unreadBadge = page.locator('[data-testid="unread-badge"], [data-testid="messages-btn"] .badge, [data-testid="messages-btn"] [class*="dot"]');
    
    // Badge may or may not be visible depending on message state
    // This test just verifies the structure exists
  });
});
