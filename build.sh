#!/usr/bin/env bash
set -o errexit

echo "==> Installing system dependencies (PostGIS runtime)"
apt-get update -qq
apt-get install -y -qq gdal-bin libgdal-dev

echo "==> Checking Node.js (Vite 8 requires Node >= 20.19)"
NODE_OK=false
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
  NODE_MINOR=$(node -p 'process.versions.node.split(".")[1]')
  if [ "$NODE_MAJOR" -gt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 19 ]; }; then
    NODE_OK=true
  fi
fi
if [ "$NODE_OK" = "false" ]; then
  echo "==> Installing Node.js 22 via NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi

echo "==> Installing Python dependencies"
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Building frontend"
cd frontend
npm ci
npm run build
cd ..

echo "==> Django: enabling PostGIS on the database"
cd backend
python manage.py shell -c "from django.db import connection; connection.cursor().execute('CREATE EXTENSION IF NOT EXISTS postgis')"

echo "==> Django: collectstatic"
python manage.py collectstatic --noinput

echo "==> Django: migrate"
python manage.py migrate

echo "==> Django: creating superuser if missing"
DJANGO_SUPERUSER_PASSWORD="$ADMIN_PASSWORD" python manage.py createsuperuser --noinput --email admin@aktivar.app --full_name admin || true

echo "==> Django: loading demo data (idempotent, fails softly)"
python manage.py load_demo_data || true

cd ..

echo "==> Build complete"