![Deploy](https://img.shields.io/badge/deploy-CubePath-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Hackathon](https://img.shields.io/badge/Hackathon-CubePath_2026-orange)

# Aktivar — Outdoor Activities & Shared Transport Platform
**Connect with people who love the outdoors. Organize activities, share rides, and go on adventures together.**

Aktivar is a platform that connects people who enjoy outdoor activities — running, hiking, cycling, climbing, kayaking, and more. It includes integrated carpooling so groups can share transport costs and reduce their environmental impact. Built with Django, React, and PostGIS for real-time geolocation.

> Hackathon CubePath 2026 — Deployed on CubePath with Docker Compose

### 🌐 **Demo en vivo:** https://aktivar.online
---

## Features

### Activities & Discovery
- **Create and join activities** by category, location, difficulty level, and date
- **Interactive map** with geolocation powered by Leaflet + PostGIS
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
| **Backend** | Django 5, Django REST Framework, Daphne (ASGI) |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Database** | PostgreSQL 16 + PostGIS (geospatial queries) |
| **Cache / Broker** | Redis 7 |
| **Async Tasks** | Celery |
| **WebSocket** | Django Channels + channels-redis |
| **Payments** | Stripe (Checkout, Connect, Subscriptions) |
| **Auth** | JWT (SimpleJWT) + Argon2 password hashing |
| **State Management** | Zustand |
| **Maps** | Leaflet + React-Leaflet |
| **CI/CD** | GitHub Actions (lint, test, build, security audit, Docker) |
| **Monitoring** | Sentry (backend + frontend) |
| **Deployment** | Docker Compose, Nginx, CubePath / Dokploy |

---

## Architecture

```
                        ┌─────────────────────────────────────┐
                        │           Nginx (port 80)           │
                        │  React SPA (static) + Reverse Proxy │
                        └──────────┬──────────────────────────┘
                                   │
                          /api/    │    /ws/
                     ┌─────────────┼─────────────┐
                     │                           │
               ┌─────▼──────┐             ┌──────▼──────┐
               │   Daphne   │             │   Daphne    │
               │  HTTP API  │             │  WebSocket  │
               └─────┬──────┘             └─────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
   ┌─────▼─────┐ ┌──▼───┐ ┌────▼────┐
   │ PostgreSQL │ │Redis │ │ Celery  │
   │ + PostGIS  │ │      │ │ Workers │
   └───────────┘ └──────┘ └─────────┘
```

**Docker services:** `db` · `redis` · `backend` · `celery` · `nginx`

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone

```bash
git clone https://github.com/SilvanoPuccini/aktivar.git
cd aktivar
```

### 2. Configure environment

```bash
cp .env.production.example .env
```

Set the required values:

```bash
SECRET_KEY=<generate-with: python -c "import secrets; print(secrets.token_urlsafe(50))">
POSTGRES_PASSWORD=<strong-password>
```

### 3. Deploy

```bash
docker compose -f dokploy-compose.yml up -d --build
```

The backend automatically runs migrations, collects static files, and seeds demo data on first start.

### 4. Access

| URL | Description |
|-----|-------------|
| `http://localhost` | Application |
| `http://localhost/api/v1/` | REST API |
| `http://localhost/api/v1/health/` | Health check |
| `http://localhost/admin/` | Django Admin |

---

## Deploy on CubePath / Dokploy

1. In Dokploy, create a new project → **Docker Compose**
2. Connect the GitHub repository
3. Set environment variables: `SECRET_KEY` and `POSTGRES_PASSWORD` (minimum)
4. Go to **Domains** tab → generate a subdomain
5. Set **Container Port: 80**, **Service: nginx**
6. Deploy

The `dokploy-compose.yml` file handles everything: PostgreSQL, Redis, backend, Celery, and Nginx with the built-in frontend.

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
- Rate limiting: auth 30/hr, OTP 3/hr, API 100/day (anon)
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

### Smoke tests sobre dominio real (VPS / CubePath)

```bash
# Desde la raíz del repo:
bash scripts/smoke_tests.sh https://tu-dominio.com

# Opcional: validar login también
AUTH_EMAIL=tu_email_de_prueba AUTH_PASSWORD=tu_password_de_prueba \
  bash scripts/smoke_tests.sh https://tu-dominio.com
```

### Verificación guiada auth/register en VPS (500 troubleshooting)

```bash
# Control de conexión total (DNS + HTTPS + API + register probe)
bash scripts/vps_connection_check.sh https://tu-dominio.com

# Opcional: validar login con usuario real
AUTH_EMAIL=tu_email_de_prueba AUTH_PASSWORD=tu_password_de_prueba \
  bash scripts/vps_connection_check.sh https://tu-dominio.com
```

Checklist operativo completo:
- `docs/vps-auth-debug-checklist.md`

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
├── nginx/                    # Nginx config + multi-stage Dockerfile
├── dokploy-compose.yml       # Production Docker Compose
├── docker-compose.yml        # Development Docker Compose
└── scripts/                  # Smoke tests, deployment checks
```

---

## CI/CD

GitHub Actions pipeline with 5 jobs:

1. **backend-test** — Django pytest suite (Python 3.12)
2. **frontend-lint** — ESLint with React Compiler rules
3. **frontend-build** — Production build verification
4. **security-audit** — pip-audit + npm audit
5. **docker-build** — Docker image builds (on push to main)

---

## License

MIT

---

Built for the outdoor community. From Argentina to the world.
