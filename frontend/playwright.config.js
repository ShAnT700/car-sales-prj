// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for NextRides.com
 * - Uses deployed frontend as baseURL
 * - Runs tests in headed Chromium by default
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://nextrides-frontend.onrender.com',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
