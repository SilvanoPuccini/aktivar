#!/bin/bash
# =============================================================================
# Aktivar — Deploy Script for VPS
#
# Usage:
#   bash deploy.sh                    → Deploy with IP only (HTTP)
#   bash deploy.sh aktivar.com        → Deploy with domain + SSL (HTTPS)
#   bash deploy.sh --ssl aktivar.com  → Add SSL to existing deploy
# =============================================================================

set -e

DOMAIN="${1}"
SSL_ONLY=false

if [ "$1" = "--ssl" ]; then
    SSL_ONLY=true
    DOMAIN="${2}"
fi

echo "=========================================="
echo "  Aktivar — Deploy to VPS"
echo "=========================================="
echo ""

# ─── Check Docker is installed ──────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    echo ""
    echo "Docker installed! Log out and back in, then run this script again."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "ERROR: docker compose plugin not found."
    echo "Run: sudo apt install docker-compose-plugin"
    exit 1
fi

# ─── Detect server IP ───────────────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Server IP: $SERVER_IP"

if [ -n "$DOMAIN" ]; then
    echo "Domain:    $DOMAIN"
    HOST="$DOMAIN"
    SCHEME="https"
else
    echo "Domain:    (none — using IP)"
    HOST="$SERVER_IP"
    SCHEME="http"
fi
echo ""

# ─── SSL-only mode: just add certificates ───────────────────────────────────
if [ "$SSL_ONLY" = true ]; then
    if [ -z "$DOMAIN" ]; then
        echo "ERROR: --ssl requires a domain. Usage: bash deploy.sh --ssl yourdomain.com"
        exit 1
    fi
    echo "Adding SSL certificate for $DOMAIN..."

    # Update .env for HTTPS
    sed -i "s|SECURE_SSL_REDIRECT=False|SECURE_SSL_REDIRECT=True|" .env
    sed -i "s|SESSION_COOKIE_SECURE=False|SESSION_COOKIE_SECURE=True|" .env
    sed -i "s|CSRF_COOKIE_SECURE=False|CSRF_COOKIE_SECURE=True|" .env
    sed -i "s|http://${SERVER_IP}|https://${DOMAIN}|g" .env
    sed -i "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=${DOMAIN},www.${DOMAIN},${SERVER_IP},localhost|" .env

    # Get SSL certificate
    docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot \
        certonly --webroot -w /var/www/certbot \
        --email "admin@${DOMAIN}" --agree-tos --no-eff-email \
        -d "$DOMAIN" -d "www.${DOMAIN}"

    # Restart with prod config
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

    echo ""
    echo "SSL enabled! Site: https://$DOMAIN"
    exit 0
fi

# ─── Generate .env ──────────────────────────────────────────────────────────
if [ ! -f .env ]; then
    echo "Generating .env..."

    SECRET_KEY=$(openssl rand -base64 50 | tr -dc 'a-zA-Z0-9' | head -c 50)
    DB_PASSWORD=$(openssl rand -base64 20 | tr -dc 'a-zA-Z0-9' | head -c 20)

    if [ -n "$DOMAIN" ]; then
        ALLOWED="$DOMAIN,www.$DOMAIN,$SERVER_IP,localhost"
        ORIGINS="$SCHEME://$DOMAIN,$SCHEME://www.$DOMAIN"
        TRUSTED="$SCHEME://$DOMAIN,$SCHEME://www.$DOMAIN"
        FRONT_URL="$SCHEME://$DOMAIN"
        SSL_REDIRECT="True"
        COOKIE_SECURE="True"
    else
        ALLOWED="$SERVER_IP,localhost,127.0.0.1"
        ORIGINS="http://$SERVER_IP"
        TRUSTED="http://$SERVER_IP"
        FRONT_URL="http://$SERVER_IP"
        SSL_REDIRECT="False"
        COOKIE_SECURE="False"
    fi

    cat > .env << ENVEOF
# =============================================================================
# Aktivar — Production Environment
# Generated: $(date -u +"%Y-%m-%d %H:%M UTC")
# =============================================================================

# Django
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${ALLOWED}
DJANGO_SETTINGS_MODULE=aktivar.settings

# Database (inside Docker — automatic)
POSTGRES_DB=aktivar
POSTGRES_USER=aktivar
POSTGRES_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgis://aktivar:${DB_PASSWORD}@db:5432/aktivar

# Redis (inside Docker — automatic)
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1

# URLs
CORS_ALLOWED_ORIGINS=${ORIGINS}
CSRF_TRUSTED_ORIGINS=${TRUSTED}
FRONTEND_URL=${FRONT_URL}

# Security
SECURE_SSL_REDIRECT=${SSL_REDIRECT}
SESSION_COOKIE_SECURE=${COOKIE_SECURE}
CSRF_COOKIE_SECURE=${COOKIE_SECURE}

# ─── Servicios externos (llenar cuando los tengas) ──────────────
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
OPENAI_API_KEY=
SENTRY_DSN=
CLOUDINARY_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ENVEOF

    echo ".env created!"
    echo "  Allowed hosts: $ALLOWED"
    echo "  SSL: $SSL_REDIRECT"
    echo ""
else
    echo ".env already exists. To regenerate: rm .env && bash deploy.sh"
    echo ""
fi

# ─── Build and deploy ───────────────────────────────────────────────────────
echo "Building containers... (first time takes 5-10 min)"
echo ""

if [ -n "$DOMAIN" ]; then
    # Production with SSL
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
else
    # HTTP only (no SSL)
    docker compose -f docker-compose.yml up -d --build
fi

echo ""
echo "Waiting for services to start..."
sleep 15

# ─── Health check ───────────────────────────────────────────────────────────
echo ""
echo "Checking services..."
SERVICES_OK=true

for svc in db redis backend frontend nginx; do
    STATUS=$(docker compose ps --format '{{.Service}} {{.Status}}' 2>/dev/null | grep "$svc" | head -1)
    if echo "$STATUS" | grep -qi "up\|running\|healthy"; then
        echo "  ✓ $svc — running"
    else
        echo "  ✗ $svc — NOT running"
        SERVICES_OK=false
    fi
done

echo ""

if [ "$SERVICES_OK" = false ]; then
    echo "Some services failed. Check logs:"
    echo "  docker compose logs --tail=50"
    exit 1
fi

# ─── SSL setup if domain provided ───────────────────────────────────────────
if [ -n "$DOMAIN" ] && [ "$SSL_ONLY" = false ]; then
    echo "Setting up SSL certificate for $DOMAIN..."
    echo "(Make sure your domain DNS points to $SERVER_IP first!)"
    echo ""

    docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot \
        certonly --webroot -w /var/www/certbot \
        --email "admin@${DOMAIN}" --agree-tos --no-eff-email \
        -d "$DOMAIN" -d "www.${DOMAIN}" || {
            echo ""
            echo "WARNING: SSL setup failed. The site still works on HTTP."
            echo "Make sure DNS for $DOMAIN points to $SERVER_IP"
            echo "Then run: bash deploy.sh --ssl $DOMAIN"
        }

    # Reload nginx to pick up certs
    docker compose exec nginx nginx -s reload 2>/dev/null || true
fi

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "  Aktivar is LIVE!"
echo "=========================================="
echo ""
echo "  URL:     $SCHEME://$HOST"
echo "  Admin:   $SCHEME://$HOST/admin/"
echo "  API:     $SCHEME://$HOST/api/docs/"
echo ""
echo "  ─── Comandos útiles ───"
echo "  docker compose logs -f              # Ver logs en vivo"
echo "  docker compose logs backend -f      # Solo backend"
echo "  docker compose ps                   # Estado de contenedores"
echo "  docker compose down                 # Parar todo"
echo "  docker compose up -d                # Levantar de nuevo"
echo "  docker compose exec backend python manage.py createsuperuser"
echo "                                      # Crear usuario admin"
echo ""
echo "  ─── Base de datos ───"
echo "  La BD PostgreSQL corre dentro de Docker."
echo "  Los datos persisten en el volumen 'postgres_data'."
echo "  Para backup: docker compose exec db pg_dump -U aktivar aktivar > backup.sql"
echo ""
if [ -z "$DOMAIN" ]; then
    echo "  ─── Cuando tengas dominio ───"
    echo "  1. Comprá un dominio (ej: aktivar.com)"
    echo "  2. Apuntá el DNS A record a: $SERVER_IP"
    echo "  3. Corré: bash deploy.sh --ssl tudominio.com"
    echo ""
fi
echo "=========================================="
