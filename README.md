# 🏔️ Aktivar — LATAM Outdoor Community Platform

**Conecta con la comunidad outdoor de Latinoamérica. Actividades, transporte compartido y aventura.**

Aktivar es una plataforma que conecta personas apasionadas por las actividades al aire libre en Latinoamérica. Organiza senderismo, escalada, ciclismo, kayak y más, con transporte compartido integrado (carpooling) para llegar juntos a la aventura.

---

## ✨ Features

### Core
- **Actividades outdoor**: Crea, busca y únete a actividades por categoría, ubicación y dificultad
- **Mapa interactivo**: Explora actividades geolocalizadas con Leaflet + PostGIS
- **Transporte compartido**: Carpooling integrado con split de costos automático
- **Chat en tiempo real**: WebSocket chat grupal por actividad con reactions
- **Pagos**: Stripe Checkout + Connect para organizadores (10% platform fee)

### Social
- **Stories**: Fotos de actividades completadas (48h TTL)
- **Squads**: Grupos de hasta 8 amigos con notificaciones prioritarias
- **Swipe to match**: Desliza actividades y matchea con otros interesados
- **Reviews**: Sistema de reseñas con rating promedio automático

### Safety
- **Botón de emergencia SOS**: Alerta con geolocalización a todos los participantes
- **Verificación**: Email (Resend) + teléfono (Twilio OTP)
- **Moderación de contenido**: OpenAI API antes de publicar
- **Contacto de emergencia**: Requerido para reservar viajes

### Organizer Tools
- **Dashboard**: Métricas de participantes, ingresos, ratings
- **CSV Export**: Exporta actividades y estadísticas
- **Stripe Connect**: Pagos directos a organizadores
- **Billing Portal**: Gestión de suscripciones

### Technical
- **PWA**: Instalable con offline support y push notifications
- **i18n**: Español + Portugués (extensible a todo LATAM)
- **Weather API**: Open-Meteo forecast integrado por actividad
- **Algorithmic Feed**: Recomendaciones por afinidad de categorías
- **SEO**: Sitemap XML dinámico + Open Graph meta tags

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 5 + DRF + Daphne (ASGI) |
| **Frontend** | React 19 + TypeScript + Vite + TailwindCSS |
| **Database** | PostgreSQL 16 + PostGIS |
| **Cache/Broker** | Redis 7 |
| **Tasks** | Celery |
| **WebSocket** | Django Channels |
| **Payments** | Stripe (Checkout + Connect + Subscriptions) |
| **Auth** | JWT (SimpleJWT) + Argon2 |
| **State** | Zustand + React Query |
| **Maps** | Leaflet + React-Leaflet |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Sentry (backend + frontend) |
| **Deploy** | Docker Compose + Nginx + Certbot SSL |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone & Setup
```bash
git clone https://github.com/SilvanoPuccini/aktivar.git
cd aktivar
cp .env.production.example .env
```

### 2. Edit .env
```bash
# Generate a secret key
python -c "import secrets; print(secrets.token_urlsafe(50))"

# Set minimum required values in .env:
SECRET_KEY=your-generated-key
POSTGRES_PASSWORD=your-secure-password
ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

### 3. Deploy
```bash
docker compose up -d --build
```

### 4. Seed Demo Data
```bash
docker compose exec backend python manage.py seed_demo
```

### 5. Access
- **App**: http://localhost (or your domain)
- **API**: http://localhost/api/v1/
- **Admin**: http://localhost/admin/
- **Demo login**: `demo@aktivar.app` / `aktivar2024`

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React SPA  │────▶│    Nginx     │────▶│   Daphne     │
│  (PWA + i18n)│     │  (SSL + WS)  │     │  (ASGI)      │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                          ┌───────────────────────┼───────────────┐
                          │                       │               │
                    ┌─────▼─────┐          ┌──────▼──────┐  ┌────▼────┐
                    │ PostgreSQL │          │    Redis    │  │ Celery  │
                    │ + PostGIS  │          │ Cache+Broker│  │ Workers │
                    └───────────┘          └─────────────┘  └─────────┘
```

---

## 🔐 Security

- JWT tokens in sessionStorage (not localStorage)
- Argon2 password hashing
- HTTPS + HSTS (TLS 1.2+1.3)
- Strict CORS configuration
- Input sanitization (django-bleach) on all user inputs
- Stripe webhook signature verification with idempotency
- GDPR-compliant soft delete (`/users/me/delete/`)
- Rate limiting (auth: 5/hr, OTP: 3/hr, join: 10/hr)
- Content moderation via OpenAI API
- Sentry error monitoring (backend + frontend)
- Dependabot + pip-audit + npm audit in CI

---

## 🧪 Tests

```bash
# Run all 53 tests
cd backend
pytest -v

# With coverage
pytest --cov=. --cov-report=term-missing
```

### Smoke tests sobre dominio real (VPS / CubePath)

```bash
# Desde la raíz del repo:
bash scripts/smoke_tests.sh https://tu-dominio.com

# Opcional: validar login también
AUTH_EMAIL=tu_email_de_prueba AUTH_PASSWORD=tu_password_de_prueba \
  bash scripts/smoke_tests.sh https://tu-dominio.com
```

---

## 🏁 Hackatón CubePath 2026 — cierre de entrega

Para registrar la participación final, seguí este checklist operativo:

- **Checklist completo:** `docs/hackathon-submission-checklist.md`
- **Auditoría + plan de ejecución:** `docs/project-audit-2026-03.md`

Recordatorio de fecha límite del evento: **31 de marzo de 2026, 23:59:59 (CET)**.

---

## 📝 API Documentation

Interactive API docs available at:
- **Swagger UI**: `/api/schema/swagger-ui/`
- **ReDoc**: `/api/schema/redoc/`

---

## 🌍 i18n

Currently supported languages:
- 🇪🇸 Español (default)
- 🇧🇷 Português

Add new languages by creating a JSON file in `frontend/src/i18n/locales/`.

---

## 📄 License

MIT

---

Built with ❤️ for the LATAM outdoor community.
