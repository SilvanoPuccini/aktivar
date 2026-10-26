![Deploy](https://img.shields.io/badge/deploy-Render-46E3B7)
![License](https://img.shields.io/badge/license-MIT-blue)
![Hackathon](https://img.shields.io/badge/Hackathon-CubePath_2026-orange)

# 🏔️ Aktivar — Outdoor Activities & Shared Transport Platform
**Connect with people who love the outdoors. Organize activities, share rides, and go on adventures together.**

Aktivar is a platform that connects people who enjoy outdoor activities — running, hiking, cycling, climbing, kayaking, and more. It includes integrated carpooling so groups can share transport costs and reduce their environmental impact. Built with Django and React, with radius-based geolocation search (PostGIS when available, plain PostgreSQL fallback on Neon).

> Built for Hackathon CubePath 2026 — now deployed on Render with a Neon PostgreSQL database

### 🌐 **Demo en vivo:** https://aktivar.online
---

![Aktivar Preview](docs/Aktivar-login.png)

![Aktivar Preview](docs/Aktivar-Hackathon-2026.png)

---
## Features

### Activities & Discovery
- **Create and join activities** by category, location, difficulty level, and date
- **Interactive map** with geolocation powered by Leaflet (PostGIS optional)
- **Smart feed** with recommendations based on your preferred categories
- **Weather forecast** integrated per activity via Open-Meteo API
- **Categories**: Running, Hiking, Cycling, Climbing, Kayak, Skiing, and more

### Shared Transport (Carpooling)
- **Create trips** linked to activities with available seats
- **Automatic cost splitting** among passengers
- **Vehicle management** (brand, model, seats, license plate)

### Real-Time Chat
- **Group chat per activity** via WebSocket (Django Channels)
- **Message reactions**
- **Read receipts** and typing indicators

### Payments
- **Stripe Checkout** for activity fees and transport costs
- **Stripe Connect** for organizer payouts (platform fee model)
- **Subscription management** via Stripe Billing Portal

### Social
- **User profiles** with activity history and ratings
- **Review system** with automatic average rating
- **Squads** — small groups of friends with priority notifications
- **Content moderation** via OpenAI API

### Safety & Trust
- **SOS emergency button** with geolocation alert to all participants
- **Email verification** (Resend API)
- **Phone verification** (Twilio OTP)
- **Emergency contact** required for trip bookings
- **Input sanitization** on all user-generated content (django-bleach)

### Organizer Dashboard
- Participant metrics, revenue tracking, average ratings
- CSV export for activities and statistics
- Direct payouts via Stripe Connect

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 5, Django REST Framework, Uvicorn (ASGI) |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Database** | PostgreSQL on Neon |
| **Async Tasks** | Celery (eager mode in production, no broker) |
| **WebSocket** | Django Channels (in-memory layer in production) |
| **Payments** | Stripe (Checkout, Connect, Subscriptions) |
| **Auth** | JWT (SimpleJWT) + Argon2 password hashing |
| **State Management** | Zustand |
| **Maps** | Leaflet + React-Leaflet |
| **CI/CD** | GitHub Actions (lint, test, build, security audit) |
| **Monitoring** | Sentry (backend + frontend) |
| **Deployment** | Render (web service, `render.yaml` + `build.sh`), Neon (PostgreSQL) |

---

## Architecture

```
            Browser
               │  HTTPS (aktivar.online / aktivar.onrender.com)
               ▼
   ┌───────────────────────────────┐
   │ Render web service            │
   │  Uvicorn (ASGI) + Django      │
   │  ├─ /api/  REST API (DRF)     │
   │  ├─ /ws/   Channels WebSocket │
   │  └─ React SPA (WhiteNoise)    │
   └───────────────┬───────────────┘
                   │
           ┌───────▼────────┐
           │ Neon PostgreSQL│
           └────────────────┘
```

`build.sh` builds the React frontend (Node with verified checksum), collects static files and runs migrations on every deploy.

---

## Local development

See [`docs/local-development.md`](docs/local-development.md) for the Python 3.12 virtualenv and Vite setup.

---

## Deploy (Render + Neon)

1. Create a Neon PostgreSQL database and copy its connection string.
2. In Render, create the service from this repository (`render.yaml` describes it).
3. Set the secret environment variables in the Render dashboard: `DATABASE_URL` (Neon), `SECRET_KEY`, `ADMIN_PASSWORD` and the integration keys listed in `render.yaml`.
4. Deploy. `build.sh` builds the frontend, collects static files and applies migrations.

> If the Render service is not Blueprint-managed, the start command and environment values in the dashboard take precedence over `render.yaml`; keep both in sync.

No demo users are created in production. `load_demo_data` refuses to run with `DEBUG=False`, and every deploy locks any demo account that still uses a password previously published in this repository.

---

## API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/token/` | Login (JWT) |
| POST | `/api/v1/auth/token/refresh/` | Refresh token |
| POST | `/api/v1/users/register/` | Register |
| GET | `/api/v1/users/me/` | Current user profile |
| GET | `/api/v1/activities/` | List activities |
| POST | `/api/v1/activities/` | Create activity |
| GET | `/api/v1/categories/` | List categories |
| GET | `/api/v1/trips/` | List trips |
| GET | `/api/v1/health/` | Health check |

Interactive docs available in development mode at `/api/docs/` (Swagger UI).

---

## Security

- JWT tokens stored in sessionStorage with automatic refresh
- Argon2 password hashing (OWASP recommended)
- Rate limiting: auth 30/hr per real client IP, 10 failed logins per account lock it for 15 min, OTP 3/hr, API 100/day (anon)
- Input sanitization via django-bleach on all user content
- CORS and CSRF protection configured per-environment
- Stripe webhook signature verification
- Content moderation via OpenAI API
- Sentry error monitoring (backend + frontend)
- Security audit in CI: `pip-audit` + `npm audit`
- GDPR-compliant account deletion (`/users/me/delete/`)

---

## Testing

```bash
# Backend tests
cd backend
pytest -v

# With coverage
pytest --cov=. --cov-report=term-missing

# Frontend
cd frontend
npm run lint
npm run build
```

### Smoke tests (production)

```bash
bash scripts/smoke_tests.sh https://your-domain.com
```

Optional login check (use a dedicated test account, never a published credential):

```bash
AUTH_EMAIL=your_test_email AUTH_PASSWORD="$DEMO_USER_PASSWORD" \
  bash scripts/smoke_tests.sh https://aktivar.online
```

---

## 🏁 Hackatón CubePath 2026 — cierre de entrega

Para registrar la participación final, seguí este checklist operativo:

- **Checklist completo:** `docs/hackathon-submission-checklist.md`
- **Auditoría + plan de ejecución:** `docs/project-audit-2026-03.md`

Recordatorio de fecha límite del evento: **31 de marzo de 2026, 23:59:59 (CET)**.

---

## Project Structure

```
aktivar/
├── backend/                  # Django project
│   ├── aktivar/              # Settings, URLs, ASGI config
│   ├── users/                # Auth, registration, profiles
│   ├── activities/           # Activities CRUD, categories
│   ├── transport/            # Trips, vehicles, carpooling
│   ├── chat/                 # WebSocket chat per activity
│   ├── payments/             # Stripe integration
│   ├── reviews/              # Ratings and reviews
│   ├── notifications/        # Push notifications (OneSignal)
│   └── core/                 # Shared utilities, pagination
├── frontend/                 # React + Vite + TypeScript
│   ├── src/features/         # Feature modules (auth, explore, chat...)
│   ├── src/components/       # Shared UI components
│   ├── src/services/         # API client, hooks
│   └── src/stores/           # Zustand state management
├── render.yaml               # Render service definition
├── build.sh                  # Render build: frontend, static files, migrations
└── scripts/                  # Smoke tests
```

---

## CI/CD

GitHub Actions pipeline with 4 jobs:

1. **backend-test** — Django pytest suite (Python 3.12)
2. **frontend-lint** — ESLint with React Compiler rules
3. **frontend-build** — Production build verification
4. **security-audit** — pip-audit + npm audit

---

## License

MIT

---

Built for the outdoor community. From Argentina to the world.
