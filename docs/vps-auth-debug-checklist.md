# Verificación guiada VPS (aktivar.online)

Guía rápida para detectar y cerrar errores `500` en registro/login (`/api/v1/users/register/` y `/api/v1/auth/token/`) y hacer un control total de conexión.

---

## 1) Chequeo externo (desde tu máquina)

```bash
# Smoke general
bash scripts/smoke_tests.sh https://aktivar.online

# Control de conexión + auth/register
bash scripts/vps_connection_check.sh https://aktivar.online
```

Si querés validar login real:

```bash
AUTH_EMAIL=tu_email AUTH_PASSWORD=tu_password \
  bash scripts/vps_connection_check.sh https://aktivar.online
```

---

## 2) Chequeo interno en el VPS (Dokploy / Docker)

Entrá al servidor y corré:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker compose ps
```

Servicios esperados: `nginx`, `backend`, `db`, `redis`, `celery_worker`.

---

## 3) Logs mínimos para diagnosticar el 500 de register

```bash
# Backend (errores de Django/DRF)
docker compose logs backend --tail=300

# Nginx (status code, upstream)
docker compose logs nginx --tail=300
```

Filtrar eventos de registro/login:

```bash
docker compose logs backend --tail=500 | grep -Ei "register|registration|auth|token|integrity|traceback"
docker compose logs nginx --tail=500 | grep -E "POST /api/v1/users/register/|POST /api/v1/auth/token/"
```

---

## 4) Causas típicas del `500` en `/register/` y cómo cerrarlas

1. **DB caída o sin migraciones**
   - `docker compose exec backend python manage.py migrate`
   - `docker compose exec backend python manage.py check`

2. **Redis no accesible (throttle/cache/celery)**
   - `docker compose exec backend python manage.py shell -c "from django.core.cache import cache; cache.set('ping','ok',30); print(cache.get('ping'))"`

3. **Variables de entorno incompletas**
   - Revisar `.env` de producción: `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, DB y Redis.

4. **Error de constraint (email/teléfono repetido)**
   - Debe devolver `400` con detalle de validación (no `500`).
   - Si aparece `IntegrityError` sin mapear, revisar serializer de registro.

---

## 5) Confirmación final (criterio de cierre)

Se considera “cerrado” cuando:

- `POST /api/v1/users/register/` devuelve `201` con usuario nuevo.
- `POST /api/v1/auth/token/` devuelve `200` con `access`.
- `GET /api/v1/users/me/` devuelve `200` autenticado.
- Sin trazas `Traceback` en backend para esas rutas.

---

## 6) Comando único recomendado (rápido)

```bash
bash scripts/vps_connection_check.sh https://aktivar.online
```

Este script verifica DNS/TLS/endpoints y hace probe opcional de registro/login para aislar si el problema está en red, reverse proxy o backend.
