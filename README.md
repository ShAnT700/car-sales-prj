# NextRides.com – Modern Car Classifieds Platform

NextRides.com is a modern, full‑stack car classifieds platform built with **React**, **FastAPI**, and **MongoDB**. 

It is designed as a real product, not just a demo: buyers can quickly find their next car using powerful filters, and sellers can easily manage listings, favorites, and conversations – all in a mobile‑friendly interface.

---

## Overview

NextRides.com focuses on used cars in the United States and is optimized for:

- **Private sellers and small dealers** – easy listing creation, photo management, and in‑site messaging.
- **Buyers** – fast search by real‑world parameters (make, model, year, mileage, price, location, Clean Title).

Key design goals:

- Clean, mobile‑first UI.
- Minimal manual text entry where possible (selects for makes, models, cities, etc.).
- Clear visual indicators: Clean Title (CT), favorites, unread messages, etc.

---

## Core Features

### 1. User Accounts & Profiles

- Email + password registration and login (JWT‑based authentication).
- **Public profile** for every user:
  - Avatar
  - Display name
  - List of published listings
- Profile is accessible from:
  - Car detail page (seller info block)
  - Listing card (seller avatar circle)
  - Chat participants (messages page)

### 2. Car Listings

Each listing includes:

- **At least 3 photos** (client‑side file size limit: up to 1 MB per image)
- Make and model (selected from predefined lists for consistency)
- Year, mileage, price
- Drive type (FWD / RWD / AWD / 4WD)
- City (selected from a curated list of US cities)
- ZIP code (strict 5‑digit US ZIP validation)
- Seller phone number (validated input)
- VIN
- Rich description (**30–1000 characters**)
- **Clean Title** status (Yes / No)

Visual details:

- **Clean Title (CT)**
  - On the detail page: small green CT badge next to the title.
  - On cards: CT badge in the bottom‑right corner of the main photo.
- **Listing card layout**
  - Line 1: `Make Model` + price on the same row.
  - Line 2: mileage and city.
  - Top‑left of the photo: seller avatar circle (clickable → seller profile).

### 3. Search & Filters

Search is centered around a global bottom bar:

- Persistent **“Go Search!”** button on all pages.
  - Tapping opens the full filter panel.
  - Button text toggles to **“Hide Search!”** when the panel is open.
  - A green **“Show Matches”** button remains fixed next to it while filters are open.
  - On mobile, the panel can be closed by swiping down.

Available filters:

- Make (select)
- Model (dependent select based on make)
- Year range
- Mileage range
- Price range
- Drive type
- Clean Title (Any / Clean Title Only)
- ZIP + distance

On the homepage, search results are rendered as a responsive grid of cards with:

- Up to **16 preview listings** visible at once.
- CT badges and like counts visible directly on cards.

### 4. Favorites & Like Counts

Any authenticated user can add a listing to their favorites.

- The **favorite icon and like counter are combined**:
  - On cards and on the detail page:
    - When in current user’s favorites: **red heart** inside a circular button.
    - Count of favorites (likes) displayed directly under the heart.
  - Large counts are abbreviated (e.g., `1.2K`).

This gives an immediate sense of how much interest a car has attracted.

### 5. Messaging & Chat

Messaging between buyer and seller is implemented as a **threaded chat per listing**.

- Messages can be sent from the car detail page (contact seller).
- Dedicated **Messages** page with:

  1. **Chat selector menu** (top of the page):
     - All conversations (threads) where the user is either sender or receiver.
     - Each thread shows:
       - Seller/buyer avatar (circular image).
       - Name of the other participant.
       - Listing title.
       - Mini photo preview of the car.
       - Unread message count (badge), if any.
     - Threads are visually separated with:
       - Soft rounded borders.
       - Light translucent background tints (emerald, blue, amber, pink) alternating by row.
       - A selected thread is highlighted with a subtle emerald ring and shadow.

  2. **Chat window** (below the selector):
     - Full conversation for the selected thread (all messages for a given listing and user pair).
     - Bubble layout:
       - Right‑aligned, green bubbles for messages sent by the current user.
       - Left‑aligned, light bubbles for messages from the other participant.
     - Timestamps under each bubble.
     - Message input area with a textarea and **Send** button.

The backend exposes:

- `/api/messages/threads` – returns conversation threads with metadata.
- `/api/messages/conversation` – returns full message history for a specific listing + user pair.
- `/api/messages` (POST) – send a new message.

### 6. Profile & My Listings

- **Profile page**:
  - Upload/edit avatar.
  - Edit profile information.
- **My Listings**:
  - View all listings created by the current user.
  - Create, edit, and delete listings.
  - Update photo sets (add new images, remove old ones). Removed images are also reflected on the backend so they no longer appear in galleries.

---

## Tech Stack

### Frontend

- **React** (SPA)
- **React Router** – client‑side routing
- **Axios** – HTTP client
- **Tailwind‑style utility classes** – responsive styling
- **shadcn/ui** for base button component

### Backend

- **FastAPI** – Python web framework
- **MongoDB** – primary data store (via async driver)
- **JWT** – authentication
- Static image serving via a proxied endpoint: `/api/images/{...}`

### Data Model (simplified)

- `users`: `{ id, email, name, password_hash, avatar, ... }`
- `listings`: `{ id, user_id, make, model, year, price, mileage, drive_type, city, zip_code, phone, vin, description, images[], clean_title, created_at }`
- `favorites`: `{ id, user_id, listing_id }`
- `saved_searches`: `{ id, user_id, name, params }`
- `messages`: `{ id, listing_id, sender_id, receiver_id, message, read, created_at }`

---

## Getting Started (Local)

> The exact commands may vary depending on your environment. This is a typical local setup.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Make sure backend/.env contains valid MONGO_URL and DB_NAME values
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

```bash
cd frontend
yarn install
yarn start
```

The frontend expects the backend base URL in `frontend/.env` as:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

> Note: In production / Kubernetes environments, API routes are typically accessed via `/api` prefix and are proxied by the ingress controller.

---

## Screenshots

You can customize this section with actual image files in your repository (for example in a `/screenshots` folder). Below are suggested placeholders:

- **Homepage & Search**

  ```markdown
  ![Homepage and global search bar](screenshots/home.png)
  ```

- **Listing Detail Page**

  ```markdown
  ![Car detail page with CT badge, seller info, and Call Seller button](screenshots/detail.png)
  ```

- **Messages / Chat**

  ```markdown
  ![Messages page with chat selector and conversation window](screenshots/messages.png)
  ```

To use these, add PNG/JPEG files into a `screenshots/` directory at the root of your repo and update filenames if needed.

---

## Roadmap Ideas

Potential future improvements:

- Extended city & ZIP datasets with autocomplete.
- Web push or email notifications for new messages.
- Seller ratings and transaction history.
- Additional filters: body style, engine type, color, etc.
- Advanced analytics for sellers (views, contact rate, etc.).

---

## Contact

If you have questions, suggestions, or would like to collaborate:

- **Project owner:** _[Your Name]_
- **Email:** _[your.email@example.com]_
- **GitHub:** _[https://github.com/your‑username](https://github.com/your-username)_

(Replace the placeholders above with your actual contact information.)

---

## Repository Structure

- `backend/` – FastAPI application, models, routes, and image handling.
- `frontend/` – React SPA, pages, components, and styling.
- `README.md` – this file.

You can use this project as:

- The foundation for your own car marketplace.
- A portfolio piece demonstrating full‑stack skills.
- A reference implementation of a React + FastAPI + MongoDB application with real‑world UX decisions.
