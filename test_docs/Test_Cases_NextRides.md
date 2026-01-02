# NextRides.com – Test Cases

This document contains detailed test cases derived from the **NextRides.com Test Plan**. The focus is on end‑to‑end user flows and key functional areas. Each test case can be executed manually and/or automated (preferably via Playwright).

---

## Legend

- **ID**: Unique test case identifier
- **Preconditions**: Required state before executing the test
- **Steps**: Sequential actions to perform
- **Expected Result**: What should happen
- **Automation**: Suggested automation status (Manual / Playwright)

---

## 1. Authentication & Sessions

### TC-AUTH-01 – Register a New User (Happy Path)

- **Preconditions**:
  - User is not logged in.
  - Test email is not yet registered.
- **Steps**:
  1. Open the homepage.
  2. Click **Sell Car** (or any action that opens the auth modal).
  3. Switch to the **Sign Up / Register** mode if needed.
  4. Enter a valid email (e.g., `test@test.com`).
  5. Enter a valid password (e.g., `123456`) and confirm if required.
  6. Submit the registration form.
- **Expected Result**:
  - Registration succeeds without validation errors.
  - User is automatically logged in.
  - Header shows My Listings, Messages, Favorites, Saved Searches, and profile avatar.
- **Automation**: Playwright

### TC-AUTH-02 – Prevent Duplicate Registration

- **Preconditions**:
  - An account with `buyer@test.com` already exists.
- **Steps**:
  1. Open the homepage.
  2. Open the auth modal in registration mode.
  3. Enter `buyer@test.com` and any valid password.
  4. Submit the form.
- **Expected Result**:
  - Registration is rejected.
  - A clear error message is shown (e.g., "Email already in use").
  - User is not logged in.
- **Automation**: Playwright

### TC-AUTH-03 – Login with Valid Credentials

- **Preconditions**:
  - User account `buyer@test.com / Test1234!` exists.
  - User is logged out.
- **Steps**:
  1. Open the homepage.
  2. Open the auth modal in **Login** mode.
  3. Enter `buyer@test.com` and `Test1234!`.
  4. Submit.
- **Expected Result**:
  - Login succeeds.
  - Header and navigation reflect authenticated state.
  - No error messages are displayed.
- **Automation**: Playwright

### TC-AUTH-04 – Login with Invalid Credentials

- **Preconditions**:
  - User account `buyer@test.com / Test1234!` exists.
- **Steps**:
  1. Open the homepage.
  2. Open the login modal.
  3. Enter `buyer@test.com` and an invalid password (e.g., `WrongPass1!`).
  4. Submit.
- **Expected Result**:
  - Login is rejected.
  - A clear error message is displayed (e.g., "Invalid email or password").
  - Authenticated UI is not shown.
- **Automation**: Playwright

### TC-AUTH-05 – Logout from Desktop Header

- **Preconditions**:
  - User is logged in.
- **Steps**:
  1. On desktop viewport, open the main header.
  2. Click the **Logout** button/icon.
- **Expected Result**:
  - Session is cleared (no JWT token in storage).
  - UI switches to guest mode (Sell Car button, no My Listings etc.).
- **Automation**: Playwright

### TC-AUTH-06 – Logout from Mobile Menu

- **Preconditions**:
  - User is logged in.
- **Steps**:
  1. Switch to mobile viewport.
  2. Tap the mobile menu button (hamburger icon).
  3. Tap **Logout**.
- **Expected Result**:
  - Same as TC-AUTH-05.
- **Automation**: Playwright


## 2. Listings – Create, View, Edit, Delete

### TC-LIST-01 – Create a Valid Listing (Minimum Requirements)

- **Preconditions**:
  - User is logged in as seller (e.g., `seller1@test.com`).
  - Test images (≤ 1 MB each) are available.
- **Steps**:
  1. Navigate to **My Listings**.
  2. Click **Add Listing**.
  3. Upload 3 valid images.
  4. Set **Clean Title** = Yes.
  5. Choose Make and Model from dropdowns (e.g., Toyota → Camry).
  6. Choose City from dropdown (e.g., Los Angeles).
  7. Enter valid Year, Mileage, Price.
  8. Enter valid 5-digit ZIP (e.g., 90001).
  9. Enter valid phone number (e.g., `+1 213 555 1234`).
  10. Enter VIN (any valid pattern if validated), e.g., `1HGCM82633A004352`.
  11. Enter description of 50+ characters.
  12. Submit the form.
- **Expected Result**:
  - Listing is created successfully with no validation errors.
  - It appears in **My Listings** with correct data.
  - It is visible on the homepage (Latest Listings) and detail page.
- **Automation**: Playwright

### TC-LIST-02 – Validate Image Size Limit

- **Preconditions**:
  - User is logged in as seller.
  - One test image > 1 MB available.
- **Steps**:
  1. Start creating a listing.
  2. Attempt to upload an image larger than 1 MB.
- **Expected Result**:
  - Image is rejected.
  - A toast or inline error is shown (e.g., "Image X is larger than 1MB").
  - Oversized image is not added to the preview list.
- **Automation**: Manual / Playwright (if large image available in test assets)

### TC-LIST-03 – Validate Minimum 3 Photos

- **Preconditions**:
  - User is logged in as seller.
- **Steps**:
  1. Start creating a listing.
  2. Upload only 1 or 2 valid images.
  3. Fill in all other required fields correctly.
  4. Try to submit.
- **Expected Result**:
  - Form is not submitted.
  - User sees a clear error indicating that at least 3 photos are required.
- **Automation**: Playwright

### TC-LIST-04 – Validate ZIP Code (Only 5 Digits)

- **Preconditions**:
  - User is logged in as seller.
- **Steps**:
  1. Start creating a listing.
  2. In the ZIP field, attempt to type letters and more than 5 characters.
  3. Observe how input behaves.
  4. Enter less than 5 digits and try to submit with other fields valid.
- **Expected Result**:
  - Non-digit characters are stripped from input.
  - Input length is limited to 5 digits.
  - Submission with <5 digits is rejected with validation message.
- **Automation**: Playwright

### TC-LIST-05 – Validate Description Length

- **Preconditions**:
  - User is logged in as seller.
- **Steps**:
  1. Start creating a listing.
  2. Enter description shorter than 30 characters.
  3. Fill other fields correctly and try to submit.
  4. Then enter a very long description (>1000 chars) and try to submit again.
- **Expected Result**:
  - For <30 chars: submission rejected, error like "Description must be at least 30 characters".
  - For >1000 chars: submission rejected with message like "Description cannot exceed 1000 characters".
- **Automation**: Playwright

### TC-LIST-06 – Edit Listing and Remove Existing Photos

- **Preconditions**:
  - Listing created in TC-LIST-01 exists with ≥3 photos.
- **Steps**:
  1. Navigate to **My Listings**.
  2. Click **Edit** on the target listing.
  3. Remove one or more existing images using the delete icon.
  4. Ensure at least 3 images remain (existing + new if needed).
  5. Save changes.
  6. Open the listing detail page.
- **Expected Result**:
  - Removed images no longer appear in My Listings preview or detail gallery.
  - Remaining images are intact and displayed.
- **Automation**: Playwright

### TC-LIST-07 – Delete Listing

- **Preconditions**:
  - Listing exists in My Listings.
- **Steps**:
  1. Go to **My Listings**.
  2. Click **Delete** on a listing and confirm the action.
  3. Return to homepage and search results.
- **Expected Result**:
  - Listing is removed from My Listings.
  - Listing is not visible on homepage or in search results.
- **Automation**: Playwright


## 3. Clean Title (CT)

### TC-CT-01 – Set Clean Title and Verify Badges

- **Preconditions**:
  - Seller is logged in.
- **Steps**:
  1. Create a new listing with **Clean Title = Yes**.
  2. Open its detail page.
  3. Locate the title section.
  4. Open the same listing card on the homepage.
- **Expected Result**:
  - On the detail page: CT badge appears near the listing title.
  - On the card: a green CT badge appears in the bottom‑right corner of the main photo.
- **Automation**: Playwright

### TC-CT-02 – Listing Without Clean Title Has No CT Badge

- **Preconditions**:
  - Seller is logged in.
- **Steps**:
  1. Create a listing with **Clean Title = No**.
  2. Verify detail page and card as in TC-CT-01.
- **Expected Result**:
  - No CT badge is shown anywhere for this listing.
- **Automation**: Playwright

### TC-CT-03 – Filter Clean Title Only

- **Preconditions**:
  - At least one listing with CT = Yes and one with CT = No exist.
- **Steps**:
  1. Open homepage.
  2. Click **Go Search!** to open filters.
  3. Set Clean Title filter to "Clean Title Only".
  4. Click **Show Matches**.
- **Expected Result**:
  - Only listings with Clean Title = Yes are returned.
  - No listing with CT = No appears in results.
- **Automation**: Playwright


## 4. Search & Filters

### TC-SEARCH-01 – Open and Close Search Panel via Go Search / Hide Search

- **Preconditions**:
  - User is on homepage (logged in or guest).
- **Steps**:
  1. Verify **Go Search!** button is visible at the bottom.
  2. Click **Go Search!**.
  3. Verify filter panel appears.
  4. Verify bottom buttons now show **Hide Search!** and **Show Matches**.
  5. Click **Hide Search!**.
- **Expected Result**:
  - Filter panel opens and closes accordingly.
  - Buttons toggle text correctly.
- **Automation**: Playwright

### TC-SEARCH-02 – Filter by Make and Model

- **Preconditions**:
  - There are listings for at least two different make/model combinations.
- **Steps**:
  1. Open filter panel.
  2. Set Make = e.g., `Toyota`.
  3. Set Model = e.g., `Camry` (from dependent dropdown).
  4. Click **Show Matches**.
- **Expected Result**:
  - All returned listings have Make=Toyota and Model=Camry.
  - No listings of other makes/models appear.
- **Automation**: Playwright

### TC-SEARCH-03 – Filter by City and Clean Title

- **Preconditions**:
  - Listings exist in at least two cities and with different CT statuses.
- **Steps**:
  1. Open filter panel.
  2. Set City = e.g., `Los Angeles`.
  3. Set Clean Title = "Clean Title Only".
  4. Run search.
- **Expected Result**:
  - All results are located in the chosen city.
  - All have CT = Yes.
- **Automation**: Playwright

### TC-SEARCH-04 – Close Panel by Swipe Down (Mobile)

- **Preconditions**:
  - Mobile viewport.
- **Steps**:
  1. Open filter panel via Go Search!.
  2. Perform a downward swipe gesture on the panel.
- **Expected Result**:
  - Panel closes.
- **Automation**: Playwright (mobile emulation)


## 5. Favorites & Likes

### TC-FAV-01 – Favorite and Unfavorite from Card

- **Preconditions**:
  - User is logged in.
  - At least one listing exists.
- **Steps**:
  1. Open homepage.
  2. Note favorite count N under the heart icon on a card.
  3. Click the heart to add to favorites.
  4. Observe heart color and count.
  5. Click heart again to remove from favorites.
- **Expected Result**:
  - After favoriting: heart is red, count becomes N+1.
  - After unfavoriting: heart returns to neutral style, count returns to N.
- **Automation**: Playwright

### TC-FAV-02 – Favorites Page Lists Favorite Listings

- **Preconditions**:
  - User is logged in.
  - User has at least one favorite listing.
- **Steps**:
  1. Click **Favorites** icon/button in header.
  2. Observe listings shown.
- **Expected Result**:
  - All listings that were favorited by the user are present.
  - No non‑favorited listings appear.
- **Automation**: Playwright

### TC-FAV-03 – Like Counter Formatting (K+)

- **Preconditions**:
  - A listing has ≥ 1000 favorites (can be pre‑seeded or mocked in test DB).
- **Steps**:
  1. Open card and/or detail page for that listing.
- **Expected Result**:
  - Favorite counter shows abbreviated format (e.g., `1.2K`) instead of full integer.
- **Automation**: Manual / Playwright (requires prepared data)


## 6. Messaging & Chat

### TC-MSG-01 – Buyer Sends Message to Seller from Detail Page

- **Preconditions**:
  - Seller listing exists.
  - Buyer and seller accounts exist.
- **Steps**:
  1. Log in as buyer.
  2. Open a listing detail page.
  3. Type a message in the contact/ chat area.
  4. Click **Send**.
- **Expected Result**:
  - Message is successfully sent (no error toast).
  - A new chat thread appears under Messages for both buyer and seller.
- **Automation**: Playwright

### TC-MSG-02 – Seller Sees Unread Indicator and Opens Conversation

- **Preconditions**:
  - Message from TC-MSG-01 has been sent.
- **Steps**:
  1. Log in as seller.
  2. Open **Messages** page.
  3. Observe the chat selector menu.
  4. Locate the thread for the listing and buyer.
  5. Open the thread.
- **Expected Result**:
  - Thread shows an unread badge (`unread_count > 0`) before opening.
  - After opening, full conversation history is visible.
- **Automation**: Playwright

### TC-MSG-03 – Exchange Replies in Chat

- **Preconditions**:
  - Buyer and seller have at least one existing thread.
- **Steps**:
  1. Log in as seller, open Messages, select the appropriate chat.
  2. Type a reply and click **Send**.
  3. Log in as buyer and open the same chat.
- **Expected Result**:
  - Seller’s reply is visible in chat history for both sides.
  - Message ordering is chronological.
- **Automation**: Playwright


## 7. Profiles & Avatars

### TC-PROF-01 – Upload Avatar and Verify Across UI

- **Preconditions**:
  - User is logged in.
  - Test image (≤ 1 MB) available.
- **Steps**:
  1. Navigate to **Profile** page.
  2. Click on the avatar upload control.
  3. Select an image file.
  4. Save profile if necessary.
  5. Return to homepage.
- **Expected Result**:
  - Avatar on Profile page updates to the new image.
  - Header profile button shows the new avatar.
  - Mobile profile entry icon shows the new avatar.
  - Avatar in listing cards and chat selector (for user’s listings/chats) uses the same image.
- **Automation**: Playwright

### TC-PROF-02 – Public Profile Shows User Listings

- **Preconditions**:
  - User has at least one active listing.
- **Steps**:
  1. From a listing card, click on the seller avatar.
  2. Arrive at `/user/:id` public profile page.
- **Expected Result**:
  - Correct user name and avatar are shown.
  - Page lists all public listings for this user.
- **Automation**: Playwright


## 8. Smoke Test Set (Subset for Quick Regression)

Recommended minimal set of E2E tests to run on each deployment:

1. **TC-AUTH-03** – Login with valid credentials.
2. **TC-LIST-01** – Create a valid listing.
3. **TC-SEARCH-02** – Filter by Make/Model.
4. **TC-FAV-01** – Favorite/unfavorite a listing.
5. **TC-MSG-01/02** – Send a message and open chat.
6. **TC-PROF-01** – Upload avatar and verify in header.

---

_Last updated: {{DATE}}_
