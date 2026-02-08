# NextRides.com — Application Documentation

> This document describes the web application used as the **System Under Test (SUT)** for the QA automation portfolio.

🌐 **Live Application**: [nextrides-frontend.onrender.com](https://nextrides-frontend.onrender.com)

---

## Overview

**NextRides.com** is a modern car classifieds platform where users can:
- **Sellers**: Create listings, upload photos, manage their inventory
- **Buyers**: Search cars, save favorites, contact sellers

The application is built as a real product with production-ready features, not just a demo.

---

## Core Features

### 1. User Accounts & Authentication

- Email + password registration
- JWT-based authentication
- Public user profiles with avatar and listings

### 2. Car Listings

Each listing includes:
- **Photos**: Minimum 1, maximum 10MB per image (auto-compressed to <500KB)
- **Vehicle details**: Make, Model, Year, Mileage, Price
- **Drive type**: FWD / RWD / AWD / 4WD
- **Location**: City (dropdown), ZIP code (5-digit validation)
- **Contact**: Phone number (validated)
- **VIN**: Vehicle Identification Number
- **Description**: 30–1000 characters
- **Clean Title**: Yes/No status with visual badge

### 3. Search & Filters

- **Global search bar**: "Go Search!" button on all pages
- **Filters**: Make, Model, Year range, Mileage, Price, Drive type, Clean Title, ZIP + distance
- **Results**: Responsive grid with up to 16 listings

### 4. Favorites System

- Add/remove listings to favorites
- Like counter displayed on cards and detail pages
- Large counts abbreviated (e.g., `1.2K`)

### 5. Messaging

- Threaded chat per listing
- Conversation history
- Unread message indicators

### 6. User Profile

- Edit profile information
- Upload/change avatar
- View own listings

---

## Technical Architecture

### Frontend
- **Framework**: React (SPA)
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (async driver)
- **Authentication**: JWT tokens
- **Image handling**: Pillow for compression

### Data Model

```
users:      { id, email, name, password_hash, avatar }
listings:   { id, user_id, make, model, year, price, mileage, 
              drive_type, city, zip_code, phone, vin, 
              description, images[], clean_title, created_at }
favorites:  { id, user_id, listing_id }
messages:   { id, listing_id, sender_id, receiver_id, 
              message, read, created_at }
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | Get all listings (with filters) |
| GET | `/api/listings/{id}` | Get single listing |
| POST | `/api/listings` | Create listing |
| PUT | `/api/listings/{id}` | Update listing |
| DELETE | `/api/listings/{id}` | Delete listing |

### Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | Get user's favorites |
| POST | `/api/favorites/{listing_id}` | Add to favorites |
| DELETE | `/api/favorites/{listing_id}` | Remove from favorites |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/threads` | Get conversation threads |
| GET | `/api/messages/conversation` | Get messages in thread |
| POST | `/api/messages` | Send message |

📖 **Full API documentation**: [Swagger UI](https://nextrides-backend.onrender.com/api/docs)

---

## Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Render.com (Static Site) | [nextrides-frontend.onrender.com](https://nextrides-frontend.onrender.com) |
| Backend | Render.com (Web Service) | [nextrides-backend.onrender.com](https://nextrides-backend.onrender.com) |
| Database | MongoDB Atlas | Cloud-hosted |

---

## Known Limitations

⚠️ **Image Storage**: Currently uses Render's ephemeral filesystem. Images are lost on redeployment. Production solution would use cloud storage (S3, GCS).

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

---

<div align="center">

**[← Back to Main README](../README.md)** • **[🌐 Live App](https://nextrides-frontend.onrender.com)** • **[📖 API Docs](https://nextrides-backend.onrender.com/api/docs)**

</div>
