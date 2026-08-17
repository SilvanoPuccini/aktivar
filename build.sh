#!/usr/bin/env bash
set -o errexit

# NOTE: The Render free build environment has a read-only filesystem, so apt-get
# is NOT available. GDAL/PostGIS are not required: the app uses the standard
# postgres engine (see backend/aktivar/settings.py).

echo "==> Setting up Node.js (official binary tarball, no apt-get)"
NODE_VERSION="v22.14.0"
NODE_HOME="${HOME}/nodejs"
if [ ! -x "${NODE_HOME}/bin/node" ]; then
  mkdir -p "${NODE_HOME}"
  curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz" -o "${HOME}/node.tar.xz"
  tar -xJf "${HOME}/node.tar.xz" -C "${NODE_HOME}" --strip-components=1
  rm -f "${HOME}/node.tar.xz"
fi
export PATH="${NODE_HOME}/bin:${PATH}"
node --version
npm --version

echo "==> Installing Python dependencies"
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Building frontend"
cd frontend
npm ci
npm run build
cd ..

echo "==> Django: collectstatic"
cd backend
python manage.py collectstatic --noinput

echo "==> Django: migrate"
python manage.py migrate

echo "==> Django: creating superuser if missing"
DJANGO_SUPERUSER_PASSWORD="$ADMIN_PASSWORD" python manage.py createsuperuser --noinput --email admin@aktivar.app --full_name admin || true

echo "==> Django: loading demo data (idempotent, fails softly)"
python manage.py load_demo_data || true

cd ..

echo "==> Build complete"