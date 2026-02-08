const { test, expect } = require('@playwright/test');

// API Base URL (will be set from env or default)
const API_URL = process.env.E2E_API_URL || 'https://nextrides-backend.onrender.com/api';

// Test credentials
const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = '123456';
const TEST_NAME = 'Test User';

// ============================================
// Global Setup: Ensure test user exists
// ============================================
test.beforeAll(async ({ request }) => {
  // Step 1: Check if the API is reachable
  const healthCheck = await request.get(`${API_URL}/`);
  expect(healthCheck.ok(), `API not reachable at ${API_URL}`).toBeTruthy();

  // Step 2: Try to login with test credentials
  const loginResponse = await request.post(`${API_URL}/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD }
  });

  if (loginResponse.status() === 200) {
    // Test user already exists with correct password — we're good
    return;
  }

  // Step 3: Try to register the test user
  const registerResponse = await request.post(`${API_URL}/auth/register`, {
    data: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME
    }
  });

  if (registerResponse.status() === 200) {
    // Successfully registered
    return;
  }

  // Step 4: If both login and register failed, the user may exist with a different
  // password (e.g. from a corrupted previous test run).
  // Use the seed endpoint to reset the test user if available.
  const seedResponse = await request.post(`${API_URL}/test/seed`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME }
  });

  if (seedResponse.ok()) {
    return;
  }

  // If nothing works, fail with a clear message
  throw new Error(
    `Test setup failed: Could not login or register test user (${TEST_EMAIL}). ` +
    `Login status: ${loginResponse.status()}, Register status: ${registerResponse.status()}. ` +
    `The test user may exist with a different password. Please reset the database or add a /api/test/seed endpoint.`
  );
});

// Helper: Get auth token (with proper error handling)
async function getAuthToken(request) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD }
  });
  expect(response.status(), 'Login should succeed for test user').toBe(200);
  const data = await response.json();
  expect(data.access_token).toBeDefined();
  return data.access_token;
}

// ===========================================
// API Tests: Authentication
// ===========================================
test.describe('API - Authentication', () => {

  test('API-AUTH-01: login returns token', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.access_token).toBeDefined();
    expect(data.user.email).toBe(TEST_EMAIL);
  });

  test('API-AUTH-02: login with invalid credentials returns 401', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email: TEST_EMAIL, password: 'wrongpassword' }
    });

    expect(response.status()).toBe(401);
  });

  test('API-AUTH-03: register with existing email returns 400', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/register`, {
      data: { email: TEST_EMAIL, password: 'newpass123', name: 'Test' }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.detail).toContain('already');
  });

  test('API-AUTH-04: /auth/me requires authentication', async ({ request }) => {
    const response = await request.get(`${API_URL}/auth/me`);
    expect(response.status()).toBe(401);
  });

  test('API-AUTH-05: /auth/me returns user with valid token', async ({ request }) => {
    const access_token = await getAuthToken(request);

    const response = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    expect(response.status()).toBe(200);
    const user = await response.json();
    expect(user.email).toBe(TEST_EMAIL);
  });
});

// ===========================================
// API Tests: Listings
// ===========================================
test.describe('API - Listings', () => {

  test('API-LIST-01: get listings returns array', async ({ request }) => {
    const response = await request.get(`${API_URL}/listings`);

    expect(response.status()).toBe(200);
    const listings = await response.json();
    expect(Array.isArray(listings)).toBeTruthy();
  });

  test('API-LIST-02: listings have required fields', async ({ request }) => {
    const response = await request.get(`${API_URL}/listings?limit=1`);
    const listings = await response.json();

    if (listings.length > 0) {
      const listing = listings[0];
      expect(listing.id).toBeDefined();
      expect(listing.make).toBeDefined();
      expect(listing.model).toBeDefined();
      expect(listing.year).toBeDefined();
      expect(listing.price).toBeDefined();
      expect(listing.images).toBeDefined();
      expect(Array.isArray(listing.images)).toBeTruthy();
    }
  });

  test('API-LIST-03: filter by make works', async ({ request }) => {
    const response = await request.get(`${API_URL}/listings?make=Tesla`);
    const listings = await response.json();

    // All returned listings should be Tesla (if any exist)
    for (const listing of listings) {
      expect(listing.make.toLowerCase()).toContain('tesla');
    }
  });

  test('API-LIST-04: filter by clean_title works', async ({ request }) => {
    const response = await request.get(`${API_URL}/listings?clean_title=true`);
    const listings = await response.json();

    // All returned listings should have clean_title=true
    for (const listing of listings) {
      expect(listing.clean_title).toBe(true);
    }
  });

  test('API-LIST-05: get single listing by id', async ({ request }) => {
    // First get a listing id
    const listResponse = await request.get(`${API_URL}/listings?limit=1`);
    const listings = await listResponse.json();

    if (listings.length > 0) {
      const listingId = listings[0].id;

      const response = await request.get(`${API_URL}/listings/${listingId}`);
      expect(response.status()).toBe(200);

      const listing = await response.json();
      expect(listing.id).toBe(listingId);
    }
  });

  test('API-LIST-06: get non-existent listing returns 404', async ({ request }) => {
    const response = await request.get(`${API_URL}/listings/non-existent-id-12345`);
    expect(response.status()).toBe(404);
  });

  test('API-LIST-07: create listing requires auth', async ({ request }) => {
    // This should fail without proper auth (401 or 422)
    const response = await request.post(`${API_URL}/listings`, {
      multipart: {
        make: 'Test',
        model: 'Car',
        year: '2023',
        mileage: '10000',
        price: '20000',
        drive_type: 'FWD',
        city: 'Test City',
        zip_code: '12345',
        phone: '+1234567890',
        vin: 'TEST12345678901234',
        description: 'Test description for the listing that meets minimum requirements.',
        clean_title: 'false',
        authorization: 'invalid-token'
      }
    });

    // Should not return 200 (success) - either 401 (unauthorized) or 422 (validation error due to invalid auth)
    expect(response.status()).not.toBe(200);
    expect([401, 422]).toContain(response.status());
  });
});

// ===========================================
// API Tests: Favorites
// ===========================================
test.describe('API - Favorites', () => {

  test('API-FAV-01: get favorites requires auth', async ({ request }) => {
    const response = await request.get(`${API_URL}/favorites`);
    expect(response.status()).toBe(401);
  });

  test('API-FAV-02: get favorites with auth returns array', async ({ request }) => {
    const access_token = await getAuthToken(request);

    const response = await request.get(`${API_URL}/favorites`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    expect(response.status()).toBe(200);
    const favorites = await response.json();
    expect(Array.isArray(favorites)).toBeTruthy();
  });

  test('API-FAV-03: favorite ids endpoint works', async ({ request }) => {
    const access_token = await getAuthToken(request);

    const response = await request.get(`${API_URL}/favorites/ids`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    expect(response.status()).toBe(200);
    const ids = await response.json();
    expect(Array.isArray(ids)).toBeTruthy();
  });
});

// ===========================================
// API Tests: Messages
// ===========================================
test.describe('API - Messages', () => {

  test('API-MSG-01: get threads requires auth', async ({ request }) => {
    const response = await request.get(`${API_URL}/messages/threads`);
    expect(response.status()).toBe(401);
  });

  test('API-MSG-02: get threads with auth returns array', async ({ request }) => {
    const access_token = await getAuthToken(request);

    const response = await request.get(`${API_URL}/messages/threads`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    expect(response.status()).toBe(200);
    const threads = await response.json();
    expect(Array.isArray(threads)).toBeTruthy();
  });

  test('API-MSG-03: unread count endpoint works', async ({ request }) => {
    const access_token = await getAuthToken(request);

    const response = await request.get(`${API_URL}/messages/unread-count`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.count).toBeDefined();
    expect(typeof data.count).toBe('number');
  });
});

// ===========================================
// API Tests: Profile
// ===========================================
test.describe('API - Profile', () => {

  test('API-PROF-01: get profile requires auth', async ({ request }) => {
    const response = await request.get(`${API_URL}/profile`);
    expect(response.status()).toBe(401);
  });

  test('API-PROF-02: get profile with auth returns user data', async ({ request }) => {
    const access_token = await getAuthToken(request);

    const response = await request.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    expect(response.status()).toBe(200);
    const profile = await response.json();
    expect(profile.email).toBe(TEST_EMAIL);
  });

  test('API-PROF-03: public profile endpoint works', async ({ request }) => {
    // First get a user id from a listing
    const listResponse = await request.get(`${API_URL}/listings?limit=1`);
    const listings = await listResponse.json();

    if (listings.length > 0) {
      const userId = listings[0].user_id;

      const response = await request.get(`${API_URL}/users/${userId}/public`);
      expect(response.status()).toBe(200);

      const publicProfile = await response.json();
      expect(publicProfile.user).toBeDefined();
      expect(publicProfile.listings).toBeDefined();
    }
  });
});

// ===========================================
// API Tests: Saved Searches
// ===========================================
test.describe('API - Saved Searches', () => {

  test('API-SAVED-01: get saved searches requires auth', async ({ request }) => {
    const response = await request.get(`${API_URL}/saved-searches`);
    expect(response.status()).toBe(401);
  });

  test('API-SAVED-02: get saved searches with auth', async ({ request }) => {
    const access_token = await getAuthToken(request);

    const response = await request.get(`${API_URL}/saved-searches`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    expect(response.status()).toBe(200);
    const searches = await response.json();
    expect(Array.isArray(searches)).toBeTruthy();
  });
});
