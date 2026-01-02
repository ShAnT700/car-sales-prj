# NextRides.com Test Plan

## 1. Introduction

This document describes the overall testing strategy, scope, approach, and responsibilities for the **NextRides.com** project – a modern car classifieds web application built with **React**, **FastAPI**, and **MongoDB**.

The goal of this test plan is to ensure that the application meets its functional and non‑functional requirements from the perspective of end users (buyers and sellers), and that critical user journeys work reliably in production.


## 2. Test Objectives

- Verify that buyers can **search for cars**, view listings, and contact sellers via chat and phone.
- Verify that sellers can **create, edit, and delete listings**, including photo management.
- Validate the correct behavior of **favorites (likes)**, including counters and CT (Clean Title) indicators.
- Validate the full **messaging (chat) flow** between buyer and seller.
- Ensure that **authentication, profiles, and My Listings** behave correctly.
- Provide a solid **regression test suite**, with a focus on end‑to‑end tests automated via **Playwright**.


## 3. Scope

### 3.1 In Scope

- Web UI for:
  - Homepage and search (filters, Go Search / Hide Search / Show Matches).
  - Car listings: cards, detail pages, CT badges, likes.
  - Authentication: registration, login, logout, session persistence.
  - Profile page: avatar, profile info, public profile view.
  - My Listings: CRUD operations, photo validations.
  - Favorites: adding/removing, favorites page, like counters.
  - Messages: chat selector menu, conversation view, sending/receiving messages.

- Backend API behavior (at least via integration/E2E level):
  - `/api/auth/*`, `/api/listings*`, `/api/me/*`, `/api/messages*`, `/api/users/*`.

- Basic non‑functional checks: usability, high‑level performance (page loads), and basic security controls (auth‑protected routes).

### 3.2 Out of Scope (Initially)

- Load and stress testing.
- Detailed security penetration testing.
- Cross‑browser testing beyond a limited set (Chromium‑based by default).
- Localization / i18n beyond current UI language.


## 4. Test Items

- **Frontend**: React SPA located in `/frontend`.
  - Pages: `HomePage`, `CarDetailPage`, `ProfilePage`, `MyListingsPage`, `MessagesPage`, `FavoritesPage`, `SavedSearchesPage`, `PublicProfilePage`.
  - Components: `Header`, `CarCard`, `FullSearchPanel`, global search bar, auth modal.

- **Backend**: FastAPI application in `/backend/server.py`.
  - Models and endpoints for users, listings, favorites, saved searches, messages.

- **Database**: MongoDB (Atlas in deployed environment).


## 5. Test Approach

### 5.1 Levels of Testing

1. **Unit Tests** (recommended, not yet primary focus)
   - Backend: validation of Pydantic models and logic helpers.
   - Frontend: pure utility functions (formatting price, mileage, K‑notation for likes, etc.).

2. **Integration Tests**
   - Backend API calls against MongoDB.
   - Ensuring that endpoints store, update, and return data in correct structure.

3. **End‑to‑End (E2E) Tests – primary focus**
   - Implemented with **Playwright**.
   - Simulate real user workflows in a real browser against a deployed environment.

4. **Regression Tests**
   - A subset of E2E tests that cover critical flows (smoke tests) and are run before each release.

### 5.2 Test Types

- **Functional testing**
  - Verification of features described in the product requirements.
- **UI / UX checks**
  - Layout, responsive behavior, visibility of important elements (CT badges, search bar, chat UI, etc.).
- **Validation & Error handling**
  - Form validation for listings, auth, and messaging.
- **Authentication & Authorization**
  - Access control for protected pages (Profile, My Listings, Messages, Favorites).
- **Compatibility**
  - At minimum: Chrome/Chromium desktop; optional: mobile viewport simulations in Playwright.


## 6. Test Environment

### 6.1 Target Environment (Production‑like)

- **Frontend URL**: `https://nextrides-frontend.onrender.com`
- **Backend URL** (via `REACT_APP_BACKEND_URL`): e.g. `https://nextrides-backend.onrender.com`
- **Database**: MongoDB Atlas cluster (free tier), with dedicated database (e.g. `nextrides_db`).

### 6.2 Test Data

Recommended stable test accounts:

- Buyer: `buyer@test.com` / `Test1234!`
- Seller 1: `seller1@test.com` / `Test1234!`
- Seller 2: `seller2@test.com` / `Test1234!`

These accounts will be used across Playwright tests to avoid polluting real user data.


## 7. Functional Test Areas & High‑Level Test Cases

### 7.1 Authentication & Sessions

**Goals:** Ensure users can register, log in, log out, and maintain sessions.

High‑level cases:

1. Register a new user with valid email/password.
2. Prevent registration with an existing email.
3. Login with valid credentials.
4. Reject invalid login (wrong password, unknown email).
5. Session persistence across page reloads.
6. Logout from header and mobile menu; verify guest UI.

**E2E Automation:** `auth.spec.ts`

---

### 7.2 Listings – Create, View, Edit, Delete

**Goals:** Sellers can fully manage their car listings, including photo handling.

Create listing:

1. Create listing with valid data:
   - Make/Model from dropdown lists.
   - City from dropdown list.
   - Valid US ZIP (5 digits).
   - Phone – only allowed characters, length > 7.
   - Description between 30 and 1000 characters.
   - Clean Title = Yes or No.
   - Minimum 3 photos, each ≤ 1 MB.
2. Validate error messages when:
   - Fewer than 3 images are uploaded.
   - At least one image is > 1 MB.
   - ZIP is not exactly 5 digits.
   - Description too short or too long.
   - Required fields are missing.

Edit listing:

1. Update text fields (price, description, CT, etc.) and verify changes.
2. Remove one or more existing images and verify they no longer show up after save.
3. Add additional images during edit and verify they appear in galleries.

Delete listing:

1. Delete a listing from My Listings and confirm it disappears from My Listings, the homepage grid, and search results.

**E2E Automation:** `listings.spec.ts`

---

### 7.3 Clean Title (CT)

**Goals:** Clean Title flag is correctly stored, displayed, and used in search.

High‑level cases:

1. Set Clean Title = Yes during creation; verify `clean_title=true` in API response or DB.
2. Verify CT badge on:
   - Detail page header.
   - Card image bottom‑right corner.
3. Search filter "Clean Title Only" returns only CT listings.

**E2E Automation:** in `listings.spec.ts` and `search.spec.ts`.

---

### 7.4 Search & Filters

**Goals:** Users can efficiently filter listings and navigate search UI.

High‑level cases:

1. Global **Go Search!** button:
   - Visible on all pages.
   - Opens filter panel.
   - Toggles to **Hide Search!** when open.
   - "Show Matches" triggers search.
2. Mobile behavior:
   - Swipe down on panel closes filters.
3. Filter combinations:
   - Make + Model.
   - City + Clean Title.
   - Year/Price/Mileage ranges.
4. Resetting filters shows an unfiltered list of listings.

**E2E Automation:** `search.spec.ts`

---

### 7.5 Favorites & Likes

**Goals:** Favoriting works as expected and like counts are accurate and user‑friendly.

High‑level cases:

1. Favorite/unfavorite from card and from detail page for authenticated users.
2. Favorites page lists all liked listings.
3. Favorite count logic:
   - Increment when user favorites.
   - Decrement when user removes from favorites.
   - Formatting: `1.2K` style for counts ≥ 1000.
4. Verify consistency between card, detail page, and Favorites page.

**E2E Automation:** `favorites.spec.ts`

---

### 7.6 Messaging & Chat

**Goals:** Buyers and sellers can exchange messages in a threaded chat per listing.

High‑level cases:

1. Buyer sends a message to seller from car detail page.
2. Seller sees a new chat thread in Messages with unread indicator.
3. Chat selector menu:
   - Shows avatar of the other user.
   - Shows listing title.
   - Shows mini car image.
   - Displays unread message count.
   - Uses distinct soft backgrounds/borders per row.
4. Chat window:
   - Shows full history for selected thread.
   - Proper alignment (right = current user, left = other user).
   - Messages sorted chronologically.
5. Reply flow:
   - Both sides can reply and see history updated immediately.

**E2E Automation:** `messages.spec.ts`

---

### 7.7 Profiles & Avatars

**Goals:** User avatars and profiles are consistent across the site.

High‑level cases:

1. Upload avatar on Profile page; verify:
   - Avatar in header.
   - Avatar in mobile menu.
   - Avatar on listing cards.
   - Avatar in chat selector menu.
2. Public profile `/user/:id`:
   - Shows user name, avatar, and list of their listings.
3. Navigation from listing card avatar to public profile.

**E2E Automation:** `profile.spec.ts`


## 8. Non‑Functional Testing

### 8.1 Usability

- Layout and visual hierarchy on desktop and mobile.
- Clear call‑to‑action buttons (Go Search, My Listings, Call Seller, Send).
- Error messages are understandable and non‑technical.

### 8.2 Performance (Basic)

- Homepage and search results load within acceptable time on a typical connection.
- Detail page (including image gallery) loads without obvious lag for a typical listing.

### 8.3 Security (Basic)

- Protected pages (Profile, My Listings, Messages, Favorites) are not accessible without authentication.
- JWT tokens are stored client‑side (e.g., localStorage) and not exposed in URLs.


## 9. Test Automation Strategy (Playwright)

### 9.1 Structure

Proposed E2E test structure:

- `frontend/tests/e2e/`
  - `auth.spec.ts`
  - `listings.spec.ts`
  - `search.spec.ts`
  - `favorites.spec.ts`
  - `messages.spec.ts`
  - `profile.spec.ts`
- `playwright.config.ts`
  - `baseURL: 'https://nextrides-frontend.onrender.com'`
  - Browsers: Chromium (desktop) + optional mobile viewports.

### 9.2 Reusable Helpers

- Authentication helpers (e.g., `loginAsBuyer`, `loginAsSeller`).
- Page object models (optional, for maintainability):
  - `HomePage`, `CarDetailPage`, `MessagesPage`, `CreateListingPage`, `ProfilePage`.

### 9.3 Execution

- Local execution:
  - `npx playwright test` or `yarn playwright test` from the `frontend` directory.
- CI integration:
  - Add a GitHub Actions workflow or Render CI step that runs Playwright tests against staging/production after deployment.


## 10. Entry and Exit Criteria

### 10.1 Entry Criteria

- Backend deployed and reachable via a stable URL.
- Frontend deployed and configured with correct `REACT_APP_BACKEND_URL`.
- Test accounts created and accessible.
- MongoDB database initialized (at least with users; listings can be created during tests).

### 10.2 Exit Criteria

- All **smoke tests** (critical E2E flows) pass.
- No open **critical** or **high severity** defects.
- Known medium/low issues documented and accepted by stakeholders.


## 11. Risks & Assumptions

**Risks**

- Free tiers (Render, MongoDB Atlas) may introduce cold starts or throttling, affecting test stability.
- UI changes (especially layout and selectors) may require frequent updates to Playwright tests.

**Assumptions**

- The same environment (URLs, credentials) is used consistently between test runs.
- Test data can be created and cleaned up without impacting real users (preferably dedicated staging DB).


## 12. Deliverables

- This **Test Plan** document.
- Playwright configuration and E2E test suites under `frontend/tests/e2e/`.
- Optional: backend unit/integration tests under `backend/tests/`.
- Test execution reports or CI logs for regression runs.

---

_Last updated: {{DATE}}_
