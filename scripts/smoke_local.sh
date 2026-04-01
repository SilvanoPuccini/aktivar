#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PROJECT="aktivar"
DJANGO_SETTINGS_MODULE_VALUE="${DJANGO_SETTINGS_MODULE:-aktivar.settings_test}"
PLAYWRIGHT_PROJECT="${PLAYWRIGHT_PROJECT:-chromium}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }
}

require_cmd bash
require_cmd curl
require_cmd npm

if [[ ! -x "$BACKEND_DIR/venv/bin/python" ]]; then
  echo "Backend virtualenv not found at $BACKEND_DIR/venv" >&2
  exit 1
fi

pushd "$BACKEND_DIR" >/dev/null
export DJANGO_SETTINGS_MODULE="$DJANGO_SETTINGS_MODULE_VALUE"
./venv/bin/python manage.py migrate --noinput
./venv/bin/python manage.py seed_smoke
./venv/bin/python manage.py runserver "${BACKEND_HOST}:${BACKEND_PORT}" > /tmp/${PROJECT}-backend-smoke.log 2>&1 &
BACKEND_PID=$!
popd >/dev/null

for _ in {1..30}; do
  if curl -fsS "$BACKEND_URL/api/v1/health/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

curl -fsS "$BACKEND_URL/api/v1/health/" >/dev/null

echo "Backend ready at $BACKEND_URL"

echo "Running Playwright project: $PLAYWRIGHT_PROJECT"
pushd "$FRONTEND_DIR" >/dev/null
npx playwright test --project="$PLAYWRIGHT_PROJECT"
popd >/dev/null

echo "Smoke flow completed successfully"
