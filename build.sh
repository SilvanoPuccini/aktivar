#!/usr/bin/env bash
set -o errexit

# NOTE: The Render free build environment has a read-only filesystem, so apt-get
# is NOT available. GDAL/PostGIS are not required: the app uses the standard
# postgres engine (see backend/aktivar/settings.py).

echo "==> Setting up Node.js (official binary tarball, no apt-get)"
NODE_VERSION="v22.23.4"
# From the GPG-signed https://nodejs.org/dist/v22.23.4/SHASUMS256.txt
NODE_SHA256="1805bcd35e6815559bd2eb97db438d3fdb0eb3a5e6a977b7c1badca76337e9ce"
NODE_HOME="${HOME}/nodejs"
if [ "$("${NODE_HOME}/bin/node" --version 2>/dev/null)" != "${NODE_VERSION}" ]; then
  rm -rf "${NODE_HOME}"
  mkdir -p "${NODE_HOME}"
  curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz" -o "${HOME}/node.tar.xz"
  echo "${NODE_SHA256}  ${HOME}/node.tar.xz" | sha256sum -c -
  tar -xJf "${HOME}/node.tar.xz" -C "${NODE_HOME}" --strip-components=1
  rm -f "${HOME}/node.tar.xz"
fi
export PATH="${NODE_HOME}/bin:${PATH}"
node --version
npm --version

echo "==> Installing Python dependencies"
pip install --upgrade pip
pip install -r backend/requirements.txt

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

echo "==> Django: locking demo logins that use publicly leaked passwords"
python manage.py lock_leaked_demo_passwords

cd ..

echo "==> Build complete"