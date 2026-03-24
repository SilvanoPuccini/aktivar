# Aktivar — Guía de Despliegue

## Requisitos

- **VPS** con mínimo 2GB RAM, 2 vCPU (CubePath, DigitalOcean, Hetzner, etc.)
- **Ubuntu 22.04+** o Debian 12+
- **Docker** y **Docker Compose v2** (el script los instala si no los tenés)
- **No necesitás comprar dominio** — hay opciones gratis

---

## Opción A: Deploy en CubePath con Dokploy (Recomendada)

Dokploy ya está instalado en CubePath. Te da un **subdominio gratis automático** con traefik.me.

### Paso a paso:

1. **Entrá al panel de Dokploy** en tu VPS de CubePath
   - URL: `http://TU_IP_VPS:3000` (o el puerto que tenga Dokploy)

2. **Crear proyecto:**
   - Click en "Create Project"
   - Nombre: `aktivar`

3. **Agregar servicio Docker Compose:**
   - Dentro del proyecto → "Add Service" → "Docker Compose"
   - En "Source": seleccionar "Git" y poner la URL del repo
   - En "Compose Path": escribir `dokploy-compose.yml`

4. **Configurar variables de entorno:**
   - Ir a la pestaña "Environment"
   - Agregar estas dos variables **obligatorias**:
   ```
   SECRET_KEY=cambia-esto-a-algo-random-de-50-caracteres
   POSTGRES_PASSWORD=una-contraseña-segura-aqui
   ```

5. **Asignar dominio gratis:**
   - Ir a la pestaña "Domains"
   - Click en "Add Domain"
   - Click en el icono de dado 🎲 → genera algo como: `aktivar-abc123-TU-IP.traefik.me`
   - Container Port: `80`
   - Service Name: `nginx`
   - HTTPS: `OFF`
   - Click "Create"

6. **Deploy:**
   - Click en "Deploy"
   - Esperar 5-10 minutos (la primera vez descarga y compila todo)

7. **Listo!** Abrí tu navegador en la URL que generó traefik.me

### Resumen de lo que pasa automáticamente:
- PostgreSQL + PostGIS se crea dentro de Docker (no hay que instalar BD aparte)
- Redis se levanta solo
- Las migraciones de Django corren automáticas
- Los datos demo se cargan solos
- Frontend React se compila y sirve

---

## Opción B: Deploy con DuckDNS (Dominio gratis legible)

Si querés un dominio más profesional como `aktivar.duckdns.org` (gratis para siempre):

### Paso 1: Crear subdominio en DuckDNS
1. Andá a https://www.duckdns.org
2. Iniciá sesión con Google o GitHub (gratis)
3. Creá un subdominio (ej: `aktivar`)
4. Copiá tu token del dashboard

### Paso 2: Configurar en el VPS
```bash
# Conectate por SSH al VPS
ssh root@TU_IP_VPS

# Clonar el repo
git clone https://github.com/SilvanoPuccini/aktivar.git
cd aktivar

# Configurar DuckDNS
bash setup-duckdns.sh aktivar TU_TOKEN_DE_DUCKDNS

# Desplegar
bash deploy.sh aktivar.duckdns.org
```

Tu app estará disponible en: `http://aktivar.duckdns.org`

---

## Opción C: Deploy rápido solo con IP

Si solo querés probar rápido sin ningún dominio:

```bash
ssh root@TU_IP_VPS
git clone https://github.com/SilvanoPuccini/aktivar.git
cd aktivar
bash deploy.sh
```

Accedé en: `http://TU_IP_DEL_VPS`

---

## Base de datos

**PostgreSQL + PostGIS corre DENTRO de Docker.** No necesitás instalar ni configurar nada por separado.

- Se crea automáticamente al primer deploy
- Las migraciones corren solas al iniciar
- Los datos persisten en un volumen Docker (`postgres_data`)
- Si reiniciás o actualizás, los datos NO se pierden

### Comandos útiles de BD

```bash
# Backup de la base de datos
docker compose exec db pg_dump -U aktivar aktivar > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup.sql | docker compose exec -T db psql -U aktivar aktivar

# Acceder a la consola de PostgreSQL
docker compose exec db psql -U aktivar aktivar

# Ver tablas
docker compose exec db psql -U aktivar aktivar -c "\dt"
```

## Crear usuario administrador

```bash
docker compose exec backend python manage.py createsuperuser
```

Después accedé a `http://TU_DOMINIO/admin/`

## Comandos del día a día

```bash
# Ver estado de los contenedores
docker compose ps

# Ver logs en vivo
docker compose logs -f

# Solo backend
docker compose logs backend -f

# Reiniciar un servicio
docker compose restart backend

# Parar todo
docker compose down

# Levantar todo
docker compose up -d

# Actualizar (después de git pull)
docker compose up -d --build
```

## Actualizar la aplicación

```bash
cd aktivar
git pull origin main
docker compose up -d --build
```

## Configurar servicios externos

Editá el `.env` en el VPS (o las env vars en Dokploy):

| Servicio | Variable | Para qué |
|----------|----------|----------|
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | Pagos |
| Cloudinary | `CLOUDINARY_URL` | Almacenamiento de imágenes |
| Resend | `RESEND_API_KEY` | Emails transaccionales |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | SMS / OTP |
| OneSignal | `ONESIGNAL_APP_ID` | Push notifications |
| Sentry | `SENTRY_DSN` | Monitoreo de errores |

## Troubleshooting

```bash
# Si un contenedor no levanta:
docker compose logs <servicio> --tail=100

# Si la BD no conecta:
docker compose logs db --tail=50

# Recrear todo desde cero (BORRA DATOS):
docker compose down -v && bash deploy.sh

# Ver uso de recursos:
docker stats
```

## Arquitectura

```
Internet → Traefik (Dokploy) → Nginx (puerto 80)
                                  ├── /api/*    → Django Backend (Daphne :8000)
                                  ├── /admin/*  → Django Backend
                                  ├── /ws/*     → Django Channels (WebSocket)
                                  ├── /static/* → Archivos estáticos
                                  ├── /media/*  → Archivos subidos
                                  └── /*        → React Frontend (SPA)

Backend → PostgreSQL + PostGIS (volumen persistente)
       → Redis (cache + Celery broker + WebSocket)
       → Celery Worker (tareas async)
```

## Comparación de opciones de dominio gratis

| Opción | Dominio ejemplo | HTTPS | Profesionalismo |
|--------|----------------|-------|-----------------|
| traefik.me (Dokploy) | `aktivar-abc-1-2-3-4.traefik.me` | No | Medio |
| DuckDNS | `aktivar.duckdns.org` | Sí (Let's Encrypt) | Alto |
| Solo IP | `http://123.45.67.89` | No | Bajo |
