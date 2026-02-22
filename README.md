# 🧪 QA Automation Portfolio: E2E Testing Framework

> **Test automation demonstration project** showcasing a complete testing framework for a web application.

![Playwright Tests](https://github.com/shant700/car-sales-prj/actions/workflows/playwright-tests.yml/badge.svg)
[![Test Report](https://img.shields.io/badge/Test%20Report-GitHub%20Pages-blue)](https://shant700.github.io/car-sales-prj/)

---

## 📋 About This Project

This repository demonstrates a **complete test automation lifecycle** for a web application:

- ✅ **E2E Tests** (Playwright) — User scenario verification
- ✅ **API Tests** — Backend endpoint validation
- ✅ **CI/CD Pipeline** (GitHub Actions) — Automated test execution
- ✅ **Test Documentation** — [Test Plan](test_docs/Test_Plan_NextRides.md), [Test Cases](test_docs/Test_Cases_NextRides.md)
- ✅ **Reporting** — [HTML Reports](https://shant700.github.io/car-sales-prj/) with run history

**System Under Test (SUT)**: [NextRides.com](https://nextrides-frontend.onrender.com) — A car classifieds platform built with React + FastAPI + M
> 📖 For detailed information about the application itself, see the [Application Documentation](docs/APPLICATION.md).

---

## 🏗️ Test Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                            │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ API Tests│───▶│ E2E (Chrome) │───▶│ Deploy Test Report   │  │
│  │  23 tests│    │   47 tests   │    │   to GitHub Pages    │  │
│  └──────────┘    └──────────────┘    └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

| Decision | Reasoning |
|----------|-----------|
| **API tests run first** | Fast feedback (~40 sec). If backend is broken, no point running E2E |
| **E2E Chrome — main suite** | Covers 95% of users. Runs on every PR and nightly |
| **Report on GitHub Pages** | Instant access to results without downloading artifacts |

---

## 📊 Test Coverage

### Test Structure

```
e2e/
├── tests/
│   ├── api/
│   │   └── api.spec.js          # 23 API tests
│   └── e2e/
│       ├── auth.spec.js         # 11 authentication tests
│       ├── listings.spec.js     # 10 listings tests
│       ├── search.spec.js       # 7 search & filter tests
│       ├── favorites.spec.js    # 5 favorites tests
│       ├── messages.spec.js     # 6 messaging tests
│       └── profile.spec.js      # 8 profile tests
├── playwright.config.js         # Playwright configuration
└── package.json                 # Run scripts
```

### Coverage Matrix

| Module | UI Tests | API Tests | Status |
|--------|----------|-----------|--------|
| **Authentication** | Registration, Login, Logout, Sessions | /auth/login, /auth/register, /auth/me | ✅ |
| **Listings** | Create, Form validation, View | /listings CRUD, filtering | ✅ |
| **Search** | Filters, Clean Title, Make/Model | Query parameters | ✅ |
| **Favorites** | Add, Remove, Counter | /favorites endpoints | ✅ |
| **Messages** | Chat, Threads, Send | /messages threads, conversation | ✅ |
| **Profile** | Edit, Avatar, Public profile | /profile, /users/{id}/public | ✅ |

---

## 🛠️ Technology Stack

### Testing Stack

| Tool | Purpose | Why Chosen |
|------|---------|------------|
| **Playwright** | E2E testing | Faster than Selenium, built-in waits, mobile viewport support |
| **GitHub Actions** | CI/CD | Free for open-source, excellent GitHub integration |
| **GitHub Pages** | Report hosting | Automatic deployment, no external services required |

### Application Stack (SUT)

| Layer | Technology |
|-------|------------|
| Frontend | React, Tailwind CSS, Axios |
| Backend | FastAPI (Python), JWT auth |
| Database | MongoDB Atlas |
| Hosting | Render.com |

---

## 🚀 Running Tests

### Locally

```bash
# Install dependencies
cd e2e
yarn install
npx playwright install

# Run all tests
yarn test

# Run by category
yarn test:api        # API tests only
yarn test:e2e        # E2E (Chrome) only
yarn test:auth       # Authentication only
yarn test:search     # Search only

# Debug mode
yarn test:debug      # Step-by-step execution
yarn test:headed     # With browser visible
```

### In CI/CD

Tests automatically run:
- 📌 On every **Pull Request** to main
- 🌙 **Nightly at 00:00 UTC** (full suite)
- 🖱️ **Manually** via "Run workflow" button

---

## 📈 Reporting

### Playwright HTML Report

An interactive HTML report is generated after each run:

- **Statistics**: passed/failed/skipped
- **Screenshots** on test failure
- **Video recordings** of failed tests
- **Trace files** for detailed debugging

📊 **[View Latest Test Report →](https://shant700.github.io/car-sales-prj/)**

### Artifacts in GitHub Actions

Each run saves:
- `playwright-report/` — [HTML report](https://shant700.github.io/car-sales-prj/) (30 days retention)
- `test-results/` — screenshots, videos, traces (14 days retention)

---

## 📝 Test Documentation

This project includes formal test documentation:

| Document | Description | Link |
|----------|-------------|------|
| **Test Plan** | Testing strategy, scope, criteria | [Test_Plan_NextRides.md](test_docs/Test_Plan_NextRides.md) |
| **Test Cases** | Detailed test cases with steps | [Test_Cases_NextRides.md](test_docs/Test_Cases_NextRides.md) |

### Sample Test Case

```markdown
### TC-AUTH-03 – Login with Valid Credentials

**Preconditions**: User registered with test@test.com / 123456

**Steps**:
1. Navigate to homepage
2. Click "Sell Car" button
3. Enter email and password
4. Click "Sign In"

**Expected Result**:
- User redirected to homepage
- Header shows user menu (My Listings, Favorites, Messages)
- Token saved in localStorage
```

---

## 🔧 Implementation Highlights

### Test Stability

```javascript
// ❌ Bad: hard-coded wait
await page.waitForTimeout(5000);

// ✅ Good: smart wait with fallback
const hasListings = await firstCard.isVisible({ timeout: 5000 }).catch(() => false);
if (!hasListings) {
  test.skip(true, 'No listings available in database');
}
```

### Data-testid Strategy

All key elements have `data-testid` attributes for stable selectors:

```javascript
// Selectors don't depend on CSS classes or text content
await page.getByTestId('listing-card').first();
await page.getByTestId('favorite-btn').click();
await page.getByTestId('search-btn').click();
```

### Empty Database Handling

Tests work correctly even with an empty database:

```javascript
test('TC-FAV-01: toggle favorite', async ({ page }) => {
  const firstCard = page.getByTestId('listing-card').first();
  const hasListings = await firstCard.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (!hasListings) {
    test.skip(true, 'No listings available');  // Graceful skip
    return;
  }
  // ... rest of the test
});
```

---

## 📁 Repository Structure

```
car-sales-prj/
├── .github/
│   └── workflows/
│       └── playwright-tests.yml    # CI/CD pipeline
├── backend/                        # FastAPI application
├── frontend/                       # React SPA
├── e2e/                           # 🧪 TEST FRAMEWORK
│   ├── tests/
│   │   ├── api/                   # API tests
│   │   └── e2e/                   # E2E tests
│   ├── playwright.config.js
│   └── package.json
├── test_docs/                     # 📄 Test documentation
│   ├── Test_Plan_NextRides.md
│   └── Test_Cases_NextRides.md
└── README.md                      # This file
```

---

## 🎯 Skills Demonstrated

- ✅ Test architecture design
- ✅ Writing E2E tests with Playwright
- ✅ API testing of REST endpoints
- ✅ CI/CD pipeline setup (GitHub Actions)
- ✅ Test documentation creation
- ✅ Analyzing and fixing flaky tests
- ✅ Understanding of frontend (React) and backend (Python/FastAPI)

---

## 📞 Contact

**Author**: Vitalii Berchikov

- 📧 Email: vitaliibercvikov@gmail.com
- 💼 LinkedIn: [[linkedin.com/in/your-profile]](https://www.linkedin.com/in/vitalii-berchikov/)
- 🐙 GitHub: github.com/shant700

---

<div align="center">

**[📊 Test Report](https://shant700.github.io/car-sales-prj/)** • **[📋 Test Plan](test_docs/Test_Plan_NextRides.md)** • **[📝 Test Cases](test_docs/Test_Cases_NextRides.md)**

</div>
