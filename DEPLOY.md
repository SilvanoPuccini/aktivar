# Aktivar — Guía de Despliegue (VPS)

## Requisitos

- **VPS** con mínimo 2GB RAM, 2 vCPU (CubePath, DigitalOcean, Hetzner, etc.)
- **Ubuntu 22.04+** o Debian 12+
- **Docker** y **Docker Compose v2** (el script los instala si no los tenés)

## Opción 1: Deploy rápido (solo IP, sin dominio)

Conectate al VPS por SSH y ejecutá:

```bash
# 1. Clonar el repositorio
git clone https://github.com/SilvanoPuccini/aktivar.git
cd aktivar

# 2. Correr el script de deploy
bash deploy.sh
```

Eso es todo. El script:
- Instala Docker si no está
- Genera el `.env` con contraseñas seguras automáticas
- Levanta PostgreSQL + PostGIS, Redis, Backend, Frontend, Nginx, Celery
- Te muestra la URL para acceder

Después de que termine, abrí tu navegador en: `http://TU_IP_DEL_VPS`

## Opción 2: Deploy con dominio + SSL (producción real)

```bash
# 1. Comprá un dominio (ej: aktivar.com en Namecheap, Cloudflare, etc.)

# 2. En el panel DNS del dominio, creá un registro A:
#    Tipo: A | Nombre: @ | Valor: TU_IP_DEL_VPS | TTL: 300
#    Tipo: A | Nombre: www | Valor: TU_IP_DEL_VPS | TTL: 300

# 3. Esperá 5-10 minutos a que propague el DNS

# 4. En el VPS:
git clone https://github.com/SilvanoPuccini/aktivar.git
cd aktivar
bash deploy.sh aktivar.com
```

El script automáticamente:
- Configura HTTPS con certificado SSL gratuito (Let's Encrypt)
- Redirige HTTP → HTTPS
- Configura renovación automática del certificado

## Agregar SSL después (si ya desplegaste sin dominio)

```bash
# Cuando tengas el dominio y DNS apuntando al VPS:
bash deploy.sh --ssl tudominio.com
```

## Base de datos

**PostgreSQL + PostGIS corre dentro de Docker.** No necesitás instalar ni configurar nada por separado.

- Los datos persisten en un volumen Docker (`postgres_data`)
- Se crea automáticamente al primer deploy
- Las migraciones corren automáticas al iniciar

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

Después accedé a `http://TU_IP/admin/` con ese usuario.

## Comandos del día a día

```bash
# Ver estado de los contenedores
docker compose ps

# Ver logs en vivo (todos los servicios)
docker compose logs -f

# Ver logs solo del backend
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

Editá el archivo `.env` en el VPS y reiniciá:

```bash
nano .env   # o vim .env

# Después de editar:
docker compose restart backend celery
```

### Servicios opcionales:
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
# Si un contenedor no levanta, ver los logs:
docker compose logs <servicio> --tail=100

# Si la BD no conecta:
docker compose logs db --tail=50

# Recrear todo desde cero (BORRA DATOS):
docker compose down -v
bash deploy.sh

# Ver uso de recursos:
docker stats
```

## Arquitectura del deploy

```
Internet → Nginx (puerto 80/443)
              ├── /api/*    → Django Backend (Daphne :8000)
              ├── /admin/*  → Django Backend
              ├── /ws/*     → Django Channels (WebSocket)
              ├── /static/* → Archivos estáticos (volumen)
              ├── /media/*  → Archivos subidos (volumen)
              └── /*        → React Frontend (SPA)

Backend → PostgreSQL + PostGIS (volumen persistente)
       → Redis (cache + Celery broker)
       → Celery Worker (tareas async)
```
