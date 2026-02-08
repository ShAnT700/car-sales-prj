// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory structure
  testDir: './tests',
  
  // Global timeout
  timeout: 60 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 10 * 1000,
  },
  
  // Fail fast in CI
  forbidOnly: !!process.env.CI,
  
  // Retry on failure
  retries: process.env.CI ? 2 : 0,
  
  // Parallel execution
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  
  // Global configuration
  use: {
    // Base URL for frontend tests
    baseURL: process.env.E2E_BASE_URL || 'https://nextrides-frontend.onrender.com',
    
    // Headless mode
    headless: true,
    
    // Trace on retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'on-first-retry',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
  },
  
  // Projects for different test types
  projects: [
    // E2E Tests - Desktop Chrome
    {
      name: 'e2e-chrome',
      testDir: './tests/e2e',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
    
    // E2E Tests - Mobile Safari
    {
      name: 'e2e-mobile',
      testDir: './tests/e2e',
      use: { 
        ...devices['iPhone 13'],
      },
    },
    
    // API Tests
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        // API tests don't need browser
        baseURL: process.env.E2E_API_URL || 'https://project-analyzer-111.preview.emergentagent.com/api',
      },
    },
  ],
  
  // Output folder
  outputDir: 'test-results',
});
