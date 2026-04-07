# Product Requirements Document — Dekat (LDR Companion App)

## Overview

**Product Name:** Dekat  
**Tagline:** Bridging distance, one moment at a time.  
**Type:** Private web application — 2 users only (a couple in a long-distance relationship)  
**Stack:** Django 5.x + Django REST Framework · React 18 + Vite · PostgreSQL · Docker

---

## Problem Statement

Long-distance couples struggle with three core pain points:
1. **Timezone disorientation** — not knowing what the partner is doing or when to reach out
2. **Emotional disconnection** — lack of shared daily rituals and spontaneous moments
3. **No shared activity space** — nothing to do *together* from a distance

---

## Target Users

Exactly two users: a couple. No registration flow, no social features. The app is pre-seeded with two accounts via a management command. Both users are authenticated via username/password JWT.

---

## Tech Stack

### Backend
- Python 3.12
- Django 5.x
- Django REST Framework (DRF)
- SimpleJWT for authentication
- PostgreSQL 15
- django-cors-headers
- Pillow (image handling)
- requests (for Nominatim reverse geocoding)
- django-environ (env vars)
- Gunicorn (production WSGI)

### Frontend
- React 18 + Vite
- React Router v6
- Axios (API client)
- Tailwind CSS v3
- Leaflet.js + react-leaflet (map display)
- date-fns (time formatting)
- Zustand (global state)

### Infrastructure
- Docker + Docker Compose
- Nginx (reverse proxy in production)
- `.env` file for secrets

---

## Application Structure

```
dekat/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── dekat/              # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── accounts/           # User model, auth endpoints
│   ├── checkins/           # Check-in feature
│   ├── core/               # Shared utilities
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios client + endpoint functions
│   │   ├── components/     # Shared UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── store/          # Zustand stores
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── nginx/
│   └── default.conf
└── docker-compose.yml
```

---

## Features — Phase 1 (MVP)

### F-01: Authentication

**Endpoints:**
- `POST /api/auth/login/` — returns access + refresh JWT tokens
- `POST /api/auth/refresh/` — refresh token rotation
- `GET /api/auth/me/` — returns current user profile

**Requirements:**
- Pre-seeded users via `python manage.py seed_users` — no public registration
- JWT stored in `localStorage` on frontend
- Axios interceptor auto-attaches `Authorization: Bearer <token>` header
- If token expired, auto-refresh using refresh token; if refresh fails, redirect to `/login`
- Login page is the only unauthenticated route

**User model fields:**
```
id (UUID)
username
display_name        # e.g. "Fathul" or "Sayang"
avatar              # ImageField, nullable
timezone            # CharField, e.g. "Asia/Makassar"
created_at
```

---

### F-02: Home Dashboard

The main screen after login. Shows:
1. **Dual clock widget** — current time for both users, using their respective timezone fields. Auto-updates every second.
2. **Partner's last check-in card** — most recent check-in of the partner (place name, time ago, optional note, mini static map via Leaflet).
3. **My last check-in card** — same layout for own last check-in.
4. **Quick check-in button** — prominent CTA to trigger F-03 flow.

**API needed:**
- `GET /api/checkins/latest/` — returns last check-in for both users `{ me: {...}, partner: {...} }`

---

### F-03: Check-in Feature

The core feature of Phase 1. Allows each user to voluntarily log their current location with an optional note.

#### User Flow
1. User taps "Check in" button
2. Frontend requests browser geolocation (`navigator.geolocation.getCurrentPosition`)
3. Coordinates sent to backend → backend calls Nominatim reverse geocoding
4. Backend returns suggested place name + place type to frontend
5. User sees a confirmation modal: place name (editable), optional text note (max 200 chars), optional emoji mood (from a predefined set)
6. User confirms → check-in saved → partner's dashboard refreshes (via polling every 30s)

#### Check-in Model (`checkins_checkin`)
```
id              UUID, primary key
user            FK → User
latitude        DecimalField(max_digits=9, decimal_places=6)
longitude       DecimalField(max_digits=9, decimal_places=6)
place_name      CharField(max_length=255)       # from Nominatim or user-edited
place_type      CharField(max_length=100)       # e.g. restaurant, cafe, home, office
note            TextField(max_length=200, blank=True)
mood_emoji      CharField(max_length=10, blank=True)  # e.g. "😊", "😴", "🍜"
photo           ImageField(upload_to='checkins/', null=True, blank=True)
checked_in_at   DateTimeField(auto_now_add=True)
```

#### API Endpoints
```
POST /api/checkins/reverse-geocode/
  Body: { latitude, longitude }
  Returns: { place_name, place_type, display_address }
  Note: calls Nominatim internally, never expose raw coords to frontend geocoding

POST /api/checkins/
  Body: { latitude, longitude, place_name, place_type, note, mood_emoji, photo (optional) }
  Returns: created check-in object
  Auth: required

GET /api/checkins/
  Returns: paginated list of ALL check-ins by both users, ordered by -checked_in_at
  Query params: ?user=me|partner&date=YYYY-MM-DD
  Auth: required

GET /api/checkins/latest/
  Returns: { me: <last checkin|null>, partner: <last checkin|null> }
  Auth: required
```

#### Reverse Geocoding Implementation
```python
# Use Nominatim (free, no API key needed)
# Endpoint: https://nominatim.openstreetmap.org/reverse
# Params: lat, lon, format=json
# Required header: User-Agent: Dekat-App/1.0

def reverse_geocode(lat, lon):
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {"lat": lat, "lon": lon, "format": "json"}
    headers = {"User-Agent": "Dekat-App/1.0"}
    response = requests.get(url, params=params, headers=headers, timeout=5)
    data = response.json()
    place_name = data.get("name") or data.get("address", {}).get("amenity") or data.get("display_name", "").split(",")[0]
    place_type = data.get("type") or data.get("class") or "place"
    display_address = data.get("display_name", "")
    return place_name, place_type, display_address
```

---

### F-04: Check-in History & Map

**Page: `/history`**

Two sub-views toggled by a tab:

**Timeline view:**
- Chronological list of all check-ins by both users
- Each entry shows: avatar initial + display_name, place_name, place_type icon, mood_emoji, time ago, note (if any)
- Grouped by date ("Today", "Yesterday", "Monday, 7 Apr")
- Filter by person: All / Me / Partner
- Paginated (20 per page, load more button)

**Map view:**
- Leaflet map showing all check-in pins
- Two pin colors: purple for self, pink/coral for partner
- Clicking a pin shows a popup with place_name, note, time
- Default center: midpoint between the two latest check-ins

**API needed:**
- `GET /api/checkins/` with query params as described above
- `GET /api/checkins/map/` — returns all check-ins with only `{ id, latitude, longitude, place_name, place_type, note, mood_emoji, checked_in_at, user_display_name }` for map rendering (no pagination)

---

## Features — Phase 2 (Post-MVP, spec only — do not build)

These are defined here for awareness but should NOT be implemented in Phase 1:

- **F-05: Daily Question** — one prompt per day, both must answer, answers revealed after both submit
- **F-06: Love Letters** — rich text + photo messages stored separately from check-ins
- **F-07: Countdown Timer** — to next meetup date
- **F-08: Mood Tracker** — daily mood log separate from check-in
- **F-09: Shared Journal** — private diary entries visible to both
- **F-10: Memory Board** — photo collage of favorite moments

---

## UI/UX Requirements

### Design System
- **Color palette:** Soft, warm, intimate — not clinical. Primary: soft purple `#7F77DD`. Accent: coral `#D85A30`. Background: off-white `#FAFAF8`.
- **Typography:** System font stack, readable, no decorative fonts
- **Responsive:** Mobile-first. The app is primarily used on phones.
- **Dark mode:** Optional — implement only if time allows

### Key UI Components
- `DualClock` — two clocks side by side, updates every second
- `CheckInCard` — displays a single check-in (used on dashboard + history)
- `CheckInModal` — confirmation dialog before submitting check-in
- `MiniMap` — small Leaflet map showing a single pin (used in CheckInCard)
- `HistoryMap` — full Leaflet map with all pins

### Place Type Icons
Map `place_type` string to an icon/emoji in the frontend:
```js
const PLACE_ICONS = {
  restaurant: "🍽️",
  cafe: "☕",
  fast_food: "🍔",
  home: "🏠",
  office: "💼",
  school: "📚",
  hospital: "🏥",
  mall: "🛍️",
  park: "🌿",
  gym: "💪",
  default: "📍"
}
```

---

## API Design Conventions

- All endpoints prefixed with `/api/`
- Authentication: `Authorization: Bearer <access_token>` header
- Response format: JSON
- Dates: ISO 8601 (`2025-04-07T14:30:00+08:00`)
- Error format: `{ "error": "message" }` with appropriate HTTP status
- File uploads: `multipart/form-data`
- Pagination: `{ "count": N, "next": url|null, "previous": url|null, "results": [...] }`

---

## Environment Variables

```env
# Backend
SECRET_KEY=
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://user:pass@db:5432/dekat
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:80

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

---

## Seed Data

`python manage.py seed_users` should create:
```python
User(username="fathul", display_name="Fathul", timezone="Asia/Makassar", password="changeme123")
User(username="sayang", display_name="Sayang", timezone="Asia/Makassar", password="changeme123")
```

---

## Docker Compose Services

```yaml
services:
  db:        PostgreSQL 15
  backend:   Django + Gunicorn on port 8000
  frontend:  Vite dev server on port 5173 (dev) / Nginx static (prod)
  nginx:     Reverse proxy — /api/ → backend, / → frontend
```

---

## Definition of Done (Phase 1)

- [ ] Both users can log in and stay logged in across sessions
- [ ] Dashboard shows dual clocks updating live
- [ ] Dashboard shows partner's last check-in (place, time, note)
- [ ] Check-in flow works: GPS → geocode → confirm modal → save
- [ ] Check-in is visible on partner's dashboard within 30 seconds (polling)
- [ ] History page shows timeline of all check-ins, filterable
- [ ] History map shows all check-in pins with popups
- [ ] App is fully functional on mobile browser
- [ ] Docker Compose `up` starts the entire stack
