# CLAUDE.md — Dekat LDR App

You are building **Dekat**, a private LDR companion web app for exactly two users (a couple).
Read PRD.md first and keep it open as your source of truth throughout the build.

---

## Your Mission

Build the complete Phase 1 MVP described in PRD.md. The app must be runnable with a single
`docker compose up --build` command. Do not skip any feature in Phase 1.

---

## Absolute Rules

1. **Never break working code.** Make incremental changes. After each major step, verify the
   relevant parts still work before proceeding.
2. **Follow the PRD exactly.** Do not invent features. Do not omit features. Phase 2 items
   are explicitly excluded.
3. **Mobile-first UI.** Every page must be usable on a 390px-wide screen.
4. **No public registration.** Seed users via management command only.
5. **Use the exact stack** specified in PRD.md. No substitutions.
6. **Environment config via .env.** Never hardcode secrets.

---

## Build Order

Follow this exact sequence. Complete and verify each step before starting the next.

### Step 1 — Project scaffold

Create the full directory structure:
```
dekat/
├── backend/
│   ├── dekat/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── accounts/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── checkins/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── geocoding.py
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── auth.js
│   │   │   └── checkins.js
│   │   ├── components/
│   │   │   ├── DualClock.jsx
│   │   │   ├── CheckInCard.jsx
│   │   │   ├── CheckInModal.jsx
│   │   │   ├── MiniMap.jsx
│   │   │   └── HistoryMap.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── HistoryPage.jsx
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   └── checkinStore.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── nginx/
│   └── default.conf
├── docker-compose.yml
├── .env.example
└── .gitignore
```

### Step 2 — Backend: Django project setup

**`requirements.txt`:**
```
Django==5.0.6
djangorestframework==3.15.2
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.4.0
psycopg2-binary==2.9.9
Pillow==10.4.0
requests==2.32.3
django-environ==0.11.2
gunicorn==22.0.0
```

**`dekat/settings.py`** — key settings:
```python
import environ
env = environ.Env()
environ.Env.read_env()

SECRET_KEY = env('SECRET_KEY', default='dev-secret-key-change-in-prod')
DEBUG = env.bool('DEBUG', default=True)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'accounts',
    'checkins',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # must be first
    'django.middleware.security.SecurityMiddleware',
    # ... rest of default middleware
]

AUTH_USER_MODEL = 'accounts.User'

DATABASES = {
    'default': env.db('DATABASE_URL', default='postgres://postgres:postgres@db:5432/dekat')
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
}

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'http://localhost:5173',
    'http://localhost:3000',
])

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

**`dekat/urls.py`:**
```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/checkins/', include('checkins.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Step 3 — Backend: accounts app

**`accounts/models.py`:**
```python
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    display_name = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    timezone = models.CharField(max_length=50, default='Asia/Jakarta')

    def __str__(self):
        return self.display_name or self.username
```

**`accounts/serializers.py`:**
```python
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'avatar', 'timezone']
```

**`accounts/views.py`:**
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
```

**`accounts/urls.py`:**
```python
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import MeView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
]
```

**`accounts/management/commands/seed_users.py`:**
```python
from django.core.management.base import BaseCommand
from accounts.models import User

class Command(BaseCommand):
    help = 'Seed initial two users for the couple'

    def handle(self, *args, **kwargs):
        if User.objects.count() >= 2:
            self.stdout.write('Users already seeded.')
            return

        User.objects.create_superuser(
            username='fathul',
            display_name='Fathul',
            timezone='Asia/Makassar',
            password='changeme123',
            email='fathul@dekat.app'
        )
        User.objects.create_user(
            username='sayang',
            display_name='Sayang',
            timezone='Asia/Makassar',
            password='changeme123',
            email='sayang@dekat.app'
        )
        self.stdout.write(self.style.SUCCESS('Users created: fathul / sayang'))
```

### Step 4 — Backend: checkins app

**`checkins/geocoding.py`:**
```python
import requests
import logging

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
HEADERS = {"User-Agent": "Dekat-App/1.0 (ldr-companion)"}

def reverse_geocode(lat, lon):
    """
    Call Nominatim to get place info from coordinates.
    Returns (place_name, place_type, display_address) tuple.
    Falls back gracefully on error.
    """
    try:
        response = requests.get(
            NOMINATIM_URL,
            params={"lat": lat, "lon": lon, "format": "json"},
            headers=HEADERS,
            timeout=5
        )
        response.raise_for_status()
        data = response.json()

        address = data.get("address", {})
        place_name = (
            data.get("name")
            or address.get("amenity")
            or address.get("building")
            or address.get("road")
            or data.get("display_name", "").split(",")[0]
            or "Unknown place"
        )
        place_type = (
            address.get("amenity")
            or data.get("type")
            or data.get("class")
            or "place"
        )
        display_address = data.get("display_name", "")
        return place_name, place_type, display_address

    except Exception as e:
        logger.warning(f"Nominatim geocoding failed: {e}")
        return "Unknown place", "place", ""
```

**`checkins/models.py`:**
```python
import uuid
from django.db import models
from django.conf import settings

class CheckIn(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='checkins'
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    place_name = models.CharField(max_length=255)
    place_type = models.CharField(max_length=100, default='place')
    note = models.TextField(max_length=200, blank=True)
    mood_emoji = models.CharField(max_length=10, blank=True)
    photo = models.ImageField(upload_to='checkins/', null=True, blank=True)
    checked_in_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-checked_in_at']

    def __str__(self):
        return f"{self.user.display_name} @ {self.place_name}"
```

**`checkins/serializers.py`:**
```python
from rest_framework import serializers
from .models import CheckIn
from accounts.serializers import UserSerializer

class CheckInSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CheckIn
        fields = [
            'id', 'user', 'latitude', 'longitude',
            'place_name', 'place_type', 'note', 'mood_emoji',
            'photo', 'checked_in_at'
        ]
        read_only_fields = ['id', 'user', 'checked_in_at']

class CheckInCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = ['latitude', 'longitude', 'place_name', 'place_type', 'note', 'mood_emoji', 'photo']
```

**`checkins/views.py`:**
```python
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import CheckIn
from .serializers import CheckInSerializer, CheckInCreateSerializer
from .geocoding import reverse_geocode

User = get_user_model()


class ReverseGeocodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        if not lat or not lon:
            return Response({'error': 'latitude and longitude required'}, status=400)
        place_name, place_type, display_address = reverse_geocode(lat, lon)
        return Response({
            'place_name': place_name,
            'place_type': place_type,
            'display_address': display_address
        })


class CheckInListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = CheckIn.objects.select_related('user').all()
        user_filter = self.request.query_params.get('user')
        date_filter = self.request.query_params.get('date')
        if user_filter == 'me':
            qs = qs.filter(user=self.request.user)
        elif user_filter == 'partner':
            partner = User.objects.exclude(id=self.request.user.id).first()
            if partner:
                qs = qs.filter(user=partner)
        if date_filter:
            qs = qs.filter(checked_in_at__date=date_filter)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CheckInCreateSerializer
        return CheckInSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Return full serialized response
        full = CheckInSerializer(serializer.instance)
        return Response(full.data, status=status.HTTP_201_CREATED)


class LatestCheckInsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        me = request.user
        partner = User.objects.exclude(id=me.id).first()

        my_last = CheckIn.objects.filter(user=me).first()
        partner_last = CheckIn.objects.filter(user=partner).first() if partner else None

        return Response({
            'me': CheckInSerializer(my_last).data if my_last else None,
            'partner': CheckInSerializer(partner_last).data if partner_last else None,
        })


class CheckInMapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        checkins = CheckIn.objects.select_related('user').all()
        data = [
            {
                'id': str(c.id),
                'latitude': float(c.latitude),
                'longitude': float(c.longitude),
                'place_name': c.place_name,
                'place_type': c.place_type,
                'note': c.note,
                'mood_emoji': c.mood_emoji,
                'checked_in_at': c.checked_in_at.isoformat(),
                'user_display_name': c.user.display_name,
                'user_id': str(c.user.id),
            }
            for c in checkins
        ]
        return Response(data)
```

**`checkins/urls.py`:**
```python
from django.urls import path
from .views import (
    ReverseGeocodeView,
    CheckInListCreateView,
    LatestCheckInsView,
    CheckInMapView,
)

urlpatterns = [
    path('', CheckInListCreateView.as_view(), name='checkin-list-create'),
    path('reverse-geocode/', ReverseGeocodeView.as_view(), name='reverse-geocode'),
    path('latest/', LatestCheckInsView.as_view(), name='latest-checkins'),
    path('map/', CheckInMapView.as_view(), name='checkin-map'),
]
```

### Step 5 — Backend: Dockerfile

**`backend/Dockerfile`:**
```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p media staticfiles

CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_users && python manage.py collectstatic --noinput && gunicorn dekat.wsgi:application --bind 0.0.0.0:8000"]
```

### Step 6 — Frontend: Setup

**`package.json`:**
```json
{
  "name": "dekat-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.1",
    "axios": "^1.7.4",
    "zustand": "^4.5.5",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "date-fns": "^3.6.0",
    "date-fns-tz": "^3.1.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^3.4.10",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "vite": "^5.4.1"
  }
}
```

**`vite.config.js`:**
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://backend:8000',
        changeOrigin: true,
      }
    }
  }
})
```

**`tailwind.config.js`:**
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7F77DD',
        'primary-dark': '#534AB7',
        accent: '#D85A30',
        surface: '#FAFAF8',
      }
    }
  },
  plugins: []
}
```

### Step 7 — Frontend: API client & stores

**`src/api/client.js`:**
```js
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const res = await axios.post('/api/auth/refresh/', { refresh })
          localStorage.setItem('access_token', res.data.access)
          original.headers.Authorization = `Bearer ${res.data.access}`
          return client(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default client
```

**`src/api/auth.js`:**
```js
import client from './client'

export const login = (username, password) =>
  client.post('/api/auth/login/', { username, password })

export const getMe = () =>
  client.get('/api/auth/me/')
```

**`src/api/checkins.js`:**
```js
import client from './client'

export const reverseGeocode = (latitude, longitude) =>
  client.post('/api/checkins/reverse-geocode/', { latitude, longitude })

export const createCheckIn = (data) =>
  client.post('/api/checkins/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  })

export const getLatest = () =>
  client.get('/api/checkins/latest/')

export const getCheckIns = (params = {}) =>
  client.get('/api/checkins/', { params })

export const getMapCheckIns = () =>
  client.get('/api/checkins/map/')
```

**`src/store/authStore.js`:**
```js
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    localStorage.clear()
    set({ user: null, isAuthenticated: false })
  },
}))
```

### Step 8 — Frontend: Pages

**`src/pages/LoginPage.jsx`:**
- Centered card with app name "Dekat" and a tagline
- Username + password fields
- Submit button — calls `login()` API, stores tokens in localStorage, redirects to `/`
- Handle loading and error states

**`src/pages/DashboardPage.jsx`:**
- Import and use `DualClock`, `CheckInCard`, `CheckInModal`
- On mount: call `getLatest()`, store results in local state
- Poll `getLatest()` every 30 seconds using `setInterval` in `useEffect` (clear on unmount)
- Layout (mobile-first):
  ```
  [DualClock — full width]
  [Quick check-in button — full width, purple, prominent]
  [Partner's last check-in card]
  [My last check-in card]
  ```
- Check-in button opens `CheckInModal`
- After successful check-in, call `getLatest()` immediately to refresh dashboard

**`src/pages/HistoryPage.jsx`:**
- Two tabs: "Timeline" and "Map"
- Timeline tab: filter buttons (All / Me / Partner), then list of `CheckInCard` grouped by date
- Map tab: renders `HistoryMap`
- Pagination: load 20 items, "Load more" button if `next` is not null

### Step 9 — Frontend: Components

**`src/components/DualClock.jsx`:**
```jsx
// Two side-by-side clock cards
// Props: meUser { display_name, timezone }, partnerUser { display_name, timezone }
// Use date-fns-tz: formatInTimeZone(new Date(), timezone, 'HH:mm:ss')
// useEffect with setInterval(1000) to tick
// Show: display_name, current time (HH:mm:ss), date (EEE, d MMM), timezone name
```

**`src/components/CheckInCard.jsx`:**
```jsx
// Props: checkin object (from API), isMe (bool)
// Shows:
//   - User avatar initial circle (purple for me, coral for partner)
//   - display_name + place_type icon (from PLACE_ICONS map)
//   - place_name (bold)
//   - time ago using date-fns formatDistanceToNow
//   - note (if present, italicized)
//   - mood_emoji (if present)
//   - MiniMap component below (small, 120px tall)
// If checkin is null: show "No check-in yet" placeholder
```

**`src/components/MiniMap.jsx`:**
```jsx
// Props: latitude, longitude, place_name
// Small Leaflet map (height: 120px), non-interactive (zoomControl=false, dragging=false)
// Single marker at coordinates
// Use OpenStreetMap tiles: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
// Important: import 'leaflet/dist/leaflet.css' in this component
// Fix default Leaflet marker icon (common Vite issue):
//   import L from 'leaflet'
//   import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
//   import markerIcon from 'leaflet/dist/images/marker-icon.png'
//   import markerShadow from 'leaflet/dist/images/marker-shadow.png'
//   delete L.Icon.Default.prototype._getIconUrl
//   L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })
```

**`src/components/CheckInModal.jsx`:**
```jsx
// Props: isOpen, onClose, onSuccess
// Internal state: loading, step ('locating' | 'confirm'), coords, placeData, note, moodEmoji
// Step 1 — 'locating':
//   - Auto-trigger navigator.geolocation.getCurrentPosition on open
//   - Show spinner "Getting your location..."
//   - On success: call reverseGeocode API, transition to 'confirm'
//   - On error: show error message with retry button
// Step 2 — 'confirm':
//   - Show place_name in an editable input (pre-filled from geocode result)
//   - Textarea for note (max 200 chars, char counter)
//   - Emoji picker: row of clickable emojis ["😊","😴","🍜","💪","☕","🏠","💼","😔","🥰","😤"]
//   - Submit button — calls createCheckIn, on success: onSuccess(), onClose()
// Full-screen modal on mobile (bottom sheet style), centered on desktop
```

**`src/components/HistoryMap.jsx`:**
```jsx
// Full-height Leaflet map (height: calc(100vh - 120px))
// Fetches /api/checkins/map/ on mount
// Two colored circle markers:
//   - Purple (#7F77DD) for current user
//   - Coral (#D85A30) for partner
// Use L.circleMarker for colored dots
// Each marker opens a popup: place_name, note, mood_emoji, time ago, user display_name
// Auto-fit bounds to all markers on load
```

**`src/components/NavBar.jsx`:**
```jsx
// Simple bottom navigation bar (mobile-first)
// Links: Home (/) and History (/history)
// Shows display_name and logout button
```

### Step 10 — Frontend: App routing

**`src/App.jsx`:**
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import NavBar from './components/NavBar'
import { useEffect } from 'react'
import { getMe } from './api/auth'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { isAuthenticated, setUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      getMe().then((res) => setUser(res.data)).catch(() => {})
    }
  }, [isAuthenticated])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <div className="pb-16"> {/* padding for bottom nav */}
              <DashboardPage />
              <NavBar />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <div className="pb-16">
              <HistoryPage />
              <NavBar />
            </div>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**`src/main.jsx`:**
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**`src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #FAFAF8;
}
```

**`frontend/Dockerfile`:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`frontend/nginx-frontend.conf`:**
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 11 — Nginx + Docker Compose

**`nginx/default.conf`:**
```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /media/ {
        proxy_pass http://backend;
    }

    location /static/ {
        proxy_pass http://backend;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
    }
}
```

**`docker-compose.yml`:**
```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: dekat
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    env_file: .env
    volumes:
      - media_files:/app/media
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  media_files:
```

**`.env.example`:**
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://postgres:postgres@db:5432/dekat
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:80,http://localhost
```

**`.gitignore`:**
```
.env
__pycache__/
*.pyc
*.pyo
node_modules/
dist/
media/
staticfiles/
*.sqlite3
```

---

## Verification Checklist

After completing all steps, verify each item works:

### Backend
- [ ] `docker compose up --build` completes without errors
- [ ] `GET /api/auth/me/` returns 401 without token
- [ ] `POST /api/auth/login/` with `fathul/changeme123` returns access + refresh tokens
- [ ] `GET /api/auth/me/` with token returns user data
- [ ] `POST /api/checkins/reverse-geocode/` with test coords returns place data
- [ ] `POST /api/checkins/` creates a check-in
- [ ] `GET /api/checkins/latest/` returns both users' latest check-ins
- [ ] `GET /api/checkins/map/` returns all check-ins for map

### Frontend
- [ ] `/login` page renders, login works, redirects to `/`
- [ ] Dashboard shows dual clocks updating every second
- [ ] Dashboard shows latest check-in cards for both users
- [ ] Check-in button triggers geolocation, shows confirmation modal
- [ ] Submitting check-in refreshes dashboard
- [ ] `/history` timeline tab shows grouped check-ins
- [ ] `/history` map tab renders Leaflet map with colored pins
- [ ] Logout clears tokens and redirects to `/login`
- [ ] All pages are usable on 390px mobile width

---

## Common Issues & Fixes

**Leaflet marker icons broken in Vite:** Fix in `MiniMap.jsx` and `HistoryMap.jsx` as described in Step 9.

**CORS errors in dev:** Ensure `CORS_ALLOWED_ORIGINS` includes `http://localhost:5173`. The Vite proxy handles this in dev, but set it correctly for production too.

**Nominatim rate limiting:** Nominatim allows 1 req/sec. This is fine for a 2-user app. Add a `time.sleep(1)` in the geocoding function if needed.

**JWT tokens not refreshing:** Check that the Axios interceptor in `client.js` is correctly catching 401s and using the refresh token.

**Leaflet CSS not loading:** Must import `leaflet/dist/leaflet.css` in the component that uses MapContainer, not in main.jsx.

**Django MEDIA files not served in prod:** Nginx must proxy `/media/` to backend, and `MEDIA_ROOT` must be a shared volume between backend and nginx — handled by `media_files` volume in docker-compose.yml.
